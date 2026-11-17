import { describe, expect, it } from 'vitest';
import { qualifierWords, resolvePart } from './part-cards';
import type { VehicleLocale } from './types';

const cards = {
  wheel: { category: 'wheels' },
  'brake.front': { category: 'brakes' },
  'door.front': { category: 'body' },
  hood: { category: 'body' },
};

describe('resolvePart', () => {
  it('returns the card of an exact id', () => {
    expect(resolvePart(cards, 'hood')).toMatchObject({ cardId: 'hood', qualifiers: [] });
    expect(resolvePart(cards, 'brake.front')).toMatchObject({ cardId: 'brake.front' });
  });

  it('derives qualified parts from the longest base card', () => {
    expect(resolvePart(cards, 'brake.front.left')).toMatchObject({
      cardId: 'brake.front',
      qualifiers: ['left'],
    });
    expect(resolvePart(cards, 'wheel.rear.right')).toMatchObject({
      cardId: 'wheel',
      qualifiers: ['rear', 'right'],
    });
  });

  it('rejects unknown ids and non-qualifier suffixes', () => {
    expect(resolvePart(cards, 'roof')).toBeNull();
    expect(resolvePart(cards, 'roof.left')).toBeNull();
    expect(resolvePart(cards, 'hood.cover')).toBeNull();
  });
});

describe('qualifierWords', () => {
  const locale = {
    qualifiers: { left: 'sinistro', left_female: 'sinistra', front: 'anteriore' },
  } as unknown as VehicleLocale;

  it('uses gendered forms when the card has a gender', () => {
    const door = { name: 'Porta', description: '', gender: 'female' };
    expect(qualifierWords(locale, door, ['front', 'left'])).toBe('anteriore sinistra');
    expect(qualifierWords(locale, { name: 'Specchio', description: '' }, ['left'])).toBe(
      'sinistro',
    );
  });
});
