// uso: node tools/inspect-glb.mjs <file.glb>  — elenca nodi, mesh, materiali e ingombri
import fs from 'fs';
const buf = fs.readFileSync(process.argv[2]);
const jlen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jlen).toString('utf8'));
console.log('asset', JSON.stringify(json.asset), 'extensions', json.extensionsUsed);
console.log(
  'nodes',
  json.nodes.length,
  'meshes',
  json.meshes.length,
  'materials',
  (json.materials || []).length,
  'textures',
  (json.textures || []).length,
  'images',
  (json.images || []).length,
);
console.log(
  'materials:',
  (json.materials || [])
    .map(
      (m, i) =>
        `${i}:${m.name} ${JSON.stringify(m.pbrMetallicRoughness?.baseColorFactor || '')}${m.alphaMode ? ' ' + m.alphaMode : ''}`,
    )
    .join('\n  '),
);
json.nodes.forEach((n, i) => {
  if (n.mesh === undefined) {
    if (n.children)
      console.log(
        `node ${i} "${n.name}" children=${n.children.length}${n.matrix ? ' matrix=' + n.matrix.map((v) => +v.toFixed(3)).join(',') : ''}${n.scale ? ' scale=' + n.scale : ''}${n.rotation ? ' rot=' + n.rotation.map((v) => +v.toFixed(3)) : ''}`,
      );
    return;
  }
  const m = json.meshes[n.mesh];
  for (const p of m.primitives) {
    const a = json.accessors[p.attributes.POSITION],
      tri = p.indices !== undefined ? json.accessors[p.indices].count / 3 : a.count / 3;
    console.log(
      `node ${i} "${n.name}" mesh "${m.name}" mat=${p.material} tris=${tri} min=${a.min.map((v) => +v.toFixed(2))} max=${a.max.map((v) => +v.toFixed(2))} attrs=${Object.keys(p.attributes).join('/')}`,
    );
  }
});
