// K9K 1.5 dCi engine bay and running gear (transmission, exhaust, suspension), built from
// primitives. Vehicle coordinates: x from the front bumper towards the rear, y up, z left (+) /
// right (-).
import * as THREE from 'three';
import { createShapes } from '../../viewer/shapes';
import { grain, label } from '../../viewer/textures';
import type { ClioMaterials } from './materials';
import type { ClioDimensions } from './dimensions';

// Micro relief of the engine bay materials: cast aluminium, cast iron, rust, textured plastic, rubber
function dressMaterials(mat: ClioMaterials) {
  const fine = grain(256, { octaves: 5, amp: 60, seed: 1 }, { repeat: [3, 3] }),
    coarse = grain(256, { octaves: 4, amp: 90, blotch: 0.5, seed: 2 }, { repeat: [2, 2] });
  const set = (m: THREE.MeshStandardMaterial, tex: THREE.Texture, bump: number, rough: boolean) => {
    m.bumpMap = tex;
    m.bumpScale = bump;
    if (rough) m.roughnessMap = tex;
    m.needsUpdate = true;
  };
  set(mat.alu, fine, 0.9, true);
  mat.alu.color.setHex(0xb4b7bb);
  mat.alu.roughness = 0.62;
  mat.alu.metalness = 0.85;
  set(mat.aluDark, fine, 0.9, true);
  mat.aluDark.roughness = 0.7;
  set(mat.iron, coarse, 1.4, true);
  mat.iron.color.setHex(0x34363a);
  mat.iron.roughness = 0.9;
  mat.iron.metalness = 0.55;
  set(mat.rust, coarse, 2.0, true);
  mat.rust.color.setHex(0x5e3f2c);
  mat.rust.roughness = 1.0;
  mat.rust.metalness = 0.35;
  set(mat.plastic, fine, 0.35, false);
  mat.plastic.roughness = 0.62;
  set(mat.plasticG, fine, 0.35, false);
  set(mat.hose, fine, 0.5, false);
  mat.hose.roughness = 0.75;
  mat.steel.roughness = 0.3;
  mat.steel.envMapIntensity = 1.3;
}

export interface EngineBay {
  parts: Record<string, THREE.Group>;
  explode: Record<string, THREE.Vector3>;
}

/** Builds the engine bay into `root`; explodable parts get an offset for the exploded view. */
export function buildEngineBay(
  root: THREE.Group,
  mat: ClioMaterials,
  dims: ClioDimensions,
): EngineBay {
  dressMaterials(mat);
  const fa = dims.frontAxle,
    ra = dims.rearAxle,
    wy = dims.wheelCenterY;
  const mech = new THREE.Group();
  root.add(mech);
  const parts: Record<string, THREE.Group> = {};
  const explodable: THREE.Group[] = [];
  const part = (id: string, explode = true) => {
    const g = new THREE.Group();
    mech.add(g);
    parts[id] = g;
    if (explode) explodable.push(g);
    return g;
  };
  const {
    add,
    box,
    cyl,
    tube,
    sph,
    helix,
    label: lab,
  } = createShapes({
    castShadow: true,
    boxSegments: 2,
    boxRadius: 0.012,
  });
  let g: THREE.Group;
  // ===== Engine =====
  g = part('engine');
  box(g, mat.iron, 0.34, 0.25, 0.5, 0.72, 0.42, -0.15, 0.02); // cylinder block
  box(g, mat.alu, 0.32, 0.13, 0.5, 0.72, 0.605, -0.15, 0.02); // cylinder head
  box(g, mat.plastic, 0.24, 0.05, 0.46, 0.72, 0.69, -0.15, 0.02); // valve cover
  box(g, mat.aluDark, 0.3, 0.09, 0.44, 0.72, 0.255, -0.15, 0.03); // oil sump
  cyl(g, mat.steel, 0.012, 0.02, 0.72, 0.205, -0.02); // oil drain plug

  g = part('engine-cover');
  box(g, mat.plastic, 0.36, 0.03, 0.46, 0.71, 0.752, -0.14, 0.014);
  for (let i = 0; i < 4; i++)
    box(g, mat.plasticG, 0.22, 0.012, 0.05, 0.72, 0.771, -0.31 + i * 0.113, 0.005);
  lab(
    g,
    label(
      [
        ['RENAULT', 'bold 44px Arial'],
        ['dCi', 'italic bold 120px Arial'],
      ],
      { bg: '#18191b', fg: '#d9dcdf' },
    ),
    0.13,
    0.065,
    0.585,
    0.7675,
    -0.14,
  );

  g = part('oil-filler-cap');
  cyl(g, mat.plastic, 0.03, 0.03, 0.66, 0.725, -0.3);
  cyl(g, mat.yellow, 0.022, 0.006, 0.66, 0.743, -0.3);
  g = part('oil-dipstick');
  tube(g, mat.steel, 0.004, [
    [0.545, 0.36, 0.02],
    [0.535, 0.5, 0.03],
    [0.53, 0.68, 0.04],
  ]);
  add(g, new THREE.TorusGeometry(0.016, 0.005, 8, 16), mat.yellow).position.set(0.53, 0.7, 0.04);
  g = part('oil-filter');
  cyl(g, mat.plastic, 0.042, 0.1, 0.515, 0.36, -0.05, 'x');
  cyl(g, mat.aluDark, 0.046, 0.03, 0.555, 0.36, -0.05, 'x');

  g = part('timing-belt');
  box(g, mat.plastic, 0.3, 0.36, 0.045, 0.72, 0.5, -0.425, 0.03);
  cyl(g, mat.aluDark, 0.055, 0.02, 0.72, 0.62, -0.455, 'z');
  cyl(g, mat.aluDark, 0.03, 0.02, 0.72, 0.36, -0.455, 'z');
  g = part('water-pump');
  cyl(g, mat.alu, 0.045, 0.05, 0.6, 0.47, -0.4, 'z');
  cyl(g, mat.steel, 0.03, 0.02, 0.6, 0.47, -0.435, 'z');

  g = part('accessory-belt');
  cyl(g, mat.iron, 0.072, 0.03, 0.72, 0.33, -0.475, 'z'); // crankshaft pulley
  cyl(g, mat.plastic, 0.03, 0.028, 0.6, 0.42, -0.475, 'z'); // belt tensioner
  tube(
    g,
    mat.rubber,
    0.006,
    [
      [0.79, 0.3, -0.475],
      [0.72, 0.255, -0.475],
      [0.55, 0.27, -0.475],
      [0.47, 0.33, -0.475],
      [0.55, 0.39, -0.475],
      [0.47, 0.5, -0.475],
      [0.53, 0.545, -0.475],
      [0.62, 0.45, -0.475],
      [0.79, 0.37, -0.475],
    ],
    true,
  );

  g = part('alternator');
  cyl(g, mat.alu, 0.062, 0.12, 0.52, 0.5, -0.37, 'z');
  cyl(g, mat.copper, 0.05, 0.05, 0.52, 0.5, -0.37, 'z', 0.05, 12);
  cyl(g, mat.steel, 0.032, 0.03, 0.52, 0.5, -0.455, 'z');
  g = part('ac-compressor');
  cyl(g, mat.aluDark, 0.058, 0.17, 0.5, 0.325, -0.34, 'z');
  cyl(g, mat.steel, 0.05, 0.03, 0.5, 0.325, -0.455, 'z');
  tube(g, mat.alu, 0.007, [
    [0.5, 0.38, -0.28],
    [0.42, 0.45, -0.3],
    [0.33, 0.45, -0.32],
  ]);

  g = part('intake-manifold');
  box(g, mat.plastic, 0.07, 0.085, 0.44, 0.535, 0.625, -0.15, 0.03);
  for (let i = 0; i < 4; i++) cyl(g, mat.plastic, 0.02, 0.05, 0.575, 0.61, -0.31 + i * 0.113, 'x');
  g = part('egr-valve');
  box(g, mat.alu, 0.07, 0.08, 0.07, 0.56, 0.635, 0.105, 0.012);
  cyl(g, mat.plastic, 0.032, 0.05, 0.56, 0.7, 0.105);
  tube(g, mat.steel, 0.014, [
    [0.6, 0.63, 0.12],
    [0.75, 0.6, 0.135],
    [0.89, 0.58, 0.1],
    [0.92, 0.57, 0.0],
  ]);
  box(g, mat.steel, 0.16, 0.05, 0.045, 0.76, 0.6, 0.13, 0.01); // EGR cooler
  g = part('glow-plugs');
  for (let i = 0; i < 4; i++) {
    cyl(g, mat.steel, 0.005, 0.07, 0.6, 0.665, -0.31 + i * 0.113);
    cyl(g, mat.plastic, 0.008, 0.015, 0.6, 0.705, -0.31 + i * 0.113);
  }
  tube(g, mat.hose, 0.004, [
    [0.6, 0.712, -0.31],
    [0.6, 0.716, -0.14],
    [0.6, 0.712, 0.03],
  ]);

  g = part('injectors');
  for (let i = 0; i < 4; i++) {
    const z = -0.31 + i * 0.113;
    cyl(g, mat.steel, 0.011, 0.11, 0.7, 0.7, z);
    cyl(g, mat.plastic, 0.014, 0.03, 0.7, 0.745, z);
    tube(g, mat.steel, 0.004, [
      [0.7, 0.735, z],
      [0.76, 0.74, z],
      [0.82, 0.715, z],
    ]);
  }
  g = part('fuel-rail');
  cyl(g, mat.steel, 0.014, 0.4, 0.825, 0.705, -0.14, 'z');
  cyl(g, mat.plastic, 0.012, 0.03, 0.825, 0.705, 0.075, 'z');
  tube(g, mat.steel, 0.004, [
    [0.825, 0.705, -0.34],
    [0.85, 0.68, -0.37],
    [0.85, 0.63, -0.38],
  ]);
  g = part('high-pressure-pump');
  cyl(g, mat.alu, 0.045, 0.09, 0.855, 0.6, -0.36, 'z');
  box(g, mat.aluDark, 0.07, 0.06, 0.05, 0.875, 0.635, -0.34, 0.01);
  cyl(g, mat.plastic, 0.012, 0.03, 0.89, 0.67, -0.34);

  g = part('exhaust-manifold');
  for (let i = 0; i < 4; i++)
    tube(g, mat.rust, 0.018, [
      [0.885, 0.6, -0.31 + i * 0.113],
      [0.92, 0.585, -0.27 + i * 0.07],
      [0.94, 0.56, -0.17],
    ]);
  box(g, mat.rust, 0.04, 0.05, 0.42, 0.895, 0.6, -0.145, 0.01);
  g = part('turbocharger');
  cyl(g, mat.rust, 0.062, 0.055, 0.965, 0.545, -0.185, 'z'); // turbine housing (exhaust side)
  cyl(g, mat.iron, 0.035, 0.05, 0.965, 0.545, -0.13, 'z'); // centre housing
  cyl(g, mat.alu, 0.068, 0.05, 0.965, 0.545, -0.075, 'z'); // compressor housing
  cyl(g, mat.alu, 0.03, 0.04, 0.965, 0.545, -0.035, 'z'); // air inlet
  cyl(g, mat.steel, 0.025, 0.05, 1.01, 0.63, -0.12, 'z');
  tube(g, mat.steel, 0.004, [
    [1.01, 0.63, -0.15],
    [0.99, 0.6, -0.19],
    [0.97, 0.6, -0.2],
  ]); // wastegate actuator
  g = part('dpf');
  cyl(g, mat.steel, 0.075, 0.3, 1.0, 0.36, -0.2);
  cyl(g, mat.steel, 0.045, 0.06, 0.985, 0.5, -0.195, 'y', 0.075);
  cyl(g, mat.rust, 0.03, 0.06, 1.0, 0.19, -0.2, 'y', 0.07);
  cyl(g, mat.plastic, 0.008, 0.03, 0.93, 0.46, -0.2, 'x');
  cyl(g, mat.plastic, 0.008, 0.03, 0.93, 0.28, -0.2, 'x');

  // ===== Intake / boost =====
  g = part('air-filter');
  box(g, mat.plastic, 0.25, 0.15, 0.27, 0.53, 0.645, 0.315, 0.03);
  box(g, mat.plasticG, 0.23, 0.012, 0.25, 0.53, 0.665, 0.315, 0.004);
  tube(g, mat.plastic, 0.03, [
    [0.42, 0.66, 0.38],
    [0.36, 0.7, 0.43],
    [0.31, 0.7, 0.46],
  ]); // air intake
  g = part('maf-sensor');
  cyl(g, mat.plasticG, 0.033, 0.06, 0.68, 0.66, 0.24, 'x');
  box(g, mat.plastic, 0.03, 0.03, 0.035, 0.68, 0.7, 0.24, 0.006);
  g = part('intake-duct');
  tube(g, mat.hose, 0.03, [
    [0.71, 0.66, 0.24],
    [0.82, 0.675, 0.2],
    [0.93, 0.66, 0.1],
    [0.975, 0.6, 0.0],
    [0.965, 0.55, -0.03],
  ]);
  g = part('intercooler');
  box(g, mat.alu, 0.035, 0.17, 0.24, 0.285, 0.36, 0.385, 0.006);
  box(g, mat.plastic, 0.045, 0.17, 0.03, 0.285, 0.36, 0.515, 0.01);
  box(g, mat.plastic, 0.045, 0.17, 0.03, 0.285, 0.36, 0.255, 0.01);
  g = part('intercooler-hoses');
  tube(g, mat.hose, 0.024, [
    [0.965, 0.5, -0.07],
    [0.97, 0.36, 0.0],
    [0.8, 0.24, 0.3],
    [0.5, 0.26, 0.5],
    [0.31, 0.33, 0.52],
  ]);
  tube(g, mat.hose, 0.024, [
    [0.31, 0.4, 0.255],
    [0.38, 0.47, 0.18],
    [0.45, 0.57, 0.11],
    [0.5, 0.625, 0.08],
  ]);

  // ===== Cooling =====
  g = part('ac-condenser');
  box(g, mat.aluDark, 0.016, 0.34, 0.54, 0.262, 0.5, -0.07, 0.004);
  g = part('radiator');
  box(g, mat.alu, 0.03, 0.38, 0.52, 0.3, 0.49, -0.07, 0.004);
  box(g, mat.plastic, 0.04, 0.38, 0.035, 0.3, 0.49, -0.35, 0.01);
  box(g, mat.plastic, 0.04, 0.38, 0.035, 0.3, 0.49, 0.21, 0.01);
  g = part('radiator-fan');
  box(g, mat.plastic, 0.02, 0.37, 0.5, 0.335, 0.49, -0.07, 0.006);
  cyl(g, mat.plasticG, 0.165, 0.025, 0.352, 0.49, -0.07, 'x');
  cyl(g, mat.plastic, 0.045, 0.05, 0.365, 0.49, -0.07, 'x');
  for (let i = 0; i < 7; i++) {
    const b = box(g, mat.plastic, 0.006, 0.13, 0.04, 0.366, 0.49, -0.07, 0.002);
    b.rotation.x = (i * Math.PI * 2) / 7;
    b.translateY(0.09);
    b.rotateY(0.5);
  }
  g = part('radiator-hoses');
  tube(g, mat.hose, 0.018, [
    [0.56, 0.66, -0.36],
    [0.45, 0.68, -0.33],
    [0.36, 0.66, -0.3],
    [0.315, 0.65, -0.3],
  ]);
  tube(g, mat.hose, 0.018, [
    [0.315, 0.33, 0.17],
    [0.4, 0.3, 0.12],
    [0.5, 0.33, 0.05],
    [0.56, 0.4, -0.36 + 0.36],
  ]);
  g = part('coolant-reservoir');
  {
    const m = box(g, mat.white, 0.17, 0.15, 0.19, 0.95, 0.7, -0.5, 0.03);
    m.castShadow = false;
  }
  box(g, mat.fluidG, 0.16, 0.07, 0.18, 0.95, 0.665, -0.5, 0.025);
  cyl(g, mat.plastic, 0.032, 0.03, 0.93, 0.79, -0.5);
  lab(
    g,
    label(
      [
        ['MAX', 'bold 70px Arial'],
        ['MIN', 'bold 70px Arial'],
      ],
      { w: 256, h: 256, bg: '#e8e6da', fg: '#222' },
    ),
    0.05,
    0.09,
    0.864,
    0.7,
    -0.5,
    'front',
  );
  tube(g, mat.hose, 0.008, [
    [0.9, 0.64, -0.42],
    [0.8, 0.62, -0.42],
    [0.64, 0.66, -0.38],
  ]);
  g = part('thermostat');
  box(g, mat.plastic, 0.06, 0.06, 0.05, 0.6, 0.66, -0.385 + 0.0, 0.012);

  // ===== Fuel =====
  g = part('fuel-filter');
  cyl(g, mat.plastic, 0.05, 0.13, 0.42, 0.55, -0.5);
  cyl(g, mat.plasticG, 0.052, 0.025, 0.42, 0.625, -0.5);
  tube(g, mat.hose, 0.006, [
    [0.42, 0.64, -0.5],
    [0.6, 0.7, -0.46],
    [0.84, 0.66, -0.4],
  ]);
  sph(g, mat.rubber, 0.022, 0.5, 0.675, -0.485, 1.6, 1, 1); // priming bulb

  // ===== Electrical =====
  g = part('battery');
  box(g, mat.plastic, 0.185, 0.185, 0.25, 0.84, 0.655, 0.37, 0.012);
  box(g, mat.plasticG, 0.185, 0.02, 0.25, 0.84, 0.755, 0.37, 0.006);
  cyl(g, mat.redP, 0.014, 0.025, 0.8, 0.775, 0.45);
  cyl(g, mat.steel, 0.012, 0.025, 0.8, 0.775, 0.29);
  lab(
    g,
    label(
      [
        ['12V  70Ah  720A', 'bold 54px Arial'],
        ['EFB  START-STOP', 'bold 44px Arial'],
      ],
      { bg: '#e9e9e4', fg: '#111', accent: '#f2c300' },
    ),
    0.17,
    0.085,
    0.865,
    0.7655,
    0.37,
  );
  tube(g, mat.redP, 0.006, [
    [0.8, 0.78, 0.45],
    [0.74, 0.78, 0.5],
    [0.66, 0.765, 0.54],
  ]);
  g = part('ecu');
  box(g, mat.alu, 0.03, 0.15, 0.2, 0.715, 0.66, 0.36, 0.006);
  box(g, mat.plastic, 0.035, 0.04, 0.16, 0.715, 0.755, 0.36, 0.006);
  g = part('fuse-box');
  box(g, mat.plastic, 0.22, 0.065, 0.1, 0.6, 0.74, 0.56, 0.012);
  g = part('starter-motor');
  cyl(g, mat.aluDark, 0.04, 0.15, 0.93, 0.36, 0.06, 'z');
  cyl(g, mat.steel, 0.022, 0.09, 0.955, 0.415, 0.05, 'z');

  // ===== Brakes (hydraulics) =====
  g = part('brake-booster');
  cyl(g, mat.plastic, 0.115, 0.07, 1.045, 0.7, 0.36, 'x');
  cyl(g, mat.alu, 0.022, 0.12, 0.96, 0.7, 0.36, 'x');
  g = part('brake-fluid-reservoir');
  {
    const m = box(g, mat.white, 0.07, 0.06, 0.11, 0.955, 0.755, 0.36, 0.012);
    m.castShadow = false;
  }
  cyl(g, mat.yellow, 0.025, 0.02, 0.955, 0.795, 0.36);
  g = part('abs-unit');
  box(g, mat.alu, 0.09, 0.09, 0.1, 1.0, 0.5, 0.5, 0.008);
  box(g, mat.plastic, 0.06, 0.09, 0.09, 1.0, 0.5, 0.41, 0.008);

  // ===== Washer =====
  g = part('washer-reservoir');
  {
    const m = box(g, mat.white, 0.14, 0.22, 0.1, 0.44, 0.5, -0.585, 0.02);
    m.castShadow = false;
  }
  tube(g, mat.white, 0.018, [
    [0.46, 0.6, -0.58],
    [0.5, 0.68, -0.56],
    [0.52, 0.735, -0.55],
  ]);
  cyl(g, mat.blue, 0.026, 0.02, 0.523, 0.745, -0.548);

  // ===== Transmission =====
  g = part('gearbox');
  cyl(g, mat.alu, 0.17, 0.09, 0.72, 0.42, 0.15, 'z', 0.15);
  box(g, mat.alu, 0.3, 0.27, 0.27, 0.72, 0.41, 0.335, 0.05);
  cyl(g, mat.alu, 0.1, 0.16, 0.86, 0.325, 0.27, 'z'); // differential
  cyl(g, mat.plastic, 0.012, 0.02, 0.62, 0.555, 0.34);
  tube(g, mat.steel, 0.005, [
    [0.7, 0.55, 0.4],
    [0.85, 0.6, 0.42],
    [1.05, 0.55, 0.3],
  ]); // gear selector cables
  g = part('clutch', true);
  cyl(g, mat.iron, 0.115, 0.03, 0.72, 0.42, 0.115, 'z');
  cyl(g, mat.steel, 0.1, 0.012, 0.72, 0.42, 0.135, 'z');
  g = part('driveshafts', false);
  for (const s of [1, -1]) {
    cyl(g, mat.steel, 0.013, 0.42, fa, wy + 0.005, s > 0 ? 0.52 : -0.45, 'z');
    cyl(g, mat.rubber, 0.04, 0.07, fa, wy, 0.66 * s, 'z', 0.02);
    cyl(g, mat.rubber, 0.035, 0.06, fa, wy + 0.008, s > 0 ? 0.37 : -0.26, 'z', 0.02);
  }
  cyl(g, mat.steel, 0.014, 0.42, fa, wy + 0.01, -0.03, 'z');

  // ===== Exhaust =====
  g = part('exhaust', false);
  tube(g, mat.steel, 0.026, [
    [1.0, 0.2, -0.2],
    [1.1, 0.2, -0.12],
    [1.5, 0.2, -0.06],
    [2.6, 0.2, -0.06],
    [3.1, 0.21, 0.1],
    [3.45, 0.3, 0.24],
    [3.6, 0.34, 0.24],
  ]);
  cyl(g, mat.steel, 0.045, 0.36, 2.0, 0.2, -0.06, 'x');
  cyl(g, mat.steel, 0.07, 0.36, 3.76, 0.34, 0.24, 'x');
  tube(g, mat.steel, 0.022, [
    [3.93, 0.34, 0.24],
    [3.97, 0.32, 0.26],
    [3.985, 0.29, 0.29],
  ]);
  g = part('fuel-tank', false);
  box(g, mat.plasticG, 0.55, 0.2, 0.95, 2.82, 0.285, 0.05, 0.05);
  tube(g, mat.plastic, 0.022, [
    [3.0, 0.33, -0.4],
    [3.3, 0.55, -0.62],
    [3.55, 0.82, -0.74],
  ]);

  // ===== Suspension and steering =====
  for (const s of [1, -1]) {
    g = part('suspension.front.' + (s > 0 ? 'left' : 'right'), false);
    const zt = 0.585 * s,
      zb = 0.635 * s;
    tube(g, mat.plastic, 0.026, [
      [fa + 0.005, 0.36, zb],
      [fa + 0.02, 0.6, 0.61 * s],
    ]);
    tube(g, mat.steel, 0.011, [
      [fa + 0.02, 0.6, 0.61 * s],
      [fa + 0.035, 0.8, zt],
    ]);
    {
      const sp = helix(g, mat.rimDark, 0, 0, 0.26, 0, 0.062, 5);
      sp.position.set(fa + 0.02, 0.54, 0.607 * s);
      sp.rotation.set(-0.19 * s, 0, -0.075);
    }
    cyl(g, mat.rubber, 0.07, 0.025, fa + 0.035, 0.81, zt);
    cyl(g, mat.steel, 0.075, 0.008, fa + 0.022, 0.545, 0.61 * s);
    // lower arm and knuckle
    tube(g, mat.iron, 0.02, [
      [fa - 0.02, 0.215, 0.33 * s],
      [fa, 0.2, 0.5 * s],
      [fa, 0.205, 0.66 * s],
    ]);
    tube(g, mat.iron, 0.018, [
      [fa + 0.24, 0.225, 0.34 * s],
      [fa + 0.1, 0.21, 0.48 * s],
      [fa, 0.205, 0.64 * s],
    ]);
    box(g, mat.iron, 0.07, 0.2, 0.05, fa, 0.3, 0.665 * s, 0.015);
  }
  g = part('steering-rack', false);
  cyl(g, mat.aluDark, 0.026, 0.62, fa + 0.17, 0.3, 0, 'z');
  cyl(g, mat.steel, 0.011, 1.22, fa + 0.17, 0.3, 0, 'z');
  for (const s of [1, -1]) {
    cyl(g, mat.rubber, 0.03, 0.12, fa + 0.17, 0.3, 0.37 * s, 'z', 0.018);
    tube(g, mat.steel, 0.009, [
      [fa + 0.17, 0.3, 0.6 * s],
      [fa + 0.1, 0.3, 0.67 * s],
    ]);
  }
  tube(g, mat.steel, 0.011, [
    [fa + 0.17, 0.32, 0.3],
    [1.15, 0.5, 0.34],
    [1.35, 0.72, 0.36],
  ]);
  g = part('anti-roll-bar', false);
  tube(g, mat.iron, 0.011, [
    [fa + 0.06, 0.26, -0.62],
    [fa + 0.22, 0.25, -0.5],
    [fa + 0.25, 0.25, 0],
    [fa + 0.22, 0.25, 0.5],
    [fa + 0.06, 0.26, 0.62],
  ]);
  g = part('subframe', false);
  box(g, mat.iron, 0.42, 0.04, 0.8, fa + 0.08, 0.19, 0, 0.015);

  g = part('rear-axle', false);
  cyl(g, mat.iron, 0.04, 1.18, ra - 0.3, 0.3, 0, 'z');
  for (const s of [1, -1]) {
    tube(g, mat.iron, 0.03, [
      [ra - 0.42, 0.33, 0.56 * s],
      [ra - 0.3, 0.3, 0.585 * s],
      [ra, wy, 0.61 * s],
    ]);
    cyl(g, mat.rubber, 0.04, 0.07, ra - 0.42, 0.33, 0.56 * s, 'z');
  }
  for (const s of [1, -1]) {
    g = part('suspension.rear.' + (s > 0 ? 'left' : 'right'), false);
    helix(g, mat.rimDark, ra - 0.1, 0.31, 0.5, 0.5 * s, 0.05, 5);
    cyl(g, mat.steel, 0.05, 0.008, ra - 0.1, 0.305, 0.5 * s);
    tube(g, mat.plastic, 0.022, [
      [ra + 0.03, 0.27, 0.6 * s],
      [ra + 0.09, 0.5, 0.59 * s],
    ]);
    tube(g, mat.steel, 0.01, [
      [ra + 0.09, 0.5, 0.59 * s],
      [ra + 0.14, 0.7, 0.58 * s],
    ]);
  }

  root.updateMatrixWorld(true);
  // exploded view: each part moves out from the engine, higher parts further up
  const explode: Record<string, THREE.Vector3> = {};
  for (const [id, p] of Object.entries(parts)) {
    if (!explodable.includes(p)) continue;
    const c = new THREE.Box3().setFromObject(p).getCenter(new THREE.Vector3());
    p.worldToLocal(c);
    const dir = new THREE.Vector3((c.x - 0.7) * 1.2, 0, c.z * 1.35);
    dir.y = 0.3 + Math.max(0, c.y - 0.25) * 1.9;
    dir.x -= 0.15;
    explode[id] = dir;
  }
  return { parts, explode };
}
