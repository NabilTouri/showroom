// Turns a glTF model that is already split into named nodes into vehicle parts, driven by a
// declarative spec: node -> part mapping, hinged openables, material mapping, detail islands,
// material-based splits, sub-parts extracted by material and number plates.
//
// Model convention: X lateral, Y up, -Z forward. Vehicle coordinates: x from the front bumper
// towards the rear (m), y up, z to the left.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { splitIslands } from './islands';
import { plateTexture } from './textures';
import type { Axis, Openable } from '../vehicles/types';

/** A hinge coordinate: a fixed value, or a point of the panel's bounding box plus an offset. */
export type HingeCoordinate = number | { at: 'min' | 'max' | 'center'; offset?: number };

export interface OpenableNodeSpec {
  part: string;
  axis: Axis;
  angle: number;
  hinge: { x: HingeCoordinate; y: HingeCoordinate; z: HingeCoordinate };
}

export interface MaterialRule {
  /** glTF material name(s). */
  gltf: string | readonly string[];
  /** Only for nodes whose name matches. */
  node?: RegExp;
  use: string;
}

export interface GltfAssemblySpec {
  url: string;
  /** Node whose children are the vehicle's nodes (fallback: first grandchild of the scene). */
  container: string;
  /** Nodes whose bounding box spans the vehicle's length (bumpers). */
  lengthNodes: RegExp;
  /** Real overall length (m): the model is scaled to it. */
  length: number;
  openables: Readonly<Record<string, OpenableNodeSpec>>;
  /** Plain nodes: part id, and the openable that carries them (a door's glass). */
  nodes: Readonly<Record<string, { part: string; within?: string }>>;
  /** Nodes loaded but not added to the scene, e.g. a rim reused by procedural wheels. */
  templates: Readonly<Record<string, string>>;
  materials: { rules: readonly MaterialRule[]; fallback: string; noShadow: readonly string[] };
  /** Islands of the `material` meshes of nodes starting with a key, re-materialed by box. */
  details: {
    material: string;
    rules: Readonly<Record<string, (box: THREE.Box3) => string | null>>;
  };
  /**
   * Nodes split by the glTF material of their children: material -> part id (null = vehicle
   * root). Children with other materials go to the root (`others: 'root'`) or are dropped.
   * `material` overrides the mapped material of every kept child.
   */
  splits: readonly {
    node: string;
    parts: Readonly<Record<string, string | null>>;
    others: 'root' | 'drop';
    material?: string;
  }[];
  /** Meshes of `from` with one of `materials` moved to their own part `to`. */
  extract: readonly { from: string; materials: readonly string[]; to: string }[];
  plates: {
    text: string;
    country: string;
    items: readonly { part: string; x: number; y: number; dir: 1 | -1; bend: number }[];
  };
}

export interface GltfAssembly {
  parts: Record<string, THREE.Object3D>;
  openables: Record<string, Openable>;
  templates: Record<string, THREE.Object3D>;
}

const hingeAt = (c: HingeCoordinate, min: number, max: number) =>
  typeof c === 'number'
    ? c
    : (c.at === 'min' ? min : c.at === 'max' ? max : (min + max) / 2) + (c.offset ?? 0);

export async function assembleGltf(
  spec: GltfAssemblySpec,
  root: THREE.Group,
  materials: Readonly<Record<string, THREE.Material>>,
): Promise<GltfAssembly> {
  const gltf = await new GLTFLoader().loadAsync(spec.url);
  const src = gltf.scene;
  src.updateMatrixWorld(true);
  const top = src.getObjectByName(spec.container) || src.children[0].children[0];
  const base = top.matrixWorld.clone(); // brings the model to Y-up

  // scale to the real length, front bumper at x = 0, wheels on the ground
  const bb = new THREE.Box3();
  for (const n of top.children) if (spec.lengthNodes.test(n.name)) bb.expandByObject(n);
  const s = spec.length / (bb.max.z - bb.min.z);
  const conv = new THREE.Matrix4()
    .makeTranslation(bb.max.z * s, 0, 0)
    .multiply(new THREE.Matrix4().makeScale(s, s, s))
    .multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2))
    .multiply(base);

  const material = (key: string) => {
    const m = materials[key];
    if (!m) throw new Error(`Unknown material key "${key}"`);
    return m;
  };
  const materialFor = (gltfName: string, node: string) => {
    const rule = spec.materials.rules.find(
      (r) =>
        (typeof r.gltf === 'string' ? r.gltf === gltfName : r.gltf.includes(gltfName)) &&
        (!r.node || r.node.test(node)),
    );
    return material(rule ? rule.use : spec.materials.fallback);
  };
  const noShadow = new Set(spec.materials.noShadow.map(material));
  const detailBase = material(spec.details.material);

  const parts: Record<string, THREE.Object3D> = {};
  const openables: Record<string, Openable> = {};
  const templates: Record<string, THREE.Object3D> = {};
  const part = (id: string, parent?: THREE.Object3D | null) => {
    if (parts[id]) return parts[id];
    const g = new THREE.Group();
    parts[id] = g;
    (parent || root).add(g);
    return g;
  };
  const wrap = (node: THREE.Object3D) => {
    const w = new THREE.Group();
    conv.decompose(w.position, w.quaternion, w.scale);
    w.add(node);
    w.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.material = materialFor(o.material.name, node.name);
      o.castShadow = !noShadow.has(o.material);
    });
    const prefix = Object.keys(spec.details.rules).find((k) => node.name.startsWith(k));
    if (prefix) {
      const rule = spec.details.rules[prefix];
      w.updateMatrixWorld(true);
      w.traverse((o) => {
        if (o instanceof THREE.Mesh && o.material === detailBase)
          splitIslands(o, (box) => {
            const key = rule(box);
            return key ? material(key) : null;
          });
      });
    }
    return w;
  };

  // 1) openables: pivot on the hinge, found from the panel's bounding box
  const inner: Record<string, THREE.Group> = {};
  const openableOfNode = (name: string) => spec.openables[name];
  for (const n of [...top.children]) {
    const def = openableOfNode(n.name);
    if (!def) continue;
    const id = def.part,
      w = wrap(n);
    w.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(w);
    const pivot = new THREE.Vector3(
      hingeAt(def.hinge.x, b.min.x, b.max.x),
      hingeAt(def.hinge.y, b.min.y, b.max.y),
      hingeAt(def.hinge.z, b.min.z, b.max.z),
    );
    const o = part(id);
    o.position.copy(pivot);
    openables[id] = { object: o, axis: def.axis, angle: def.angle };
    inner[id] = new THREE.Group();
    inner[id].position.copy(pivot).negate();
    o.add(inner[id]);
    inner[id].add(w);
  }
  // 2) the other named nodes
  for (const n of [...top.children]) {
    const template = Object.keys(spec.templates).find((k) => spec.templates[k] === n.name);
    if (template) {
      const w = wrap(n);
      w.position.set(0, 0, 0);
      templates[template] = w;
      continue;
    }
    const def = spec.nodes[n.name];
    if (!def || openableOfNode(n.name)) continue;
    part(def.part, def.within ? inner[def.within] : null).add(wrap(n));
  }
  // 3) nodes split by material
  for (const split of spec.splits) {
    const n = top.getObjectByName(split.node);
    if (!n) continue;
    for (const m of [...n.children]) {
      const mesh =
        m instanceof THREE.Mesh
          ? m
          : m.children.find((c): c is THREE.Mesh => c instanceof THREE.Mesh);
      if (!mesh) continue;
      const name = mesh.material.name as string;
      if (!(name in split.parts) && split.others === 'drop') continue;
      const id = split.parts[name] ?? null;
      const w = wrap(m);
      if (split.material) {
        const override = material(split.material);
        w.traverse((o) => {
          if (o instanceof THREE.Mesh) o.material = override;
        });
      }
      if (id) part(id).add(w);
      else root.add(w);
    }
  }
  // 4) sub-parts extracted by material (lamps in the bumper, the grille, the tailgate)
  for (const ex of spec.extract) {
    const fromOpenable = !!inner[ex.from];
    const g = fromOpenable ? inner[ex.from] : parts[ex.from];
    if (!g) continue;
    const mats = new Set(ex.materials.map(material));
    const pick: THREE.Mesh[] = [];
    g.traverse((o) => {
      if (o instanceof THREE.Mesh && mats.has(o.material)) pick.push(o);
    });
    for (const o of pick) {
      const holder = new THREE.Group();
      o.parent!.updateWorldMatrix(true, false);
      const p = part(ex.to, fromOpenable ? inner[ex.from] : null);
      o.updateWorldMatrix(true, false);
      const mw = o.matrixWorld.clone();
      p.updateWorldMatrix(true, false);
      holder.applyMatrix4(new THREE.Matrix4().copy(p.matrixWorld).invert().multiply(mw));
      o.removeFromParent();
      o.position.set(0, 0, 0);
      o.quaternion.identity();
      o.scale.set(1, 1, 1);
      holder.add(o);
      p.add(holder);
    }
  }
  // 5) number plates, bent to follow the bumper
  const plateMat = new THREE.MeshStandardMaterial({
    map: plateTexture(spec.plates.text, spec.plates.country),
    roughness: 0.35,
    metalness: 0.1,
  });
  for (const { part: id, x, y, dir, bend } of spec.plates.items) {
    const g = new THREE.PlaneGeometry(0.52, 0.11, 10, 1),
      p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const z = p.getX(i);
      p.setXYZ(i, bend * z * z * dir, p.getY(i), -z * dir);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, plateMat);
    m.position.set(x, y, 0);
    parts[id].add(m);
  }
  return { parts, openables, templates };
}
