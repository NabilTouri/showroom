// Luci dell'auto accendibili: agisce sull'emissione dei materiali delle lampade (il bagliore lo aggiunge la post-produzione).
import * as THREE from 'three';
import { M } from './materials.js';
import { beamTexture } from './textures.js';

export const LIGHT_LABEL = { diurne: 'Luci diurne', anabbaglianti: 'Anabbaglianti', frecce: 'Frecce (4 frecce)', stop: 'Stop', retro: 'Retromarcia' };

export function createLights(car) {
  const state = { diurne: true, anabbaglianti: false, frecce: false, stop: false, retro: false };
  // fascio dei fari sul pavimento (alone additivo)
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.6), new THREE.MeshBasicMaterial({ map: beamTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  beam.rotation.x = -Math.PI / 2; beam.position.set(-2.3, 0.006, 0); beam.renderOrder = 2; car.root.add(beam);
  let beamK = 0;
  return {
    state,
    get animating() { return state.frecce || Math.abs(beamK - (state.anabbaglianti ? 1 : 0)) > 0.01; },
    apply(t, dt) {
      const low = state.anabbaglianti, blink = state.frecce && Math.floor(t * 2.8) % 2 === 0;
      M.drl.emissiveIntensity = low ? 2 : state.diurne ? 5 : 0;
      M.lowBeam.emissiveIntensity = low ? 7 : 0;
      M.red.emissiveIntensity = state.stop ? 6 : low ? 1.4 : 0;
      M.redLens.emissiveIntensity = state.stop ? 1.4 : low ? 0.45 : 0.05;
      M.chmsl.emissiveIntensity = state.stop ? 7 : 0;
      M.reverse.emissiveIntensity = state.retro ? 6 : 0;
      M.amber.emissiveIntensity = blink ? 7 : 0;
      beamK += ((low ? 1 : 0) - beamK) * Math.min(1, dt * 6);
      beam.material.opacity = 0.5 * beamK; beam.visible = beamK > 0.01;
    },
  };
}
