import * as THREE from 'three';

// Vernice a tre strati: base colore, scaglie metalliche (solo sulla base, sotto il trasparente liscio),
// viraggio del colore agli angoli radenti. Il lato interno dei pannelli resta scuro.
export const paintUniforms = { uFlake: { value: 0.16 }, uEdge: { value: new THREE.Color(0x000000) }, uEdgeAmt: { value: 0.5 } };
function carPaint(mat) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, paintUniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPaintPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPaintPos = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vPaintPos; uniform float uFlake; uniform vec3 uEdge; uniform float uEdgeAmt;
        float ph(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }`)
      .replace('#include <color_fragment>', '#include <color_fragment>\n if (!gl_FrontFacing) diffuseColor.rgb = vec3(0.02);')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        if (gl_FrontFacing) {
          vec3 fp = vPaintPos * 1500.0, c = floor(fp);
          vec3 fn = vec3(ph(c), ph(c + 17.0), ph(c + 41.0)) - 0.5;
          float fade = clamp(1.0 - length(fwidth(fp)) * 0.3, 0.0, 1.0);
          normal = normalize(normal + fn * uFlake * fade);
          float fres = pow(1.0 - saturate(dot(normalize(vViewPosition), nonPerturbedNormal)), 2.5);
          diffuseColor.rgb = mix(diffuseColor.rgb, uEdge, fres * uEdgeAmt);
        }`);
  };
  mat.customProgramCacheKey = () => 'carpaint';
  return mat;
}

const P = (o) => new THREE.MeshPhysicalMaterial(o);
const St = (o) => new THREE.MeshStandardMaterial(o);
const DS = THREE.DoubleSide;

// Tinte del catalogo Clio IV (valori cromatici approssimati). tipo: pastello / metallizzato / perlato
export const COLORS = {
  'Rosso Flamme': { hex: 0x9c0a12, edge: 0x2a0003, metal: 0.55, rough: 0.42, flake: 0.2, tipo: 'metallizzato' },
  'Blu Iron': { hex: 0x16335c, edge: 0x050a1c, metal: 0.6, rough: 0.42, flake: 0.2, tipo: 'metallizzato' },
  'Bianco Ghiaccio': { hex: 0xe6e6e1, edge: 0xb9bcc0, metal: 0.0, rough: 0.5, flake: 0.0, tipo: 'pastello' },
  'Bianco Perla': { hex: 0xe9e6dc, edge: 0xcfd6e6, metal: 0.25, rough: 0.38, flake: 0.1, tipo: 'perlato' },
  'Grigio Platino': { hex: 0x8a8d91, edge: 0x3d4045, metal: 0.75, rough: 0.4, flake: 0.24, tipo: 'metallizzato' },
  'Grigio Cassiopea': { hex: 0x4a4d52, edge: 0x15171a, metal: 0.7, rough: 0.42, flake: 0.24, tipo: 'metallizzato' },
  'Nero Étoilé': { hex: 0x08080a, edge: 0x1c2030, metal: 0.6, rough: 0.4, flake: 0.3, tipo: 'metallizzato' },
  'Giallo Eclair': { hex: 0xe0b200, edge: 0x8a5a00, metal: 0.0, rough: 0.48, flake: 0.0, tipo: 'pastello' },
  'Marrone Vison': { hex: 0x4b3a30, edge: 0x1a120e, metal: 0.65, rough: 0.42, flake: 0.22, tipo: 'metallizzato' },
  'Blu Pacifico': { hex: 0x1f6ea8, edge: 0x082a55, metal: 0.55, rough: 0.42, flake: 0.2, tipo: 'metallizzato' },
};

export const M = {
  paint: carPaint(P({ color: 0x9c0a12, metalness: 0.55, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.035, envMapIntensity: 1.0, side: DS })),
  inner: St({ color: 0x17181a, roughness: 0.85, metalness: 0.1, side: DS }),
  trim: St({ color: 0x0c0c0d, roughness: 0.5, metalness: 0.0, side: DS }),
  gloss: P({ color: 0x050506, roughness: 0.08, metalness: 0.2, clearcoat: 1, side: DS }),
  glass: P({ color: 0x16262a, roughness: 0.0, metalness: 0.0, transparent: true, opacity: 0.42, side: DS, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 1.5 }),
  lens: P({ color: 0xe8eef2, roughness: 0.0, metalness: 0.0, transparent: true, opacity: 0.1, side: DS, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 1.1 }),
  lampIn: St({ color: 0xd6d9dc, roughness: 0.12, metalness: 1, side: DS, envMapIntensity: 1.4 }),
  redLens: P({ color: 0xb00c16, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.72, side: DS, clearcoat: 1, emissive: 0xff0a0a, emissiveIntensity: 0.05, envMapIntensity: 1.4 }),
  redIn: St({ color: 0x7a0a10, roughness: 0.2, metalness: 0.8, side: DS }),
  lowBeam: St({ color: 0xf2f4f6, emissive: 0xfff1d6, emissiveIntensity: 0, roughness: 0.12, metalness: 0.9, side: DS }),
  highBeam: St({ color: 0xf2f4f6, emissive: 0xfff6e6, emissiveIntensity: 0, roughness: 0.12, metalness: 0.9, side: DS }),
  fog: St({ color: 0xf2f4f6, emissive: 0xfff1d6, emissiveIntensity: 0, roughness: 0.12, metalness: 0.9, side: DS }),
  drl: St({ color: 0xf4f6f8, emissive: 0xe4eeff, emissiveIntensity: 0, roughness: 0.25, metalness: 0.2, side: DS }),
  reverse: St({ color: 0xf0f0f0, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.2, metalness: 0.4, side: DS }),
  roofl: St({ color: 0xe8e6de, emissive: 0xfff2d8, emissiveIntensity: 0, roughness: 0.4, side: DS }),
  chmsl: P({ color: 0x8a0a12, roughness: 0.1, emissive: 0xff1010, emissiveIntensity: 0, clearcoat: 1, side: DS }),
  cabin: St({ color: 0x1b1c1f, roughness: 0.8, side: DS }),
  red: P({ color: 0xc0101a, roughness: 0.06, metalness: 0.0, emissive: 0xff1410, emissiveIntensity: 0, clearcoat: 1, side: DS }),
  amber: P({ color: 0xe07a00, roughness: 0.1, emissive: 0xff8a00, emissiveIntensity: 0, side: DS }),
  chrome: St({ color: 0xf0f1f2, roughness: 0.06, metalness: 1, side: DS, envMapIntensity: 1.5 }),
  rubber: St({ color: 0x0b0b0b, roughness: 0.92 }),
  plastic: St({ color: 0x151517, roughness: 0.7, side: DS }),
  plasticG: St({ color: 0x2a2c30, roughness: 0.75, side: DS }),
  alu: St({ color: 0xa9adb2, roughness: 0.45, metalness: 0.9 }),
  aluDark: St({ color: 0x6d7176, roughness: 0.55, metalness: 0.85 }),
  iron: St({ color: 0x3b3d40, roughness: 0.7, metalness: 0.7 }),
  steel: St({ color: 0x8a8d91, roughness: 0.35, metalness: 1 }),
  rust: St({ color: 0x6a4a36, roughness: 0.8, metalness: 0.6 }),
  copper: St({ color: 0xb87333, roughness: 0.4, metalness: 0.9 }),
  yellow: St({ color: 0xf2c300, roughness: 0.5 }),
  blue: St({ color: 0x1f5fd0, roughness: 0.5 }),
  redP: St({ color: 0xc0181c, roughness: 0.5 }),
  white: P({ color: 0xe8e6da, roughness: 0.4, transparent: true, opacity: 0.85, side: DS }),
  fabric: St({ color: 0x232428, roughness: 0.95, side: DS }),
  fabric2: St({ color: 0x34363c, roughness: 0.95 }),
  floor: St({ color: 0x101011, roughness: 1, side: DS }),
  rim: St({ color: 0xdfe1e4, roughness: 0.22, metalness: 1, envMapIntensity: 1.5 }),
  rimDark: St({ color: 0x1c1d20, roughness: 0.45, metalness: 0.7 }),
  tire: St({ color: 0x0d0d0e, roughness: 0.9 }),
  disc: St({ color: 0x9a9da1, roughness: 0.35, metalness: 1 }),
  hose: St({ color: 0x0e0e0f, roughness: 0.8 }),
  fluidG: P({ color: 0x9be36b, roughness: 0.3, transparent: true, opacity: 0.8 }),
  orange: St({ color: 0xff6a00, roughness: 0.5 }),
};

// Applica una tinta alla vernice (k = 0..1 per le transizioni animate)
const _c = new THREE.Color();
export function applyPaint(from, to, k) {
  const a = COLORS[from], b = COLORS[to], L = THREE.MathUtils.lerp;
  M.paint.color.setHex(a.hex).lerp(_c.setHex(b.hex), k);
  paintUniforms.uEdge.value.setHex(a.edge).lerp(_c.setHex(b.edge), k);
  M.paint.metalness = L(a.metal, b.metal, k); M.paint.roughness = L(a.rough, b.rough, k);
  paintUniforms.uFlake.value = L(a.flake, b.flake, k);
}
