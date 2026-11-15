// Abitacolo semplificato e bagagliaio
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M } from './materials.js';

export function buildInterior(car) {
  const root = new THREE.Group(); car.root.add(root);
  const part = (id) => { const g = new THREE.Group(); g.userData.partId = id; root.add(g); car.parts[id] = g; return g; };
  const add = (g, geo, mat) => { const m = new THREE.Mesh(geo, mat); g.add(m); return m; };
  const box = (g, mat, w, h, d, x, y, z, r = 0.02) => { const m = add(g, new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.2, h / 2.2, d / 2.2)), mat); m.position.set(x, y, z); return m; };
  const cyl = (g, mat, r, len, x, y, z, axis = 'y') => { const m = add(g, new THREE.CylinderGeometry(r, r, len, 20), mat); m.position.set(x, y, z); if (axis === 'x') m.rotation.z = Math.PI / 2; if (axis === 'z') m.rotation.x = Math.PI / 2; return m; };

  // struttura non cliccabile: pavimento, parafiamma, passaruota interni
  const st = new THREE.Group(); root.add(st);
  box(st, M.floor, 2.75, 0.03, 1.40, 2.48, 0.215, 0, 0.01);
  box(st, M.floor, 0.03, 0.78, 1.42, 1.10, 0.58, 0, 0.01);          // parafiamma
  box(st, M.floor, 0.62, 0.03, 1.25, 3.62, 0.50, 0, 0.01);          // piano bagagliaio
  box(st, M.floor, 0.5, 0.42, 0.20, 3.44, 0.45, 0.60, 0.05); box(st, M.floor, 0.5, 0.42, 0.20, 3.44, 0.45, -0.60, 0.05);
  box(st, M.floor, 1.9, 0.16, 0.16, 2.2, 0.29, 0, 0.04);            // tunnel

  let g = part('plancia');
  box(g, M.plastic, 0.42, 0.20, 1.40, 1.33, 0.83, 0, 0.07);
  box(g, M.plasticG, 0.30, 0.34, 1.30, 1.30, 0.58, 0, 0.05);
  box(g, M.gloss, 0.03, 0.14, 0.21, 1.535, 0.83, 0, 0.01).rotation.z = -0.25;     // schermo R-Link / radio
  box(g, M.plastic, 0.16, 0.10, 0.34, 1.42, 0.955, 0.36, 0.04);                  // palpebra quadro
  for (const z of [-0.60, -0.16, 0.16, 0.60]) cyl(g, M.gloss, 0.04, 0.02, 1.545, 0.86, z, 'x');
  g = part('quadro_strumenti');
  box(g, M.gloss, 0.02, 0.075, 0.26, 1.49, 0.93, 0.36, 0.01).rotation.z = -0.3;
  g = part('volante');
  { const t = add(g, new THREE.TorusGeometry(0.175, 0.017, 12, 36), M.plastic); t.position.set(1.66, 0.90, 0.36); t.rotation.set(0, Math.PI / 2, 0); t.rotateX(0.0); t.rotation.z = 0; t.rotateY(0); t.rotation.set(0, Math.PI / 2, 0); t.rotateX(-0.38); }
  { const h = box(g, M.plastic, 0.05, 0.11, 0.13, 1.645, 0.895, 0.36, 0.03); h.rotation.z = -0.38; }
  for (const a of [0, 2.3, -2.3]) { const s = box(g, M.plastic, 0.016, 0.15, 0.03, 1.655, 0.898, 0.36, 0.006); s.rotation.z = -0.38; s.rotateX(a + Math.PI); s.translateY(0.09); }
  cyl(g, M.plastic, 0.03, 0.26, 1.54, 0.855, 0.36, 'x').rotation.z = Math.PI / 2 - 0.38;
  g = part('leva_cambio');
  box(g, M.plasticG, 0.50, 0.14, 0.17, 1.88, 0.38, 0, 0.03);
  cyl(g, M.steel, 0.008, 0.16, 1.74, 0.52, 0); add(g, new THREE.SphereGeometry(0.028, 16, 12), M.plastic).position.set(1.74, 0.61, 0);
  { const hb = box(g, M.plastic, 0.20, 0.03, 0.035, 2.02, 0.48, 0.03, 0.012); hb.rotation.z = 0.25; }
  g = part('pedaliera');
  for (const [z, w] of [[0.48, 0.05], [0.37, 0.05], [0.24, 0.04]]) { const p = box(g, M.steel, 0.012, 0.07, w, 1.21, 0.40, z, 0.004); p.rotation.z = 0.5; cyl(g, M.iron, 0.006, 0.22, 1.19, 0.50, z).rotation.z = 0.25; }

  const seat = (id, z, w) => {
    const s = part(id);
    box(s, M.fabric, 0.50, 0.12, w, 2.02, 0.44, z, 0.05);
    box(s, M.fabric2, 0.34, 0.03, w * 0.6, 2.02, 0.505, z, 0.012);
    const b = box(s, M.fabric, 0.12, 0.62, w, 2.33, 0.78, z, 0.05); b.rotation.z = -0.22;
    const b2 = box(s, M.fabric2, 0.03, 0.42, w * 0.6, 2.275, 0.76, z, 0.012); b2.rotation.z = -0.22;
    const h = box(s, M.fabric, 0.09, 0.17, w * 0.5, 2.425, 1.16, z, 0.04); h.rotation.z = -0.15;
    cyl(s, M.steel, 0.005, 0.1, 2.41, 1.06, z + 0.05); cyl(s, M.steel, 0.005, 0.1, 2.41, 1.06, z - 0.05);
    box(s, M.plastic, 0.46, 0.08, w * 0.9, 2.02, 0.345, z, 0.02);
  };
  seat('sedile_ant_sx', 0.37, 0.50); seat('sedile_ant_dx', -0.37, 0.50);
  g = part('divano_post');
  box(g, M.fabric, 0.50, 0.13, 1.28, 2.93, 0.44, 0, 0.05);
  { const b = box(g, M.fabric, 0.12, 0.60, 1.28, 3.24, 0.76, 0, 0.05); b.rotation.z = -0.3; }
  for (const z of [-0.42, 0.42]) { const h = box(g, M.fabric, 0.08, 0.13, 0.22, 3.36, 1.10, z, 0.035); h.rotation.z = -0.25; }
  g = part('cappelliera');
  box(g, M.plasticG, 0.50, 0.015, 1.16, 3.60, 0.99, 0, 0.006);
  g = part('ruotino');
  cyl(g, M.tire, 0.27, 0.11, 3.66, 0.40, 0); cyl(g, M.iron, 0.17, 0.115, 3.66, 0.40, 0);
  g = part('filtro_abitacolo');
  box(g, M.white, 0.035, 0.20, 0.22, 1.24, 0.50, -0.28, 0.006); box(g, M.plastic, 0.05, 0.22, 0.05, 1.24, 0.50, -0.15, 0.01);
  g = part('airbag');
  box(g, M.plasticG, 0.02, 0.10, 0.26, 1.535, 0.845, -0.40, 0.01);
}
