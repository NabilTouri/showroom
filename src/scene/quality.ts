import type * as THREE from 'three';

// Livelli di qualita': scelta automatica all'avvio, discesa automatica se il frame rate e' basso, scelta manuale salvata.
export interface QualityConfig {
  label: string;
  pixelRatio: number;
  post: boolean;
  ao: boolean;
  mirror: number;
  shadow: number;
  beams: boolean;
}
export type QualityLevel = 'alta' | 'media' | 'bassa';

export const LEVELS: Record<QualityLevel, QualityConfig> = {
  alta: {
    label: 'Alta',
    pixelRatio: 2,
    post: true,
    ao: true,
    mirror: 640,
    shadow: 2048,
    beams: true,
  },
  media: {
    label: 'Media',
    pixelRatio: 1.5,
    post: true,
    ao: false,
    mirror: 512,
    shadow: 1024,
    beams: false,
  },
  bassa: {
    label: 'Bassa',
    pixelRatio: 1.25,
    post: false,
    ao: false,
    mirror: 0,
    shadow: 1024,
    beams: false,
  },
};
const ORDER: QualityLevel[] = ['alta', 'media', 'bassa'];
const isLevel = (v: string | null): v is QualityLevel => v !== null && v in LEVELS;
const KEY = 'clio4-qualita';

function softwareGL(gl: WebGLRenderingContext | WebGL2RenderingContext) {
  try {
    const e = gl.getExtension('WEBGL_debug_renderer_info');
    const r = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : '';
    return /swiftshader|llvmpipe|software/i.test(r);
  } catch {
    return false;
  }
}

export type Quality = ReturnType<typeof createQuality>;

export function createQuality(
  renderer: THREE.WebGLRenderer,
  apply: (cfg: QualityConfig, level: QualityLevel) => void,
) {
  const url = new URLSearchParams(location.search).get('q');
  let saved = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    /* storage non disponibile */
  }
  let manual = isLevel(url) || isLevel(saved);
  let level: QualityLevel =
    (isLevel(url) && url) ||
    (isLevel(saved) && saved) ||
    (softwareGL(renderer.getContext())
      ? 'bassa'
      : matchMedia('(pointer: coarse)').matches || innerWidth < 900
        ? 'media'
        : 'alta');
  const q = {
    get level() {
      return level;
    },
    get cfg() {
      return LEVELS[level];
    },
    set(l: QualityLevel, byUser = true) {
      level = l;
      if (byUser) {
        manual = true;
        try {
          localStorage.setItem(KEY, l);
        } catch {
          /* ignora */
        }
      }
      apply(LEVELS[l], l);
    },
    next() {
      q.set(ORDER[(ORDER.indexOf(level) + 1) % ORDER.length]);
    },
    // chiamata a ogni frame animato con il tempo del frame (s): se resta lento, scende di un livello
    slow: 0,
    tick(dt: number) {
      if (manual) return;
      q.slow = dt > 0.045 ? q.slow + 1 : Math.max(0, q.slow - 2);
      if (q.slow > 45 && level !== 'bassa') {
        q.slow = 0;
        q.set(ORDER[ORDER.indexOf(level) + 1], false);
      }
    },
  };
  return q;
}
