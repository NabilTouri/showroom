// Hover and selection highlight: meshes temporarily get emissive clones of their materials.
import * as THREE from 'three';

export type HighlightMode = 'selected' | 'hovered';

/** The material properties the highlight reads or writes (all optional on THREE.Material). */
export type AnyMaterial = THREE.Material & {
  color?: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  emissiveMap?: THREE.Texture | null;
  metalness?: number;
  roughness?: number;
};

export class Highlighter {
  private cache = new Map<string, AnyMaterial>();
  private original = new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>();

  private clone(mat: AnyMaterial, mode: HighlightMode) {
    const key = mat.uuid + mode;
    let m = this.cache.get(key);
    if (!m) {
      m = mat.clone() as AnyMaterial;
      m.onBeforeCompile = mat.onBeforeCompile;
      m.customProgramCacheKey = mat.customProgramCacheKey;
      if (m.emissive) {
        m.emissive = new THREE.Color(mode === 'selected' ? 0x2f7dff : 0xffffff);
        m.emissiveIntensity = mode === 'selected' ? 0.55 : 0.16;
        m.emissiveMap = null;
      }
      if (mode === 'selected' && m.transparent && m.opacity < 0.3) m.opacity = 0.5;
      this.cache.set(key, m);
    }
    return m;
  }

  /** Material of a mesh without highlight. */
  originalOf(mesh: THREE.Mesh) {
    return this.original.get(mesh) || mesh.material;
  }

  set(object: THREE.Object3D, mode: HighlightMode | null) {
    object.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      if (!this.original.has(o)) this.original.set(o, o.material);
      const base = this.original.get(o)!;
      o.material = mode
        ? Array.isArray(base)
          ? base.map((b) => this.clone(b, mode))
          : this.clone(base, mode)
        : base;
    });
  }

  /** Drops the cached clones (after the source materials changed, e.g. x-ray). */
  clear() {
    this.cache.forEach((m) => m.dispose());
    this.cache.clear();
  }

  /** Copies colour, metalness and roughness of `source` to its clones (animated paint). */
  sync(source: AnyMaterial) {
    this.cache.forEach((m, key) => {
      if (!key.startsWith(source.uuid)) return;
      m.color!.copy(source.color!);
      m.metalness = source.metalness;
      m.roughness = source.roughness;
    });
  }
}
