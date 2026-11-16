// Componenti interni non presenti nel modello della carrozzeria (visibili con Raggi X o a bagagliaio aperto)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M } from './materials.js';

export function buildInterior(car) {
  const root = new THREE.Group(); car.root.add(root);
  const part = (id) => { const g = new THREE.Group(); g.userData.partId = id; root.add(g); car.parts[id] = g; return g; };
  const add = (g, geo, mat) => { const m = new THREE.Mesh(geo, mat); g.add(m); return m; };
  const box = (g, mat, w, h, d, x, y, z, r = 0.02) => { const m = add(g, new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.2, h / 2.2, d / 2.2)), mat); m.position.set(x, y, z); return m; };
  const cyl = (g, mat, r, len, x, y, z) => { const m = add(g, new THREE.CylinderGeometry(r, r, len, 24), mat); m.position.set(x, y, z); return m; };

  let g = part('ruotino');
  cyl(g, M.tire, 0.27, 0.11, 3.62, 0.36, 0); cyl(g, M.iron, 0.17, 0.115, 3.62, 0.36, 0);
  g = part('filtro_abitacolo');
  box(g, M.white, 0.035, 0.20, 0.22, 1.24, 0.50, -0.28, 0.006); box(g, M.plastic, 0.05, 0.22, 0.05, 1.24, 0.50, -0.15, 0.01);
}
