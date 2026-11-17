import * as THREE from 'three';

/** A paint colour: base colour, grazing-angle colour shift, metal flakes. */
export interface PaintColor {
  hex: number;
  /** Colour seen at grazing angles (colour flop). */
  edge: number;
  metalness: number;
  roughness: number;
  /** Strength of the metal flakes (0 = solid paint). */
  flake: number;
}

export interface CarPaint {
  material: THREE.MeshPhysicalMaterial;
  /** Blends from one colour to another (k = 0..1, for animated transitions). */
  apply(from: PaintColor, to: PaintColor, k: number): void;
}

/**
 * Three-layer car paint: base colour, metal flakes (on the base only, under the smooth clear
 * coat) and colour flop at grazing angles. The inner side of the panels stays dark.
 * Every call owns its uniforms, so several vehicles can be painted independently.
 */
export function createCarPaint(params: THREE.MeshPhysicalMaterialParameters): CarPaint {
  const uniforms = {
    uFlake: { value: 0.16 },
    uEdge: { value: new THREE.Color(0x000000) },
    uEdgeAmt: { value: 0.5 },
  };
  const material = new THREE.MeshPhysicalMaterial(params);
  material.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPaintPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPaintPos = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vPaintPos; uniform float uFlake; uniform vec3 uEdge; uniform float uEdgeAmt;
        float ph(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }`,
      )
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\n if (!gl_FrontFacing) diffuseColor.rgb = vec3(0.02);',
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        if (gl_FrontFacing) {
          vec3 fp = vPaintPos * 1500.0, c = floor(fp);
          vec3 fn = vec3(ph(c), ph(c + 17.0), ph(c + 41.0)) - 0.5;
          float fade = clamp(1.0 - length(fwidth(fp)) * 0.3, 0.0, 1.0);
          normal = normalize(normal + fn * uFlake * fade);
          float fres = pow(1.0 - saturate(dot(normalize(vViewPosition), nonPerturbedNormal)), 2.5);
          diffuseColor.rgb = mix(diffuseColor.rgb, uEdge, fres * uEdgeAmt);
        }`,
      );
  };
  material.customProgramCacheKey = () => 'carpaint';

  const tmp = new THREE.Color();
  const lerp = THREE.MathUtils.lerp;
  return {
    material,
    apply(from, to, k) {
      material.color.setHex(from.hex).lerp(tmp.setHex(to.hex), k);
      uniforms.uEdge.value.setHex(from.edge).lerp(tmp.setHex(to.edge), k);
      material.metalness = lerp(from.metalness, to.metalness, k);
      material.roughness = lerp(from.roughness, to.roughness, k);
      uniforms.uFlake.value = lerp(from.flake, to.flake, k);
    },
  };
}
