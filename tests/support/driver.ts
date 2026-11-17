// In-page test driver: one small API over the app's debug handle, so specs stay independent of
// the handle's shape. Installed with page.addInitScript(installDriver); everything below runs in
// the browser and must stay self-contained (no imports, no closures over Node values).
import type * as THREE from 'three';

export interface ModelView {
  root: THREE.Object3D;
  parts: Record<string, THREE.Object3D>;
  openables: Record<string, { object: THREE.Object3D; axis: string; angle: number }>;
  explode: Record<string, THREE.Vector3 | undefined>;
}

export interface TestDriver {
  ready(): boolean;
  select(id: string | null, focus?: boolean): void;
  /** Localised display name of a scene part's card, or null when the part has no card. */
  partName(id: string): string | null;
  /** Main renderer frame counter: stops increasing once nothing animates. */
  frame(): number;
  model(): ModelView;
}

declare global {
  interface Window {
    __driver: TestDriver;
  }
}

export function installDriver() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  // window.__showroom (current app) or window.__app (original app, see tests/baseline)
  const handle = () => w.__showroom;
  const legacy = () => w.__app;
  const driver: TestDriver = {
    ready: () => !!(handle() || legacy()),
    select: (id, focus = false) => (handle()?.viewer ?? legacy()).select(id, { focus }),
    partName: (id) => (handle() ? handle().partName(id) : (legacy().info[id]?.name ?? null)),
    frame: () => (handle()?.viewer ?? legacy()).renderer.info.render.frame,
    model: () => {
      if (handle()) return handle().viewer.model;
      const car = legacy().car;
      const openables: ModelView['openables'] = {};
      for (const id in car.openables) {
        const o = car.openables[id];
        openables[id] = { object: o, axis: o.userData.open.axis, angle: o.userData.open.angle };
      }
      const explode: ModelView['explode'] = {};
      for (const id in car.parts) explode[id] = car.parts[id].userData.explodeVec;
      return { root: car.root, parts: car.parts, openables, explode };
    },
  };
  w.__driver = driver;
}
