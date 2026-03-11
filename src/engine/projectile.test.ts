import { describe, it, expect } from 'vitest';
import { createProjectile } from './projectile.ts';
import { WeaponType } from '../types/game.ts';

describe('projectile', () => {
  it('placeholder', () => {
    const projectile = createProjectile(
      { angle: 0, power: 50, weaponType: WeaponType.Standard, ownerTankId: '1' },
      { x: 0, y: 0 },
    );
    expect(projectile).toBeDefined();
  });
});
