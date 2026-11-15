import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  L, FA, RA, WHEEL_Y, S, N, lerp, smooth, curve, patchData, Rx, tAtY, xAtY, polarSolver,
  warpStart, warpEnd, warpBoth,
} from './surface.js';
import { M } from './materials.js';

const D2R = Math.PI / 180;
const val = (f, a) => (typeof f === 'function' ? f(a) : f);

export function geo(fn, nu, nv, opt = {}) {
  const d = patchData(fn, nu, nv, opt);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(d.pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(d.nor, 3));
  g.setAttribute('cpos', new THREE.BufferAttribute(d.cp, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(d.uv, 2));
  g.setIndex(d.idx);
  return g;
}
const both = (fn, nu, nv, opt = {}) => mergeGeometries([geo(fn, nu, nv, { ...opt, side: 1 }), geo(fn, nu, nv, { ...opt, side: -1 })]);

// patch in carta polare (theta in gradi, y in metri)
function polar(xc, front, th0, th1, ylo, yhi) {
  const sol = polarSolver(xc, front); let row = null;
  return (u, v) => {
    if (u === 0 && row) sol.reset(row);
    const r = sol(lerp(th0, th1, u) * D2R, lerp(val(ylo, u), val(yhi, u), v));
    if (u === 0) row = r;
    return r;
  };
}
// patch in vista laterale
const sideR = (x0, x1, y0, y1) => (u, v) => { const x = lerp(x0, x1, u); return [x, tAtY(x, lerp(val(y0, u), val(y1, u), v))]; };

export function anchor(x, y, side = 1) {
  const t = tAtY(x, y), p = S(x, t), n = N(x, t);
  return { p: new THREE.Vector3(p[0], p[1], p[2] * side), n: new THREE.Vector3(n[0], n[1], n[2] * side) };
}
const XR = (t, y) => xAtY(t, y, 3.46, L - 0.003, -1);

// linee di taglio
const xHoodLead = (t) => lerp(0.20, 0.115, smooth((t - 0.56) / 0.44));
const xCowl = (t) => lerp(1.225, 1.0, smooth((t - 0.78) / 0.22));
const xHeader = (t) => lerp(1.90, 1.80, smooth((t - 0.8) / 0.2));
const xRDc = curve([[0.2, 2.99], [0.3, 3.06], [0.42, 3.19], [0.5, 3.265], [0.8, 3.265]]);
const xRD = (t) => (t <= 0.2 ? 2.99 : xRDc(t));

function plateTexture(text) {
  const c = document.createElement('canvas'); c.width = 520; c.height = 110;
  const g = c.getContext('2d');
  g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, 520, 110);
  g.fillStyle = '#1b3fa0'; g.fillRect(0, 0, 44, 110); g.fillRect(476, 0, 44, 110);
  g.fillStyle = '#111'; g.font = 'bold 78px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 260, 58);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function logoGeo(h = 0.062) {
  const w = h * 0.78, sh = new THREE.Shape();
  sh.moveTo(0, h); sh.lineTo(w, 0); sh.lineTo(0, -h); sh.lineTo(-w, 0); sh.closePath();
  const k = 0.52, ho = new THREE.Path();
  ho.moveTo(0, h * k); ho.lineTo(-w * k, 0); ho.lineTo(0, -h * k); ho.lineTo(w * k, 0); ho.closePath();
  sh.holes.push(ho);
  return new THREE.ExtrudeGeometry(sh, { depth: 0.01, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2 });
}

export function buildBody(car) {
  const { root } = car;
  const mesh = (g, geom, mat, shadow = true) => { const m = new THREE.Mesh(geom, mat); m.castShadow = shadow; g.add(m); return m; };
  const part = (id, parent = root) => { const g = new THREE.Group(); g.userData.partId = id; parent.add(g); car.parts[id] = g; return g; };
  const pivot = (id, pv, axis, angle, parent = root) => {
    const o = part(id, parent); o.position.copy(pv);
    const inner = new THREE.Group(); inner.position.copy(pv).negate(); o.add(inner);
    o.userData.open = { axis, angle, cur: 0, target: 0 };
    car.openables[id] = o;
    return inner;
  };
  const sfx = (s) => (s > 0 ? 'sx' : 'dx');

  // ---------- Paraurti anteriore ----------
  const pa = part('paraurti_ant');
  mesh(pa, both(Rx(1e-6, 0.52, 0, 0.585, warpStart), 56, 30), M.paint);
  mesh(pa, both(Rx(1e-6, (t) => xHoodLead(t) + 0.03, 0.5, 1, warpStart), 26, 22), M.paint);
  // presa d'aria inferiore
  mesh(pa, both(polar(1.0, true, 0, 23, 0.27, 0.42), 20, 6, { offset: 0.004 }), M.trim);
  // targa
  {
    const sol = polarSolver(1.0, true); const [x, t] = sol(0, 0.53); const p = S(x, t);
    const pl = mesh(pa, new THREE.BoxGeometry(0.012, 0.11, 0.52), [M.plastic, new THREE.MeshStandardMaterial({ map: plateTexture('FB 416 KD'), roughness: 0.5 }), M.plastic, M.plastic, M.plastic, M.plastic]);
    pl.material = [pl.material[0], pl.material[1], M.plastic, M.plastic, M.plastic, M.plastic];
    pl.position.set(p[0] - 0.012, 0.53, 0);
  }

  // ---------- Calandra + logo ----------
  const cal = part('calandra');
  mesh(cal, both(polar(1.0, true, 0, 22.5, 0.635, 0.752), 16, 6, { offset: 0.004 }), M.gloss);
  {
    const sol = polarSolver(1.0, true); const [x, t] = sol(0, 0.694); const p = S(x, t), n = N(x, t);
    const lg = mesh(cal, logoGeo(0.066), M.chrome);
    lg.position.set(p[0] - 0.012, p[1], 0); lg.rotation.set(0, -Math.PI / 2, 0);
    lg.rotateX(-Math.atan2(n[1], -n[0]) * 0.8);
  }

  // ---------- Fari, DRL ----------
  for (const s of [1, -1]) {
    const f = part('faro_' + sfx(s));
    const yb = (u) => lerp(0.648, 0.778, Math.pow(u, 1.5)), yt = (u) => lerp(0.762, 0.806, Math.pow(u, 0.6));
    mesh(f, geo(polar(1.0, true, 22.5, 62, yb, yt), 26, 8, { offset: 0.003, side: s }), M.gloss);
    mesh(f, geo(polar(1.0, true, 22.5, 62, yb, yt), 26, 8, { offset: 0.009, side: s }), M.lens, false);
    const sol = polarSolver(1.0, true);
    for (const [th, y, r] of [[28.5, 0.708, 0.04], [37.5, 0.742, 0.03]]) {
      const [x, t] = sol(th * D2R, y); const p = S(x, t);
      const b = mesh(f, new THREE.SphereGeometry(r, 20, 14), M.gloss); b.position.set(p[0] + 0.012, p[1], p[2] * s); b.scale.set(0.5, 1, 1);
      const c = mesh(f, new THREE.SphereGeometry(r * 0.6, 16, 12), M.chrome); c.position.set(p[0] + 0.002, p[1], p[2] * s); c.scale.set(0.5, 1, 1);
    }
    const d = part('drl_' + sfx(s));
    mesh(d, geo(polar(1.0, true, 29, 45, 0.30, 0.405), 12, 5, { offset: 0.004, side: s }), M.gloss);
    mesh(d, geo(polar(1.0, true, 31, 43.5, 0.372, 0.388), 10, 2, { offset: 0.007, side: s }), M.led, false);
    const [x, t] = sol(36 * D2R, 0.335); const p = S(x, t);
    const fg = mesh(d, new THREE.SphereGeometry(0.026, 16, 12), M.chrome); fg.position.set(p[0] + 0.004, p[1], p[2] * s); fg.scale.set(0.4, 1, 1);
  }

  // ---------- Parafanghi anteriori ----------
  for (const s of [1, -1]) {
    const pf = part('parafango_' + sfx(s));
    mesh(pf, geo(Rx(0.50, 1.335, 0.17, 0.58), 36, 22, { side: s }), M.paint);
  }

  // ---------- Fiancate (brancardo, montanti, parafango posteriore) ----------
  for (const s of [1, -1]) {
    const fi = part('fiancata_' + sfx(s));
    const o = { side: s };
    mesh(fi, geo(Rx(0.50, 3.82, 0.10, 0.20), 80, 6, o), M.paint);
    mesh(fi, geo(Rx((t) => xRD(t) + 0.006, 3.82, 0.17, 0.80), 22, 36, o), M.paint);
    mesh(fi, geo(Rx(3.80, (t) => XR(t, 0.70), 0.5, 0.80, warpEnd), 24, 16, o), M.paint);
    mesh(fi, geo(Rx(1.225, 3.30, 0.779, 0.80), 70, 2, o), M.paint);
    mesh(fi, geo(Rx(xCowl, xHeader, 0.80, 0.832), 24, 3, o), M.paint);
    mesh(fi, geo(Rx(2.275, 2.405, 0.2, 0.78), 3, 24, { side: s, offset: -0.045 }), M.inner);
  }

  // ---------- Tetto ----------
  const te = part('tetto');
  mesh(te, both(Rx(xHeader, 3.452, 0.80, 1), 34, 12), M.paint);
  {
    const p = S(3.30, 1);
    const a = mesh(te, new THREE.CylinderGeometry(0.004, 0.006, 0.36, 8), M.plastic); a.position.set(p[0] + 0.12, p[1] + 0.13, 0); a.rotation.z = -0.75;
    const b = mesh(te, new THREE.CylinderGeometry(0.014, 0.02, 0.02, 12), M.plastic); b.position.set(p[0], p[1] + 0.008, 0);
  }

  // ---------- Parabrezza + tergicristalli ----------
  const pb = part('parabrezza');
  mesh(pb, both(Rx((t) => xCowl(t) + 0.05, xHeader, 0.832, 1), 22, 14), M.glass, false);
  mesh(pb, both(Rx(xCowl, (t) => xCowl(t) + 0.055, 0.80, 1), 3, 16), M.trim);
  const tg = part('tergicristalli');
  const wiper = (t0, t1, side, dx) => {
    const pts = [];
    for (let i = 0; i <= 6; i++) { const t = lerp(t0, t1, i / 6), x = xCowl(t) + dx, p = S(x, t), n = N(x, t); pts.push(new THREE.Vector3(p[0] + n[0] * 0.016, p[1] + n[1] * 0.016, (p[2] + n[2] * 0.016) * side)); }
    mesh(tg, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.007, 6), M.rubber);
  };
  wiper(0.855, 0.995, 1, 0.085); wiper(0.87, 0.99, -1, 0.075);

  // ---------- Cofano ----------
  const co = pivot('cofano', new THREE.Vector3(1.17, 0.955, 0), 'z', -0.92);
  mesh(co, both(Rx(xHoodLead, (t) => xCowl(t) - 0.005, 0.565, 1), 34, 22), M.paint);
  mesh(co, both(Rx((t) => xHoodLead(t) + 0.02, (t) => xCowl(t) - 0.03, 0.60, 1), 20, 14, { offset: -0.022 }), M.inner);

  // ---------- Porte ----------
  const doorDefs = [
    { id: 'porta_ant', x0: 1.341, x1: 2.336, xb: () => 2.336, g0: 1.43, g1: 2.27 },
    { id: 'porta_post', x0: 2.346, x1: 3.26, xb: (t) => xRD(t), g0: 2.415, g1: 3.0 },
  ];
  for (const s of [1, -1]) for (const dd of doorDefs) {
    const hz = S(dd.x0, 0.34)[2] - 0.035;
    const d = pivot(dd.id + '_' + sfx(s), new THREE.Vector3(dd.x0, 0.6, hz * s), 'y', -1.12 * s);
    const o = { side: s };
    mesh(d, geo(Rx(dd.x0, dd.xb, 0.20, 0.5), 34, 26, o), M.paint);
    mesh(d, geo(Rx(dd.x0 + 0.02, (t) => dd.xb(t) - 0.02, 0.215, 0.5), 20, 14, { side: s, offset: -0.075 }), M.inner);
    // cornice superiore
    mesh(d, geo(Rx(dd.g0, dd.g1, 0.5, 0.516), 24, 1, o), M.trim);
    mesh(d, geo(Rx(dd.g0, dd.g1, 0.752, 0.776), 24, 1, o), M.gloss);
    mesh(d, geo(Rx(dd.x0, dd.g0, 0.5, 0.776), 3, 12, o), M.gloss);
    mesh(d, geo(Rx(dd.g1, dd.x1, 0.5, 0.776), 5, 12, o), M.gloss);
    const v = part(dd.id.replace('porta', 'vetro') + '_' + sfx(s), d);
    mesh(v, geo(Rx(dd.g0, dd.g1, 0.516, 0.752), 24, 12, o), M.glass, false);
    if (dd.id === 'porta_ant') {
      // maniglia
      const a = anchor(2.17, 0.895, s);
      const h = mesh(d, new RoundedBoxGeometry(0.16, 0.028, 0.03, 3, 0.012), M.paint); h.position.copy(a.p).addScaledVector(a.n, 0.008);
      // specchio
      const sp = part('specchio_' + sfx(s), d);
      const b = anchor(1.42, 0.975, s);
      const arm = mesh(sp, new RoundedBoxGeometry(0.07, 0.03, 0.10, 2, 0.01), M.plastic); arm.position.copy(b.p).add(new THREE.Vector3(0.005, 0.02, 0.045 * s));
      const hs = mesh(sp, new THREE.SphereGeometry(1, 24, 16), M.paint); hs.scale.set(0.05, 0.058, 0.10); hs.position.copy(b.p).add(new THREE.Vector3(0.0, 0.035, 0.145 * s));
      const hb = mesh(sp, new THREE.SphereGeometry(1, 24, 16, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38), M.plastic); hb.scale.set(0.052, 0.06, 0.103); hb.position.copy(hs.position);
      const gl = mesh(sp, new THREE.CircleGeometry(1, 24), M.chrome); gl.scale.set(0.088, 0.048, 1); gl.rotation.y = Math.PI / 2; gl.position.copy(hs.position).add(new THREE.Vector3(0.036, 0, 0));
      const fr = mesh(sp, new RoundedBoxGeometry(0.012, 0.012, 0.05, 2, 0.005), M.amber); fr.position.copy(hs.position).add(new THREE.Vector3(-0.045, -0.01, 0.045 * s));
    } else {
      // maniglia nascosta nel montante
      const a = anchor(3.13, 1.10, s);
      const h = mesh(d, new RoundedBoxGeometry(0.035, 0.11, 0.012, 2, 0.005), M.plastic); h.position.copy(a.p).addScaledVector(a.n, 0.004); h.rotation.z = -0.5;
    }
  }

  // ---------- Portellone ----------
  const po = pivot('portellone', new THREE.Vector3(3.46, 1.40, 0), 'z', 1.28);
  mesh(po, both(Rx(3.455, (t) => XR(t, 1.30), 0.80, 1, warpEnd), 10, 12), M.paint);
  mesh(po, both(Rx((t) => XR(t, 1.30), (t) => XR(t, 1.03), 0.80, 0.835), 16, 3), M.gloss);
  mesh(po, both(Rx((t) => XR(t, 1.03), (t) => XR(t, 0.70), 0.80, 1), 20, 14), M.paint);
  mesh(po, both(Rx((t) => XR(t, 1.28), (t) => XR(t, 0.74), 0.84, 1), 20, 10, { offset: -0.04 }), M.inner);
  const lu = part('lunotto', po);
  mesh(lu, both(Rx((t) => XR(t, 1.30), (t) => XR(t, 1.03), 0.835, 1), 16, 12), new THREE.MeshPhysicalMaterial({ color: 0x0c1114, roughness: 0.03, metalness: 0.2, transparent: true, opacity: 0.72, side: THREE.DoubleSide, envMapIntensity: 1.6 }), false);
  {
    const x = XR(1, 1.07), p = S(x, 1), n = N(x, 1);
    const w = mesh(po, new RoundedBoxGeometry(0.02, 0.012, 0.30, 2, 0.005), M.rubber); w.position.set(p[0] + n[0] * 0.012, p[1] + n[1] * 0.012, 0.03);
    const x2 = XR(1, 0.975), p2 = S(x2, 1), n2 = N(x2, 1);
    const lg = mesh(po, logoGeo(0.05), M.chrome); lg.position.set(p2[0] + 0.004, p2[1], 0); lg.rotation.y = Math.PI / 2; lg.rotateX(-Math.atan2(n2[1], n2[0]) * 0.8);
    const x3 = XR(1, 0.83), p3 = S(x3, 1);
    const pl = mesh(po, new THREE.BoxGeometry(0.012, 0.11, 0.52), [new THREE.MeshStandardMaterial({ map: plateTexture('FB 416 KD'), roughness: 0.5 }), M.plastic, M.plastic, M.plastic, M.plastic, M.plastic]);
    pl.position.set(p3[0] + 0.006, 0.83, 0); pl.rotation.z = -0.12;
  }

  // ---------- Fanali posteriori ----------
  for (const s of [1, -1]) {
    const fa = part('fanale_' + sfx(s));
    mesh(fa, geo(polar(3.3, false, 39, 74, (u) => lerp(0.805, 0.985, Math.pow(u, 1.6)), (u) => lerp(1.0, 1.03, u)), 22, 8, { offset: 0.003, side: s }), M.gloss);
    mesh(fa, geo(polar(3.3, false, 40, 72, (u) => lerp(0.82, 0.985, Math.pow(u, 1.6)), (u) => lerp(0.99, 1.02, u)), 22, 8, { offset: 0.006, side: s }), M.red);
    const fb = part('fanale_int_' + sfx(s), po);
    mesh(fb, geo(polar(3.3, false, 15.5, 39, (u) => lerp(0.85, 0.805, u), (u) => lerp(0.97, 1.0, u)), 14, 6, { offset: 0.003, side: s }), M.gloss);
    mesh(fb, geo(polar(3.3, false, 17, 39, (u) => lerp(0.86, 0.82, u), (u) => lerp(0.96, 0.99, u)), 14, 6, { offset: 0.006, side: s }), M.red);
    mesh(fb, geo(polar(3.3, false, 19, 30, 0.875, 0.905), 8, 2, { offset: 0.009, side: s }), M.white, false);
  }

  // ---------- Paraurti posteriore ----------
  const pp = part('paraurti_post');
  mesh(pp, both(Rx(3.80, L - 1e-6, 0, 0.5, warpEnd), 40, 26), M.paint);
  mesh(pp, both(Rx((t) => XR(t, 0.70), L - 1e-6, 0.5, 1, warpEnd), 22, 22), M.paint);
  mesh(pp, both(polar(3.3, false, 0, 38, 0.33, 0.43), 20, 5, { offset: 0.004 }), M.trim);
  for (const s of [1, -1]) mesh(pp, geo(polar(3.3, false, 44, 58, 0.50, 0.535), 8, 2, { offset: 0.005, side: s }), M.red);

  // ---------- Sportello carburante (lato destro) ----------
  {
    const a = anchor(3.52, 0.86, -1);
    const sp = pivot('sportello_carburante', a.p.clone(), 'y', 1.5);
    mesh(sp, geo(sideR(3.52, 3.68, 0.79, 0.93), 8, 8, { offset: 0.004, side: -1 }), M.paint);
    const c = anchor(3.60, 0.86, -1);
    const bk = new THREE.Mesh(new THREE.CircleGeometry(0.062, 24), M.plastic); bk.position.copy(c.p).addScaledVector(c.n, 0.0025); bk.lookAt(c.p.clone().add(c.n)); root.add(bk);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 20), M.plasticG); cap.position.copy(c.p).addScaledVector(c.n, 0.003); cap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), c.n); root.add(cap);
  }

  // ---------- Fondo, passaruota, pareti vano motore ----------
  const misc = new THREE.Group(); root.add(misc);
  mesh(misc, both(Rx(0.45, 3.85, 0, 0.10), 60, 6), M.floor);
  mesh(misc, both(Rx(0.24, 1.06, 0.17, 0.5), 20, 12, { offset: -0.035 }), M.inner, false);
  for (const ax of [FA, RA]) for (const s of [1, -1]) {
    const lg = new THREE.PlaneGeometry(1, 1, 28, 1), lp = lg.attributes.position;
    for (let i = 0; i < lp.count; i++) { const th = (lp.getX(i) + 0.5) * Math.PI * 1.16 - Math.PI * 0.08, zz = 0.52 + (lp.getY(i) + 0.5) * 0.31; lp.setXYZ(i, ax + Math.cos(th) * 0.362, WHEEL_Y + Math.sin(th) * 0.362, zz * s); }
    lg.computeVertexNormals();
    const c = new THREE.Mesh(lg, M.floor); misc.add(c);
    const e = new THREE.Mesh(new THREE.CircleGeometry(0.362, 32), M.floor); e.rotation.y = Math.PI / 2 * 0; e.position.set(ax, WHEEL_Y, 0.51 * s); misc.add(e);
  }
}
