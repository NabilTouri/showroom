// Procedural textures (no external files): material grain, tire tread, labels, plates.
import * as THREE from 'three';

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

interface FinishOptions {
  repeat?: [number, number];
  color?: boolean;
}

const finish = (c: HTMLCanvasElement, { repeat = [1, 1], color = false }: FinishOptions = {}) => {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** Deterministic pseudo-random generator (mulberry32): the same textures on every load. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GrainOptions {
  octaves?: number;
  base?: number;
  amp?: number;
  blotch?: number;
  seed?: number;
}

/** Multi-octave grain for bump and roughness maps: fine = cast alloy / textured plastic, coarse = cast iron / rust. */
export function grain(
  size = 256,
  { octaves = 4, base = 128, amp = 70, blotch = 0, seed = 1 }: GrainOptions = {},
  opt?: FinishOptions,
) {
  const [c, g] = canvas(size, size),
    img = g.createImageData(size, size),
    d = img.data;
  const random = seededRandom(seed);
  const layers: [number, Float32Array, number][] = [];
  for (let o = 0; o < octaves; o++) {
    const n = 8 << o,
      a = new Float32Array(n * n);
    for (let i = 0; i < a.length; i++) a[i] = random();
    layers.push([n, a, 1 / (o + 1)]);
  }
  const samp = (n: number, a: Float32Array, x: number, y: number) => {
    const fx = x * n,
      fy = y * n,
      x0 = Math.floor(fx) % n,
      y0 = Math.floor(fy) % n,
      x1 = (x0 + 1) % n,
      y1 = (y0 + 1) % n,
      tx = fx % 1,
      ty = fy % 1;
    const sx = tx * tx * (3 - 2 * tx),
      sy = ty * ty * (3 - 2 * ty);
    return (
      (a[y0 * n + x0] * (1 - sx) + a[y0 * n + x1] * sx) * (1 - sy) +
      (a[y1 * n + x0] * (1 - sx) + a[y1 * n + x1] * sx) * sy
    );
  };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let v = 0,
        w = 0;
      for (const [n, a, k] of layers) {
        v += samp(n, a, x / size, y / size) * k;
        w += k;
      }
      v = v / w - 0.5;
      if (blotch) v += (samp(4, layers[0][1].subarray(0, 16), x / size, y / size) - 0.5) * blotch;
      const p = Math.max(0, Math.min(255, base + v * amp * 2)),
        i = (y * size + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = p;
      d[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  return finish(c, opt);
}

/**
 * Tire bump map: u = around the tire, v = across the profile (sidewall – tread – sidewall).
 * Light = raised. `sidewall` alternates around both sidewalls.
 */
export function tireBump(sidewall: readonly [string, string]) {
  const [c, g] = canvas(2048, 512);
  g.fillStyle = '#808080';
  g.fillRect(0, 0, 2048, 512);
  const t0 = 512 * 0.36,
    t1 = 512 * 0.64;
  g.fillStyle = '#b0b0b0';
  g.fillRect(0, t0, 2048, t1 - t0); // tread band
  g.fillStyle = '#202020';
  for (const f of [0.42, 0.5, 0.58]) g.fillRect(0, 512 * f - 5, 2048, 10); // circumferential grooves
  g.strokeStyle = '#303030';
  g.lineWidth = 5;
  for (let x = 0; x < 2048; x += 24) {
    // oblique sipes
    g.beginPath();
    g.moveTo(x, t0);
    g.lineTo(x + 14, 512 * 0.415);
    g.stroke();
    g.beginPath();
    g.moveTo(x + 14, 512 * 0.585);
    g.lineTo(x, t1);
    g.stroke();
    g.beginPath();
    g.moveTo(x + 4, 512 * 0.44);
    g.lineTo(x + 12, 512 * 0.48);
    g.stroke();
    g.beginPath();
    g.moveTo(x + 12, 512 * 0.52);
    g.lineTo(x + 4, 512 * 0.56);
    g.stroke();
  }
  for (const [ya, yb] of [
    [0.12, 0.3],
    [0.7, 0.88],
  ]) {
    // sidewalls: ribs and lettering
    g.fillStyle = '#9a9a9a';
    g.fillRect(0, 512 * ya, 2048, 3);
    g.fillRect(0, 512 * yb, 2048, 3);
    g.fillStyle = '#c8c8c8';
    g.font = 'bold 44px Arial';
    g.textBaseline = 'middle';
    for (let i = 0; i < 4; i++) {
      g.fillText(sidewall[i % 2], 60 + i * 512, (512 * (ya + yb)) / 2);
    }
  }
  return finish(c);
}

export type LabelLine = string | [text: string, font: string];

export interface LabelOptions {
  w?: number;
  h?: number;
  bg?: string;
  fg?: string;
  accent?: string | null;
  font?: string;
}

export function label(
  lines: LabelLine[],
  {
    w = 512,
    h = 256,
    bg = '#111',
    fg = '#fff',
    accent = null,
    font = 'bold 64px Arial',
  }: LabelOptions = {},
) {
  const [c, g] = canvas(w, h);
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  if (accent) {
    g.fillStyle = accent;
    g.fillRect(0, 0, w, h * 0.22);
  }
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  lines.forEach((l, i) => {
    g.font = typeof l === 'string' ? font : l[1];
    g.fillText(
      typeof l === 'string' ? l : l[0],
      w / 2,
      h * (accent ? 0.3 : 0.1) + (h * (accent ? 0.68 : 0.8) * (i + 0.5)) / lines.length,
    );
  });
  const t = finish(c, { color: true });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

export function beamTexture() {
  const [c, g] = canvas(512, 512),
    gr = g.createRadialGradient(256, 256, 0, 256, 256, 256);
  gr.addColorStop(0, 'rgba(255,244,214,0.9)');
  gr.addColorStop(0.35, 'rgba(255,240,205,0.35)');
  gr.addColorStop(1, 'rgba(255,240,205,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** EU-style number plate: blue band with the country code on the left, plain band on the right. */
export function plateTexture(text: string, country: string) {
  const [c, g] = canvas(1040, 220);
  g.fillStyle = '#f3f3ee';
  g.fillRect(0, 0, 1040, 220);
  g.strokeStyle = '#1a1a1a';
  g.lineWidth = 6;
  g.strokeRect(6, 6, 1028, 208);
  g.fillStyle = '#17409a';
  g.fillRect(9, 9, 84, 202);
  g.fillRect(947, 9, 84, 202);
  g.fillStyle = '#f4c800';
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    g.beginPath();
    g.arc(51 + Math.cos(a) * 24, 62 + Math.sin(a) * 24, 4, 0, 7);
    g.fill();
  }
  g.fillStyle = '#fff';
  g.font = 'bold 54px Arial';
  g.textAlign = 'center';
  g.fillText(country, 51, 178);
  g.fillStyle = '#111';
  g.font = 'bold 150px "Arial Narrow", Arial';
  g.textBaseline = 'middle';
  g.fillText(text, 520, 116);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
