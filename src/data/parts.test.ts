import { describe, expect, it } from 'vitest';
import { getPart } from './parts.js';

describe('getPart', () => {
  it('returns cards by exact id', () => {
    expect(getPart('motore')?.name).toBe('Motore K9K 1.5 dCi');
  });

  it('derives side-specific cards from the base card', () => {
    expect(getPart('porta_ant_sx')?.name).toBe('Porta anteriore sinistra');
    expect(getPart('specchio_dx')?.name).toBe('Specchio retrovisore destro');
    expect(getPart('ruota_post_dx')?.name).toBe('Ruota e pneumatico posteriore destra');
    expect(getPart('freno_ant_sx')?.name).toBe('Freno a disco anteriore sinistro');
  });

  it('returns null for unknown ids', () => {
    expect(getPart('nope')).toBeNull();
    expect(getPart('nope_sx')).toBeNull();
  });
});
