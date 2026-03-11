import { describe, it, expect } from 'vitest';
import { createExplosion } from './explosion.ts';
import { WeaponType } from '../types/game.ts';

describe('explosion', () => {
  it('placeholder', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, WeaponType.Standard, 30);
    expect(explosion).toBeDefined();
  });
});
