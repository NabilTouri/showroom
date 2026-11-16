// Structural dump of the car scene, run inside the page through the test driver.
// Self-contained on purpose: it is serialised by page.evaluate().
import type * as THREE from 'three';

export interface MaterialPrint {
  [key: string]: string | number | boolean | number[] | null;
}

export interface MeshPrint {
  tris: number;
  vertices: number;
  groups: number[][];
  box: number[];
  materials: MaterialPrint[];
  castShadow: boolean;
  receiveShadow: boolean;
  visible: boolean;
  renderOrder: number;
}

export interface PartPrint {
  parent: string | null;
  box: number[] | null;
  meshes: MeshPrint[];
  explode: number[] | null;
}

export interface SceneDump {
  parts: Record<string, PartPrint>;
  openables: Record<string, { pivot: number[]; axis: string; angle: number }>;
  unassigned: MeshPrint[];
}

export function dumpScene(): SceneDump {
  const model = window.__driver.model();
  const r = (v: number) => Math.round(v * 1e4) / 1e4 + 0; // + 0 folds -0
  const owner = new Map<THREE.Object3D, string>();
  for (const id in model.parts) owner.set(model.parts[id], id);
  model.root.updateMatrixWorld(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const material = (m: any): MaterialPrint => {
    const hex = (c: THREE.Color | undefined) => (c ? c.getHexString() : null);
    const tex = (t: THREE.Texture | null | undefined) =>
      t ? [t.image?.width ?? 0, t.image?.height ?? 0, t.repeat.x, t.repeat.y] : null;
    return {
      type: m.type,
      color: hex(m.color),
      roughness: m.roughness ?? null,
      metalness: m.metalness ?? null,
      opacity: m.opacity,
      transparent: m.transparent,
      depthWrite: m.depthWrite,
      side: m.side,
      blending: m.blending,
      toneMapped: m.toneMapped,
      emissive: hex(m.emissive),
      emissiveIntensity: m.emissiveIntensity ?? null,
      clearcoat: m.clearcoat ?? null,
      clearcoatRoughness: m.clearcoatRoughness ?? null,
      envMapIntensity: m.envMapIntensity ?? null,
      map: tex(m.map),
      bumpMap: tex(m.bumpMap),
      bumpScale: m.bumpMap ? m.bumpScale : null,
      roughnessMap: tex(m.roughnessMap),
      carPaint: m.customProgramCacheKey() === 'carpaint',
    };
  };

  const mesh = (o: THREE.Mesh): MeshPrint => {
    const g = o.geometry,
      pos = g.attributes.position,
      e = o.matrixWorld.elements;
    const min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        y = pos.getY(i),
        z = pos.getZ(i);
      const w = [
        e[0] * x + e[4] * y + e[8] * z + e[12],
        e[1] * x + e[5] * y + e[9] * z + e[13],
        e[2] * x + e[6] * y + e[10] * z + e[14],
      ];
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], w[k]);
        max[k] = Math.max(max[k], w[k]);
      }
    }
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    return {
      tris: (g.index ? g.index.count : pos.count) / 3,
      vertices: pos.count,
      groups: g.groups.map((x) => [x.start, x.count, x.materialIndex ?? 0]),
      box: [...min, ...max].map(r),
      materials: mats.map(material),
      castShadow: o.castShadow,
      receiveShadow: o.receiveShadow,
      visible: o.visible,
      renderOrder: o.renderOrder,
    };
  };

  const partOf = (o: THREE.Object3D | null): string | null => {
    for (let p = o; p && p !== model.root; p = p.parent) if (owner.has(p)) return owner.get(p)!;
    return null;
  };
  const byKey = (a: MeshPrint, b: MeshPrint) =>
    JSON.stringify(a) < JSON.stringify(b) ? -1 : JSON.stringify(a) > JSON.stringify(b) ? 1 : 0;

  const parts: SceneDump['parts'] = {};
  for (const id in model.parts) {
    const ex = model.explode[id];
    parts[id] = {
      parent: partOf(model.parts[id].parent),
      box: null,
      meshes: [],
      explode: ex ? [ex.x, ex.y, ex.z].map(r) : null,
    };
  }
  const unassigned: MeshPrint[] = [];
  model.root.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) return;
    const m = mesh(o as THREE.Mesh),
      id = partOf(o);
    if (!id) return unassigned.push(m);
    parts[id].meshes.push(m);
    // a part's box covers every mesh below it, nested parts included (like Box3.setFromObject)
    for (let p: string | null = id; p; p = parts[p].parent) {
      const b = parts[p].box;
      parts[p].box = b
        ? [0, 1, 2]
            .map((k) => Math.min(b[k], m.box[k]))
            .concat([3, 4, 5].map((k) => Math.max(b[k], m.box[k])))
        : m.box.slice();
    }
  });
  for (const id in parts) parts[id].meshes.sort(byKey);
  unassigned.sort(byKey);

  const openables: SceneDump['openables'] = {};
  for (const id in model.openables) {
    const { object, axis, angle } = model.openables[id];
    const e = object.matrixWorld.elements;
    openables[id] = { pivot: [e[12], e[13], e[14]].map(r), axis, angle };
  }
  return { parts, openables, unassigned };
}
