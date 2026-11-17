import { describe, expect, it } from 'vitest';
import en from './locales/en.json';
import italian from './locales/it.json';

const keys = (o: object, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );

describe('UI locales', () => {
  it('Italian has exactly the English keys', () => {
    expect(keys(italian).sort()).toEqual(keys(en).sort());
  });
});
