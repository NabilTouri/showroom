import { describe, expect, it } from 'vitest';
import type { Language, VehicleDefinition } from '../types';
import { renaultClio4 } from '.';

const vehicle: VehicleDefinition = renaultClio4;
const languages = Object.keys(vehicle.locales) as Language[];

describe.each(languages)('renault-clio-4 texts (%s)', (lng) => {
  const locale = vehicle.locales[lng];

  it('has a text for every card, with one OEM label per OEM code', () => {
    for (const [id, card] of Object.entries(vehicle.cards)) {
      const text = locale.parts[id];
      expect(text, id).toBeDefined();
      expect(text.oem?.length ?? 0, id).toBe(card.oem?.length ?? 0);
    }
    expect(Object.keys(locale.parts).sort()).toEqual(Object.keys(vehicle.cards).sort());
  });

  it('labels every category, view, openable and light switch', () => {
    for (const c of vehicle.categories) expect(locale.categories[c], c).toBeTruthy();
    for (const v of vehicle.views) expect(locale.views[v.id], v.id).toBeTruthy();
    for (const o of vehicle.openables) expect(locale.openables[o], o).toBeTruthy();
    for (const s of vehicle.lights.switches) expect(locale.lights[s.id], s.id).toBeTruthy();
  });

  it('has the same vehicle card shape as English', () => {
    expect(locale.card.specs.length).toBe(vehicle.locales.en.card.specs.length);
    expect(locale.card.credits).toMatch(/<author>.+<\/author>.*<license>.+<\/license>/);
  });
});

describe('renault-clio-4 cards', () => {
  it('use only declared categories', () => {
    for (const [id, card] of Object.entries(vehicle.cards))
      expect(vehicle.categories, id).toContain(card.category);
  });
});
