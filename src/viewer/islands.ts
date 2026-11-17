import * as THREE from 'three';

/** Picks a material for a connected island of triangles from its bounding box, or null to keep it. */
export type IslandRule = (box: THREE.Box3) => THREE.Material | null;

/**
 * Splits a mesh into its connected triangle islands (vertices are welded by position) and
 * re-materials the islands the rule recognises, using geometry groups. Boxes are in the mesh's
 * world coordinates.
 */
export function splitIslands(mesh: THREE.Mesh, rule: IslandRule) {
  const g = mesh.geometry,
    pos = g.attributes.position,
    idx = g.index!.array,
    nv = pos.count;
  const root = new Int32Array(nv),
    key = new Map<string, number>();
  const find = (a: number) => {
    while (root[a] !== a) a = root[a] = root[root[a]];
    return a;
  };
  for (let i = 0; i < nv; i++) {
    const k = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
    if (key.has(k)) root[i] = key.get(k)!;
    else {
      key.set(k, i);
      root[i] = i;
    }
  }
  for (let t = 0; t < idx.length; t += 3) {
    const a = find(idx[t]);
    root[find(idx[t + 1])] = a;
    root[find(idx[t + 2])] = a;
  }
  const isl = new Map<number, { tris: number[]; box: THREE.Box3 }>(),
    v = new THREE.Vector3();
  for (let t = 0; t < idx.length; t += 3) {
    const r = find(idx[t]);
    let o = isl.get(r);
    if (!o) isl.set(r, (o = { tris: [], box: new THREE.Box3() }));
    o.tris.push(t);
    for (let k = 0; k < 3; k++)
      o.box.expandByPoint(v.fromBufferAttribute(pos, idx[t + k]).applyMatrix4(mesh.matrixWorld));
  }
  const mats = [mesh.material as THREE.Material],
    lists: number[][] = [[]];
  for (const o of isl.values()) {
    const m = rule(o.box) || (mesh.material as THREE.Material);
    let i = mats.indexOf(m);
    if (i < 0) {
      i = mats.length;
      mats.push(m);
      lists.push([]);
    }
    lists[i].push(...o.tris);
  }
  if (mats.length === 1) return;
  const out = new (idx.constructor as Uint32ArrayConstructor)(idx.length);
  let n = 0;
  g.clearGroups();
  lists.forEach((l, i) => {
    g.addGroup(n, l.length * 3, i);
    for (const t of l) {
      out[n++] = idx[t];
      out[n++] = idx[t + 1];
      out[n++] = idx[t + 2];
    }
  });
  g.setIndex(new THREE.BufferAttribute(out, 1));
  mesh.material = mats;
}

/** True when the box lies inside x/y ranges and within ±zmax of the centre line. */
export const boxWithin = (
  b: THREE.Box3,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  zmax: number,
) =>
  b.min.x >= x0 &&
  b.max.x <= x1 &&
  b.min.y >= y0 &&
  b.max.y <= y1 &&
  Math.max(Math.abs(b.min.z), Math.abs(b.max.z)) <= zmax;
