// Vano motore K9K 1.5 dCi + meccanica (trasmissione, scarico, sospensioni).
// Coordinate auto: x dal paraurti anteriore verso il retro, y alto, z sinistra(+)/destra(-).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FA, RA, WHEEL_Y } from './surface.js';
import { M } from './materials.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function buildMechanics(car) {
  const mech = new THREE.Group(); car.root.add(mech); car.mech = mech;
  const part = (id, explode = true) => {
    const g = new THREE.Group(); g.userData.partId = id; g.userData.explode = explode; mech.add(g); car.parts[id] = g; return g;
  };
  const add = (g, geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; g.add(m); return m; };
  const box = (g, mat, w, h, d, x, y, z, r = 0.012) => { const m = add(g, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.2, h / 2.2, d / 2.2)), mat); m.position.set(x, y, z); return m; };
  const cyl = (g, mat, r, len, x, y, z, axis = 'y', r2 = r, seg = 24) => {
    const m = add(g, new THREE.CylinderGeometry(r2, r, len, seg), mat); m.position.set(x, y, z);
    if (axis === 'x') m.rotation.z = Math.PI / 2; if (axis === 'z') m.rotation.x = Math.PI / 2; return m;
  };
  const tube = (g, mat, rad, pts, closed = false) => add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => V(...p)), closed, 'catmullrom', 0.4), Math.max(12, pts.length * 8), rad, 10, closed), mat);
  const sph = (g, mat, r, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = add(g, new THREE.SphereGeometry(r, 20, 14), mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); return m; };
  const helix = (g, mat, x, y0, y1, z, R, turns, rad = 0.007) => {
    const pts = []; const n = turns * 12;
    for (let i = 0; i <= n; i++) { const a = (i / 12) * Math.PI * 2; pts.push([x + Math.cos(a) * R, y0 + (y1 - y0) * i / n, z + Math.sin(a) * R]); }
    return add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => V(...p))), n * 3, rad, 6), mat);
  };

  let g;
  // ===== Motore =====
  g = part('motore');
  box(g, M.iron, 0.34, 0.25, 0.50, 0.72, 0.42, -0.15, 0.02);         // monoblocco
  box(g, M.alu, 0.32, 0.13, 0.50, 0.72, 0.605, -0.15, 0.02);          // testata
  box(g, M.plastic, 0.24, 0.05, 0.46, 0.72, 0.69, -0.15, 0.02);       // coperchio punterie
  box(g, M.aluDark, 0.30, 0.09, 0.44, 0.72, 0.255, -0.15, 0.03);      // coppa olio
  cyl(g, M.steel, 0.012, 0.02, 0.72, 0.205, -0.02);                   // tappo scarico olio

  g = part('coperchio_motore');
  box(g, M.plastic, 0.36, 0.03, 0.46, 0.71, 0.752, -0.14, 0.014);
  for (let i = 0; i < 4; i++) box(g, M.plasticG, 0.22, 0.012, 0.05, 0.72, 0.771, -0.31 + i * 0.113, 0.005);
  box(g, M.chrome, 0.05, 0.006, 0.09, 0.59, 0.769, -0.14, 0.002);

  g = part('tappo_olio');
  cyl(g, M.plastic, 0.03, 0.03, 0.66, 0.725, -0.30); cyl(g, M.yellow, 0.022, 0.006, 0.66, 0.743, -0.30);
  g = part('astina_olio');
  tube(g, M.steel, 0.004, [[0.545, 0.36, 0.02], [0.535, 0.5, 0.03], [0.53, 0.68, 0.04]]);
  add(g, new THREE.TorusGeometry(0.016, 0.005, 8, 16), M.yellow).position.set(0.53, 0.70, 0.04);
  g = part('filtro_olio');
  cyl(g, M.plastic, 0.042, 0.10, 0.515, 0.36, -0.05, 'x'); cyl(g, M.aluDark, 0.046, 0.03, 0.555, 0.36, -0.05, 'x');

  g = part('distribuzione');
  box(g, M.plastic, 0.30, 0.36, 0.045, 0.72, 0.50, -0.425, 0.03);
  cyl(g, M.aluDark, 0.055, 0.02, 0.72, 0.62, -0.455, 'z'); cyl(g, M.aluDark, 0.03, 0.02, 0.72, 0.36, -0.455, 'z');
  g = part('pompa_acqua');
  cyl(g, M.alu, 0.045, 0.05, 0.60, 0.47, -0.40, 'z'); cyl(g, M.steel, 0.03, 0.02, 0.60, 0.47, -0.435, 'z');

  g = part('cinghia_servizi');
  cyl(g, M.iron, 0.072, 0.03, 0.72, 0.33, -0.475, 'z');             // puleggia albero motore
  cyl(g, M.plastic, 0.03, 0.028, 0.60, 0.42, -0.475, 'z');           // tendicinghia
  tube(g, M.rubber, 0.006, [[0.79, 0.30, -0.475], [0.72, 0.255, -0.475], [0.55, 0.27, -0.475], [0.47, 0.33, -0.475], [0.55, 0.39, -0.475], [0.47, 0.50, -0.475], [0.53, 0.545, -0.475], [0.62, 0.45, -0.475], [0.79, 0.37, -0.475]], true);

  g = part('alternatore');
  cyl(g, M.alu, 0.062, 0.12, 0.52, 0.50, -0.37, 'z'); cyl(g, M.copper, 0.05, 0.05, 0.52, 0.50, -0.37, 'z', 0.05, 12);
  cyl(g, M.steel, 0.032, 0.03, 0.52, 0.50, -0.455, 'z');
  g = part('compressore_clima');
  cyl(g, M.aluDark, 0.058, 0.17, 0.50, 0.325, -0.34, 'z'); cyl(g, M.steel, 0.05, 0.03, 0.50, 0.325, -0.455, 'z');
  tube(g, M.alu, 0.007, [[0.50, 0.38, -0.28], [0.42, 0.45, -0.30], [0.33, 0.45, -0.32]]);

  g = part('collettore_aspirazione');
  box(g, M.plastic, 0.07, 0.085, 0.44, 0.535, 0.625, -0.15, 0.03);
  for (let i = 0; i < 4; i++) cyl(g, M.plastic, 0.02, 0.05, 0.575, 0.61, -0.31 + i * 0.113, 'x');
  g = part('egr');
  box(g, M.alu, 0.07, 0.08, 0.07, 0.56, 0.635, 0.105, 0.012); cyl(g, M.plastic, 0.032, 0.05, 0.56, 0.70, 0.105);
  tube(g, M.steel, 0.014, [[0.60, 0.63, 0.12], [0.75, 0.60, 0.135], [0.89, 0.58, 0.10], [0.92, 0.57, 0.0]]);
  box(g, M.steel, 0.16, 0.05, 0.045, 0.76, 0.60, 0.13, 0.01);         // scambiatore EGR
  g = part('candelette');
  for (let i = 0; i < 4; i++) { cyl(g, M.steel, 0.005, 0.07, 0.60, 0.665, -0.31 + i * 0.113); cyl(g, M.plastic, 0.008, 0.015, 0.60, 0.705, -0.31 + i * 0.113); }
  tube(g, M.hose, 0.004, [[0.60, 0.712, -0.31], [0.60, 0.716, -0.14], [0.60, 0.712, 0.03]]);

  g = part('iniettori');
  for (let i = 0; i < 4; i++) {
    const z = -0.31 + i * 0.113;
    cyl(g, M.steel, 0.011, 0.11, 0.70, 0.70, z); cyl(g, M.plastic, 0.014, 0.03, 0.70, 0.745, z);
    tube(g, M.steel, 0.004, [[0.70, 0.735, z], [0.76, 0.74, z], [0.82, 0.715, z]]);
  }
  g = part('rail');
  cyl(g, M.steel, 0.014, 0.40, 0.825, 0.705, -0.14, 'z'); cyl(g, M.plastic, 0.012, 0.03, 0.825, 0.705, 0.075, 'z');
  tube(g, M.steel, 0.004, [[0.825, 0.705, -0.34], [0.85, 0.68, -0.37], [0.85, 0.63, -0.38]]);
  g = part('pompa_alta_pressione');
  cyl(g, M.alu, 0.045, 0.09, 0.855, 0.60, -0.36, 'z'); box(g, M.aluDark, 0.07, 0.06, 0.05, 0.875, 0.635, -0.34, 0.01);
  cyl(g, M.plastic, 0.012, 0.03, 0.89, 0.67, -0.34);

  g = part('collettore_scarico');
  for (let i = 0; i < 4; i++) tube(g, M.rust, 0.018, [[0.885, 0.60, -0.31 + i * 0.113], [0.92, 0.585, -0.27 + i * 0.07], [0.94, 0.56, -0.17]]);
  box(g, M.rust, 0.04, 0.05, 0.42, 0.895, 0.60, -0.145, 0.01);
  g = part('turbo');
  cyl(g, M.rust, 0.062, 0.055, 0.965, 0.545, -0.185, 'z');            // chiocciola turbina (lato scarico)
  cyl(g, M.iron, 0.035, 0.05, 0.965, 0.545, -0.13, 'z');              // corpo centrale
  cyl(g, M.alu, 0.068, 0.05, 0.965, 0.545, -0.075, 'z');              // chiocciola compressore
  cyl(g, M.alu, 0.03, 0.04, 0.965, 0.545, -0.035, 'z');               // ingresso aria
  cyl(g, M.steel, 0.025, 0.05, 1.01, 0.63, -0.12, 'z'); tube(g, M.steel, 0.004, [[1.01, 0.63, -0.15], [0.99, 0.60, -0.19], [0.97, 0.60, -0.2]]); // attuatore wastegate
  g = part('fap');
  cyl(g, M.steel, 0.075, 0.30, 1.0, 0.36, -0.20); cyl(g, M.steel, 0.045, 0.06, 0.985, 0.50, -0.195, 'y', 0.075);
  cyl(g, M.rust, 0.03, 0.06, 1.0, 0.19, -0.20, 'y', 0.07);
  cyl(g, M.plastic, 0.008, 0.03, 0.93, 0.46, -0.20, 'x'); cyl(g, M.plastic, 0.008, 0.03, 0.93, 0.28, -0.20, 'x');

  // ===== Aspirazione / sovralimentazione =====
  g = part('filtro_aria');
  box(g, M.plastic, 0.25, 0.15, 0.27, 0.53, 0.645, 0.315, 0.03);
  box(g, M.plasticG, 0.23, 0.012, 0.25, 0.53, 0.665, 0.315, 0.004);
  tube(g, M.plastic, 0.03, [[0.42, 0.66, 0.38], [0.36, 0.70, 0.43], [0.31, 0.70, 0.46]]);   // presa aria
  g = part('debimetro');
  cyl(g, M.plasticG, 0.033, 0.06, 0.68, 0.66, 0.24, 'x'); box(g, M.plastic, 0.03, 0.03, 0.035, 0.68, 0.70, 0.24, 0.006);
  g = part('manicotto_aspirazione');
  tube(g, M.hose, 0.03, [[0.71, 0.66, 0.24], [0.82, 0.675, 0.20], [0.93, 0.66, 0.10], [0.975, 0.60, 0.0], [0.965, 0.55, -0.03]]);
  g = part('intercooler');
  box(g, M.alu, 0.035, 0.17, 0.24, 0.285, 0.36, 0.385, 0.006); box(g, M.plastic, 0.045, 0.17, 0.03, 0.285, 0.36, 0.515, 0.01); box(g, M.plastic, 0.045, 0.17, 0.03, 0.285, 0.36, 0.255, 0.01);
  g = part('manicotti_turbo');
  tube(g, M.hose, 0.024, [[0.965, 0.50, -0.07], [0.97, 0.36, 0.0], [0.80, 0.24, 0.30], [0.50, 0.26, 0.50], [0.31, 0.33, 0.52]]);
  tube(g, M.hose, 0.024, [[0.31, 0.40, 0.255], [0.38, 0.47, 0.18], [0.45, 0.57, 0.11], [0.50, 0.625, 0.08]]);

  // ===== Raffreddamento =====
  g = part('condensatore');
  box(g, M.aluDark, 0.016, 0.34, 0.54, 0.262, 0.50, -0.07, 0.004);
  g = part('radiatore');
  box(g, M.alu, 0.03, 0.38, 0.52, 0.30, 0.49, -0.07, 0.004);
  box(g, M.plastic, 0.04, 0.38, 0.035, 0.30, 0.49, -0.35, 0.01); box(g, M.plastic, 0.04, 0.38, 0.035, 0.30, 0.49, 0.21, 0.01);
  g = part('ventola');
  box(g, M.plastic, 0.02, 0.37, 0.50, 0.335, 0.49, -0.07, 0.006);
  cyl(g, M.plasticG, 0.165, 0.025, 0.352, 0.49, -0.07, 'x'); cyl(g, M.plastic, 0.045, 0.05, 0.365, 0.49, -0.07, 'x');
  for (let i = 0; i < 7; i++) { const b = box(g, M.plastic, 0.006, 0.13, 0.04, 0.366, 0.49, -0.07, 0.002); b.rotation.x = i * Math.PI * 2 / 7; b.translateY(0.09); b.rotateY(0.5); }
  g = part('manicotti_radiatore');
  tube(g, M.hose, 0.018, [[0.56, 0.66, -0.36], [0.45, 0.68, -0.33], [0.36, 0.66, -0.30], [0.315, 0.65, -0.30]]);
  tube(g, M.hose, 0.018, [[0.315, 0.33, 0.17], [0.40, 0.30, 0.12], [0.50, 0.33, 0.05], [0.56, 0.40, -0.36 + 0.36]]);
  g = part('vaschetta_refrigerante');
  { const m = box(g, M.white, 0.17, 0.15, 0.19, 0.95, 0.70, -0.50, 0.03); m.castShadow = false; }
  box(g, M.fluidG, 0.16, 0.07, 0.18, 0.95, 0.665, -0.50, 0.025);
  cyl(g, M.plastic, 0.032, 0.03, 0.93, 0.79, -0.50); tube(g, M.hose, 0.008, [[0.90, 0.64, -0.42], [0.80, 0.62, -0.42], [0.64, 0.66, -0.38]]);
  g = part('termostato');
  box(g, M.plastic, 0.06, 0.06, 0.05, 0.60, 0.66, -0.385 + 0.0, 0.012);

  // ===== Alimentazione =====
  g = part('filtro_gasolio');
  cyl(g, M.plastic, 0.05, 0.13, 0.42, 0.55, -0.50); cyl(g, M.plasticG, 0.052, 0.025, 0.42, 0.625, -0.50);
  tube(g, M.hose, 0.006, [[0.42, 0.64, -0.50], [0.60, 0.70, -0.46], [0.84, 0.66, -0.40]]);
  sph(g, M.rubber, 0.022, 0.50, 0.675, -0.485, 1.6, 1, 1);          // pompetta di adescamento

  // ===== Elettrico =====
  g = part('batteria');
  box(g, M.plastic, 0.185, 0.185, 0.25, 0.84, 0.655, 0.37, 0.012); box(g, M.plasticG, 0.185, 0.02, 0.25, 0.84, 0.755, 0.37, 0.006);
  cyl(g, M.redP, 0.014, 0.025, 0.80, 0.775, 0.45); cyl(g, M.steel, 0.012, 0.025, 0.80, 0.775, 0.29);
  tube(g, M.redP, 0.006, [[0.80, 0.78, 0.45], [0.74, 0.78, 0.50], [0.66, 0.765, 0.54]]);
  g = part('centralina_motore');
  box(g, M.alu, 0.03, 0.15, 0.20, 0.715, 0.66, 0.36, 0.006); box(g, M.plastic, 0.035, 0.04, 0.16, 0.715, 0.755, 0.36, 0.006);
  g = part('scatola_fusibili');
  box(g, M.plastic, 0.22, 0.065, 0.10, 0.60, 0.74, 0.56, 0.012);
  g = part('motorino_avviamento');
  cyl(g, M.aluDark, 0.04, 0.15, 0.93, 0.36, 0.06, 'z'); cyl(g, M.steel, 0.022, 0.09, 0.955, 0.415, 0.05, 'z');

  // ===== Freni (idraulica) =====
  g = part('servofreno');
  cyl(g, M.plastic, 0.115, 0.07, 1.045, 0.70, 0.36, 'x'); cyl(g, M.alu, 0.022, 0.12, 0.96, 0.70, 0.36, 'x');
  g = part('vaschetta_freni');
  { const m = box(g, M.white, 0.07, 0.06, 0.11, 0.955, 0.755, 0.36, 0.012); m.castShadow = false; }
  cyl(g, M.yellow, 0.025, 0.02, 0.955, 0.795, 0.36);
  g = part('abs');
  box(g, M.alu, 0.09, 0.09, 0.10, 1.0, 0.50, 0.50, 0.008); box(g, M.plastic, 0.06, 0.09, 0.09, 1.0, 0.50, 0.41, 0.008);

  // ===== Lavavetri =====
  g = part('vaschetta_lavavetri');
  { const m = box(g, M.white, 0.14, 0.22, 0.10, 0.44, 0.50, -0.585, 0.02); m.castShadow = false; }
  tube(g, M.white, 0.018, [[0.46, 0.60, -0.58], [0.50, 0.68, -0.56], [0.52, 0.735, -0.55]]);
  cyl(g, M.blue, 0.026, 0.02, 0.523, 0.745, -0.548);

  // ===== Trasmissione =====
  g = part('cambio');
  cyl(g, M.alu, 0.17, 0.09, 0.72, 0.42, 0.15, 'z', 0.15); box(g, M.alu, 0.30, 0.27, 0.27, 0.72, 0.41, 0.335, 0.05);
  cyl(g, M.alu, 0.10, 0.16, 0.86, 0.325, 0.27, 'z');                  // differenziale
  cyl(g, M.plastic, 0.012, 0.02, 0.62, 0.555, 0.34);
  tube(g, M.steel, 0.005, [[0.70, 0.55, 0.40], [0.85, 0.60, 0.42], [1.05, 0.55, 0.30]]);  // cavi selezione marce
  g = part('frizione', true);
  cyl(g, M.iron, 0.115, 0.03, 0.72, 0.42, 0.115, 'z'); cyl(g, M.steel, 0.10, 0.012, 0.72, 0.42, 0.135, 'z');
  g = part('semiassi', false);
  for (const s of [1, -1]) {
    cyl(g, M.steel, 0.013, 0.42, FA, WHEEL_Y + 0.005, s > 0 ? 0.52 : -0.45, 'z');
    cyl(g, M.rubber, 0.04, 0.07, FA, WHEEL_Y, 0.66 * s, 'z', 0.02); cyl(g, M.rubber, 0.035, 0.06, FA, WHEEL_Y + 0.008, s > 0 ? 0.37 : -0.26, 'z', 0.02);
  }
  cyl(g, M.steel, 0.014, 0.42, FA, WHEEL_Y + 0.01, -0.03, 'z');

  // ===== Scarico =====
  g = part('scarico', false);
  tube(g, M.steel, 0.026, [[1.0, 0.17, -0.20], [1.10, 0.15, -0.12], [1.5, 0.15, -0.06], [2.6, 0.15, -0.06], [3.1, 0.17, 0.10], [3.45, 0.24, 0.24], [3.6, 0.26, 0.24]]);
  cyl(g, M.steel, 0.05, 0.36, 2.0, 0.15, -0.06, 'x');
  cyl(g, M.steel, 0.085, 0.36, 3.78, 0.275, 0.24, 'x');
  tube(g, M.steel, 0.022, [[3.95, 0.26, 0.24], [3.99, 0.24, 0.26], [4.0, 0.20, 0.30]]);
  g = part('serbatoio', false);
  box(g, M.plasticG, 0.55, 0.20, 0.95, 2.82, 0.285, 0.05, 0.05);
  tube(g, M.plastic, 0.022, [[3.0, 0.33, -0.40], [3.3, 0.55, -0.62], [3.55, 0.82, -0.74]]);

  // ===== Sospensioni e sterzo =====
  for (const s of [1, -1]) {
    g = part('sospensione_ant_' + (s > 0 ? 'sx' : 'dx'), false);
    const zt = 0.585 * s, zb = 0.635 * s;
    tube(g, M.plastic, 0.026, [[FA + 0.005, 0.36, zb], [FA + 0.02, 0.60, 0.61 * s]]);
    tube(g, M.steel, 0.011, [[FA + 0.02, 0.60, 0.61 * s], [FA + 0.035, 0.80, zt]]);
    { const sp = helix(g, M.redP, 0, 0, 0.26, 0, 0.062, 5); sp.position.set(FA + 0.02, 0.54, 0.607 * s); sp.rotation.set(-0.19 * s, 0, -0.075); }
    cyl(g, M.rubber, 0.07, 0.025, FA + 0.035, 0.81, zt); cyl(g, M.steel, 0.075, 0.008, FA + 0.022, 0.545, 0.61 * s);
    // braccio inferiore e montante
    tube(g, M.iron, 0.02, [[FA - 0.02, 0.215, 0.33 * s], [FA, 0.20, 0.50 * s], [FA, 0.205, 0.66 * s]]);
    tube(g, M.iron, 0.018, [[FA + 0.24, 0.225, 0.34 * s], [FA + 0.10, 0.21, 0.48 * s], [FA, 0.205, 0.64 * s]]);
    box(g, M.iron, 0.07, 0.20, 0.05, FA, 0.30, 0.665 * s, 0.015);
  }
  g = part('sterzo', false);
  cyl(g, M.aluDark, 0.026, 0.62, FA + 0.17, 0.30, 0, 'z'); cyl(g, M.steel, 0.011, 1.22, FA + 0.17, 0.30, 0, 'z');
  for (const s of [1, -1]) { cyl(g, M.rubber, 0.03, 0.12, FA + 0.17, 0.30, 0.37 * s, 'z', 0.018); tube(g, M.steel, 0.009, [[FA + 0.17, 0.30, 0.60 * s], [FA + 0.10, 0.30, 0.67 * s]]); }
  tube(g, M.steel, 0.011, [[FA + 0.17, 0.32, 0.30], [1.15, 0.50, 0.34], [1.35, 0.72, 0.36]]);
  g = part('barra_stabilizzatrice', false);
  tube(g, M.iron, 0.011, [[FA + 0.06, 0.26, -0.62], [FA + 0.22, 0.25, -0.50], [FA + 0.25, 0.25, 0], [FA + 0.22, 0.25, 0.50], [FA + 0.06, 0.26, 0.62]]);
  g = part('culla_motore', false);
  box(g, M.iron, 0.42, 0.04, 0.80, FA + 0.08, 0.19, 0, 0.015);

  g = part('ponte_posteriore', false);
  cyl(g, M.iron, 0.04, 1.18, RA - 0.30, 0.30, 0, 'z');
  for (const s of [1, -1]) {
    tube(g, M.iron, 0.03, [[RA - 0.42, 0.33, 0.56 * s], [RA - 0.30, 0.30, 0.585 * s], [RA, WHEEL_Y, 0.61 * s]]);
    cyl(g, M.rubber, 0.04, 0.07, RA - 0.42, 0.33, 0.56 * s, 'z');
  }
  for (const s of [1, -1]) {
    g = part('sospensione_post_' + (s > 0 ? 'sx' : 'dx'), false);
    { const sp = helix(g, M.redP, RA - 0.10, 0.31, 0.50, 0.50 * s, 0.05, 5); }
    cyl(g, M.steel, 0.05, 0.008, RA - 0.10, 0.305, 0.50 * s);
    tube(g, M.plastic, 0.022, [[RA + 0.03, 0.27, 0.60 * s], [RA + 0.09, 0.50, 0.59 * s]]); tube(g, M.steel, 0.01, [[RA + 0.09, 0.50, 0.59 * s], [RA + 0.14, 0.70, 0.58 * s]]);
  }

  car.root.updateMatrixWorld(true);
  // punto di riferimento per vista esplosa
  for (const id in car.parts) {
    const p = car.parts[id]; if (!p.userData.explode) continue;
    const c = new THREE.Box3().setFromObject(p).getCenter(new THREE.Vector3()); p.worldToLocal(c);
    const dir = new THREE.Vector3(c.x + car.root.position.x * 0 - 0.70, 0, c.z).multiplyScalar(1.15);
    dir.y = 0.25 + Math.max(0, c.y - 0.3) * 1.5;
    dir.x -= 0.12;
    p.userData.explodeVec = dir;
  }
}
