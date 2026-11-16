import * as THREE from 'three';
import { FA, RA, WHEEL_Y, TRACK } from './surface.js';
import { M } from './materials.js';
import { tireBump } from './textures.js';
import type { Car } from './car.js';

const RIM_R = 0.218; // raggio del cerchio del modello (17")

function tireGeo() {
  const w = 0.1,
    pts = [
      [RIM_R, -w * 0.92],
      [RIM_R + 0.012, -w],
      [0.262, -w * 1.04],
      [0.292, -w * 0.96],
      [0.306, -w * 0.78],
      [0.312, -w * 0.5],
      [0.3125, 0],
      [0.312, w * 0.5],
      [0.306, w * 0.78],
      [0.292, w * 0.96],
      [0.262, w * 1.04],
      [RIM_R + 0.012, w],
      [RIM_R, w * 0.92],
    ].map(([r, y]) => new THREE.Vector2(r, y));
  const spline = new THREE.SplineCurve(pts).getPoints(40);
  return new THREE.LatheGeometry(spline, 72).rotateX(Math.PI / 2);
}

export function buildWheels(car: Car) {
  const tire = tireGeo();
  const bump = tireBump();
  M.tire.bumpMap = bump;
  M.tire.bumpScale = 1.6;
  M.tire.roughness = 0.88;
  M.tire.needsUpdate = true;
  const barrel = new THREE.CylinderGeometry(
    RIM_R - 0.004,
    RIM_R - 0.004,
    0.19,
    48,
    1,
    true,
  ).rotateX(Math.PI / 2);
  for (const [pos, ax] of [
    ['ant', FA],
    ['post', RA],
  ] as const)
    for (const s of [1, -1]) {
      const sx = s > 0 ? 'sx' : 'dx';
      const hub = new THREE.Group();
      hub.position.set(ax, WHEEL_Y, TRACK * s);
      hub.scale.z = s;
      car.root.add(hub);
      const w = new THREE.Group();
      w.userData.partId = `ruota_${pos}_${sx}`;
      car.parts[w.userData.partId] = w;
      hub.add(w);
      const add = (g: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material) => {
        const m = new THREE.Mesh(geo, mat);
        m.castShadow = true;
        g.add(m);
        return m;
      };
      add(w, tire, M.tire);
      const inner = add(w, barrel, M.rimDark);
      inner.material = M.rimDark;
      if (car.rim) {
        const r = car.rim.clone(true);
        r.position.set(0, 0, 0.012);
        w.add(r);
      }
      const cap = add(
        w,
        new THREE.CylinderGeometry(0.027, 0.027, 0.004, 24).rotateX(Math.PI / 2),
        M.plastic,
      );
      cap.position.z = 0.062;
      // freni
      const f = new THREE.Group();
      f.userData.partId = `freno_${pos}_${sx}`;
      car.parts[f.userData.partId] = f;
      hub.add(f);
      if (pos === 'ant') {
        const d = add(
          f,
          new THREE.CylinderGeometry(0.129, 0.129, 0.022, 48).rotateX(Math.PI / 2),
          M.disc,
        );
        d.position.z = 0.0;
        const h = add(
          f,
          new THREE.CylinderGeometry(0.072, 0.072, 0.05, 24).rotateX(Math.PI / 2),
          M.iron,
        );
        h.position.z = 0.01;
        const c = add(f, new THREE.BoxGeometry(0.07, 0.13, 0.075), M.aluDark);
        c.position.set(-0.115, 0.02, -0.005);
      } else {
        const d = add(
          f,
          new THREE.CylinderGeometry(0.118, 0.118, 0.06, 32).rotateX(Math.PI / 2),
          M.iron,
        );
        d.position.z = -0.02;
        const h = add(
          f,
          new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20).rotateX(Math.PI / 2),
          M.rust,
        );
        h.position.z = 0.02;
      }
    }
}
