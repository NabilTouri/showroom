// uso: node tools/islands.mjs <file.glb> <nodo> [materiale] — isole connesse di una mesh, in coordinate auto
import fs from 'fs';
const [file, nodeName, matName] = process.argv.slice(2);
const buf = fs.readFileSync(file),
  jlen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jlen).toString('utf8')),
  bin = buf.slice(20 + jlen + 8);
const acc = (i) => {
  const a = json.accessors[i],
    v = json.bufferViews[a.bufferView],
    off = (v.byteOffset || 0) + (a.byteOffset || 0);
  const n = { SCALAR: 1, VEC2: 2, VEC3: 3 }[a.type],
    T = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array }[a.componentType];
  return new T(
    bin.buffer.slice(
      bin.byteOffset + off,
      bin.byteOffset + off + a.count * n * T.BYTES_PER_ELEMENT,
    ),
  );
};
const S = 0.9626;
const node = json.nodes.find((n) => n.name === nodeName);
for (const ci of node.children) {
  const c = json.nodes[ci],
    m = json.meshes[c.mesh],
    p = m.primitives[0],
    mn = json.materials[p.material].name;
  if (matName && mn !== matName) continue;
  const pos = acc(p.attributes.POSITION),
    idx = acc(p.indices),
    nv = pos.length / 3;
  const key = new Map(),
    root = new Int32Array(nv);
  const find = (a) => {
    while (root[a] !== a) a = root[a] = root[root[a]];
    return a;
  };
  for (let i = 0; i < nv; i++) {
    const k = `${pos[i * 3].toFixed(4)},${pos[i * 3 + 1].toFixed(4)},${pos[i * 3 + 2].toFixed(4)}`;
    root[i] = key.has(k) ? key.get(k) : (key.set(k, i), i);
  }
  for (let t = 0; t < idx.length; t += 3) {
    const a = find(idx[t]),
      b = find(idx[t + 1]),
      d = find(idx[t + 2]);
    root[b] = a;
    root[d] = a;
  }
  const isl = new Map();
  for (let t = 0; t < idx.length; t += 3) {
    const r = find(idx[t]);
    let o = isl.get(r);
    if (!o) isl.set(r, (o = { tris: 0, min: [9, 9, 9], max: [-9, -9, -9] }));
    o.tris++;
    for (let k = 0; k < 3; k++) {
      const v = idx[t + k],
        q = [(pos[v * 3 + 1] + 2.226) * S, pos[v * 3 + 2] * S, pos[v * 3] * S];
      for (let j = 0; j < 3; j++) {
        o.min[j] = Math.min(o.min[j], q[j]);
        o.max[j] = Math.max(o.max[j], q[j]);
      }
    }
  }
  console.log(`-- ${mn}: ${idx.length / 3} tri, ${isl.size} isole`);
  [...isl.values()]
    .sort((a, b) => b.tris - a.tris)
    .slice(0, 40)
    .forEach((o) =>
      console.log(
        `  tri=${o.tris} x[${o.min[0].toFixed(2)},${o.max[0].toFixed(2)}] y[${o.min[1].toFixed(2)},${o.max[1].toFixed(2)}] z[${o.min[2].toFixed(2)},${o.max[2].toFixed(2)}]`,
      ),
    );
}
