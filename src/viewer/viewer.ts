// Generic 3D vehicle viewer: renderer, studio, the vehicle's scene and every interaction on it
// (picking, highlight, x-ray, exploded view, openables, camera, paint, lights, part preview).
// The UI drives it through methods and observes it through `store` (state) and `events`.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { resolvePart } from '../vehicles/part-cards';
import type {
  CameraPose,
  LightState,
  Openable,
  PaintOption,
  VehicleDefinition,
} from '../vehicles/types';
import { Highlighter, type AnyMaterial } from './highlight';
import { VehicleLights } from './lights';
import { ease } from './math';
import { PartPreview } from './part-preview';
import { createPost, type Post } from './post';
import { createQuality, type Quality, type QualityLevel } from './quality';
import { Emitter, Store } from './store';
import { createStudio, type Studio } from './studio';

export interface ViewerState {
  /** The vehicle is built and on screen. */
  ready: boolean;
  selected: string | null;
  xray: boolean;
  exploded: boolean;
  hidden: ReadonlySet<string>;
  /** Requested state of every openable (true = open or opening). */
  open: Readonly<Record<string, boolean>>;
  paint: string;
  lights: LightState;
  quality: QualityLevel;
}

export interface ViewerEvents extends Record<string, unknown> {
  /** Mouse over a part (client coordinates); null when nothing is under the pointer. */
  hover: { id: string; x: number; y: number } | null;
}

interface OpenableState extends Openable {
  /** Animated opening 0..1 and its target. */
  cur: number;
  target: number;
}

interface Flight {
  p0: THREE.Vector3;
  t0: THREE.Vector3;
  p1: THREE.Vector3;
  t1: THREE.Vector3;
  t: number;
  dur: number;
}

/** What the debug handle and the tests see of the built vehicle. */
export interface ViewerModel {
  root: THREE.Group;
  parts: Readonly<Record<string, THREE.Object3D>>;
  openables: Readonly<Record<string, Openable>>;
  explode: Readonly<Record<string, THREE.Vector3>>;
}

const v3 = (p: readonly [number, number, number]) => new THREE.Vector3(p[0], p[1], p[2]);

export class Viewer {
  readonly renderer: THREE.WebGLRenderer;
  readonly store: Store<ViewerState>;
  readonly events = new Emitter<ViewerEvents>();

  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(24, 1, 0.05, 80);
  private readonly controls: OrbitControls;
  private readonly studio: Studio;
  private readonly highlighter = new Highlighter();
  private readonly clock = new THREE.Clock();
  private readonly raycaster = new THREE.Raycaster();
  private readonly cleanup: (() => void)[] = [];

  private post: Post | null = null;
  private quality: Quality | null = null;
  private lights: VehicleLights | null = null;
  private preview: PartPreview | null = null;
  private previewHost: HTMLElement | null = null;

  private root = new THREE.Group();
  private parts: Record<string, THREE.Object3D> = {};
  private openables: Record<string, OpenableState> = {};
  private openableByObject = new Map<THREE.Object3D, string>();
  private explodeOffsets: Record<string, THREE.Vector3> = {};
  private materials: Record<string, THREE.Material> = {};
  private paint: { apply(from: PaintOption, to: PaintOption, k: number): void } | null = null;
  private paintMaterial: AnyMaterial | null = null;
  private pickable = new Set<string>();
  private xrayPassThrough = new Set<string>();
  private pickThrough = new Set<THREE.Material>();

  private dirty = true;
  private shadowDirty = true;
  private hover: string | null = null;
  private fly: Flight | null = null;
  private explode = { value: 0, target: 0 };
  private paintFade = { from: '', to: '', k: 1 };
  private viewOffset = { x: 0, y: 0 };
  private pointerDown: { x: number; y: number } | null = null;
  private disposed = false;

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly vehicle: VehicleDefinition,
  ) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer = renderer;

    const controls = new OrbitControls(this.camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.5;
    controls.maxDistance = 16;
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(0, 0.6, 0);
    this.controls = controls;
    this.studio = createStudio(renderer, this.scene, vehicle.spotlights);

    this.store = new Store<ViewerState>({
      ready: false,
      selected: null,
      xray: false,
      exploded: false,
      hidden: new Set(),
      open: Object.fromEntries(vehicle.openables.map((id) => [id, false])),
      paint: vehicle.defaultPaint,
      lights: {},
      quality: 'high',
    });
  }

  private get state() {
    return this.store.get();
  }

  /** Builds the vehicle and starts rendering. */
  async load() {
    const { vehicle } = this;
    this.root.position.x = -vehicle.length / 2;
    this.scene.add(this.root);
    const build = await vehicle.build({ root: this.root });
    if (this.disposed) return; // disposed while loading
    this.root.traverse((o) => {
      if (o instanceof THREE.Mesh)
        o.receiveShadow = Array.isArray(o.material) || !o.material.transparent;
    });
    this.root.updateMatrixWorld(true);

    this.parts = build.parts;
    this.materials = build.materials;
    this.explodeOffsets = build.explode;
    for (const [id, o] of Object.entries(build.openables)) {
      this.openables[id] = { ...o, cur: 0, target: 0 };
      this.openableByObject.set(o.object, id);
    }
    this.lights = new VehicleLights(vehicle.lights, build.materials, this.root);
    for (const id of Object.keys(build.parts)) {
      const part = resolvePart(vehicle.cards, id);
      if (!part) continue;
      this.pickable.add(id);
      if (vehicle.xrayPassThroughCategories.includes(part.card.category))
        this.xrayPassThrough.add(id);
    }
    for (const key of vehicle.materialRoles.pickThrough) this.pickThrough.add(build.materials[key]);
    this.paint = build.paint;
    this.paintMaterial = build.materials[vehicle.materialRoles.paint] as AnyMaterial;
    const paint = this.paintOption(vehicle.defaultPaint);
    this.paintFade = { from: paint.id, to: paint.id, k: 1 };
    build.paint.apply(paint, paint, 1);
    this.store.set({ lights: this.lights.initialState() });

    this.listen();
    this.quality = createQuality(this.renderer, (cfg, level) => {
      const { renderer, studio } = this;
      renderer.setPixelRatio(Math.min(devicePixelRatio, cfg.pixelRatio));
      if (cfg.post && !this.post) this.post = createPost(renderer, this.scene, this.camera);
      if (this.post) this.post.ao.enabled = cfg.ao;
      studio.setMirror(cfg.mirror);
      const shadow = studio.key.shadow;
      if (shadow.mapSize.x !== cfg.shadow) {
        shadow.mapSize.set(cfg.shadow, cfg.shadow);
        if (shadow.map) {
          shadow.map.dispose();
          shadow.map = null;
        }
      }
      this.store.set({ quality: level });
      this.resize();
    });
    this.quality.set(this.quality.level, false);

    const view = vehicle.views.find((v) => v.id === vehicle.defaultView)!;
    const [p, t] = this.framedPose(view);
    this.camera.position.copy(p);
    this.controls.target.copy(t);
    this.controls.update();
    this.renderer.setAnimationLoop(() => this.frame());
    this.store.set({ ready: true });
  }

  /** Stops rendering and releases every GPU resource and listener. */
  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.cleanup.forEach((off) => off());
    this.controls.dispose();
    this.preview?.dispose();
    this.post?.dispose();
    this.studio.dispose();
    this.highlighter.clear();
    const textures = new Set<THREE.Texture>();
    const materials = new Set<THREE.Material>(Object.values(this.materials));
    this.scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.geometry.dispose();
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m);
    });
    for (const m of materials) {
      for (const value of Object.values(m)) if (value instanceof THREE.Texture) textures.add(value);
      m.dispose();
    }
    textures.forEach((t) => t.dispose());
    this.renderer.dispose();
  }

  /** The built vehicle, for debugging and tests. */
  get model(): ViewerModel {
    return {
      root: this.root,
      parts: this.parts,
      openables: this.openables,
      explode: this.explodeOffsets,
    };
  }

  // ---------- Commands ----------

  select(id: string | null, { focus = false } = {}) {
    if (this.state.selected === id) {
      if (focus && id) this.focus(id);
      return;
    }
    const previous = this.state.selected;
    if (previous) this.highlighter.set(this.parts[previous], null);
    this.hover = null;
    if (!id) {
      this.store.set({ selected: null });
      this.preview?.clear();
      this.invalidate();
      return;
    }
    this.highlighter.set(this.parts[id], 'selected');
    this.store.set({ selected: id });
    if (this.explodeOffsets[id])
      for (const o of this.vehicle.explode.opens) if (!this.isOpen(o)) this.setOpen(o, true);
    this.showPreview(id);
    if (focus) this.focus(id);
    this.invalidate();
  }

  /** Flies the camera to frame a part. */
  focus(id: string) {
    const g = this.parts[id];
    const box = new THREE.Box3().setFromObject(g);
    if (box.isEmpty()) return;
    const c = box.getCenter(new THREE.Vector3()),
      size = box.getSize(new THREE.Vector3()).length();
    let dir = this.camera.position.clone().sub(this.controls.target).normalize();
    if (this.explodeOffsets[id]) {
      const [x, y, z] = this.vehicle.explode.focusDirection;
      dir = new THREE.Vector3(x, y, c.z >= 0 ? z : -z).normalize();
    } else if (dir.y < 0.15) {
      dir.y = 0.2;
      dir.normalize();
    }
    const dist = THREE.MathUtils.clamp(size * 2.4, 1.3, 9) * Math.max(1, 1.0 / this.camera.aspect);
    this.flyTo(c.clone().addScaledVector(dir, dist), c, 0.8);
  }

  isOpen(id: string) {
    return this.openables[id].target > 0.5;
  }

  setOpen(id: string, open: boolean) {
    const o = this.openables[id];
    if (!o) return;
    o.target = open ? 1 : 0;
    this.store.set({ open: { ...this.state.open, [id]: open } });
    this.invalidate();
  }

  setAllOpen(open: boolean) {
    for (const id in this.openables) this.setOpen(id, open);
  }

  /** The openable that carries a part (the part itself, or e.g. the door of a door glass). */
  openableOf(id: string): string | null {
    for (let o: THREE.Object3D | null = this.parts[id]; o && o !== this.root; o = o.parent) {
      const openable = this.openableByObject.get(o);
      if (openable) return openable;
    }
    return null;
  }

  setXray(on: boolean) {
    for (const [key, opacity] of Object.entries(this.vehicle.materialRoles.xray)) {
      const m = this.materials[key];
      if (on) {
        m.userData.xray = {
          transparent: m.transparent,
          opacity: m.opacity,
          depthWrite: m.depthWrite,
        };
        m.transparent = true;
        m.opacity = opacity;
        m.depthWrite = false;
      } else if (m.userData.xray) {
        Object.assign(m, m.userData.xray);
        delete m.userData.xray;
      }
      m.needsUpdate = true;
    }
    this.store.set({ xray: on });
    this.highlighter.clear();
    const { selected } = this.state;
    if (selected) {
      this.highlighter.set(this.parts[selected], 'selected');
      this.showPreview(selected);
    }
    this.invalidate();
  }

  setExploded(on: boolean) {
    this.explode.target = on ? 1 : 0;
    this.store.set({ exploded: on });
    if (on) {
      for (const o of this.vehicle.explode.opens) this.setOpen(o, true);
      const [p, t] = this.framedPose(this.vehicle.explode.view);
      this.flyTo(p, t);
    }
    this.invalidate();
  }

  setHidden(id: string, hide: boolean) {
    this.parts[id].visible = !hide;
    const hidden = new Set(this.state.hidden);
    if (hide) hidden.add(id);
    else hidden.delete(id);
    this.store.set({ hidden });
    this.shadowDirty = true;
    this.invalidate();
  }

  showAll() {
    for (const id of this.state.hidden) this.setHidden(id, false);
    if (this.state.selected) this.showPreview(this.state.selected);
  }

  goView(id: string) {
    const view = this.vehicle.views.find((v) => v.id === id);
    if (!view) return;
    for (const o of view.opens ?? []) this.setOpen(o, true);
    const [p, t] = this.framedPose(view);
    this.flyTo(p, t);
  }

  /** Fades the body paint to another colour. */
  setPaint(id: string) {
    this.paintFade = { from: this.paintFade.to, to: id, k: 0 };
    this.store.set({ paint: id });
    this.invalidate();
  }

  setLight(id: string, on: boolean) {
    this.store.set({ lights: { ...this.state.lights, [id]: on } });
    this.invalidate();
  }

  nextQuality() {
    this.quality?.next();
  }

  /**
   * Shifts the centre of the view (pixels) so the vehicle stays in the area left free by the
   * UI's panels.
   */
  setViewOffset(x: number, y: number) {
    this.viewOffset = { x, y };
    this.applyViewOffset();
  }

  /** Puts the isolated-part preview canvas into `host` (shown while mounted). */
  mountPreview(host: HTMLElement) {
    this.preview ??= new PartPreview();
    host.prepend(this.preview.canvas);
    this.previewHost = host;
    if (this.state.selected) this.showPreview(this.state.selected);
  }

  unmountPreview(host: HTMLElement) {
    if (this.previewHost !== host) return;
    this.preview?.canvas.remove();
    this.previewHost = null;
  }

  invalidate() {
    this.dirty = true;
  }

  // ---------- Internals ----------

  private paintOption(id: string) {
    return this.vehicle.paints.find((p) => p.id === id) ?? this.vehicle.paints[0];
  }

  private showPreview(id: string) {
    this.preview?.show(this.parts[id], (mesh) => this.highlighter.originalOf(mesh));
  }

  /** Camera position and target for a pose, pulled back on narrow screens. */
  private framedPose(pose: CameraPose): [THREE.Vector3, THREE.Vector3] {
    const t = v3(pose.target);
    const k = Math.max(1, pose.fit / this.camera.aspect);
    return [t.clone().add(v3(pose.position).sub(t).multiplyScalar(k)), t];
  }

  private flyTo(pos: THREE.Vector3, target: THREE.Vector3, dur = 0.9) {
    this.fly = {
      p0: this.camera.position.clone(),
      t0: this.controls.target.clone(),
      p1: pos.clone(),
      t1: target.clone(),
      t: 0,
      dur,
    };
    this.invalidate();
  }

  private resize() {
    const w = innerWidth,
      h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.post?.setSize(w, h, this.renderer.getPixelRatio());
    this.camera.aspect = w / h;
    this.applyViewOffset();
  }

  private applyViewOffset() {
    const w = innerWidth,
      h = innerHeight;
    this.camera.setViewOffset(w, h, this.viewOffset.x, this.viewOffset.y, w, h);
    this.camera.updateProjectionMatrix();
    this.invalidate();
  }

  /** The pickable part under a pointer position, if any. */
  private partAt(clientX: number, clientY: number): string | null {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - r.left) / r.width) * 2 - 1,
      -((clientY - r.top) / r.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    for (const h of this.raycaster.intersectObject(this.root, true)) {
      const o = h.object as THREE.Mesh;
      const base = this.highlighter.originalOf(o);
      if (!Array.isArray(base) && this.pickThrough.has(base)) continue;
      let id: string | null = null,
        visible = true;
      for (let p: THREE.Object3D | null = o; p && p !== this.root; p = p.parent) {
        if (!p.visible) visible = false;
        if (!id && this.partIdOf(p)) id = this.partIdOf(p);
      }
      if (!visible) continue;
      if (!id) {
        if (this.state.xray) continue;
        return null;
      }
      if (this.state.xray && this.xrayPassThrough.has(id)) continue;
      return this.pickable.has(id) ? id : null;
    }
    return null;
  }

  private partIdByObject: Map<THREE.Object3D, string> | null = null;
  private partIdOf(o: THREE.Object3D) {
    if (!this.partIdByObject)
      this.partIdByObject = new Map(Object.entries(this.parts).map(([id, p]) => [p, id]));
    return this.partIdByObject.get(o) ?? null;
  }

  private listen() {
    const { canvas } = this;
    const on = <K extends keyof HTMLElementEventMap>(
      target: HTMLElement | Window,
      type: K,
      handler: (e: HTMLElementEventMap[K]) => void,
    ) => {
      target.addEventListener(type, handler as EventListener);
      this.cleanup.push(() => target.removeEventListener(type, handler as EventListener));
    };
    const invalidate = () => this.invalidate();
    this.controls.addEventListener('change', invalidate);
    this.cleanup.push(() => this.controls.removeEventListener('change', invalidate));

    on(canvas, 'pointerdown', (e) => {
      this.pointerDown = { x: e.clientX, y: e.clientY };
      this.fly = null; // the user takes over the camera
    });
    on(canvas, 'pointerup', (e) => {
      if (!this.pointerDown) return;
      const moved = Math.hypot(e.clientX - this.pointerDown.x, e.clientY - this.pointerDown.y);
      this.pointerDown = null;
      if (moved > 6) return;
      this.select(this.partAt(e.clientX, e.clientY));
    });
    on(canvas, 'dblclick', (e) => {
      const id = this.partAt(e.clientX, e.clientY);
      if (!id) return;
      const op = this.openableOf(id);
      if (op) this.setOpen(op, !this.isOpen(op));
    });
    on(canvas, 'pointermove', (e) => {
      if (e.pointerType !== 'mouse' || e.buttons) {
        this.events.emit('hover', null);
        return;
      }
      const id = this.partAt(e.clientX, e.clientY);
      const { selected } = this.state;
      if (id !== this.hover) {
        if (this.hover && this.hover !== selected) {
          this.highlighter.set(this.parts[this.hover], null);
          this.invalidate();
        }
        this.hover = id;
        if (id && id !== selected) {
          this.highlighter.set(this.parts[id], 'hovered');
          this.invalidate();
        }
        canvas.style.cursor = id ? 'pointer' : 'grab';
      }
      this.events.emit('hover', id ? { id, x: e.clientX, y: e.clientY } : null);
    });
    on(canvas, 'pointerleave', () => this.events.emit('hover', null));
    on(window, 'resize', () => this.resize());
  }

  private frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    let anim = false;
    for (const o of Object.values(this.openables)) {
      if (Math.abs(o.cur - o.target) > 1e-4) {
        o.cur += Math.sign(o.target - o.cur) * Math.min(Math.abs(o.target - o.cur), dt / 0.9);
        o.object.rotation[o.axis] = o.angle * ease(o.cur);
        anim = true;
        this.shadowDirty = true;
      }
    }
    const ex = this.explode;
    if (Math.abs(ex.value - ex.target) > 1e-4) {
      ex.value +=
        Math.sign(ex.target - ex.value) * Math.min(Math.abs(ex.target - ex.value), dt / 1.1);
      const f = ease(ex.value);
      for (const [id, offset] of Object.entries(this.explodeOffsets))
        this.parts[id].position.copy(offset).multiplyScalar(f);
      anim = true;
      this.shadowDirty = true;
    }
    const pf = this.paintFade;
    if (pf.k < 1 && this.paint && this.paintMaterial) {
      pf.k = Math.min(1, pf.k + dt / 0.5);
      this.paint.apply(this.paintOption(pf.from), this.paintOption(pf.to), ease(pf.k));
      this.highlighter.sync(this.paintMaterial);
      if (pf.k >= 1 && this.state.selected) this.showPreview(this.state.selected);
      anim = true;
    }
    const fly = this.fly;
    if (fly) {
      fly.t = Math.min(1, fly.t + dt / fly.dur);
      const k = ease(fly.t);
      this.camera.position.lerpVectors(fly.p0, fly.p1, k);
      this.controls.target.lerpVectors(fly.t0, fly.t1, k);
      if (fly.t >= 1) this.fly = null;
      anim = true;
    }
    const lights = this.lights!;
    if (lights.animating(this.state.lights)) anim = true;
    this.controls.update();
    if (this.dirty || anim) {
      lights.apply(this.state.lights, this.clock.elapsedTime, dt);
      if (this.shadowDirty) {
        this.studio.updateContactShadow();
        this.shadowDirty = false;
      }
      this.vehicle.spotlights.forEach((s, i) => {
        const o = this.openables[s.followsOpenable];
        this.studio.spots[i].intensity = s.intensity * ease(o ? o.cur : 0);
      });
      if (this.quality!.cfg.post && this.post) this.post.render();
      else this.renderer.render(this.scene, this.camera);
      this.dirty = false;
      if (anim) this.quality!.tick(dt);
    }
    if (this.previewHost && this.preview?.hasObject) this.preview.render();
  }
}
