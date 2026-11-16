// Isolated-part preview: a small second renderer showing a copy of one part, auto-rotating.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeEnvironment } from './studio';

export class PartPreview {
  readonly canvas = document.createElement('canvas');
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(28, 1, 0.01, 50);
  private readonly controls: OrbitControls;
  private object: THREE.Group | null = null;
  private materials: THREE.Material[] = [];

  constructor() {
    const r = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer = r;
    this.scene.environment = makeEnvironment(r);
    const l = new THREE.DirectionalLight(0xffffff, 1.4);
    l.position.set(2, 4, 3);
    this.scene.add(l);
    const ct = new OrbitControls(this.camera, this.canvas);
    ct.enablePan = false;
    ct.autoRotate = true;
    ct.autoRotateSpeed = 2.2;
    ct.enableDamping = true;
    this.controls = ct;
  }

  get hasObject() {
    return !!this.object;
  }

  clear() {
    if (!this.object) return;
    this.scene.remove(this.object);
    this.materials.forEach((m) => m.dispose());
    this.object = null;
    this.materials = [];
  }

  /**
   * Shows a copy of `source` (taken with its current world transform). `unhighlighted` maps the
   * source meshes to their materials without highlight; x-ray settings saved in
   * `userData.xray` are undone so the part always looks solid.
   */
  show(
    source: THREE.Object3D,
    materialOf: (mesh: THREE.Mesh) => THREE.Material | THREE.Material[],
  ) {
    this.clear();
    source.updateWorldMatrix(true, true);
    const obj = source.clone(true);
    source.matrixWorld.decompose(obj.position, obj.quaternion, obj.scale);
    const sources: THREE.Mesh[] = [];
    source.traverse((o) => o instanceof THREE.Mesh && sources.push(o));
    const map = new Map<THREE.Material, THREE.Material>();
    const conv = (m: THREE.Material) => {
      let c = map.get(m);
      if (c) return c;
      c = m.clone();
      c.onBeforeCompile = m.onBeforeCompile;
      c.customProgramCacheKey = m.customProgramCacheKey;
      if (m.userData.xray) Object.assign(c, m.userData.xray);
      map.set(m, c);
      this.materials.push(c);
      return c;
    };
    let i = 0;
    obj.traverse((o) => {
      o.visible = true;
      if (o instanceof THREE.Mesh) {
        const b = materialOf(sources[i++]);
        o.material = Array.isArray(b) ? b.map(conv) : conv(b);
      }
    });
    const wrap = new THREE.Group();
    wrap.add(obj);
    const box = new THREE.Box3().setFromObject(wrap),
      c = box.getCenter(new THREE.Vector3()),
      rad = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 0.03);
    obj.position.sub(c);
    this.scene.add(wrap);
    this.object = wrap;
    const d = (rad / Math.sin((this.camera.fov * Math.PI) / 360)) * 1.1;
    this.camera.position.set(-d * 0.62, d * 0.42, d * 0.66);
    this.camera.near = d / 50;
    this.camera.far = d * 10;
    this.camera.updateProjectionMatrix();
    this.controls.target.set(0, 0, 0);
    this.controls.minDistance = d * 0.35;
    this.controls.maxDistance = d * 3;
    this.controls.update();
  }

  render() {
    const el = this.canvas,
      w = el.clientWidth,
      h = el.clientHeight;
    if (!this.object || !w || !h) return;
    const pr = this.renderer.getPixelRatio();
    if (el.width !== Math.round(w * pr) || el.height !== Math.round(h * pr)) {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.clear();
    this.controls.dispose();
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }
}
