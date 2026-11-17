import type { Viewer } from './viewer/viewer';

/** Debug handle for the console and the browser tests: `window.__showroom.viewer`. */
export interface ShowroomDebugHandle {
  viewer: Viewer;
  /** Localised display name of a scene part's card (current UI language), or null. */
  partName(id: string): string | null;
}

declare global {
  interface Window {
    __showroom?: ShowroomDebugHandle;
  }
}

export function exposeDebugHandle(handle: ShowroomDebugHandle) {
  window.__showroom = handle;
}
