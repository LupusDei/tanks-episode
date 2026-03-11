import { describe, it, expect } from 'vitest';
import { createProjectile, updateProjectile, checkTerrainCollision, checkTankCollision } from './projectile';

describe('projectile', () => {
  it('createProjectile returns a projectile state', () => {
    const proj = createProjectile({ x: 0, y: 0 }, 45, 100, 'standard', 'tank1');
    expect(proj.active).toBe(true);
    expect(proj.ownerTankId).toBe('tank1');
  });

  it('updateProjectile returns a projectile state', () => {
    const proj = createProjectile({ x: 0, y: 0 }, 45, 100, 'standard', 'tank1');
    const updated = updateProjectile(proj, 0.016, 0);
    expect(updated).toHaveProperty('position');
  });

  it('checkTerrainCollision returns false for placeholder', () => {
    const proj = createProjectile({ x: 0, y: 0 }, 45, 100, 'standard', 'tank1');
    const terrain = { heights: [], width: 100, height: 50 };
    expect(checkTerrainCollision(proj, terrain)).toBe(false);
  });

  it('checkTankCollision returns null for placeholder', () => {
    const proj = createProjectile({ x: 0, y: 0 }, 45, 100, 'standard', 'tank1');
    expect(checkTankCollision(proj, [])).toBeNull();
  });
});
