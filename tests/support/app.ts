import { expect, type Locator, type Page } from '@playwright/test';
import { installDriver } from './driver';

export interface OpenOptions {
  /** Quality level forced through the `q` query parameter. */
  quality?: string;
  /** UI language stored before the app starts (ignored by apps without i18n). */
  language?: 'en' | 'it';
}

export async function openApp(
  page: Page,
  url: string,
  { quality = 'low', language }: OpenOptions = {},
) {
  await page.addInitScript(installDriver);
  if (language)
    await page.addInitScript((lng) => localStorage.setItem('showroom.language', lng), language);
  await page.goto(`${url}${url.includes('?') ? '&' : '?'}q=${quality}`);
  await page.waitForFunction(() => window.__driver?.ready(), null, { timeout: 120_000 });
  await waitForSettled(page);
}

/** Waits until the main view stops re-rendering (camera flights, openings, explode, paint fades). */
export async function waitForSettled(page: Page, quietMs = 700) {
  await expect
    .poll(
      async () => {
        const a = await page.evaluate(() => window.__driver.frame());
        await page.waitForTimeout(quietMs);
        const b = await page.evaluate(() => window.__driver.frame());
        return a === b;
      },
      { timeout: 150_000, intervals: [100] },
    )
    .toBe(true);
}

/** Clicks through a DOM event: avoids pointer actionability waits while WebGL saturates the CPU. */
export async function press(target: Locator) {
  await target.evaluate((el: HTMLElement) => el.click());
}

/** Collects page errors and console errors (the browser's own favicon request is not an app error). */
export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.location().url.endsWith('/favicon.ico')) errors.push(m.text());
  });
  return errors;
}
