// Hidden components missing from the body model (visible in x-ray or with the tailgate open).
import * as THREE from 'three';
import { createShapes } from '../../viewer/shapes';
import type { ClioMaterials } from './materials';

export function buildInterior(root: THREE.Group, mat: ClioMaterials) {
  const group = new THREE.Group();
  root.add(group);
  const parts: Record<string, THREE.Group> = {};
  const part = (id: string) => {
    const g = new THREE.Group();
    group.add(g);
    parts[id] = g;
    return g;
  };
  const { box, cyl } = createShapes({ castShadow: false, boxSegments: 3, boxRadius: 0.02 });

  let g = part('spare-wheel');
  cyl(g, mat.tire, 0.27, 0.11, 3.62, 0.36, 0);
  cyl(g, mat.iron, 0.17, 0.115, 3.62, 0.36, 0);
  g = part('cabin-filter');
  box(g, mat.white, 0.035, 0.2, 0.22, 1.24, 0.5, -0.28, 0.006);
  box(g, mat.plastic, 0.05, 0.22, 0.05, 1.24, 0.5, -0.15, 0.01);
  return parts;
}
