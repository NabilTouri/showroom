// Post-produzione: occlusione ambientale, bagliore, vignettatura, tone mapping.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const GradeShader = {
  name: 'Grade',
  uniforms: { tDiffuse: { value: null }, vignette: { value: 0.32 }, contrast: { value: 1.06 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float vignette; uniform float contrast; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 p = vUv - 0.5; float v = smoothstep(0.85, 0.25, length(p * vec2(1.0, 1.15)));
      c.rgb *= mix(1.0 - vignette, 1.0, v);
      c.rgb = (c.rgb - 0.18) * contrast + 0.18;
      gl_FragColor = vec4(max(c.rgb, 0.0), c.a);
    }`,
};

export function createPost(renderer, scene, camera) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, size.x, size.y);
  ao.updateGtaoMaterial({ radius: 0.28, distanceExponent: 1.4, thickness: 1.2, scale: 1.15, samples: 12, distanceFallOff: 1, screenSpaceRadius: false });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, radiusExponent: 1, rings: 2, samples: 12 });
  ao.blendIntensity = 0.85;
  composer.addPass(ao);
  // limita i picchi speculari, altrimenti un singolo riflesso genera un alone enorme
  composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: GradeShader.vertexShader, fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); float m = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c.rgb * min(1.0, 7.0 / max(m, 1e-4)), c.a); }' }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.13, 0.45, 3.0);
  composer.addPass(bloom);
  composer.addPass(new ShaderPass(GradeShader));
  composer.addPass(new OutputPass());
  return {
    composer, ao, bloom,
    setSize(w, h, pr) { composer.setPixelRatio(pr); composer.setSize(w, h); },
    render() { composer.render(); },
  };
}
