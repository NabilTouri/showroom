// Superficie parametrica della carrozzeria Clio IV (puro JS, niente three).
// Coordinate auto: x = da paraurti anteriore verso il retro (m), y = alto, z = sinistra (+) / destra (-).
// S(x,t): t in [0,1] percorre la mezza sezione dal centro del fondo (0) al centro del tetto (1).

export const L = 4.062;      // lunghezza
export const FA = 0.853;     // asse anteriore
export const RA = 3.442;     // asse posteriore (passo 2.589)
export const WHEEL_R = 0.312;
export const WHEEL_Y = 0.312;
export const ARCH_R = 0.352;
export const TRACK = 0.753;  // semi-carreggiata

export const lerp = (a, b, s) => a + (b - a) * s;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const smooth = (s) => { s = clamp(s, 0, 1); return s * s * (3 - 2 * s); };

function nose(d, a, n) {
  if (d >= a) return 1;
  if (d <= 0) return 0;
  return Math.pow(1 - Math.pow(1 - d / a, n), 1 / n);
}
function smin(a, b, k) {
  const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1);
  return lerp(b, a, h) - k * h * (1 - h);
}

// Interpolazione cubica monotona (PCHIP)
export function curve(pts) {
  const n = pts.length, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 * d[i - 1] * d[i] / (d[i - 1] + d[i]);
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], s = (x - xs[i]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * ys[i + 1] + (s3 - s2) * h * m[i + 1];
  };
}

// ---- Profili (misure in metri, ricavate dalle quote ufficiali Clio IV) ----
const yTopC = curve([[0, 0.78], [0.12, 0.80], [0.35, 0.86], [0.70, 0.925], [1.02, 0.975], [1.03, 0.978],
  [1.40, 1.215], [1.80, 1.395], [2.25, 1.448], [2.90, 1.44], [3.45, 1.405], [3.60, 1.365],
  [3.92, 1.04], [3.985, 0.80], [4.03, 0.70], [L, 0.62]]);
const yReC = curve([[0, 0.76], [0.12, 0.78], [0.35, 0.835], [0.70, 0.897], [1.20, 0.967], [1.21, 0.97],
  [1.55, 1.19], [1.90, 1.355], [2.35, 1.40], [2.95, 1.39], [3.45, 1.35], [3.62, 1.29],
  [3.92, 1.02], [3.985, 0.79], [L, 0.62]]);
const yBeltC = curve([[0, 0.69], [0.15, 0.73], [0.40, 0.795], [0.75, 0.865], [1.05, 0.91], [1.30, 0.935],
  [2.30, 0.965], [3.00, 1.015], [3.40, 1.045], [3.75, 1.045], [3.94, 0.99], [L, 0.62]]);
const yShC = curve([[0, 0.46], [0.30, 0.48], [1.0, 0.56], [2.3, 0.60], [3.4, 0.67], [3.9, 0.64], [L, 0.56]]);
const yBotC = curve([[0, 0.24], [0.25, 0.19], [0.6, 0.17], [3.1, 0.17], [3.8, 0.25], [L, 0.33]]);
const wC = curve([[0, 0.80], [0.5, 0.845], [0.853, 0.864], [1.5, 0.846], [2.6, 0.850], [3.2, 0.862], [3.442, 0.866], [3.9, 0.835], [L, 0.80]]);
const rBeltC = curve([[0, 0.90], [0.3, 0.87], [0.9, 0.885], [1.3, 0.925], [2.3, 0.93], [3.3, 0.915], [3.9, 0.90], [L, 0.9]]);
const rReC = curve([[0, 0.60], [0.3, 0.60], [1.0, 0.66], [1.22, 0.865], [1.55, 0.78], [1.9, 0.705], [2.4, 0.69], [3.4, 0.675], [3.9, 0.74], [L, 0.74]]);

const TK = [0, 0.10, 0.17, 0.34, 0.5, 0.8, 0.92, 1];

function keysAt(x) {
  const fv = nose(x, 0.13, 3.0) * nose(L - x, 0.07, 2.4);
  const yc = x < 2 ? 0.50 : 0.58;
  const Y = (v) => yc + (v - yc) * fv;
  const wM = wC(x) * nose(x, 0.62, 2.7) * nose(L - x, 0.31, 4.2);
  const top = yTopC(x);
  const re = smin(yReC(x), top - 0.010, 0.02);
  const belt = smin(yBeltC(x), re - 0.012, 0.02);
  const sh = Math.min(yShC(x), belt - 0.05);
  const yb = yBotC(x);
  const wS = wM * 0.945, wB = wM * rBeltC(x), wR = wM * rReC(x);
  return [
    [0, Y(yb)], [wS * 0.80, Y(yb)], [wS, Y(yb + 0.075)], [wM, Y(sh)],
    [wB, Y(belt)], [wR, Y(re)], [wR * 0.55, Y(top - 0.27 * (top - re))], [0, Y(top)],
  ];
}

let _kx = NaN, _k = null;
function sec(x, t) {
  if (x !== _kx) { _k = keysAt(x); _kx = x; }
  const K = _k, n = K.length;
  let i = 0; while (i < n - 2 && t > TK[i + 1]) i++;
  const s = clamp((t - TK[i]) / (TK[i + 1] - TK[i]), 0, 1);
  const P1 = K[i], P2 = K[i + 1];
  const P0 = i > 0 ? K[i - 1] : [-K[1][0], K[1][1]];
  const P3 = i + 2 < n ? K[i + 2] : [-K[n - 2][0], K[n - 2][1]];
  const s2 = s * s, s3 = s2 * s;
  const c0 = -0.5 * s3 + s2 - 0.5 * s, c1 = 1.5 * s3 - 2.5 * s2 + 1, c2 = -1.5 * s3 + 2 * s2 + 0.5 * s, c3 = 0.5 * s3 - 0.5 * s2;
  return [c0 * P0[0] + c1 * P1[0] + c2 * P2[0] + c3 * P3[0], c0 * P0[1] + c1 * P1[1] + c2 * P2[1] + c3 * P3[1]];
}

const bump = (v) => { v = clamp(v, -1, 1); const c = 1 - v * v; return c * c; };

export function S(x, t) {
  x = clamp(x, 1e-4, L - 1e-4); t = clamp(t, 0, 1);
  let [z, y] = sec(x, t);
  if (t > 0.15 && t < 0.52) {
    // scalfatura bassa sulle porte (firma stilistica Clio IV)
    const win = smooth((x - 1.15) / 0.35) * (1 - smooth((x - 2.85) / 0.4));
    z -= 0.024 * bump((t - 0.265) / 0.075) * win;
    // labbro dei passaruota
    for (const ax of [FA, RA]) {
      const d = Math.hypot(x - ax, y - WHEEL_Y);
      z += 0.014 * bump((d - ARCH_R - 0.01) / 0.07) * smooth((0.5 - t) / 0.06);
    }
  }
  if (z < 0) z = 0;
  return [x, y, z];
}

export function N(x, t) {
  const e = 1.5e-3;
  x = clamp(x, 2e-3, L - 2e-3);
  const a = S(x + e, t), b = S(x - e, t), c = S(x, Math.min(t + e, 1)), d = S(x, Math.max(t - e, 0));
  const ux = a[0] - b[0], uy = a[1] - b[1], uz = a[2] - b[2];
  const vx = c[0] - d[0], vy = c[1] - d[1], vz = c[2] - d[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const l = Math.hypot(nx, ny, nz) || 1;
  return [nx / l, ny / l, nz / l];
}

// ---- Risolutori ----
export function tAtY(x, y, t0 = 0.17, t1 = 0.8) {
  for (let i = 0; i < 40; i++) { const m = (t0 + t1) / 2; if (S(x, m)[1] < y) t0 = m; else t1 = m; }
  return (t0 + t1) / 2;
}
// x tale che y(x,t)=y; dir=+1 se y cresce con x (muso), -1 se decresce (coda)
export function xAtY(t, y, x0, x1, dir) {
  for (let i = 0; i < 40; i++) { const m = (x0 + x1) / 2; if ((S(m, t)[1] < y) === (dir > 0)) x0 = m; else x1 = m; }
  return (x0 + x1) / 2;
}
// carta polare attorno ad un asse verticale (xc,0): theta=0 sul piano di mezzeria all'estremita'
export function polarSolver(xc, front) {
  const F = (x, t) => { const p = S(x, t); return [Math.atan2(p[2], front ? xc - p[0] : p[0] - xc), p[1]]; };
  const lo = front ? 0.004 : xc, hi = front ? xc : L - 0.004;
  let last = null;
  const solve = (theta, y) => {
    let x, t, best = 1e9;
    if (last) [x, t] = last;
    else {
      for (let i = 0; i <= 50; i++) for (let j = 0; j <= 40; j++) {
        const xx = lerp(lo, hi, (i / 50) ** (front ? 2 : 0.5)), tt = lerp(0.1, 1, j / 40);
        const f = F(xx, tt), e = (f[0] - theta) ** 2 + ((f[1] - y) * 2) ** 2;
        if (e < best) { best = e; x = xx; t = tt; }
      }
    }
    for (let k = 0; k < 30; k++) {
      const f = F(x, t), e0 = f[0] - theta, e1 = f[1] - y;
      if (Math.abs(e0) < 1e-5 && Math.abs(e1) < 1e-5) break;
      const h = 1e-4, fx = F(x + h, t), ft = F(x, t + (t > 0.5 ? -h : h)), st = t > 0.5 ? -h : h;
      const a = (fx[0] - f[0]) / h, b = (ft[0] - f[0]) / st, c = (fx[1] - f[1]) / h, d = (ft[1] - f[1]) / st;
      const det = a * d - b * c; if (Math.abs(det) < 1e-12) break;
      let dx = -(d * e0 - b * e1) / det, dt = -(-c * e0 + a * e1) / det;
      const sc = Math.min(1, 0.06 / Math.abs(dx || 1e-9), 0.06 / Math.abs(dt || 1e-9));
      x = clamp(x + dx * sc, lo, hi); t = clamp(t + dt * sc, 0.02, 1);
    }
    last = [x, t];
    return [x, t];
  };
  solve.reset = (v) => { last = v; };
  return solve;
}

// ---- Costruzione patch: fn(u,v) -> [x,t] ----
export function patchData(fn, nu, nv, { offset = 0, side = 1 } = {}) {
  const cnt = (nu + 1) * (nv + 1);
  const pos = new Float32Array(cnt * 3), nor = new Float32Array(cnt * 3), cp = new Float32Array(cnt * 3), uv = new Float32Array(cnt * 2);
  let k = 0;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const [x, t] = fn(i / nu, j / nv);
    const p = S(x, t), n = N(x, t);
    pos[k * 3] = p[0] + n[0] * offset; pos[k * 3 + 1] = p[1] + n[1] * offset; pos[k * 3 + 2] = (p[2] + n[2] * offset) * side;
    nor[k * 3] = n[0]; nor[k * 3 + 1] = n[1]; nor[k * 3 + 2] = n[2] * side;
    cp[k * 3] = p[0]; cp[k * 3 + 1] = p[1]; cp[k * 3 + 2] = p[2] * side;
    uv[k * 2] = i / nu; uv[k * 2 + 1] = j / nv; k++;
  }
  // orientamento coerente con le normali
  const idx = [];
  const a0 = Math.floor(nv / 2) * (nu + 1) + Math.floor(nu / 2), b0 = a0 + 1, c0 = a0 + nu + 1;
  const e1 = [pos[b0 * 3] - pos[a0 * 3], pos[b0 * 3 + 1] - pos[a0 * 3 + 1], pos[b0 * 3 + 2] - pos[a0 * 3 + 2]];
  const e2 = [pos[c0 * 3] - pos[a0 * 3], pos[c0 * 3 + 1] - pos[a0 * 3 + 1], pos[c0 * 3 + 2] - pos[a0 * 3 + 2]];
  const g = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
  const flip = g[0] * nor[a0 * 3] + g[1] * nor[a0 * 3 + 1] + g[2] * nor[a0 * 3 + 2] < 0;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
  }
  return { pos, nor, cp, uv, idx };
}

const val = (f, a) => (typeof f === 'function' ? f(a) : f);
// regione con limiti x funzione di t
export const Rx = (xa, xb, t0, t1, warp) => (u, v) => {
  const t = lerp(t0, t1, v); if (warp) u = warp(u);
  return [lerp(val(xa, t), val(xb, t), u), t];
};
// regione con limiti t funzione di x
export const Rt = (x0, x1, ta, tb) => (u, v) => {
  const x = lerp(x0, x1, u);
  return [x, lerp(val(ta, x), val(tb, x), v)];
};
export const warpStart = (u) => Math.pow(u, 2.3);
export const warpEnd = (u) => 1 - Math.pow(1 - u, 2.6);
export const warpBoth = (u) => (u < 0.5 ? 0.5 * Math.pow(2 * u, 2.3) : 1 - 0.5 * Math.pow(2 * (1 - u), 2.6));
