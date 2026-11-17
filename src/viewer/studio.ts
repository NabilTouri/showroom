// Dark showroom: custom reflection environment, glossy reflective floor, contact shadow, lights.
import * as THREE from 'three';
import type { Spotlight } from '../vehicles/types';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';

export const BG = 0x08090b;

// Photo studio: light panels that draw the reflections on the bodywork
export function makeEnvironment(renderer: THREE.WebGLRenderer) {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(30, 12, 30),
    new THREE.MeshBasicMaterial({ color: 0x15171b, side: THREE.BackSide }),
  );
  room.position.y = 5.9;
  s.add(room);
  type Vec3 = [number, number, number];
  const panel = (w: number, h: number, pos: Vec3, rot: Vec3, k: number, color = 0xffffff) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(k),
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    );
    m.position.set(...pos);
    m.rotation.set(...rot);
    s.add(m);
  };
  const H = Math.PI / 2;
  panel(8.5, 3.4, [0, 5.6, 0], [H, 0, 0], 3.4); // ceiling softbox
  panel(11, 0.55, [0, 2.6, 7], [0, 0, 0], 16); // side strips
  panel(11, 0.55, [0, 2.6, -7], [0, 0, 0], 16);
  panel(11, 0.25, [0, 0.9, 7.2], [0, 0, 0], 6, 0xbfd4ff); // low cool blade
  panel(11, 0.25, [0, 0.9, -7.2], [0, 0, 0], 6, 0xbfd4ff);
  panel(4.5, 2.4, [-10, 3.0, 0], [0, H, 0], 5, 0xfff1dc); // warm front fill
  panel(4.5, 2.4, [10, 3.0, 0], [0, H, 0], 4, 0xdce8ff); // cool rear fill
  panel(2.2, 2.2, [-6.5, 4.6, 5.5], [H * 0.6, 0.6, 0], 9); // 3/4 accents
  panel(2.2, 2.2, [6.5, 4.6, -5.5], [H * 0.6, 0.6, 0], 7);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshBasicMaterial({ color: 0x050506 }),
  );
  floor.rotation.x = -H;
  s.add(floor);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.015, 0.1, 40).texture;
  pm.dispose();
  s.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      o.material.dispose();
    }
  });
  return tex;
}

const floorShader = {
  name: 'ShowroomFloor',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    strength: { value: 0.3 },
    texel: { value: new THREE.Vector2(1 / 1024, 1 / 1024) },
    bg: { value: new THREE.Color(BG) },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
    void main() { vUv = textureMatrix * vec4(position, 1.0); vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color; uniform vec3 bg; uniform sampler2D tDiffuse; uniform float strength; uniform vec2 texel;
    varying vec4 vUv; varying vec3 vW;
    void main() {
      vec2 uv = vUv.xy / vUv.w; float d = length(vW.xz);
      float blur = 1.0 + d * 0.3; vec3 r = vec3(0.0); float tw = 0.0;
      for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) {
        float w = 1.0 / (1.0 + float(i * i + j * j));
        r += texture2D(tDiffuse, uv + vec2(float(i), float(j)) * texel * blur).rgb * w; tw += w;
      }
      r /= tw;
      vec2 e = smoothstep(vec2(0.0), vec2(0.04), uv) * smoothstep(vec2(0.0), vec2(0.04), 1.0 - uv); r *= e.x * e.y;
      float glow = smoothstep(7.5, 0.0, d);
      vec3 col = color * (0.22 + 1.5 * glow * glow) + r * strength * smoothstep(9.0, 2.2, d);
      gl_FragColor = vec4(mix(bg, col, smoothstep(13.0, 5.5, d)), 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!,
    gr = g.createRadialGradient(256, 256, 0, 256, 256, 256);
  gr.addColorStop(0, '#3b4048');
  gr.addColorStop(0.3, '#23262c');
  gr.addColorStop(0.62, '#101215');
  gr.addColorStop(1, '#08090b');
  g.fillStyle = gr;
  g.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export type Studio = ReturnType<typeof createStudio>;

export function createStudio(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  spotlights: readonly Spotlight[],
) {
  scene.background = new THREE.Color(BG);
  scene.environment = makeEnvironment(renderer);
  scene.environmentIntensity = 1.0;

  // ----- lights -----
  const key = new THREE.DirectionalLight(0xffffff, 0.55);
  key.position.set(-2.5, 7.5, 3.5);
  key.castShadow = true;
  Object.assign(key.shadow.camera, {
    left: -3.6,
    right: 3.6,
    top: 3.6,
    bottom: -3.6,
    near: 1,
    far: 16,
  });
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.035;
  key.shadow.radius = 5;
  scene.add(key);
  const rimA = new THREE.DirectionalLight(0xbfd6ff, 0.25);
  rimA.position.set(6, 3, -6);
  scene.add(rimA);
  const rimB = new THREE.DirectionalLight(0xffe9cf, 0.18);
  rimB.position.set(-6, 2.5, -5);
  scene.add(rimB);
  scene.add(new THREE.HemisphereLight(0xcfd8e6, 0x101114, 0.18));
  // vehicle spotlights start off: the viewer fades them in with their openable
  const spots = spotlights.map((s) => {
    const spot = new THREE.SpotLight(s.color, 0, s.distance, s.angle, s.penumbra, s.decay);
    spot.position.set(...s.position);
    spot.target.position.set(...s.target);
    scene.add(spot, spot.target);
    return spot;
  });

  // ----- floor -----
  const floor = new THREE.Group();
  scene.add(floor);
  const geo = new THREE.CircleGeometry(14, 72);
  const simple = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: glowTexture() }));
  simple.rotation.x = -Math.PI / 2;
  simple.scale.setScalar(0.72);
  floor.add(simple);
  let mirror: Reflector | null = null,
    mirrorRes = 0;
  const setMirror = (res: number) => {
    if (res === mirrorRes) return;
    mirrorRes = res;
    if (mirror) {
      floor.remove(mirror);
      mirror.dispose();
      mirror = null;
    }
    if (res) {
      mirror = new Reflector(geo, {
        textureWidth: res,
        textureHeight: res,
        clipBias: 0.002,
        color: 0x5a606c,
        shader: floorShader,
        multisample: 0,
      });
      (mirror.material as THREE.ShaderMaterial).uniforms.texel.value.set(1 / res, 1 / res);
      mirror.rotation.x = -Math.PI / 2;
      floor.add(mirror);
    }
    simple.visible = !res;
  };

  // ----- contact shadow (depth seen from below, then blurred) -----
  const W = 6.2,
    D = 3.8,
    HGT = 0.9,
    RES = 512;
  const rt = new THREE.WebGLRenderTarget(RES, RES),
    rtBlur = new THREE.WebGLRenderTarget(RES, RES);
  rt.texture.generateMipmaps = rtBlur.texture.generateMipmaps = false;
  const sg = new THREE.Group();
  sg.position.y = 0.004;
  scene.add(sg);
  const pg = new THREE.PlaneGeometry(W, D).rotateX(Math.PI / 2);
  const plane = new THREE.Mesh(
    pg,
    new THREE.MeshBasicMaterial({
      map: rt.texture,
      opacity: 0.92,
      transparent: true,
      depthWrite: false,
    }),
  );
  plane.renderOrder = 1;
  plane.scale.y = -1;
  sg.add(plane);
  const blurPlane = new THREE.Mesh(pg);
  blurPlane.visible = false;
  sg.add(blurPlane);
  const sc = new THREE.OrthographicCamera(-W / 2, W / 2, D / 2, -D / 2, 0, HGT);
  sc.rotation.x = Math.PI / 2;
  sg.add(sc);
  const depthMat = new THREE.MeshDepthMaterial();
  depthMat.depthTest = false;
  depthMat.depthWrite = false;
  depthMat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
      'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * 1.6 );',
    );
  };
  const hB = new THREE.ShaderMaterial(HorizontalBlurShader),
    vB = new THREE.ShaderMaterial(VerticalBlurShader);
  hB.depthTest = vB.depthTest = false;
  const blur = (amount: number) => {
    blurPlane.visible = true;
    blurPlane.material = hB;
    hB.uniforms.tDiffuse.value = rt.texture;
    hB.uniforms.h.value = amount / 256;
    renderer.setRenderTarget(rtBlur);
    renderer.render(blurPlane, sc);
    blurPlane.material = vB;
    vB.uniforms.tDiffuse.value = rtBlur.texture;
    vB.uniforms.v.value = amount / 256;
    renderer.setRenderTarget(rt);
    renderer.render(blurPlane, sc);
    blurPlane.visible = false;
  };
  const clearCol = new THREE.Color();
  function updateContactShadow() {
    const bgSave = scene.background,
      ov = scene.overrideMaterial,
      a = renderer.getClearAlpha();
    renderer.getClearColor(clearCol);
    const sm = renderer.shadowMap.enabled;
    renderer.shadowMap.enabled = false;
    floor.visible = false;
    plane.visible = false;
    scene.background = null;
    scene.overrideMaterial = depthMat;
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(scene, sc);
    scene.overrideMaterial = ov;
    blur(3.2);
    blur(1.2);
    renderer.setRenderTarget(null);
    renderer.setClearColor(clearCol, a);
    renderer.shadowMap.enabled = sm;
    scene.background = bgSave;
    floor.visible = true;
    plane.visible = true;
  }

  // render targets and helpers; the scene's meshes are disposed with the scene
  const dispose = () => {
    setMirror(0);
    rt.dispose();
    rtBlur.dispose();
    depthMat.dispose();
    hB.dispose();
    vB.dispose();
    scene.environment?.dispose();
  };

  return { key, spots, floor, setMirror, updateContactShadow, dispose };
}
