import { describe, it, expect } from 'vitest';
import { WEAPON_CONFIGS, calculateDamage } from './weapons';

describe('weapons', () => {
  it('WEAPON_CONFIGS has all weapon types', () => {
    expect(WEAPON_CONFIGS).toHaveProperty('standard');
    expect(WEAPON_CONFIGS).toHaveProperty('sniper');
    expect(WEAPON_CONFIGS).toHaveProperty('heavy');
  });

  it('calculateDamage returns a number', () => {
    const damage = calculateDamage('standard', 10, 20);
    expect(typeof damage).toBe('number');
  });
});
