import * as THREE from 'three';
import { FA, RA, WHEEL_Y, ARCH_R } from './surface.js';

// Scarta i frammenti dentro i passaruota (ritaglio circolare perfetto senza tagliare la mesh)
function archClip(mat, darkBack = false) {
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 cpos;\nvarying vec3 vCpos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCpos = cpos;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCpos;')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        if (abs(vCpos.z) > 0.45) {
          vec2 a = vCpos.xy - vec2(${FA.toFixed(4)}, ${WHEEL_Y.toFixed(4)});
          vec2 b = vCpos.xy - vec2(${RA.toFixed(4)}, ${WHEEL_Y.toFixed(4)});
          float r2 = ${(ARCH_R * ARCH_R).toFixed(5)};
          if (dot(a, a) < r2 || dot(b, b) < r2) discard;
        }`);
    if (darkBack) sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n if (!gl_FrontFacing) diffuseColor.rgb = vec3(0.02);');
  };
  mat.customProgramCacheKey = () => 'archclip' + darkBack;
  mat.userData.archClip = true;
  return mat;
}
export function inArch(x, y, z) {
  if (Math.abs(z) < 0.45) return false;
  const r2 = ARCH_R * ARCH_R;
  return (x - FA) ** 2 + (y - WHEEL_Y) ** 2 < r2 || (x - RA) ** 2 + (y - WHEEL_Y) ** 2 < r2;
}

const P = (o) => new THREE.MeshPhysicalMaterial(o);
const St = (o) => new THREE.MeshStandardMaterial(o);
const DS = THREE.DoubleSide;

export const COLORS = {
  'Rosso Flamme': 0xa30d14,
  'Bianco Ghiaccio': 0xe9e9e4,
  'Grigio Platino': 0x8d9094,
  'Blu Iron': 0x1c3a63,
  'Nero Étoilé': 0x0b0b0d,
};

export const M = {
  paint: archClip(P({ color: 0xa30d14, metalness: 0.45, roughness: 0.36, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.85, side: DS }), true),
  inner: archClip(St({ color: 0x17181a, roughness: 0.85, metalness: 0.1, side: DS })),
  trim: archClip(St({ color: 0x0c0c0d, roughness: 0.6, metalness: 0.1, side: DS })),
  gloss: P({ color: 0x050506, roughness: 0.08, metalness: 0.2, clearcoat: 1, side: DS }),
  glass: P({ color: 0x1b2a30, roughness: 0.03, metalness: 0.1, transparent: true, opacity: 0.38, side: DS, depthWrite: false, envMapIntensity: 1.6 }),
  lens: P({ color: 0xdfe8ee, roughness: 0.02, metalness: 0.1, transparent: true, opacity: 0.16, side: DS, depthWrite: false, clearcoat: 1, envMapIntensity: 2 }),
  lampIn: St({ color: 0xc8ccd0, roughness: 0.15, metalness: 1, side: DS }),
  red: P({ color: 0x5c040a, roughness: 0.05, metalness: 0.25, emissive: 0x3a0002, clearcoat: 1, side: DS }),
  amber: P({ color: 0xff8a00, roughness: 0.1, emissive: 0x301400, side: DS }),
  led: St({ color: 0xffffff, emissive: 0xdfeaff, emissiveIntensity: 1.6, roughness: 0.3, side: DS }),
  chrome: St({ color: 0xe6e8ea, roughness: 0.08, metalness: 1, side: DS }),
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
  fabric: St({ color: 0x232428, roughness: 0.95 }),
  fabric2: St({ color: 0x34363c, roughness: 0.95 }),
  floor: St({ color: 0x101011, roughness: 1, side: DS }),
  rim: St({ color: 0xc9ccd0, roughness: 0.25, metalness: 1 }),
  tire: St({ color: 0x0d0d0e, roughness: 0.9 }),
  disc: St({ color: 0x9a9da1, roughness: 0.35, metalness: 1 }),
  hose: St({ color: 0x0e0e0f, roughness: 0.8 }),
  fluidG: P({ color: 0x9be36b, roughness: 0.3, transparent: true, opacity: 0.8 }),
  orange: St({ color: 0xff6a00, roughness: 0.5 }),
};
