import type * as THREE from 'three';

// Quality levels: chosen automatically at start, lowered automatically when the frame rate stays
// low, or picked by the user (remembered).
export interface QualityConfig {
  /** Maximum device pixel ratio. */
  pixelRatio: number;
  /** Post-processing (bloom, grading). */
  post: boolean;
  /** Ambient occlusion (needs `post`). */
  ao: boolean;
  /** Floor reflection resolution, 0 = no reflection. */
  mirror: number;
  /** Shadow map size. */
  shadow: number;
}

export const QUALITY_LEVELS = ['high', 'medium', 'low'] as const;
export type QualityLevel = (typeof QUALITY_LEVELS)[number];

export const QUALITY: Record<QualityLevel, QualityConfig> = {
  high: { pixelRatio: 2, post: true, ao: true, mirror: 640, shadow: 2048 },
  medium: { pixelRatio: 1.5, post: true, ao: false, mirror: 512, shadow: 1024 },
  low: { pixelRatio: 1.25, post: false, ao: false, mirror: 0, shadow: 1024 },
};

const STORAGE_KEY = 'showroom.quality';
const isLevel = (v: string | null): v is QualityLevel => v !== null && v in QUALITY;

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

/** Quality controller. The level can be forced with `?q=high|medium|low`. */
export function createQuality(
  renderer: THREE.WebGLRenderer,
  apply: (cfg: QualityConfig, level: QualityLevel) => void,
) {
  const url = new URLSearchParams(location.search).get('q');
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
  let manual = isLevel(url) || isLevel(saved);
  let level: QualityLevel =
    (isLevel(url) && url) ||
    (isLevel(saved) && saved) ||
    (softwareGL(renderer.getContext())
      ? 'low'
      : matchMedia('(pointer: coarse)').matches || innerWidth < 900
        ? 'medium'
        : 'high');
  let slow = 0;
  const q = {
    get level() {
      return level;
    },
    get cfg() {
      return QUALITY[level];
    },
    set(l: QualityLevel, byUser = true) {
      level = l;
      if (byUser) {
        manual = true;
        try {
          localStorage.setItem(STORAGE_KEY, l);
        } catch {
          /* ignore */
        }
      }
      apply(QUALITY[l], l);
    },
    next() {
      q.set(QUALITY_LEVELS[(QUALITY_LEVELS.indexOf(level) + 1) % QUALITY_LEVELS.length]);
    },
    /** Called on every animated frame with its duration (s): steps down while it stays slow. */
    tick(dt: number) {
      if (manual) return;
      slow = dt > 0.045 ? slow + 1 : Math.max(0, slow - 2);
      if (slow > 45 && level !== 'low') {
        slow = 0;
        q.set(QUALITY_LEVELS[QUALITY_LEVELS.indexOf(level) + 1], false);
      }
    },
  };
  return q;
}
