// uso: node tools/shot.mjs <nome> "<px,py,pz,tx,ty,tz>" ["js da eseguire"]
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)(process.env.PW || 'playwright');
const [name, cam, js] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
p.on('console', m => { if (m.type() === 'error') console.log('ERR', m.text()); });
p.on('pageerror', e => console.log('PAGEERR', e.message));
await p.goto(process.env.URL || 'http://localhost:5173/');
await p.waitForFunction(() => window.__app, null, { timeout: 60000 });
const views = cam.split('|');
let i = 0;
for (const v of views) {
  const c = v.split(',').map(Number);
  await p.evaluate(({ c, js }) => { const a = window.__app; a.camera.position.set(c[0], c[1], c[2]); a.controls.target.set(c[3], c[4], c[5]); a.controls.update(); if (js) eval(js); }, { c, js });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `shots/${name}${views.length > 1 ? i : ''}.png` }); i++;
}
await b.close();
