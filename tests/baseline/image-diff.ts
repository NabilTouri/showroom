import type { Page } from '@playwright/test';

export interface ImageDiff {
  width: number;
  height: number;
  /** Pixels where any channel differs by more than `threshold`. */
  diffPixels: number;
  ratio: number;
  maxDelta: number;
  /** PNG (base64) highlighting differing pixels in red over a dimmed copy of the first image. */
  diffPng: string;
}

/** Compares two PNG screenshots with the browser's own decoder (no extra dependencies). */
export async function diffImages(
  page: Page,
  a: Buffer,
  b: Buffer,
  threshold = 24,
): Promise<ImageDiff> {
  return page.evaluate(
    async ({ a, b, threshold }) => {
      const load = async (src: string) => {
        const img = new Image();
        img.src = `data:image/png;base64,${src}`;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const g = c.getContext('2d')!;
        g.drawImage(img, 0, 0);
        return g.getImageData(0, 0, c.width, c.height);
      };
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const { width, height } = ia;
      if (ib.width !== width || ib.height !== height) throw new Error('image sizes differ');
      const out = document.createElement('canvas');
      out.width = width;
      out.height = height;
      const og = out.getContext('2d')!,
        od = og.createImageData(width, height);
      let diffPixels = 0,
        maxDelta = 0;
      for (let i = 0; i < ia.data.length; i += 4) {
        let d = 0;
        for (let k = 0; k < 3; k++) d = Math.max(d, Math.abs(ia.data[i + k] - ib.data[i + k]));
        maxDelta = Math.max(maxDelta, d);
        const hit = d > threshold;
        if (hit) diffPixels++;
        const grey = (ia.data[i] + ia.data[i + 1] + ia.data[i + 2]) / 9;
        od.data[i] = hit ? 255 : grey;
        od.data[i + 1] = hit ? 0 : grey;
        od.data[i + 2] = hit ? 0 : grey;
        od.data[i + 3] = 255;
      }
      og.putImageData(od, 0, 0);
      const diffPng = out.toDataURL('image/png').split(',')[1];
      return { width, height, diffPixels, ratio: diffPixels / (width * height), maxDelta, diffPng };
    },
    { a: a.toString('base64'), b: b.toString('base64'), threshold },
  );
}
