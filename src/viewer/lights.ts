// Switchable vehicle lights: they drive the emissive intensity of the lamp materials (the glow
// comes from post-processing) and an optional additive beam on the floor.
import * as THREE from 'three';
import type { LightRig, LightState } from '../vehicles/types';
import { beamTexture } from './textures';

type Emissive = THREE.Material & { emissiveIntensity: number };

export class VehicleLights {
  private beam: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null = null;
  private beamK = 0;

  constructor(
    private readonly rig: LightRig,
    private readonly materials: Readonly<Record<string, THREE.Material>>,
    root: THREE.Object3D,
  ) {
    const fb = rig.floorBeam;
    if (fb) {
      const beam = new THREE.Mesh(
        new THREE.PlaneGeometry(fb.size[0], fb.size[1]),
        new THREE.MeshBasicMaterial({
          map: beamTexture(),
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          toneMapped: false,
        }),
      );
      beam.rotation.x = -Math.PI / 2;
      beam.position.set(...fb.position);
      beam.renderOrder = 2;
      root.add(beam);
      this.beam = beam;
    }
  }

  /** Initial switch positions. */
  initialState(): LightState {
    return Object.fromEntries(this.rig.switches.map((s) => [s.id, !!s.on]));
  }

  /** True while something changes over time (blinking, beam fading). */
  animating(state: LightState) {
    const fb = this.rig.floorBeam;
    return (
      this.rig.switches.some((s) => s.blinking && state[s.id]) ||
      (!!fb && Math.abs(this.beamK - (state[fb.switch] ? 1 : 0)) > 0.01)
    );
  }

  apply(state: LightState, time: number, dt: number) {
    const blinking = this.rig.switches.some((s) => s.blinking && state[s.id]);
    const blink = blinking && Math.floor(time * this.rig.blinkRate) % 2 === 0;
    for (const [key, intensity] of Object.entries(this.rig.emission))
      (this.materials[key] as Emissive).emissiveIntensity = intensity(state, blink);
    const fb = this.rig.floorBeam;
    if (fb && this.beam) {
      this.beamK += ((state[fb.switch] ? 1 : 0) - this.beamK) * Math.min(1, dt * 6);
      this.beam.material.opacity = fb.opacity * this.beamK;
      this.beam.visible = this.beamK > 0.01;
    }
  }
}
