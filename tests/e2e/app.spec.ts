import { expect, test } from '@playwright/test';
import { collectErrors, openApp, press, waitForSettled } from '../support/app';

test.describe('desktop', () => {
  test('loads without errors and every scene part has a card', async ({ page }) => {
    const errors = collectErrors(page);
    await openApp(page, '/');
    await expect(page.locator('#loading')).toHaveClass(/done/);
    const missing = await page.evaluate(() =>
      Object.keys(window.__driver.model().parts).filter((id) => !window.__driver.partName(id)),
    );
    expect(missing).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('selecting from the list opens the part panel', async ({ page }) => {
    await openApp(page, '/');
    const item = page.locator('#cats .item').first();
    const name = await item.textContent();
    await press(item);
    await expect(page.locator('#panel')).toBeVisible();
    await expect(page.locator('#panel h2')).toHaveText(name!);
    await expect(item).toHaveClass(/sel/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#panel')).toBeHidden();
  });

  test('search filters the list by name and description', async ({ page }) => {
    await openApp(page, '/');
    const all = await page.locator('#cats .item').count();
    await page.locator('#search').fill('turbo');
    const filtered = await page.locator('#cats .item:visible').count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(all);
  });

  test('toolbar toggles: open all, x-ray, explode, paint, lights', async ({ page }) => {
    await openApp(page, '/');
    const openAll = page.locator('#btn-openall');
    const closedLabel = await openAll.textContent();
    await press(openAll);
    await expect(openAll).not.toHaveText(closedLabel!);
    await expect(page.locator('#openables input:not(:checked)')).toHaveCount(0);
    await waitForSettled(page);

    await press(page.locator('#btn-xray'));
    await expect(page.locator('#btn-xray')).toHaveClass(/on/);
    await press(page.locator('#btn-explode'));
    await expect(page.locator('#btn-explode')).toHaveClass(/on/);
    await waitForSettled(page);

    const swatch = page.locator('#colors button').nth(2);
    await press(swatch);
    await expect(swatch).toHaveClass(/on/);
    await expect(page.locator('#colors button.on')).toHaveCount(1);

    const lowBeam = page.locator('#lights input').nth(1);
    await expect(lowBeam).not.toBeChecked();
    await press(lowBeam);
    await expect(lowBeam).toBeChecked();
    await waitForSettled(page);
  });

  test('vehicle card opens in the panel', async ({ page }) => {
    await openApp(page, '/');
    await press(page.locator('#btn-vehicle'));
    await expect(page.locator('#panel')).toBeVisible();
    await expect(page.locator('#panel table.sp tr')).not.toHaveCount(0);
    await press(page.locator('#panel-close'));
    await expect(page.locator('#panel')).toBeHidden();
  });
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 780 } });

  test('list opens from the menu button and the panel is a bottom sheet', async ({ page }) => {
    await openApp(page, '/');
    await expect(page.locator('#list')).toBeHidden();
    await expect(page.locator('#hint')).toBeHidden();
    await press(page.locator('#btn-list'));
    await expect(page.locator('#list')).toBeVisible();
    await press(page.locator('#cats .item').first());
    await expect(page.locator('#list')).toBeHidden();
    const panel = await page.locator('#panel').boundingBox();
    expect(panel!.x).toBe(0);
    expect(panel!.y + panel!.height).toBeCloseTo(780, 0);
  });
});
