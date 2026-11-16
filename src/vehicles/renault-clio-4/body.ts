// Body and cabin: «Renault Clio MK4 2012-2020» by Merc_TV (CC BY 4.0, see CREDITS.md).
// The model is already split into named nodes: this spec maps each node to its part, mounts
// doors, hood and tailgate on their hinges and assigns the Clio's materials.
import type * as THREE from 'three';
import { boxWithin } from '../../viewer/islands';
import type { GltfAssemblySpec } from '../../viewer/gltf-assembly';
import type { ClioDimensions } from './dimensions';
import modelUrl from './clio_mk4.glb?url';

const leftDoor = {
  x: { at: 'min', offset: 0.02 },
  y: { at: 'center' },
  z: { at: 'max', offset: -0.05 },
} as const;
const rightDoor = { ...leftDoor, z: { at: 'min', offset: 0.05 } } as const;

const height = (b: THREE.Box3) => b.max.y - b.min.y;
const width = (b: THREE.Box3) => b.max.z - b.min.z;

export const bodySpec = (dims: ClioDimensions): GltfAssemblySpec => ({
  url: modelUrl,
  container: 'Collada_visual_scene_group',
  lengthNodes: /bumper/,
  length: dims.length,
  openables: {
    ClioIV_hood: {
      part: 'hood',
      axis: 'z',
      angle: -0.95,
      hinge: { x: { at: 'max', offset: -0.03 }, y: { at: 'max', offset: -0.03 }, z: 0 },
    },
    ClioIV_door_FL: { part: 'door.front.left', axis: 'y', angle: -1.1, hinge: leftDoor },
    ClioIV_door_FR: { part: 'door.front.right', axis: 'y', angle: 1.1, hinge: rightDoor },
    ClioIV_door_RL: { part: 'door.rear.left', axis: 'y', angle: -1.1, hinge: leftDoor },
    ClioIV_door_RR: { part: 'door.rear.right', axis: 'y', angle: 1.1, hinge: rightDoor },
    ClioIV_tailgate: {
      part: 'tailgate',
      axis: 'z',
      angle: 1.3,
      hinge: { x: { at: 'min', offset: 0.03 }, y: { at: 'max', offset: -0.04 }, z: 0 },
    },
  },
  nodes: {
    ClioIV_doorglass_FL: { part: 'door-glass.front.left', within: 'door.front.left' },
    ClioIV_doorglass_FR: { part: 'door-glass.front.right', within: 'door.front.right' },
    ClioIV_doorglass_RL: { part: 'door-glass.rear.left', within: 'door.rear.left' },
    ClioIV_doorglass_RR: { part: 'door-glass.rear.right', within: 'door.rear.right' },
    ClioIV_mirror_L: { part: 'mirror.left', within: 'door.front.left' },
    ClioIV_mirror_R: { part: 'mirror.right', within: 'door.front.right' },
    ClioIV_tailgateglass: { part: 'rear-window', within: 'tailgate' },
    ClioIV_fender_L: { part: 'fender.front.left' },
    ClioIV_fender_R: { part: 'fender.front.right' },
    ClioIV_bumper_F: { part: 'bumper.front' },
    ClioIV_bumper_R: { part: 'bumper.rear' },
    ClioIV_grille_F: { part: 'grille' },
    ClioIV_headlightframe_L: { part: 'headlight.left' },
    ClioIV_headlightglass_L: { part: 'headlight.left' },
    ClioIV_headlightframe_R: { part: 'headlight.right' },
    ClioIV_headlightglass_R: { part: 'headlight.right' },
    ClioIV_taillightframe_L: { part: 'taillight.left' },
    ClioIV_taillightglass_L: { part: 'taillight.left' },
    ClioIV_taillightframe_R: { part: 'taillight.right' },
    ClioIV_taillightglass_R: { part: 'taillight.right' },
    ClioIV_windshield: { part: 'windshield' },
    ClioIV_steering_wheel: { part: 'steering-wheel' },
    ClioIV_needle_tacho: { part: 'dashboard' },
  },
  // the model's alloy rim: wheels.ts mounts it inside the procedural tire
  templates: { rim: 'ClioIV_wheel_17x8' },
  materials: {
    rules: [
      { gltf: 'ClioIV', use: 'paint' },
      { gltf: 'ClioIV_body', use: 'trim' },
      { gltf: 'ClioIV_glass', node: /headlight/, use: 'lens' },
      { gltf: 'ClioIV_glass', use: 'glass' },
      { gltf: 'ClioIV_lights_glass', use: 'redLens' },
      { gltf: 'ClioIV_lights_misc', node: /taillight|tailgate/, use: 'redIn' },
      { gltf: 'ClioIV_lights_misc', use: 'lampIn' },
      { gltf: 'ClioIV_taillight', use: 'red' },
      { gltf: 'ClioIV_chmsl', use: 'chmsl' },
      { gltf: ['ClioIV_signal_L', 'ClioIV_signal_R'], use: 'amber' },
      { gltf: 'ClioIV_headlight', use: 'lowBeam' },
      { gltf: 'ClioIV_highbeam', use: 'highBeam' },
      { gltf: 'ClioIV_foglight', use: 'fog' },
      { gltf: 'ClioIV_runninglight', use: 'drl' },
      { gltf: 'ClioIV_reverselight', use: 'reverse' },
      { gltf: 'ClioIV_rooflight', use: 'roofl' },
      { gltf: 'ClioIV_silver', use: 'chrome' },
      { gltf: 'ClioIV_wheel', use: 'rim' },
      { gltf: 'ClioIV_dashboard', use: 'plasticG' },
      { gltf: ['ClioIV_doorpanel', 'ClioIV_cabin', 'ClioIV_interior'], use: 'cabin' },
      { gltf: 'ClioIV_interior_lod0', use: 'fabric' },
      { gltf: ['ClioIV_bottom', 'ClioIV_underside'], use: 'floor' },
    ],
    fallback: 'plastic',
    noShadow: ['glass', 'lens'],
  },
  // Details that share the model's "trim" material, recognised as triangle islands by their
  // bounds (vehicle coordinates, m) and given the right material.
  details: {
    material: 'trim',
    rules: {
      // Renault diamond and chrome strips
      ClioIV_grille_F: (b) =>
        boxWithin(b, 0, 0.12, 0.56, 0.77, 0.09) ||
        (boxWithin(b, 0.03, 0.13, 0.63, 0.69, 0.32) && width(b) > 0.2)
          ? 'chrome'
          : null,
      // diamond, CLIO lettering, badges
      ClioIV_tailgate: (b) =>
        boxWithin(b, 3.9, 4.05, 0.69, 0.97, 0.6) && height(b) < 0.13 && width(b) < 0.5
          ? 'chrome'
          : null,
      // body-coloured handle, chrome strip
      ClioIV_door_F: (b) =>
        b.min.y > 0.75 && b.max.y < 0.83
          ? 'paint'
          : b.max.y < 0.4 && height(b) < 0.045
            ? 'chrome'
            : null,
      ClioIV_door_R: (b) =>
        b.max.y < 0.4 && height(b) < 0.06 && width(b) < 0.03 ? 'chrome' : null,
      // exhaust tip
      ClioIV_body: (b) =>
        b.max.y < 0.28 && b.min.x > 3.75 && b.max.x - b.min.x < 0.12 ? 'chrome' : null,
    },
  },
  splits: [
    {
      node: 'ClioIV_body',
      parts: {
        ClioIV: 'body-shell',
        ClioIV_interior_lod0: 'seats',
        ClioIV_dashboard: 'dashboard',
        ClioIV_glass: 'body-shell',
      },
      others: 'root',
    },
    // only the engine bay tub is kept: the engine is the detailed one of engine-bay.ts
    { node: 'ClioIV_engbay', parts: { ClioIV: null }, others: 'drop', material: 'plastic' },
  ],
  // lamps in the bumper, the grille and the tailgate as parts of their own
  extract: [
    { from: 'bumper.front', materials: ['fog', 'drl'], to: 'drl' },
    { from: 'grille', materials: ['fog', 'drl'], to: 'drl' },
    {
      from: 'tailgate',
      materials: ['fog', 'drl', 'redLens', 'redIn', 'red', 'reverse'],
      to: 'tailgate-light',
    },
  ],
  plates: {
    text: 'FB 416 KD',
    country: 'I',
    items: [
      { part: 'bumper.front', x: -0.004, y: 0.32, dir: -1, bend: -0.43 },
      { part: 'bumper.rear', x: 4.036, y: 0.462, dir: 1, bend: -0.2 },
    ],
  },
});
