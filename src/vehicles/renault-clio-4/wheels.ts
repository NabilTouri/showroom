// Wheels (the model's alloy rim inside a procedural tire) and brakes.
import * as THREE from 'three';
import { tireBump } from '../../viewer/textures';
import type { ClioDimensions } from './dimensions';
import type { ClioMaterials } from './materials';

const RIM_R = 0.218; // radius of the model's 17" rim

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

/** Adds the four wheels and brakes to `root`; `rim` is the rim template from the model. */
export function buildWheels(
  root: THREE.Group,
  mat: ClioMaterials,
  dims: ClioDimensions,
  rim: THREE.Object3D | undefined,
) {
  const parts: Record<string, THREE.Group> = {};
  const tire = tireGeo();
  const bump = tireBump(['ENERGY SAVER', '195/55 R16 87H']);
  mat.tire.bumpMap = bump;
  mat.tire.bumpScale = 1.6;
  mat.tire.roughness = 0.88;
  mat.tire.needsUpdate = true;
  const barrel = new THREE.CylinderGeometry(
    RIM_R - 0.004,
    RIM_R - 0.004,
    0.19,
    48,
    1,
    true,
  ).rotateX(Math.PI / 2);
  for (const [pos, ax] of [
    ['front', dims.frontAxle],
    ['rear', dims.rearAxle],
  ] as const)
    for (const s of [1, -1]) {
      const side = s > 0 ? 'left' : 'right';
      const hub = new THREE.Group();
      hub.position.set(ax, dims.wheelCenterY, dims.halfTrack * s);
      hub.scale.z = s;
      root.add(hub);
      const w = new THREE.Group();
      parts[`wheel.${pos}.${side}`] = w;
      hub.add(w);
      const add = (g: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material) => {
        const m = new THREE.Mesh(geo, mat);
        m.castShadow = true;
        g.add(m);
        return m;
      };
      add(w, tire, mat.tire);
      const inner = add(w, barrel, mat.rimDark);
      inner.material = mat.rimDark;
      if (rim) {
        const r = rim.clone(true);
        r.position.set(0, 0, 0.012);
        w.add(r);
      }
      const cap = add(
        w,
        new THREE.CylinderGeometry(0.027, 0.027, 0.004, 24).rotateX(Math.PI / 2),
        mat.plastic,
      );
      cap.position.z = 0.062;
      // brakes
      const f = new THREE.Group();
      parts[`brake.${pos}.${side}`] = f;
      hub.add(f);
      if (pos === 'front') {
        const d = add(
          f,
          new THREE.CylinderGeometry(0.129, 0.129, 0.022, 48).rotateX(Math.PI / 2),
          mat.disc,
        );
        d.position.z = 0.0;
        const h = add(
          f,
          new THREE.CylinderGeometry(0.072, 0.072, 0.05, 24).rotateX(Math.PI / 2),
          mat.iron,
        );
        h.position.z = 0.01;
        const c = add(f, new THREE.BoxGeometry(0.07, 0.13, 0.075), mat.aluDark);
        c.position.set(-0.115, 0.02, -0.005);
      } else {
        const d = add(
          f,
          new THREE.CylinderGeometry(0.118, 0.118, 0.06, 32).rotateX(Math.PI / 2),
          mat.iron,
        );
        d.position.z = -0.02;
        const h = add(
          f,
          new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20).rotateX(Math.PI / 2),
          mat.rust,
        );
        h.position.z = 0.02;
      }
    }
  return parts;
}
