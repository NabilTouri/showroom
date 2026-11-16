import type * as THREE from 'three';

// Auto in costruzione/costruita: gruppo radice, pezzi per id della scheda, pezzi apribili.
export interface Car {
  root: THREE.Group;
  parts: Record<string, THREE.Object3D>;
  openables: Record<string, THREE.Object3D>;
  rim?: THREE.Object3D;
  mech?: THREE.Group;
}

export interface OpenState {
  axis: 'x' | 'y' | 'z';
  angle: number;
  cur: number;
  target: number;
}
