// Small helpers to model procedural parts (engine bay, wheels, hidden components) from primitives.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Vec3 } from './math';

export type ShapeAxis = 'x' | 'y' | 'z';

export interface ShapeOptions {
  castShadow: boolean;
  /** Segments of rounded boxes. */
  boxSegments: number;
  /** Default corner radius of rounded boxes. */
  boxRadius: number;
}

export function createShapes({ castShadow, boxSegments, boxRadius }: ShapeOptions) {
  const V = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2]);
  const add = (g: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material) => {
    const m = new THREE.Mesh(geo, mat);
    if (castShadow) m.castShadow = true;
    g.add(m);
    return m;
  };
  return {
    add,
    box(
      g: THREE.Object3D,
      mat: THREE.Material,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      r = boxRadius,
    ) {
      const m = add(
        g,
        new RoundedBoxGeometry(w, h, d, boxSegments, Math.min(r, w / 2.2, h / 2.2, d / 2.2)),
        mat,
      );
      m.position.set(x, y, z);
      return m;
    },
    /** Cylinder along `axis`; r2 is the top radius (cones). */
    cyl(
      g: THREE.Object3D,
      mat: THREE.Material,
      r: number,
      len: number,
      x: number,
      y: number,
      z: number,
      axis: ShapeAxis = 'y',
      r2 = r,
      seg = 24,
    ) {
      const m = add(g, new THREE.CylinderGeometry(r2, r, len, seg), mat);
      m.position.set(x, y, z);
      if (axis === 'x') m.rotation.z = Math.PI / 2;
      if (axis === 'z') m.rotation.x = Math.PI / 2;
      return m;
    },
    /** Pipe through Catmull-Rom points. */
    tube(g: THREE.Object3D, mat: THREE.Material, rad: number, pts: Vec3[], closed = false) {
      return add(
        g,
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(pts.map(V), closed, 'catmullrom', 0.4),
          Math.max(12, pts.length * 8),
          rad,
          10,
          closed,
        ),
        mat,
      );
    },
    sph(
      g: THREE.Object3D,
      mat: THREE.Material,
      r: number,
      x: number,
      y: number,
      z: number,
      sx = 1,
      sy = 1,
      sz = 1,
    ) {
      const m = add(g, new THREE.SphereGeometry(r, 20, 14), mat);
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      return m;
    },
    /** Coil spring around a vertical axis. */
    helix(
      g: THREE.Object3D,
      mat: THREE.Material,
      x: number,
      y0: number,
      y1: number,
      z: number,
      R: number,
      turns: number,
      rad = 0.007,
    ) {
      const pts: Vec3[] = [];
      const n = turns * 12;
      for (let i = 0; i <= n; i++) {
        const a = (i / 12) * Math.PI * 2;
        pts.push([x + Math.cos(a) * R, y0 + ((y1 - y0) * i) / n, z + Math.sin(a) * R]);
      }
      return add(
        g,
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(V)), n * 3, rad, 6),
        mat,
      );
    },
    /** Textured label facing up (x towards the front) or towards the front of the vehicle. */
    label(
      g: THREE.Object3D,
      tex: THREE.Texture,
      w: number,
      d: number,
      x: number,
      y: number,
      z: number,
      facing: 'up' | 'front' = 'up',
    ) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, d),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45 }),
      );
      m.position.set(x, y, z);
      if (facing === 'up') {
        m.rotation.x = -Math.PI / 2;
        m.rotation.z = Math.PI / 2;
      } else m.rotation.y = -Math.PI / 2;
      g.add(m);
      return m;
    },
  };
}
