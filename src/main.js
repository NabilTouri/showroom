import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildBody } from './car/body.js';
import { buildWheels } from './car/wheels.js';
import { buildMechanics } from './car/engine.js';
import { buildInterior } from './car/interior.js';
import { L } from './car/surface.js';
import { M, COLORS } from './car/materials.js';
import { CATEGORIES, VEHICLE, getPart } from './data/parts.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#view');

// ---------- Renderer / scena ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const envTex = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture;
scene.environment = envTex;
const camera = new THREE.PerspectiveCamera(24, 1, 0.05, 80);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.minDistance = 0.5; controls.maxDistance = 22; controls.maxPolarAngle = Math.PI * 0.53;
controls.target.set(0, 0.6, 0);

const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(-3.5, 7, 4.5); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 6;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x30343a, 0.35));

// pavimento: alone radiale + ombra
{
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d'), gr = g.createRadialGradient(256, 256, 30, 256, 256, 256);
  gr.addColorStop(0, 'rgba(120,130,145,0.55)'); gr.addColorStop(0.55, 'rgba(70,78,90,0.25)'); gr.addColorStop(1, 'rgba(40,44,52,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const fl = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  fl.rotation.x = -Math.PI / 2; fl.position.y = -0.002; scene.add(fl);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.ShadowMaterial({ opacity: 0.5 }));
  sh.rotation.x = -Math.PI / 2; sh.receiveShadow = true; scene.add(sh);
}

// ---------- Auto ----------
const car = { root: new THREE.Group(), parts: {}, openables: {} };
car.root.position.x = -L / 2;
scene.add(car.root);
await buildBody(car); buildWheels(car); buildInterior(car); buildMechanics(car);
car.root.traverse((o) => { if (o.isMesh) { o.receiveShadow = false; } });
car.root.updateMatrixWorld(true);

const info = {};           // id scena -> scheda
for (const id in car.parts) { const p = getPart(id); if (p) info[id] = p; }
const BODY_CATS = new Set(['Carrozzeria', 'Luci e vetri']);
const OPEN_LABEL = { cofano: 'Cofano', porta_ant_sx: 'Porta ant. sinistra', porta_ant_dx: 'Porta ant. destra', porta_post_sx: 'Porta post. sinistra', porta_post_dx: 'Porta post. destra', portellone: 'Portellone' };

// ---------- Stato ----------
const state = { selected: null, hover: null, xray: false, explode: 0, explodeTarget: 0, hidden: new Set() };
let dirty = true;
const invalidate = () => { dirty = true; };
controls.addEventListener('change', invalidate);

// ---------- Evidenziazione (materiali clonati con emissione) ----------
const hlCache = new Map();
const origMat = new WeakMap();
function hlMat(mat, mode) {
  const key = mat.uuid + mode; let m = hlCache.get(key);
  if (!m) {
    m = mat.clone(); m.onBeforeCompile = mat.onBeforeCompile; m.customProgramCacheKey = mat.customProgramCacheKey;
    if (m.emissive) {
      m.emissive = new THREE.Color(mode === 'sel' ? 0x2f7dff : 0xffffff);
      m.emissiveIntensity = mode === 'sel' ? 0.55 : 0.16; m.emissiveMap = null;
    }
    if (mode === 'sel' && m.transparent && m.opacity < 0.3) m.opacity = 0.5;
    hlCache.set(key, m);
  }
  return m;
}
function setHighlight(id, mode) {
  const g = car.parts[id]; if (!g) return;
  g.traverse((o) => {
    if (!o.isMesh) return;
    if (!origMat.has(o)) origMat.set(o, o.material);
    const base = origMat.get(o);
    o.material = mode ? (Array.isArray(base) ? base.map((b) => hlMat(b, mode)) : hlMat(base, mode)) : base;
  });
  invalidate();
}
function refreshHighlights() {
  hlCache.forEach((m) => m.dispose()); hlCache.clear();
  if (state.selected) setHighlight(state.selected, 'sel');
}

// ---------- Aperture ----------
function setOpen(id, open) { const o = car.openables[id]; if (!o) return; o.userData.open.target = open ? 1 : 0; syncOpenUI(); invalidate(); }
const isOpen = (id) => car.openables[id].userData.open.target > 0.5;
function openableOf(id) {
  let o = car.parts[id];
  while (o && o !== car.root) { if (o.userData.open) return o.userData.partId; o = o.parent; }
  return null;
}

// ---------- Raggi X ----------
const XR_MATS = [M.paint, M.inner, M.trim, M.gloss, M.floor];
function setXray(on) {
  state.xray = on;
  for (const m of XR_MATS) {
    if (on) { m.userData.xr = { transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite }; m.transparent = true; m.opacity = m === M.paint ? 0.16 : 0.1; m.depthWrite = false; }
    else if (m.userData.xr) { Object.assign(m, m.userData.xr); delete m.userData.xr; }
    m.needsUpdate = true;
  }
  $('#btn-xray').classList.toggle('on', on);
  refreshHighlights(); if (state.selected) showPreview(state.selected); invalidate();
}

// ---------- Camera ----------
let fly = null;
const fit = () => Math.max(1, 1.45 / camera.aspect);
function flyTo(pos, target, dur = 0.9) {
  fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: target.clone(), t: 0, dur };
  invalidate();
}
const VIEWS = {
  '3/4': [[-5.6, 2.1, 5.6], [0, 0.62, 0]],
  Lato: [[0, 0.95, 10], [0, 0.65, 0]],
  Fronte: [[-9.5, 1.0, 0.01], [0, 0.65, 0]],
  Retro: [[6, 2.0, -5.2], [0, 0.62, 0]],
  Alto: [[0.01, 11.5, 0], [0, 0.5, 0]],
  Motore: [[-3.9, 2.5, 1.7], [-1.32, 0.62, 0]],
  Interni: [[0.6, 1.55, 3.4], [0.1, 0.85, 0]],
};
const EXPLODE_VIEW = [[-6.6, 4.4, 3.6], [-1.3, 0.95, 0]];
function goView(name) {
  const [p, t] = VIEWS[name]; const T = new THREE.Vector3(...t), P = new THREE.Vector3(...p);
  if (name === 'Motore') setOpen('cofano', true);
  if (name === 'Interni') { setOpen('porta_ant_sx', true); setOpen('porta_post_sx', true); }
  const k = name === 'Motore' || name === 'Interni' ? Math.max(1, 1.1 / camera.aspect) : fit();
  flyTo(T.clone().add(P.sub(T).multiplyScalar(k)), T);
}
function focusPart(id) {
  const g = car.parts[id]; const box = new THREE.Box3().setFromObject(g);
  if (box.isEmpty()) return;
  const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()).length();
  let dir = camera.position.clone().sub(controls.target).normalize();
  if (g.userData.explode) dir = new THREE.Vector3(-0.62, 0.68, c.z >= 0 ? 0.4 : -0.4).normalize();
  else if (dir.y < 0.15) { dir.y = 0.2; dir.normalize(); }
  const dist = THREE.MathUtils.clamp(size * 2.4, 1.3, 9) * Math.max(1, 1.0 / camera.aspect);
  flyTo(c.clone().addScaledVector(dir, dist), c, 0.8);
}

// ---------- Selezione ----------
function select(id, { focus = false } = {}) {
  if (state.selected === id) { if (focus) focusPart(id); return; }
  if (state.selected) setHighlight(state.selected, null);
  state.selected = id; state.hover = null;
  document.querySelectorAll('.item.sel').forEach((e) => e.classList.remove('sel'));
  if (!id) { $('#panel').hidden = true; stopPreview(); invalidate(); return; }
  setHighlight(id, 'sel');
  const it = document.querySelector(`.item[data-id="${id}"]`);
  if (it) { it.classList.add('sel'); const d = it.closest('details'); if (d) d.open = true; it.scrollIntoView({ block: 'nearest' }); }
  if (car.parts[id].userData.explode && !isOpen('cofano')) setOpen('cofano', true);
  renderPanel(id);
  if (focus) focusPart(id);
}

function partAt(ev) {
  const r = canvas.getBoundingClientRect();
  const ndc = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObject(car.root, true);
  for (const h of hits) {
    const o = h.object;
    const base = origMat.get(o) || o.material;
    if (base === M.glass || base === M.lens) continue;
    // visibilita' e id
    let id = null, vis = true;
    for (let p = o; p && p !== car.root; p = p.parent) { if (!p.visible) vis = false; if (!id && p.userData.partId) id = p.userData.partId; }
    if (!vis) continue;
    if (!id) { if (state.xray) continue; return null; }
    if (state.xray && info[id] && BODY_CATS.has(info[id].cat) && !isOpenPanelHit(id)) continue;
    return info[id] ? id : null;
  }
  return null;
}
const isOpenPanelHit = () => false;
const ray = new THREE.Raycaster();

let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointerup', (e) => {
  if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
  if (moved > 6) return;
  const id = partAt(e);
  select(id);
});
canvas.addEventListener('dblclick', (e) => {
  const id = partAt(e); if (!id) return;
  const op = openableOf(id); if (op) setOpen(op, !isOpen(op));
});
const tip = $('#tip');
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || e.buttons) { tip.hidden = true; return; }
  const id = partAt(e);
  if (id !== state.hover) {
    if (state.hover && state.hover !== state.selected) setHighlight(state.hover, null);
    state.hover = id;
    if (id && id !== state.selected) setHighlight(id, 'hov');
    canvas.style.cursor = id ? 'pointer' : 'grab';
  }
  if (id) { tip.hidden = false; tip.textContent = info[id].name; tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px'; } else tip.hidden = true;
});
canvas.addEventListener('pointerleave', () => { tip.hidden = true; });
addEventListener('keydown', (e) => { if (e.key === 'Escape') select(null); });

// ---------- Anteprima del pezzo isolato ----------
let pv = null;
function ensurePreview(cv) {
  if (pv) { pv.host = cv.parentElement; pv.host.prepend(pv.renderer.domElement); cv.remove(); return; }
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.toneMapping = THREE.ACESFilmicToneMapping;
  const s = new THREE.Scene(); s.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.03).texture;
  const l = new THREE.DirectionalLight(0xffffff, 1.4); l.position.set(2, 4, 3); s.add(l);
  const c = new THREE.PerspectiveCamera(28, 1, 0.01, 50);
  const ct = new OrbitControls(c, cv); ct.enablePan = false; ct.autoRotate = true; ct.autoRotateSpeed = 2.2; ct.enableDamping = true;
  pv = { renderer: r, scene: s, camera: c, controls: ct, obj: null, mats: [], host: cv.parentElement };
}
function stopPreview() { if (pv && pv.obj) { pv.scene.remove(pv.obj); pv.mats.forEach((m) => m.dispose()); pv.obj = null; pv.mats = []; } }
function showPreview(id) {
  if (!pv) return; stopPreview();
  const src = car.parts[id]; src.updateWorldMatrix(true, true);
  const wasSel = state.selected === id; if (wasSel) setHighlight(id, null);
  const obj = src.clone(true);
  if (wasSel) setHighlight(id, 'sel');
  src.matrixWorld.decompose(obj.position, obj.quaternion, obj.scale);
  const map = new Map();
  const conv = (m) => {
    let c = map.get(m); if (c) return c;
    c = m.clone(); c.onBeforeCompile = m.onBeforeCompile; c.customProgramCacheKey = m.customProgramCacheKey;
    if (m.userData.xr) Object.assign(c, m.userData.xr);
    map.set(m, c); pv.mats.push(c); return c;
  };
  obj.traverse((o) => { o.visible = true; if (o.isMesh) { const b = o.material; o.material = Array.isArray(b) ? b.map(conv) : conv(b); } });
  const wrap = new THREE.Group(); wrap.add(obj);
  const box = new THREE.Box3().setFromObject(wrap), c = box.getCenter(new THREE.Vector3()), rad = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 0.03);
  obj.position.sub(c);
  pv.scene.add(wrap); pv.obj = wrap;
  const d = rad / Math.sin((pv.camera.fov * Math.PI) / 360) * 1.1;
  pv.camera.position.set(-d * 0.62, d * 0.42, d * 0.66); pv.camera.near = d / 50; pv.camera.far = d * 10; pv.camera.updateProjectionMatrix();
  pv.controls.target.set(0, 0, 0); pv.controls.minDistance = d * 0.35; pv.controls.maxDistance = d * 3; pv.controls.update();
}
function sizePreview() {
  if (!pv) return; const el = pv.renderer.domElement, w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
  const pr = pv.renderer.getPixelRatio();
  if (el.width !== Math.round(w * pr) || el.height !== Math.round(h * pr)) { pv.renderer.setSize(w, h, false); pv.camera.aspect = w / h; pv.camera.updateProjectionMatrix(); }
}

// ---------- Pannello dettagli ----------
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function renderPanel(id) {
  const p = info[id], body = $('#panel-body'), op = openableOf(id);
  let h = `<div class="pv"><canvas></canvas><span>Pezzo isolato · trascina per ruotare</span></div><div class="pb">`;
  h += `<span class="chip">${esc(p.cat)}</span><h2>${esc(p.name)}</h2>`;
  h += `<div class="acts">`;
  if (op) h += `<button data-act="open">${isOpen(op) ? 'Chiudi' : 'Apri'} ${esc((OPEN_LABEL[op] || '').toLowerCase())}</button>`;
  h += `<button data-act="focus">Inquadra</button><button data-act="hide">${state.hidden.has(id) ? 'Mostra' : 'Nascondi'}</button></div>`;
  if (p.where) h += `<h3>Dove si trova</h3><p class="where">${esc(p.where)}</p>`;
  h += `<h3>Cos'è e a cosa serve</h3><p>${esc(p.desc)}</p>`;
  if (p.specs) h += `<h3>Dati tecnici</h3><table class="sp">${p.specs.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>`;
  if (p.maint) h += `<h3>Manutenzione</h3><ul>${p.maint.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  if (p.faults) h += `<h3>Guasti e sintomi tipici</h3><ul class="faults">${p.faults.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  if (p.oem) h += `<h3>Ricambi e codici OEM Renault</h3>${p.oem.map(([n, c, v]) => `<div class="oem"><span>${esc(n)}${v && c !== '—' ? '<span class="badge">da verificare</span>' : ''}</span><code>${esc(c)}</code></div>`).join('')}`;
  h += `<p class="note">Dati indicativi a scopo didattico per Clio IV 1.5 dCi 75 (K9K 612/628). Intervalli, quantità e codici ricambio cambiano con anno e versione: verifica sempre con libretto o numero di telaio.</p></div>`;
  body.innerHTML = h; body.scrollTop = 0; $('#panel').hidden = false;
  ensurePreview(body.querySelector('.pv canvas')); showPreview(id); sizePreview();
  body.querySelector('.acts').onclick = (e) => {
    const a = e.target.dataset.act; if (!a) return;
    if (a === 'open') { setOpen(op, !isOpen(op)); e.target.textContent = `${isOpen(op) ? 'Chiudi' : 'Apri'} ${(OPEN_LABEL[op] || '').toLowerCase()}`; }
    if (a === 'focus') focusPart(id);
    if (a === 'hide') { setHidden(id, !state.hidden.has(id)); e.target.textContent = state.hidden.has(id) ? 'Mostra' : 'Nascondi'; }
  };
}
function renderVehicle() {
  select(null);
  const body = $('#panel-body');
  body.innerHTML = `<div class="pb" style="padding-top:18px"><span class="chip">Scheda auto</span><h2>${esc(VEHICLE.name)}</h2><p>Quarta generazione della Clio (2012–2019), modello 2016 con il turbodiesel 1.5 dCi da 75 CV. Clicca un componente nel modello o nell'elenco per vederne funzione, dati, manutenzione e ricambi.</p><h3>Dati tecnici</h3><table class="sp">${VEHICLE.specs.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table><p class="note">Valori indicativi: possono variare secondo allestimento, omologazione e anno di produzione.</p><p class="note">Modello 3D della carrozzeria: «Renault Clio MK4 2012-2020» di <a href="https://sketchfab.com/3d-models/renault-clio-mk4-2012-2020-70a12bd8056647c7a4226f6fa7171c15" target="_blank" rel="noopener">Merc_TV su Sketchfab</a>, licenza <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Vano motore, meccanica e ruote sono ricostruzioni aggiunte.</p></div>`;
  $('#panel').hidden = false;
}
$('#panel-close').onclick = () => { select(null); $('#panel').hidden = true; };
$('#btn-vehicle').onclick = () => { renderVehicle(); $('#list').classList.remove('open'); };

function setHidden(id, hide) {
  car.parts[id].visible = !hide; hide ? state.hidden.add(id) : state.hidden.delete(id);
  const it = document.querySelector(`.item[data-id="${id}"]`); if (it) it.classList.toggle('hid', hide);
  $('#btn-showall').hidden = state.hidden.size === 0; invalidate();
}
$('#btn-showall').onclick = () => { [...state.hidden].forEach((id) => setHidden(id, false)); if (state.selected) renderPanel(state.selected); };

// ---------- Barra strumenti ----------
for (const name of Object.keys(VIEWS)) { const b = document.createElement('button'); b.textContent = name; b.onclick = () => goView(name); $('#views').append(b); }
for (const id in OPEN_LABEL) {
  const l = document.createElement('label'); l.innerHTML = `<span>${OPEN_LABEL[id]}</span><input type="checkbox" data-id="${id}">`;
  l.querySelector('input').onchange = (e) => setOpen(id, e.target.checked); $('#openables').append(l);
}
function syncOpenUI() {
  let all = true;
  document.querySelectorAll('#openables input').forEach((i) => { i.checked = isOpen(i.dataset.id); if (!i.checked) all = false; });
  $('#btn-openall').textContent = all ? 'Chiudi tutto' : 'Apri tutto'; $('#btn-openall').dataset.all = all ? '1' : '';
}
$('#btn-openall').onclick = () => { const open = !$('#btn-openall').dataset.all; for (const id in car.openables) setOpen(id, open); };
$('#btn-openmenu').onclick = (e) => { e.stopPropagation(); $('#btn-openmenu').parentElement.classList.toggle('open'); };
addEventListener('pointerdown', (e) => { if (!e.target.closest('.menu')) document.querySelectorAll('.menu.open').forEach((m) => m.classList.remove('open')); });
$('#btn-xray').onclick = () => setXray(!state.xray);
$('#btn-explode').onclick = () => {
  state.explodeTarget = state.explodeTarget ? 0 : 1; $('#btn-explode').classList.toggle('on', !!state.explodeTarget);
  if (state.explodeTarget) { setOpen('cofano', true); const k = Math.max(1, 1.1 / camera.aspect), T = new THREE.Vector3(...EXPLODE_VIEW[1]); flyTo(T.clone().add(new THREE.Vector3(...EXPLODE_VIEW[0]).sub(T).multiplyScalar(k)), T); } invalidate();
};
Object.entries(COLORS).forEach(([name, hex], i) => {
  const b = document.createElement('button'); b.className = 'sw' + (i === 0 ? ' on' : ''); b.title = name; b.setAttribute('aria-label', name); b.style.background = '#' + hex.toString(16).padStart(6, '0');
  b.onclick = () => { M.paint.color.setHex(hex); document.querySelectorAll('.sw').forEach((s) => s.classList.toggle('on', s === b)); refreshHighlights(); if (state.selected) showPreview(state.selected); invalidate(); };
  $('#colors').append(b);
});
$('#btn-list').onclick = () => $('#list').classList.toggle('open');

// ---------- Elenco componenti ----------
{
  const byCat = {};
  for (const id in info) (byCat[info[id].cat] ||= []).push(id);
  const cats = $('#cats');
  for (const c of CATEGORIES) {
    if (!byCat[c]) continue;
    const d = document.createElement('details'); if (c === 'Motore') d.open = true;
    d.innerHTML = `<summary>${c} <span style="margin-left:auto;margin-right:8px;opacity:.6">${byCat[c].length}</span></summary>`;
    byCat[c].sort((a, b) => info[a].name.localeCompare(info[b].name, 'it'));
    for (const id of byCat[c]) { const b = document.createElement('button'); b.className = 'item'; b.dataset.id = id; b.textContent = info[id].name; d.append(b); }
    cats.append(d);
  }
  cats.onclick = (e) => { const b = e.target.closest('.item'); if (!b) return; select(b.dataset.id, { focus: true }); $('#list').classList.remove('open'); };
  $('#search').oninput = (e) => {
    const q = e.target.value.trim().toLowerCase();
    cats.querySelectorAll('details').forEach((d) => {
      let n = 0; d.querySelectorAll('.item').forEach((b) => { const ok = !q || b.textContent.toLowerCase().includes(q) || (info[b.dataset.id].desc || '').toLowerCase().includes(q); b.style.display = ok ? '' : 'none'; if (ok) n++; });
      d.style.display = n ? '' : 'none'; if (q) d.open = n > 0;
    });
  };
}

// ---------- Ciclo ----------
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; viewOffset();
}
// sposta il centro della vista nell'area libera dai pannelli
function viewOffset() {
  const w = innerWidth, h = innerHeight, open = !$('#panel').hidden;
  let ox = 0, oy = 0;
  if (w <= 900) oy = open ? h * 0.24 : 0; else ox = (open ? 192 : 0) - 135;
  camera.setViewOffset(w, h, ox, oy, w, h); camera.updateProjectionMatrix(); invalidate();
}
new MutationObserver(viewOffset).observe($('#panel'), { attributes: true, attributeFilter: ['hidden'] });
addEventListener('resize', resize); resize();
{ const [p, t] = VIEWS['3/4']; const T = new THREE.Vector3(...t); camera.position.copy(T).add(new THREE.Vector3(...p).sub(T).multiplyScalar(fit())); controls.target.copy(T); controls.update(); }
syncOpenUI();

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  let anim = false;
  for (const id in car.openables) {
    const o = car.openables[id], s = o.userData.open;
    if (Math.abs(s.cur - s.target) > 1e-4) {
      s.cur += Math.sign(s.target - s.cur) * Math.min(Math.abs(s.target - s.cur), dt / 0.9);
      o.rotation[s.axis] = s.angle * ease(s.cur); anim = true;
    }
  }
  if (Math.abs(state.explode - state.explodeTarget) > 1e-4) {
    state.explode += Math.sign(state.explodeTarget - state.explode) * Math.min(Math.abs(state.explodeTarget - state.explode), dt / 1.1);
    const f = ease(state.explode);
    for (const id in car.parts) { const p = car.parts[id]; if (p.userData.explodeVec) p.position.copy(p.userData.explodeVec).multiplyScalar(f); }
    anim = true;
  }
  if (fly) {
    fly.t = Math.min(1, fly.t + dt / fly.dur); const k = ease(fly.t);
    camera.position.lerpVectors(fly.p0, fly.p1, k); controls.target.lerpVectors(fly.t0, fly.t1, k);
    if (fly.t >= 1) fly = null; anim = true;
  }
  controls.update();
  if (dirty || anim) { renderer.render(scene, camera); dirty = false; }
  if (pv && pv.obj && !$('#panel').hidden) { sizePreview(); pv.controls.update(); pv.renderer.render(pv.scene, pv.camera); }
});
canvas.addEventListener('pointerdown', () => { fly = null; });

$('#loading').classList.add('done');
window.__app = { camera, controls, car, THREE, select, setOpen, setXray, goView, state, invalidate, info };
