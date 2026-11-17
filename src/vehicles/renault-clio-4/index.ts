// Renault Clio IV (X98) 2016, 1.5 dCi 75 hp (K9K 612 Euro 5 / K9K 628 Euro 6).
import type { VehicleDefinition } from '../types';
import { assembleGltf } from '../../viewer/gltf-assembly';
import { bodySpec } from './body';
import { cards } from './cards';
import type { ClioDimensions } from './dimensions';
import { buildEngineBay } from './engine-bay';
import { buildInterior } from './interior';
import en from './locales/en.json';
import it from './locales/it.json';
import { createMaterials } from './materials';
import { buildWheels } from './wheels';

const dimensions: ClioDimensions = {
  length: 4.062,
  frontAxle: 0.853,
  rearAxle: 3.442,
  wheelCenterY: 0.312,
  halfTrack: 0.753,
};

const lowBeam = 'low-beam';

export const renaultClio4 = {
  id: 'renault-clio-4',
  name: 'Renault Clio IV 1.5 dCi 75',
  shortName: 'Clio IV 1.5 dCi 75',
  brand: 'Clio IV',
  make: 'Renault',
  length: dimensions.length,

  async build({ root }) {
    const { paint, materials } = createMaterials();
    const body = await assembleGltf(bodySpec(dimensions), root, materials);
    const wheels = buildWheels(root, materials, dimensions, body.templates.rim);
    const interior = buildInterior(root, materials);
    const engineBay = buildEngineBay(root, materials, dimensions);
    return {
      parts: { ...body.parts, ...wheels, ...interior, ...engineBay.parts },
      openables: body.openables,
      explode: engineBay.explode,
      materials,
      paint,
    };
  },
  materialRoles: {
    paint: 'paint',
    xray: { paint: 0.16, inner: 0.1, trim: 0.1, gloss: 0.1, floor: 0.1 },
    pickThrough: ['glass', 'lens'],
  },

  views: [
    { id: 'three-quarter', position: [-5.6, 2.1, 5.6], target: [0, 0.62, 0], fit: 1.45 },
    { id: 'side', position: [0, 0.95, 10], target: [0, 0.65, 0], fit: 1.45 },
    { id: 'front', position: [-9.5, 1.0, 0.01], target: [0, 0.65, 0], fit: 1.45 },
    { id: 'rear', position: [6, 2.0, -5.2], target: [0, 0.62, 0], fit: 1.45 },
    { id: 'top', position: [0.01, 11.5, 0], target: [0, 0.5, 0], fit: 1.45 },
    {
      id: 'engine',
      position: [-3.9, 2.5, 1.7],
      target: [-1.32, 0.62, 0],
      fit: 1.1,
      opens: ['hood'],
    },
    {
      id: 'interior',
      position: [0.6, 1.55, 3.4],
      target: [0.1, 0.85, 0],
      fit: 1.1,
      opens: ['door.front.left', 'door.rear.left'],
    },
  ],
  defaultView: 'three-quarter',
  explode: {
    view: { position: [-6.6, 4.4, 3.6], target: [-1.3, 0.95, 0], fit: 1.1 },
    opens: ['hood'],
    focusDirection: [-0.62, 0.68, 0.4],
  },
  openables: [
    'hood',
    'door.front.left',
    'door.front.right',
    'door.rear.left',
    'door.rear.right',
    'tailgate',
  ],
  // Clio IV catalogue colours (approximate colour values)
  paints: [
    {
      id: 'rosso-flamme',
      name: 'Rosso Flamme',
      hex: 0x9c0a12,
      edge: 0x2a0003,
      metalness: 0.55,
      roughness: 0.42,
      flake: 0.2,
      finish: 'metallic',
    },
    {
      id: 'blu-iron',
      name: 'Blu Iron',
      hex: 0x16335c,
      edge: 0x050a1c,
      metalness: 0.6,
      roughness: 0.42,
      flake: 0.2,
      finish: 'metallic',
    },
    {
      id: 'bianco-ghiaccio',
      name: 'Bianco Ghiaccio',
      hex: 0xe6e6e1,
      edge: 0xb9bcc0,
      metalness: 0.0,
      roughness: 0.5,
      flake: 0.0,
      finish: 'solid',
    },
    {
      id: 'bianco-perla',
      name: 'Bianco Perla',
      hex: 0xe9e6dc,
      edge: 0xcfd6e6,
      metalness: 0.25,
      roughness: 0.38,
      flake: 0.1,
      finish: 'pearl',
    },
    {
      id: 'grigio-platino',
      name: 'Grigio Platino',
      hex: 0x8a8d91,
      edge: 0x3d4045,
      metalness: 0.75,
      roughness: 0.4,
      flake: 0.24,
      finish: 'metallic',
    },
    {
      id: 'grigio-cassiopea',
      name: 'Grigio Cassiopea',
      hex: 0x4a4d52,
      edge: 0x15171a,
      metalness: 0.7,
      roughness: 0.42,
      flake: 0.24,
      finish: 'metallic',
    },
    {
      id: 'nero-etoile',
      name: 'Nero Étoilé',
      hex: 0x08080a,
      edge: 0x1c2030,
      metalness: 0.6,
      roughness: 0.4,
      flake: 0.3,
      finish: 'metallic',
    },
    {
      id: 'giallo-eclair',
      name: 'Giallo Eclair',
      hex: 0xe0b200,
      edge: 0x8a5a00,
      metalness: 0.0,
      roughness: 0.48,
      flake: 0.0,
      finish: 'solid',
    },
    {
      id: 'marrone-vison',
      name: 'Marrone Vison',
      hex: 0x4b3a30,
      edge: 0x1a120e,
      metalness: 0.65,
      roughness: 0.42,
      flake: 0.22,
      finish: 'metallic',
    },
    {
      id: 'blu-pacifico',
      name: 'Blu Pacifico',
      hex: 0x1f6ea8,
      edge: 0x082a55,
      metalness: 0.55,
      roughness: 0.42,
      flake: 0.2,
      finish: 'metallic',
    },
  ],
  defaultPaint: 'rosso-flamme',
  // Switchable lights act on the lamps' emissive intensity (post-processing adds the glow).
  lights: {
    switches: [
      { id: 'drl', on: true },
      { id: lowBeam },
      { id: 'hazard', blinking: true },
      { id: 'brake' },
      { id: 'reverse' },
    ],
    blinkRate: 2.8,
    emission: {
      drl: (s) => (s[lowBeam] ? 2 : s.drl ? 5 : 0),
      lowBeam: (s) => (s[lowBeam] ? 7 : 0),
      red: (s) => (s.brake ? 6 : s[lowBeam] ? 1.4 : 0),
      redLens: (s) => (s.brake ? 1.4 : s[lowBeam] ? 0.45 : 0.05),
      chmsl: (s) => (s.brake ? 7 : 0),
      reverse: (s) => (s.reverse ? 6 : 0),
      amber: (_s, blink) => (blink ? 7 : 0),
    },
    floorBeam: { switch: lowBeam, position: [-2.3, 0.006, 0], size: [5.2, 3.6], opacity: 0.5 },
  },
  // lights the engine bay while the hood is open
  spotlights: [
    {
      color: 0xfff3e0,
      intensity: 9,
      distance: 4,
      angle: 0.75,
      penumbra: 0.6,
      decay: 1.2,
      position: [-2.9, 2.3, 0.4],
      target: [-1.35, 0.6, 0],
      followsOpenable: 'hood',
    },
  ],

  categories: [
    'engine',
    'fuel',
    'intake',
    'cooling',
    'exhaust',
    'electrical',
    'transmission',
    'brakes',
    'suspension',
    'wheels',
    'body',
    'lights',
    'interior',
  ],
  initialCategory: 'engine',
  xrayPassThroughCategories: ['body', 'lights'],
  cards,
  locales: { en, it },
  credits: {
    authorUrl:
      'https://sketchfab.com/3d-models/renault-clio-mk4-2012-2020-70a12bd8056647c7a4226f6fa7171c15',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
} satisfies VehicleDefinition;
