import * as THREE from 'three';
import { FA, RA, WHEEL_Y, TRACK } from './surface.js';
import { M } from './materials.js';

function tireGeo() {
  const w = 0.0975, pts = [[0.205, -w], [0.275, -w], [0.300, -w * 0.86], [0.312, -w * 0.55], [0.312, w * 0.55], [0.300, w * 0.86], [0.275, w], [0.205, w]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 48).rotateX(Math.PI / 2);
}
function rimBarrelGeo() {
  const pts = [[0.208, -0.095], [0.196, -0.09], [0.19, 0.06], [0.205, 0.085], [0.212, 0.097], [0.205, 0.1]].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 48).rotateX(Math.PI / 2);
}

export function buildWheels(car) {
  const tire = tireGeo(), barrel = rimBarrelGeo();
  const spoke = new THREE.BoxGeometry(0.155, 0.022, 0.018);
  const defs = [['ant', FA], ['post', RA]];
  for (const [pos, ax] of defs) for (const s of [1, -1]) {
    const sx = s > 0 ? 'sx' : 'dx';
    const hub = new THREE.Group(); hub.position.set(ax, WHEEL_Y, TRACK * s); hub.scale.z = s; car.root.add(hub);
    const w = new THREE.Group(); w.userData.partId = `ruota_${pos}_${sx}`; car.parts[w.userData.partId] = w; hub.add(w);
    const add = (g, geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; g.add(m); return m; };
    add(w, tire, M.tire);
    add(w, barrel, M.rim);
    // razze (5 doppie)
    for (let i = 0; i < 5; i++) for (const d of [-0.16, 0.16]) {
      const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
      const sp = add(w, spoke, M.rim);
      const r = 0.118;
      sp.position.set(Math.cos(a + d * 0.55) * r, Math.sin(a + d * 0.55) * r, 0.075 - 0.012);
      sp.rotation.z = a + d * 0.9; sp.rotation.y = 0;
    }
    const cap = add(w, new THREE.CylinderGeometry(0.05, 0.058, 0.03, 24).rotateX(Math.PI / 2), M.rim); cap.position.z = 0.068;
    const cap2 = add(w, new THREE.CylinderGeometry(0.028, 0.028, 0.006, 20).rotateX(Math.PI / 2), M.plastic); cap2.position.z = 0.085;
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.6; const n = add(w, new THREE.CylinderGeometry(0.008, 0.008, 0.012, 6).rotateX(Math.PI / 2), M.steel); n.position.set(Math.cos(a) * 0.04, Math.sin(a) * 0.04, 0.084); }
    // freni
    const f = new THREE.Group(); f.userData.partId = `freno_${pos}_${sx}`; car.parts[f.userData.partId] = f; hub.add(f);
    if (pos === 'ant') {
      const d = add(f, new THREE.CylinderGeometry(0.129, 0.129, 0.022, 40).rotateX(Math.PI / 2), M.disc); d.position.z = 0.02;
      const h = add(f, new THREE.CylinderGeometry(0.07, 0.07, 0.05, 24).rotateX(Math.PI / 2), M.iron); h.position.z = 0.03;
      const c = add(f, new THREE.BoxGeometry(0.07, 0.13, 0.075), M.aluDark); c.position.set(-0.115, 0.02, 0.015);
    } else {
      const d = add(f, new THREE.CylinderGeometry(0.118, 0.118, 0.06, 32).rotateX(Math.PI / 2), M.iron); d.position.z = 0.0;
      const h = add(f, new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20).rotateX(Math.PI / 2), M.rust); h.position.z = 0.04;
    }
  }
}
