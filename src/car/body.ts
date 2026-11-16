// Carrozzeria: modello «Renault Clio MK4 2012-2020» di Merc_TV (CC BY 4.0, vedi CREDITS.md).
// Il file è già suddiviso in pezzi: qui ogni nodo viene portato nelle coordinate dell'app,
// collegato all'id della sua scheda e, per porte/cofano/portellone, montato su un perno.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { L } from './surface.js';
import { M } from './materials.js';
import type { Car, OpenState } from './car.js';

// nodo del modello -> [id pezzo, pezzo apribile che lo contiene]
const NODE_PART: Record<string, [string] | [string, string]> = {
  ClioIV_hood: ['cofano'],
  ClioIV_door_FL: ['porta_ant_sx'],
  ClioIV_door_FR: ['porta_ant_dx'],
  ClioIV_door_RL: ['porta_post_sx'],
  ClioIV_door_RR: ['porta_post_dx'],
  ClioIV_tailgate: ['portellone'],
  ClioIV_doorglass_FL: ['vetro_ant_sx', 'porta_ant_sx'],
  ClioIV_doorglass_FR: ['vetro_ant_dx', 'porta_ant_dx'],
  ClioIV_doorglass_RL: ['vetro_post_sx', 'porta_post_sx'],
  ClioIV_doorglass_RR: ['vetro_post_dx', 'porta_post_dx'],
  ClioIV_mirror_L: ['specchio_sx', 'porta_ant_sx'],
  ClioIV_mirror_R: ['specchio_dx', 'porta_ant_dx'],
  ClioIV_tailgateglass: ['lunotto', 'portellone'],
  ClioIV_fender_L: ['parafango_sx'],
  ClioIV_fender_R: ['parafango_dx'],
  ClioIV_bumper_F: ['paraurti_ant'],
  ClioIV_bumper_R: ['paraurti_post'],
  ClioIV_grille_F: ['calandra'],
  ClioIV_headlightframe_L: ['faro_sx'],
  ClioIV_headlightglass_L: ['faro_sx'],
  ClioIV_headlightframe_R: ['faro_dx'],
  ClioIV_headlightglass_R: ['faro_dx'],
  ClioIV_taillightframe_L: ['fanale_sx'],
  ClioIV_taillightglass_L: ['fanale_sx'],
  ClioIV_taillightframe_R: ['fanale_dx'],
  ClioIV_taillightglass_R: ['fanale_dx'],
  ClioIV_windshield: ['parabrezza'],
  ClioIV_steering_wheel: ['volante'],
  ClioIV_needle_tacho: ['plancia'],
};
const RIM = 'ClioIV_wheel_17x8'; // cerchio in lega del modello: wheels.js lo monta dentro il pneumatico
const OPEN: Record<string, [OpenState['axis'], number]> = {
  // asse e angolo di apertura
  cofano: ['z', -0.95],
  portellone: ['z', 1.3],
  porta_ant_sx: ['y', -1.1],
  porta_post_sx: ['y', -1.1],
  porta_ant_dx: ['y', 1.1],
  porta_post_dx: ['y', 1.1],
};

// Dettagli che nel modello condividono il materiale «finiture»: riconosciuti come isole di triangoli
// dal loro ingombro (coordinate auto, metri) e rivestiti con il materiale giusto.
const box = (b: THREE.Box3, x0: number, x1: number, y0: number, y1: number, zmax: number) =>
  b.min.x >= x0 &&
  b.max.x <= x1 &&
  b.min.y >= y0 &&
  b.max.y <= y1 &&
  Math.max(Math.abs(b.min.z), Math.abs(b.max.z)) <= zmax;
type DetailRule = (b: THREE.Box3) => THREE.Material | null;
const DETAIL: Record<string, DetailRule> = {
  ClioIV_grille_F: (b) =>
    box(b, 0, 0.12, 0.56, 0.77, 0.09) ||
    (box(b, 0.03, 0.13, 0.63, 0.69, 0.32) && b.max.z - b.min.z > 0.2)
      ? M.chrome
      : null, // losanga e baffi cromati
  ClioIV_tailgate: (b) =>
    box(b, 3.9, 4.05, 0.69, 0.97, 0.6) && b.max.y - b.min.y < 0.13 && b.max.z - b.min.z < 0.5
      ? M.chrome
      : null, // losanga, scritta CLIO, targhette
  ClioIV_door_F: (b) =>
    b.min.y > 0.75 && b.max.y < 0.83
      ? M.paint
      : b.max.y < 0.4 && b.max.y - b.min.y < 0.045
        ? M.chrome
        : null, // maniglia in tinta, profilo cromato
  ClioIV_door_R: (b) =>
    b.max.y < 0.4 && b.max.y - b.min.y < 0.06 && b.max.z - b.min.z < 0.03 ? M.chrome : null,
  ClioIV_body: (b) =>
    b.max.y < 0.28 && b.min.x > 3.75 && b.max.x - b.min.x < 0.12 ? M.chrome : null, // terminale di scarico
};
function splitIslands(mesh: THREE.Mesh, rule: DetailRule) {
  const g = mesh.geometry,
    pos = g.attributes.position,
    idx = g.index!.array,
    nv = pos.count;
  const root = new Int32Array(nv),
    key = new Map<string, number>();
  const find = (a: number) => {
    while (root[a] !== a) a = root[a] = root[root[a]];
    return a;
  };
  for (let i = 0; i < nv; i++) {
    const k = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
    if (key.has(k)) root[i] = key.get(k)!;
    else {
      key.set(k, i);
      root[i] = i;
    }
  }
  for (let t = 0; t < idx.length; t += 3) {
    const a = find(idx[t]);
    root[find(idx[t + 1])] = a;
    root[find(idx[t + 2])] = a;
  }
  const isl = new Map<number, { tris: number[]; box: THREE.Box3 }>(),
    v = new THREE.Vector3();
  for (let t = 0; t < idx.length; t += 3) {
    const r = find(idx[t]);
    let o = isl.get(r);
    if (!o) isl.set(r, (o = { tris: [], box: new THREE.Box3() }));
    o.tris.push(t);
    for (let k = 0; k < 3; k++)
      o.box.expandByPoint(v.fromBufferAttribute(pos, idx[t + k]).applyMatrix4(mesh.matrixWorld));
  }
  const mats = [mesh.material as THREE.Material],
    lists: number[][] = [[]];
  for (const o of isl.values()) {
    const m = rule(o.box) || (mesh.material as THREE.Material);
    let i = mats.indexOf(m);
    if (i < 0) {
      i = mats.length;
      mats.push(m);
      lists.push([]);
    }
    lists[i].push(...o.tris);
  }
  if (mats.length === 1) return;
  const out = new (idx.constructor as Uint32ArrayConstructor)(idx.length);
  let n = 0;
  g.clearGroups();
  lists.forEach((l, i) => {
    g.addGroup(n, l.length * 3, i);
    for (const t of l) {
      out[n++] = idx[t];
      out[n++] = idx[t + 1];
      out[n++] = idx[t + 2];
    }
  });
  g.setIndex(new THREE.BufferAttribute(out, 1));
  mesh.material = mats;
}

function plateTexture(text: string) {
  const c = document.createElement('canvas');
  c.width = 1040;
  c.height = 220;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f3f3ee';
  g.fillRect(0, 0, 1040, 220);
  g.strokeStyle = '#1a1a1a';
  g.lineWidth = 6;
  g.strokeRect(6, 6, 1028, 208);
  g.fillStyle = '#17409a';
  g.fillRect(9, 9, 84, 202);
  g.fillRect(947, 9, 84, 202);
  g.fillStyle = '#f4c800';
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    g.beginPath();
    g.arc(51 + Math.cos(a) * 24, 62 + Math.sin(a) * 24, 4, 0, 7);
    g.fill();
  }
  g.fillStyle = '#fff';
  g.font = 'bold 54px Arial';
  g.textAlign = 'center';
  g.fillText('I', 51, 178);
  g.fillStyle = '#111';
  g.font = 'bold 150px "Arial Narrow", Arial';
  g.textBaseline = 'middle';
  g.fillText(text, 520, 116);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function materialFor(name: string, node: string): THREE.Material {
  const tail = /taillight|tailgate/.test(node),
    head = /headlight/.test(node);
  switch (name) {
    case 'ClioIV':
      return M.paint;
    case 'ClioIV_body':
      return M.trim;
    case 'ClioIV_glass':
      return head ? M.lens : M.glass;
    case 'ClioIV_lights_glass':
      return M.redLens;
    case 'ClioIV_lights_misc':
      return tail ? M.redIn : M.lampIn;
    case 'ClioIV_taillight':
      return M.red;
    case 'ClioIV_chmsl':
      return M.chmsl;
    case 'ClioIV_signal_L':
    case 'ClioIV_signal_R':
      return M.amber;
    case 'ClioIV_headlight':
      return M.lowBeam;
    case 'ClioIV_highbeam':
      return M.highBeam;
    case 'ClioIV_foglight':
      return M.fog;
    case 'ClioIV_runninglight':
      return M.drl;
    case 'ClioIV_reverselight':
      return M.reverse;
    case 'ClioIV_rooflight':
      return M.roofl;
    case 'ClioIV_silver':
      return M.chrome;
    case 'ClioIV_wheel':
      return M.rim;
    case 'ClioIV_dashboard':
      return M.plasticG;
    case 'ClioIV_doorpanel':
    case 'ClioIV_cabin':
    case 'ClioIV_interior':
      return M.cabin;
    case 'ClioIV_interior_lod0':
      return M.fabric;
    case 'ClioIV_bottom':
    case 'ClioIV_underside':
      return M.floor;
    default:
      return M.plastic;
  }
}

export async function buildBody(car: Car) {
  const gltf = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/clio_mk4.glb`);
  const src = gltf.scene;
  src.updateMatrixWorld(true);
  const top = src.getObjectByName('Collada_visual_scene_group') || src.children[0].children[0];
  const base = top.matrixWorld.clone(); // porta il modello in Y-alto

  // misura: lunghezza reale 4,062 m, muso a x = 0, ruote a terra
  const bb = new THREE.Box3();
  for (const n of top.children) if (/bumper/.test(n.name)) bb.expandByObject(n);
  const len = bb.max.z - bb.min.z,
    s = L / len;
  // dal modello (X laterale, Y alto, -Z avanti) alle coordinate auto (x dal muso al retro, y alto, z sinistra)
  const conv = new THREE.Matrix4()
    .makeTranslation(bb.max.z * s, 0, 0)
    .multiply(new THREE.Matrix4().makeScale(s, s, s))
    .multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2))
    .multiply(base);

  const groups: Record<string, THREE.Group> = {};
  const part = (id: string, parent?: THREE.Object3D | null) => {
    if (groups[id]) return groups[id];
    const g = new THREE.Group();
    g.userData.partId = id;
    car.parts[id] = g;
    groups[id] = g;
    (parent || car.root).add(g);
    return g;
  };
  const wrap = (node: THREE.Object3D) => {
    const w = new THREE.Group();
    conv.decompose(w.position, w.quaternion, w.scale);
    w.add(node);
    w.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.material = materialFor(o.material.name, node.name);
      o.castShadow = o.material !== M.glass && o.material !== M.lens;
    });
    const rule = Object.keys(DETAIL).find((k) => node.name.startsWith(k));
    if (rule) {
      w.updateMatrixWorld(true);
      w.traverse((o) => {
        if (o instanceof THREE.Mesh && o.material === M.trim) splitIslands(o, DETAIL[rule]);
      });
    }
    return w;
  };

  // 1) pezzi apribili: perno sulla cerniera, ricavata dall'ingombro del pannello
  const inner: Record<string, THREE.Group> = {};
  for (const n of [...top.children]) {
    const def = NODE_PART[n.name];
    if (!def || !OPEN[def[0]]) continue;
    const id = def[0],
      w = wrap(n);
    w.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(w),
      [axis, angle] = OPEN[id],
      pv = new THREE.Vector3();
    if (id === 'cofano') pv.set(b.max.x - 0.03, b.max.y - 0.03, 0);
    else if (id === 'portellone') pv.set(b.min.x + 0.03, b.max.y - 0.04, 0);
    else {
      const left = id.endsWith('sx');
      pv.set(b.min.x + 0.02, (b.min.y + b.max.y) / 2, left ? b.max.z - 0.05 : b.min.z + 0.05);
    }
    const o = part(id);
    o.position.copy(pv);
    o.userData.open = { axis, angle, cur: 0, target: 0 };
    car.openables[id] = o;
    inner[id] = new THREE.Group();
    inner[id].position.copy(pv).negate();
    o.add(inner[id]);
    inner[id].add(w);
  }
  // 2) gli altri pezzi con nome
  for (const n of [...top.children]) {
    if (n.name === RIM) {
      const w = wrap(n);
      w.position.set(0, 0, 0);
      car.rim = w;
      continue;
    }
    const def = NODE_PART[n.name];
    if (!def || OPEN[def[0]]) continue;
    part(def[0], def[1] ? inner[def[1]] : null).add(wrap(n));
  }
  // 3) scocca e vano motore: divisi per materiale
  const split = (name: string, rules: (mat: string) => string | null | false) => {
    const n = top.getObjectByName(name);
    if (!n) return;
    for (const m of [...n.children]) {
      const mesh =
        m instanceof THREE.Mesh
          ? m
          : m.children.find((c): c is THREE.Mesh => c instanceof THREE.Mesh);
      if (!mesh) continue;
      const id = rules(mesh.material.name);
      if (id === false) continue;
      const w = wrap(m);
      if (name !== 'ClioIV_body')
        w.traverse((o) => {
          if (o instanceof THREE.Mesh)
            o.material = materialFor(o.material.name === '' ? 'x' : mesh.material.name, name);
        });
      if (id) part(id).add(w);
      else car.root.add(w);
    }
  };
  const bodySplit: Record<string, string> = {
    ClioIV: 'fiancata',
    ClioIV_interior_lod0: 'sedili',
    ClioIV_dashboard: 'plancia',
    ClioIV_glass: 'fiancata',
  };
  split('ClioIV_body', (mat) => bodySplit[mat] || null);
  split('ClioIV_engbay', (mat) => (mat === 'ClioIV' ? null : false)); // si tiene solo la vasca del vano: il motore è quello dettagliato di engine.js
  // luci nel paraurti e nella calandra come pezzo a sé
  for (const id of ['paraurti_ant', 'calandra', 'portellone']) {
    const g = id === 'portellone' ? inner.portellone : groups[id];
    if (!g) continue;
    const pick: THREE.Mesh[] = [];
    g.traverse((o) => {
      if (
        o instanceof THREE.Mesh &&
        (o.material === M.fog ||
          o.material === M.drl ||
          (id === 'portellone' &&
            (o.material === M.redLens ||
              o.material === M.redIn ||
              o.material === M.red ||
              o.material === M.reverse)))
      )
        pick.push(o);
    });
    if (!pick.length) continue;
    const tid = id === 'portellone' ? 'fanale_int' : 'drl';
    for (const o of pick) {
      const holder = new THREE.Group();
      o.parent!.updateWorldMatrix(true, false);
      const p = part(tid, id === 'portellone' ? inner.portellone : null);
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

  // targhe
  const plateMat = new THREE.MeshStandardMaterial({
    map: plateTexture('FB 416 KD'),
    roughness: 0.35,
    metalness: 0.1,
  });
  const plate = (parent: THREE.Object3D, x: number, y: number, dir: number, bend: number) => {
    const g = new THREE.PlaneGeometry(0.52, 0.11, 10, 1),
      p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const z = p.getX(i);
      p.setXYZ(i, bend * z * z * dir, p.getY(i), -z * dir);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, plateMat);
    m.position.set(x, y, 0);
    parent.add(m);
  };
  plate(groups.paraurti_ant, -0.004, 0.32, -1, -0.43);
  plate(groups.paraurti_post, 4.036, 0.462, 1, -0.2);
}
