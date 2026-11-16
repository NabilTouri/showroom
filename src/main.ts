import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStudio, makeEnvironment } from './scene/studio.js';
import { createPost } from './scene/post.js';
import { createQuality } from './scene/quality.js';
import { buildBody } from './car/body.js';
import { buildWheels } from './car/wheels.js';
import { buildMechanics } from './car/engine.js';
import { buildInterior } from './car/interior.js';
import { L } from './car/surface.js';
import { M, COLORS, applyPaint } from './car/materials.js';
import { createLights, LIGHT_LABEL } from './car/lights.js';
import { CATEGORIES, VEHICLE, getPart, type PartInfo } from './data/parts.js';
import type { Car, OpenState } from './car/car.js';
import type { Post } from './scene/post.js';
import type { LightId } from './car/lights.js';

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const canvas = $<HTMLCanvasElement>('#view');

// ---------- Renderer / scena ----------
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

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(24, 1, 0.05, 80);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.5;
controls.maxDistance = 16;
controls.maxPolarAngle = Math.PI * 0.495;
controls.target.set(0, 0.6, 0);
const studio = createStudio(renderer, scene);
let post: Post | null = null;
let shadowDirty = true;

// ---------- Auto ----------
const car: Car = { root: new THREE.Group(), parts: {}, openables: {} };
car.root.position.x = -L / 2;
scene.add(car.root);
await buildBody(car);
buildWheels(car);
buildInterior(car);
buildMechanics(car);
car.root.traverse((o) => {
  if (o instanceof THREE.Mesh) o.receiveShadow = !o.material.transparent;
});
car.root.updateMatrixWorld(true);
const lights = createLights(car);

const info: Record<string, PartInfo> = {}; // id scena -> scheda
for (const id in car.parts) {
  const p = getPart(id);
  if (p) info[id] = p;
}
const BODY_CATS = new Set(['Carrozzeria', 'Luci e vetri']);
const OPEN_LABEL: Record<string, string> = {
  cofano: 'Cofano',
  porta_ant_sx: 'Porta ant. sinistra',
  porta_ant_dx: 'Porta ant. destra',
  porta_post_sx: 'Porta post. sinistra',
  porta_post_dx: 'Porta post. destra',
  portellone: 'Portellone',
};

// ---------- Stato ----------
const state = {
  selected: null as string | null,
  hover: null as string | null,
  xray: false,
  explode: 0,
  explodeTarget: 0,
  hidden: new Set<string>(),
};
let dirty = true;
const invalidate = () => {
  dirty = true;
};
controls.addEventListener('change', invalidate);

// ---------- Evidenziazione (materiali clonati con emissione) ----------
type HighlightMode = 'sel' | 'hov';
type AnyMaterial = THREE.Material & {
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  emissiveMap?: THREE.Texture | null;
  color?: THREE.Color;
  metalness?: number;
  roughness?: number;
};
const hlCache = new Map<string, AnyMaterial>();
const origMat = new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>();
function hlMat(mat: AnyMaterial, mode: HighlightMode) {
  const key = mat.uuid + mode;
  let m = hlCache.get(key);
  if (!m) {
    m = mat.clone() as AnyMaterial;
    m.onBeforeCompile = mat.onBeforeCompile;
    m.customProgramCacheKey = mat.customProgramCacheKey;
    if (m.emissive) {
      m.emissive = new THREE.Color(mode === 'sel' ? 0x2f7dff : 0xffffff);
      m.emissiveIntensity = mode === 'sel' ? 0.55 : 0.16;
      m.emissiveMap = null;
    }
    if (mode === 'sel' && m.transparent && m.opacity < 0.3) m.opacity = 0.5;
    hlCache.set(key, m);
  }
  return m;
}
function setHighlight(id: string, mode: HighlightMode | null) {
  const g = car.parts[id];
  if (!g) return;
  g.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    if (!origMat.has(o)) origMat.set(o, o.material);
    const base = origMat.get(o)!;
    o.material = mode
      ? Array.isArray(base)
        ? base.map((b) => hlMat(b, mode))
        : hlMat(base, mode)
      : base;
  });
  invalidate();
}
function refreshHighlights() {
  hlCache.forEach((m) => m.dispose());
  hlCache.clear();
  if (state.selected) setHighlight(state.selected, 'sel');
}

// ---------- Aperture ----------
const openState = (o: THREE.Object3D): OpenState => o.userData.open;
function setOpen(id: string, open: boolean) {
  const o = car.openables[id];
  if (!o) return;
  o.userData.open.target = open ? 1 : 0;
  syncOpenUI();
  invalidate();
}
const isOpen = (id: string) => openState(car.openables[id]).target > 0.5;
function openableOf(id: string): string | null {
  let o: THREE.Object3D | null = car.parts[id];
  while (o && o !== car.root) {
    if (o.userData.open) return o.userData.partId;
    o = o.parent;
  }
  return null;
}

// ---------- Raggi X ----------
const XR_MATS: THREE.Material[] = [M.paint, M.inner, M.trim, M.gloss, M.floor];
function setXray(on: boolean) {
  state.xray = on;
  for (const m of XR_MATS) {
    if (on) {
      m.userData.xr = { transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite };
      m.transparent = true;
      m.opacity = m === M.paint ? 0.16 : 0.1;
      m.depthWrite = false;
    } else if (m.userData.xr) {
      Object.assign(m, m.userData.xr);
      delete m.userData.xr;
    }
    m.needsUpdate = true;
  }
  $('#btn-xray').classList.toggle('on', on);
  refreshHighlights();
  if (state.selected) showPreview(state.selected);
  invalidate();
}

// ---------- Camera ----------
let fly: {
  p0: THREE.Vector3;
  t0: THREE.Vector3;
  p1: THREE.Vector3;
  t1: THREE.Vector3;
  t: number;
  dur: number;
} | null = null;
const fit = () => Math.max(1, 1.45 / camera.aspect);
function flyTo(pos: THREE.Vector3, target: THREE.Vector3, dur = 0.9) {
  fly = {
    p0: camera.position.clone(),
    t0: controls.target.clone(),
    p1: pos.clone(),
    t1: target.clone(),
    t: 0,
    dur,
  };
  invalidate();
}
type Vec3 = [number, number, number];
const VIEWS: Record<string, [Vec3, Vec3]> = {
  '3/4': [
    [-5.6, 2.1, 5.6],
    [0, 0.62, 0],
  ],
  Lato: [
    [0, 0.95, 10],
    [0, 0.65, 0],
  ],
  Fronte: [
    [-9.5, 1.0, 0.01],
    [0, 0.65, 0],
  ],
  Retro: [
    [6, 2.0, -5.2],
    [0, 0.62, 0],
  ],
  Alto: [
    [0.01, 11.5, 0],
    [0, 0.5, 0],
  ],
  Motore: [
    [-3.9, 2.5, 1.7],
    [-1.32, 0.62, 0],
  ],
  Interni: [
    [0.6, 1.55, 3.4],
    [0.1, 0.85, 0],
  ],
};
const EXPLODE_VIEW: [Vec3, Vec3] = [
  [-6.6, 4.4, 3.6],
  [-1.3, 0.95, 0],
];
function goView(name: string) {
  const [p, t] = VIEWS[name];
  const T = new THREE.Vector3(...t),
    P = new THREE.Vector3(...p);
  if (name === 'Motore') setOpen('cofano', true);
  if (name === 'Interni') {
    setOpen('porta_ant_sx', true);
    setOpen('porta_post_sx', true);
  }
  const k = name === 'Motore' || name === 'Interni' ? Math.max(1, 1.1 / camera.aspect) : fit();
  flyTo(T.clone().add(P.sub(T).multiplyScalar(k)), T);
}
function focusPart(id: string) {
  const g = car.parts[id];
  const box = new THREE.Box3().setFromObject(g);
  if (box.isEmpty()) return;
  const c = box.getCenter(new THREE.Vector3()),
    size = box.getSize(new THREE.Vector3()).length();
  let dir = camera.position.clone().sub(controls.target).normalize();
  if (g.userData.explode) dir = new THREE.Vector3(-0.62, 0.68, c.z >= 0 ? 0.4 : -0.4).normalize();
  else if (dir.y < 0.15) {
    dir.y = 0.2;
    dir.normalize();
  }
  const dist = THREE.MathUtils.clamp(size * 2.4, 1.3, 9) * Math.max(1, 1.0 / camera.aspect);
  flyTo(c.clone().addScaledVector(dir, dist), c, 0.8);
}

// ---------- Selezione ----------
function select(id: string | null, { focus = false } = {}) {
  if (state.selected === id) {
    if (focus && id) focusPart(id);
    return;
  }
  if (state.selected) setHighlight(state.selected, null);
  state.selected = id;
  state.hover = null;
  document.querySelectorAll('.item.sel').forEach((e) => e.classList.remove('sel'));
  if (!id) {
    $('#panel').hidden = true;
    stopPreview();
    invalidate();
    return;
  }
  setHighlight(id, 'sel');
  const it = document.querySelector<HTMLElement>(`.item[data-id="${id}"]`);
  if (it) {
    it.classList.add('sel');
    const d = it.closest('details');
    if (d) d.open = true;
    it.scrollIntoView({ block: 'nearest' });
  }
  if (car.parts[id].userData.explode && !isOpen('cofano')) setOpen('cofano', true);
  renderPanel(id);
  if (focus) focusPart(id);
}

function partAt(ev: MouseEvent): string | null {
  const r = canvas.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((ev.clientX - r.left) / r.width) * 2 - 1,
    -((ev.clientY - r.top) / r.height) * 2 + 1,
  );
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObject(car.root, true);
  for (const h of hits) {
    const o = h.object as THREE.Mesh;
    const base = origMat.get(o) || o.material;
    if (base === M.glass || base === M.lens) continue;
    // visibilita' e id
    let id: string | null = null,
      vis = true;
    for (let p: THREE.Object3D | null = o; p && p !== car.root; p = p.parent) {
      if (!p.visible) vis = false;
      if (!id && p.userData.partId) id = p.userData.partId;
    }
    if (!vis) continue;
    if (!id) {
      if (state.xray) continue;
      return null;
    }
    if (state.xray && info[id] && BODY_CATS.has(info[id].cat) && !isOpenPanelHit()) continue;
    return info[id] ? id : null;
  }
  return null;
}
const isOpenPanelHit = () => false;
const ray = new THREE.Raycaster();

let down: { x: number; y: number; t: number } | null = null;
canvas.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY, t: performance.now() };
});
canvas.addEventListener('pointerup', (e) => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  down = null;
  if (moved > 6) return;
  const id = partAt(e);
  select(id);
});
canvas.addEventListener('dblclick', (e) => {
  const id = partAt(e);
  if (!id) return;
  const op = openableOf(id);
  if (op) setOpen(op, !isOpen(op));
});
const tip = $('#tip');
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || e.buttons) {
    tip.hidden = true;
    return;
  }
  const id = partAt(e);
  if (id !== state.hover) {
    if (state.hover && state.hover !== state.selected) setHighlight(state.hover, null);
    state.hover = id;
    if (id && id !== state.selected) setHighlight(id, 'hov');
    canvas.style.cursor = id ? 'pointer' : 'grab';
  }
  if (id) {
    tip.hidden = false;
    tip.textContent = info[id].name;
    tip.style.left = e.clientX + 'px';
    tip.style.top = e.clientY + 'px';
  } else tip.hidden = true;
});
canvas.addEventListener('pointerleave', () => {
  tip.hidden = true;
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') select(null);
});

// ---------- Anteprima del pezzo isolato ----------
interface Preview {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  obj: THREE.Group | null;
  mats: THREE.Material[];
  host: HTMLElement;
}
let pv: Preview | null = null;
function ensurePreview(cv: HTMLCanvasElement) {
  if (pv) {
    pv.host = cv.parentElement!;
    pv.host.prepend(pv.renderer.domElement);
    cv.remove();
    return;
  }
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.toneMapping = THREE.ACESFilmicToneMapping;
  const s = new THREE.Scene();
  s.environment = makeEnvironment(r);
  const l = new THREE.DirectionalLight(0xffffff, 1.4);
  l.position.set(2, 4, 3);
  s.add(l);
  const c = new THREE.PerspectiveCamera(28, 1, 0.01, 50);
  const ct = new OrbitControls(c, cv);
  ct.enablePan = false;
  ct.autoRotate = true;
  ct.autoRotateSpeed = 2.2;
  ct.enableDamping = true;
  pv = {
    renderer: r,
    scene: s,
    camera: c,
    controls: ct,
    obj: null,
    mats: [],
    host: cv.parentElement!,
  };
}
function stopPreview() {
  if (pv && pv.obj) {
    pv.scene.remove(pv.obj);
    pv.mats.forEach((m) => m.dispose());
    pv.obj = null;
    pv.mats = [];
  }
}
function showPreview(id: string) {
  if (!pv) return;
  const p = pv;
  stopPreview();
  const src = car.parts[id];
  src.updateWorldMatrix(true, true);
  const wasSel = state.selected === id;
  if (wasSel) setHighlight(id, null);
  const obj = src.clone(true);
  if (wasSel) setHighlight(id, 'sel');
  src.matrixWorld.decompose(obj.position, obj.quaternion, obj.scale);
  const map = new Map<THREE.Material, THREE.Material>();
  const conv = (m: THREE.Material) => {
    let c = map.get(m);
    if (c) return c;
    c = m.clone();
    c.onBeforeCompile = m.onBeforeCompile;
    c.customProgramCacheKey = m.customProgramCacheKey;
    if (m.userData.xr) Object.assign(c, m.userData.xr);
    map.set(m, c);
    p.mats.push(c);
    return c;
  };
  obj.traverse((o) => {
    o.visible = true;
    if (o instanceof THREE.Mesh) {
      const b = o.material;
      o.material = Array.isArray(b) ? b.map(conv) : conv(b);
    }
  });
  const wrap = new THREE.Group();
  wrap.add(obj);
  const box = new THREE.Box3().setFromObject(wrap),
    c = box.getCenter(new THREE.Vector3()),
    rad = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 0.03);
  obj.position.sub(c);
  p.scene.add(wrap);
  p.obj = wrap;
  const d = (rad / Math.sin((p.camera.fov * Math.PI) / 360)) * 1.1;
  p.camera.position.set(-d * 0.62, d * 0.42, d * 0.66);
  p.camera.near = d / 50;
  p.camera.far = d * 10;
  p.camera.updateProjectionMatrix();
  p.controls.target.set(0, 0, 0);
  p.controls.minDistance = d * 0.35;
  p.controls.maxDistance = d * 3;
  p.controls.update();
}
function sizePreview() {
  if (!pv) return;
  const el = pv.renderer.domElement,
    w = el.clientWidth,
    h = el.clientHeight;
  if (!w || !h) return;
  const pr = pv.renderer.getPixelRatio();
  if (el.width !== Math.round(w * pr) || el.height !== Math.round(h * pr)) {
    pv.renderer.setSize(w, h, false);
    pv.camera.aspect = w / h;
    pv.camera.updateProjectionMatrix();
  }
}

// ---------- Pannello dettagli ----------
const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
const esc = (s: unknown) => String(s).replace(/[&<>]/g, (c) => ESC[c]);
function renderPanel(id: string) {
  const p = info[id],
    body = $('#panel-body'),
    op = openableOf(id);
  let h = `<div class="pv"><canvas></canvas><span>Pezzo isolato · trascina per ruotare</span></div><div class="pb">`;
  h += `<span class="chip">${esc(p.cat)}</span><h2>${esc(p.name)}</h2>`;
  h += `<div class="acts">`;
  if (op)
    h += `<button data-act="open">${isOpen(op) ? 'Chiudi' : 'Apri'} ${esc((OPEN_LABEL[op] || '').toLowerCase())}</button>`;
  h += `<button data-act="focus">Inquadra</button><button data-act="hide">${state.hidden.has(id) ? 'Mostra' : 'Nascondi'}</button></div>`;
  if (p.where) h += `<h3>Dove si trova</h3><p class="where">${esc(p.where)}</p>`;
  h += `<h3>Cos'è e a cosa serve</h3><p>${esc(p.desc)}</p>`;
  if (p.specs)
    h += `<h3>Dati tecnici</h3><table class="sp">${p.specs.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>`;
  if (p.maint)
    h += `<h3>Manutenzione</h3><ul>${p.maint.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  if (p.faults)
    h += `<h3>Guasti e sintomi tipici</h3><ul class="faults">${p.faults.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  if (p.oem)
    h += `<h3>Ricambi e codici OEM Renault</h3>${p.oem.map(([n, c, v]) => `<div class="oem"><span>${esc(n)}${v && c !== '—' ? '<span class="badge">da verificare</span>' : ''}</span><code>${esc(c)}</code></div>`).join('')}`;
  h += `<p class="note">Dati indicativi a scopo didattico per Clio IV 1.5 dCi 75 (K9K 612/628). Intervalli, quantità e codici ricambio cambiano con anno e versione: verifica sempre con libretto o numero di telaio.</p></div>`;
  body.innerHTML = h;
  body.scrollTop = 0;
  $('#panel').hidden = false;
  ensurePreview(body.querySelector<HTMLCanvasElement>('.pv canvas')!);
  showPreview(id);
  sizePreview();
  body.querySelector<HTMLElement>('.acts')!.onclick = (e) => {
    const target = e.target as HTMLElement;
    const a = target.dataset.act;
    if (!a) return;
    if (a === 'open' && op) {
      setOpen(op, !isOpen(op));
      target.textContent = `${isOpen(op) ? 'Chiudi' : 'Apri'} ${(OPEN_LABEL[op] || '').toLowerCase()}`;
    }
    if (a === 'focus') focusPart(id);
    if (a === 'hide') {
      setHidden(id, !state.hidden.has(id));
      target.textContent = state.hidden.has(id) ? 'Mostra' : 'Nascondi';
    }
  };
}
function renderVehicle() {
  select(null);
  const body = $('#panel-body');
  body.innerHTML = `<div class="pb" style="padding-top:18px"><span class="chip">Scheda auto</span><h2>${esc(VEHICLE.name)}</h2><p>Quarta generazione della Clio (2012–2019), modello 2016 con il turbodiesel 1.5 dCi da 75 CV. Clicca un componente nel modello o nell'elenco per vederne funzione, dati, manutenzione e ricambi.</p><h3>Dati tecnici</h3><table class="sp">${VEHICLE.specs.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table><p class="note">Valori indicativi: possono variare secondo allestimento, omologazione e anno di produzione.</p><p class="note">Modello 3D della carrozzeria: «Renault Clio MK4 2012-2020» di <a href="https://sketchfab.com/3d-models/renault-clio-mk4-2012-2020-70a12bd8056647c7a4226f6fa7171c15" target="_blank" rel="noopener">Merc_TV su Sketchfab</a>, licenza <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Vano motore, meccanica e ruote sono ricostruzioni aggiunte.</p></div>`;
  $('#panel').hidden = false;
}
$('#panel-close').onclick = () => {
  select(null);
  $('#panel').hidden = true;
};
$('#btn-vehicle').onclick = () => {
  renderVehicle();
  $('#list').classList.remove('open');
};

function setHidden(id: string, hide: boolean) {
  car.parts[id].visible = !hide;
  if (hide) state.hidden.add(id);
  else state.hidden.delete(id);
  const it = document.querySelector(`.item[data-id="${id}"]`);
  if (it) it.classList.toggle('hid', hide);
  $('#btn-showall').hidden = state.hidden.size === 0;
  shadowDirty = true;
  invalidate();
}
$('#btn-showall').onclick = () => {
  [...state.hidden].forEach((id) => setHidden(id, false));
  if (state.selected) renderPanel(state.selected);
};

// ---------- Barra strumenti ----------
for (const name of Object.keys(VIEWS)) {
  const b = document.createElement('button');
  b.textContent = name;
  b.onclick = () => goView(name);
  $('#views').append(b);
}
for (const id in OPEN_LABEL) {
  const l = document.createElement('label');
  l.innerHTML = `<span>${OPEN_LABEL[id]}</span><input type="checkbox" data-id="${id}">`;
  l.querySelector('input')!.onchange = (e) => setOpen(id, (e.target as HTMLInputElement).checked);
  $('#openables').append(l);
}
function syncOpenUI() {
  let all = true;
  document.querySelectorAll<HTMLInputElement>('#openables input').forEach((i) => {
    i.checked = isOpen(i.dataset.id!);
    if (!i.checked) all = false;
  });
  $('#btn-openall').textContent = all ? 'Chiudi tutto' : 'Apri tutto';
  $('#btn-openall').dataset.all = all ? '1' : '';
}
$('#btn-openall').onclick = () => {
  const open = !$('#btn-openall').dataset.all;
  for (const id in car.openables) setOpen(id, open);
};
for (const b of [$('#btn-openmenu'), $('#btn-lightmenu'), $('#btn-colormenu')])
  b.onclick = (e) => {
    e.stopPropagation();
    const m = b.parentElement!,
      was = m.classList.contains('open');
    document.querySelectorAll('.menu.open').forEach((x) => x.classList.remove('open'));
    m.classList.toggle('open', !was);
  };
for (const id of Object.keys(LIGHT_LABEL) as LightId[]) {
  const l = document.createElement('label');
  l.innerHTML = `<span>${LIGHT_LABEL[id]}</span><input type="checkbox" ${lights.state[id] ? 'checked' : ''}>`;
  l.querySelector('input')!.onchange = (e) => {
    lights.state[id] = (e.target as HTMLInputElement).checked;
    invalidate();
  };
  $('#lights').append(l);
}
addEventListener('pointerdown', (e) => {
  if (!(e.target as Element).closest('.menu'))
    document.querySelectorAll('.menu.open').forEach((m) => m.classList.remove('open'));
});
$('#btn-xray').onclick = () => setXray(!state.xray);
$('#btn-explode').onclick = () => {
  state.explodeTarget = state.explodeTarget ? 0 : 1;
  $('#btn-explode').classList.toggle('on', !!state.explodeTarget);
  if (state.explodeTarget) {
    setOpen('cofano', true);
    const k = Math.max(1, 1.1 / camera.aspect),
      T = new THREE.Vector3(...EXPLODE_VIEW[1]);
    flyTo(T.clone().add(new THREE.Vector3(...EXPLODE_VIEW[0]).sub(T).multiplyScalar(k)), T);
  }
  invalidate();
};
const paintState = { from: 'Rosso Flamme', to: 'Rosso Flamme', k: 1 };
applyPaint(paintState.from, paintState.to, 1);
Object.entries(COLORS).forEach(([name, c], i) => {
  const b = document.createElement('button');
  b.className = 'cl' + (i === 0 ? ' on' : '');
  b.innerHTML = `<i style="background:#${c.hex.toString(16).padStart(6, '0')}"></i><span>${name}</span><small>${c.tipo}</small>`;
  b.onclick = () => {
    paintState.from = paintState.to;
    paintState.to = name;
    paintState.k = 0;
    document.querySelectorAll('.cl').forEach((s) => s.classList.toggle('on', s === b));
    invalidate();
  };
  $('#colors').append(b);
});
$('#btn-list').onclick = () => $('#list').classList.toggle('open');

// ---------- Elenco componenti ----------
{
  const byCat: Record<string, string[]> = {};
  for (const id in info) (byCat[info[id].cat] ||= []).push(id);
  const cats = $('#cats');
  for (const c of CATEGORIES) {
    if (!byCat[c]) continue;
    const d = document.createElement('details');
    if (c === 'Motore') d.open = true;
    d.innerHTML = `<summary>${c} <span style="margin-left:auto;margin-right:8px;opacity:.6">${byCat[c].length}</span></summary>`;
    byCat[c].sort((a, b) => info[a].name.localeCompare(info[b].name, 'it'));
    for (const id of byCat[c]) {
      const b = document.createElement('button');
      b.className = 'item';
      b.dataset.id = id;
      b.textContent = info[id].name;
      d.append(b);
    }
    cats.append(d);
  }
  cats.onclick = (e) => {
    const b = (e.target as Element).closest<HTMLElement>('.item');
    if (!b) return;
    select(b.dataset.id!, { focus: true });
    $('#list').classList.remove('open');
  };
  $('#search').oninput = (e) => {
    const q = (e.target as HTMLInputElement).value.trim().toLowerCase();
    cats.querySelectorAll('details').forEach((d) => {
      let n = 0;
      d.querySelectorAll<HTMLElement>('.item').forEach((b) => {
        const ok =
          !q ||
          b.textContent!.toLowerCase().includes(q) ||
          (info[b.dataset.id!].desc || '').toLowerCase().includes(q);
        b.style.display = ok ? '' : 'none';
        if (ok) n++;
      });
      d.style.display = n ? '' : 'none';
      if (q) d.open = n > 0;
    });
  };
}

// ---------- Ciclo ----------
function resize() {
  const w = innerWidth,
    h = innerHeight;
  renderer.setSize(w, h, false);
  if (post) post.setSize(w, h, renderer.getPixelRatio());
  camera.aspect = w / h;
  viewOffset();
}
// sposta il centro della vista nell'area libera dai pannelli
function viewOffset() {
  const w = innerWidth,
    h = innerHeight,
    open = !$('#panel').hidden;
  let ox = 0,
    oy = 0;
  if (w <= 900) oy = open ? h * 0.24 : 0;
  else ox = (open ? 192 : 0) - 135;
  camera.setViewOffset(w, h, ox, oy, w, h);
  camera.updateProjectionMatrix();
  invalidate();
}
new MutationObserver(viewOffset).observe($('#panel'), {
  attributes: true,
  attributeFilter: ['hidden'],
});
// ---------- Qualita' ----------
const quality = createQuality(renderer, (cfg, name) => {
  renderer.setPixelRatio(Math.min(devicePixelRatio, cfg.pixelRatio));
  if (cfg.post && !post) post = createPost(renderer, scene, camera);
  if (post) post.ao.enabled = cfg.ao;
  studio.setMirror(cfg.mirror);
  if (studio.key.shadow.mapSize.x !== cfg.shadow) {
    studio.key.shadow.mapSize.set(cfg.shadow, cfg.shadow);
    if (studio.key.shadow.map) {
      studio.key.shadow.map.dispose();
      studio.key.shadow.map = null;
    }
  }
  $('#btn-quality').textContent = 'Qualità: ' + cfg.label;
  $('#btn-quality').dataset.level = name;
  resize();
});
$('#btn-quality').onclick = () => quality.next();
addEventListener('resize', resize);
quality.set(quality.level, false);
{
  const [p, t] = VIEWS['3/4'];
  const T = new THREE.Vector3(...t);
  camera.position.copy(T).add(new THREE.Vector3(...p).sub(T).multiplyScalar(fit()));
  controls.target.copy(T);
  controls.update();
}
syncOpenUI();

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  let anim = false;
  for (const id in car.openables) {
    const o = car.openables[id],
      s = openState(o);
    if (Math.abs(s.cur - s.target) > 1e-4) {
      s.cur += Math.sign(s.target - s.cur) * Math.min(Math.abs(s.target - s.cur), dt / 0.9);
      o.rotation[s.axis] = s.angle * ease(s.cur);
      anim = true;
      shadowDirty = true;
    }
  }
  if (Math.abs(state.explode - state.explodeTarget) > 1e-4) {
    state.explode +=
      Math.sign(state.explodeTarget - state.explode) *
      Math.min(Math.abs(state.explodeTarget - state.explode), dt / 1.1);
    const f = ease(state.explode);
    for (const id in car.parts) {
      const p = car.parts[id];
      if (p.userData.explodeVec) p.position.copy(p.userData.explodeVec).multiplyScalar(f);
    }
    anim = true;
    shadowDirty = true;
  }
  if (paintState.k < 1) {
    paintState.k = Math.min(1, paintState.k + dt / 0.5);
    applyPaint(paintState.from, paintState.to, ease(paintState.k));
    hlCache.forEach((m, key) => {
      if (key.startsWith(M.paint.uuid)) {
        m.color!.copy(M.paint.color);
        m.metalness = M.paint.metalness;
        m.roughness = M.paint.roughness;
      }
    });
    if (paintState.k >= 1 && state.selected) showPreview(state.selected);
    anim = true;
  }
  if (fly) {
    fly.t = Math.min(1, fly.t + dt / fly.dur);
    const k = ease(fly.t);
    camera.position.lerpVectors(fly.p0, fly.p1, k);
    controls.target.lerpVectors(fly.t0, fly.t1, k);
    if (fly.t >= 1) fly = null;
    anim = true;
  }
  if (lights.animating) anim = true;
  controls.update();
  if (dirty || anim) {
    lights.apply(clock.elapsedTime, dt);
    if (shadowDirty) {
      studio.updateContactShadow();
      shadowDirty = false;
    }
    studio.bay.intensity = 9 * ease(openState(car.openables.cofano).cur);
    if (quality.cfg.post && post) post.render();
    else renderer.render(scene, camera);
    dirty = false;
    if (anim) quality.tick(dt);
  }
  if (pv && pv.obj && !$('#panel').hidden) {
    sizePreview();
    pv.controls.update();
    pv.renderer.render(pv.scene, pv.camera);
  }
});
canvas.addEventListener('pointerdown', () => {
  fly = null;
});

$('#loading').classList.add('done');
declare global {
  interface Window {
    __app: unknown;
  }
}
window.__app = {
  lights,
  camera,
  controls,
  car,
  THREE,
  select,
  setOpen,
  setXray,
  goView,
  state,
  invalidate,
  info,
  quality,
  studio,
  scene,
  renderer,
};
