// Old-vs-new comparison: the refactored app must build the same scene and render the same frames
// as the original app (commit 7885117, see tests/baseline/README.md).
import { test, expect, type Browser, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { collectErrors, openApp, press, waitForSettled } from '../support/app';
import { diffImages } from './image-diff';
import { mapId } from './id-map';
import { dumpScene, type SceneDump } from './scene-dump';

const OLD_URL = process.env.BASELINE_URL ?? 'http://localhost:4174/';
const NEW_URL = process.env.APP_URL ?? 'http://localhost:4173/';
const OUT = path.resolve('test-results/baseline');
const MAX_DIFF_RATIO = Number(process.env.BASELINE_MAX_DIFF ?? 0.001);

type Which = 'old' | 'new';
interface State {
  name: string;
  quality?: 'alta' | 'media' | 'bassa';
  mobile?: boolean;
  run?: (page: Page, which: Which) => Promise<void>;
}

const select = (page: Page, oldId: string, which: Which, focus = false) =>
  page.evaluate(([id, f]) => window.__driver.select(id, f), [
    which === 'old' ? oldId : mapId(oldId),
    focus,
  ] as const);
const view = (page: Page, index: number) => press(page.locator('#views button').nth(index));

const STATES: State[] = [
  { name: 'initial' },
  { name: 'initial-high', quality: 'alta' },
  { name: 'hood-selected', run: (p, w) => select(p, 'cofano', w) },
  {
    name: 'engine-turbo',
    run: async (p, w) => {
      await view(p, 5);
      await waitForSettled(p);
      await select(p, 'turbo', w, true);
    },
  },
  { name: 'exploded-engine', run: (p) => press(p.locator('#btn-explode')) },
  { name: 'xray', run: (p) => press(p.locator('#btn-xray')) },
  { name: 'all-open', run: (p) => press(p.locator('#btn-openall')) },
  {
    name: 'rear-lights',
    run: async (p) => {
      await view(p, 3);
      for (const i of [1, 3, 4]) await press(p.locator('#lights input').nth(i));
    },
  },
  { name: 'paint', run: (p) => press(p.locator('#colors button').nth(1)) },
  { name: 'colour-menu', run: (p) => press(p.locator('#btn-colormenu')) },
  { name: 'vehicle-card', run: (p) => press(p.locator('#btn-vehicle')) },
  { name: 'mobile-battery', mobile: true, run: (p, w) => select(p, 'batteria', w, true) },
  { name: 'mobile-list', mobile: true, run: (p) => press(p.locator('#btn-list')) },
];

async function capture(browser: Browser, which: Which, state: State) {
  const context = await browser.newContext({
    viewport: state.mobile ? { width: 390, height: 780 } : { width: 1440, height: 820 },
  });
  const page = await context.newPage();
  const errors = collectErrors(page);
  await openApp(page, which === 'old' ? OLD_URL : NEW_URL, {
    quality: state.quality ?? 'bassa',
    language: 'it',
  });
  await state.run?.(page, which);
  await waitForSettled(page);
  // the isolated-part preview auto-rotates once per frame: its angle is not reproducible
  const shot = await page.screenshot({ mask: [page.locator('.pv canvas')] });
  await context.close();
  return { shot, errors };
}

/** Sorts ids and, for the original app, translates them to the current ids. */
function normalise(d: SceneDump, translate: boolean): SceneDump {
  const id = (k: string) => (translate ? mapId(k) : k);
  const rename = <T>(rec: Record<string, T>) =>
    Object.fromEntries(
      Object.entries(rec)
        .map(([k, v]) => [id(k), v] as const)
        .sort(([a], [b]) => (a < b ? -1 : 1)),
    );
  const parts = rename(d.parts);
  for (const p of Object.values(parts)) p.parent = p.parent && id(p.parent);
  return { parts, openables: rename(d.openables), unassigned: d.unassigned };
}

test.describe.configure({ mode: 'serial' });
test.beforeAll(() => fs.mkdirSync(OUT, { recursive: true }));

test('scene structure matches the original app', async ({ browser }) => {
  const dumps: SceneDump[] = [];
  for (const which of ['old', 'new'] as const) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await openApp(page, which === 'old' ? OLD_URL : NEW_URL, { language: 'it' });
    const d = await page.evaluate(dumpScene);
    dumps.push(normalise(d, which === 'old'));
    fs.writeFileSync(path.join(OUT, `scene-${which}.json`), JSON.stringify(d, null, 1));
    await context.close();
  }
  const [oldDump, newDump] = dumps;
  expect(Object.keys(newDump.parts)).toEqual(Object.keys(oldDump.parts));
  for (const id of Object.keys(oldDump.parts))
    expect(newDump.parts[id], id).toEqual(oldDump.parts[id]);
  expect(newDump.openables).toEqual(oldDump.openables);
  expect(newDump.unassigned).toEqual(oldDump.unassigned);
});

for (const state of STATES) {
  test(`screenshot: ${state.name}`, async ({ browser }) => {
    const old = await capture(browser, 'old', state);
    const now = await capture(browser, 'new', state);
    const page = await browser.newPage();
    const diff = await diffImages(page, old.shot, now.shot);
    await page.close();
    fs.writeFileSync(path.join(OUT, `${state.name}-old.png`), old.shot);
    fs.writeFileSync(path.join(OUT, `${state.name}-new.png`), now.shot);
    fs.writeFileSync(path.join(OUT, `${state.name}-diff.png`), Buffer.from(diff.diffPng, 'base64'));
    const summary = {
      state: state.name,
      diffPixels: diff.diffPixels,
      ratio: diff.ratio,
      maxDelta: diff.maxDelta,
    };
    fs.appendFileSync(path.join(OUT, 'summary.jsonl'), JSON.stringify(summary) + '\n');
    console.log(JSON.stringify(summary));
    expect(now.errors).toEqual([]);
    expect(diff.ratio).toBeLessThanOrEqual(MAX_DIFF_RATIO);
  });
}
