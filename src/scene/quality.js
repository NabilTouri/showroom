// Livelli di qualita': scelta automatica all'avvio, discesa automatica se il frame rate e' basso, scelta manuale salvata.
export const LEVELS = {
  alta: { label: 'Alta', pixelRatio: 2, post: true, ao: true, mirror: 640, shadow: 2048, beams: true },
  media: { label: 'Media', pixelRatio: 1.5, post: true, ao: false, mirror: 512, shadow: 1024, beams: false },
  bassa: { label: 'Bassa', pixelRatio: 1.25, post: false, ao: false, mirror: 0, shadow: 1024, beams: false },
};
const ORDER = ['alta', 'media', 'bassa'];
const KEY = 'clio4-qualita';

function softwareGL(gl) {
  try {
    const e = gl.getExtension('WEBGL_debug_renderer_info');
    const r = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : '';
    return /swiftshader|llvmpipe|software/i.test(r);
  } catch { return false; }
}

export function createQuality(renderer, apply) {
  const url = new URLSearchParams(location.search).get('q');
  let saved = null; try { saved = localStorage.getItem(KEY); } catch { /* storage non disponibile */ }
  let manual = !!(url && LEVELS[url]) || !!(saved && LEVELS[saved]);
  let level = (url && LEVELS[url] && url) || (saved && LEVELS[saved] && saved)
    || (softwareGL(renderer.getContext()) ? 'bassa' : (matchMedia('(pointer: coarse)').matches || innerWidth < 900 ? 'media' : 'alta'));
  const q = {
    get level() { return level; }, get cfg() { return LEVELS[level]; },
    set(l, byUser = true) {
      level = l; if (byUser) { manual = true; try { localStorage.setItem(KEY, l); } catch { /* ignora */ } }
      apply(LEVELS[l], l);
    },
    next() { q.set(ORDER[(ORDER.indexOf(level) + 1) % ORDER.length]); },
    // chiamata a ogni frame animato con il tempo del frame (s): se resta lento, scende di un livello
    slow: 0,
    tick(dt) {
      if (manual) return;
      q.slow = dt > 0.045 ? q.slow + 1 : Math.max(0, q.slow - 2);
      if (q.slow > 45 && level !== 'bassa') { q.slow = 0; q.set(ORDER[ORDER.indexOf(level) + 1], false); }
    },
  };
  return q;
}
