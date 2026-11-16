import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('/opt/node-tools/node_modules/playwright');
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 800, height: 500 } });
p.on('pageerror', e => console.log('PAGEERR', e.message));
await p.goto('http://localhost:5173/?q=bassa');
await p.waitForFunction(() => window.__app, null, { timeout: 90000 });
const out = await p.evaluate(() => {
  const { THREE, car } = window.__app, r = new THREE.Raycaster(), res = [];
  const off = car.root.position.x;
  for (const [name, x0, dir, ys] of [['rear', 5, -1, [0.3, 0.36, 0.42, 0.46, 0.5, 0.54, 0.58, 0.62, 0.66, 0.7]], ['front', -1, 1, [0.26, 0.29, 0.32, 0.35, 0.38]]]) {
    for (const y of ys) for (const z of [0, 0.2, 0.3]) {
      r.set(new THREE.Vector3(x0 + off, y, z), new THREE.Vector3(dir, 0, 0));
      const h = r.intersectObject(car.root, true)[0];
      let id = null; for (let o = h && h.object; o; o = o.parent) if (o.userData.partId) { id = o.userData.partId; break; }
      res.push(`${name} y=${y} z=${z} x=${h ? (h.point.x - off).toFixed(3) : '-'} ${id} ${h ? h.object.material.name || h.object.material.type : ''}`);
    }
  }
  return res;
});
console.log(out.join('\n'));
await b.close();
