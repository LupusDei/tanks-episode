import { describe, it, expect } from 'vitest';
import { calculateVelocity, updateProjectilePosition, worldToScreen, screenToWorld } from './physics';

describe('physics', () => {
  it('calculateVelocity returns a velocity', () => {
    const vel = calculateVelocity(45, 100);
    expect(vel).toHaveProperty('vx');
    expect(vel).toHaveProperty('vy');
  });

  it('worldToScreen returns a position', () => {
    const pos = worldToScreen({ x: 10, y: 20 }, 0, 0);
    expect(pos).toHaveProperty('x');
    expect(pos).toHaveProperty('y');
  });

  it('screenToWorld returns a position', () => {
    const pos = screenToWorld({ x: 10, y: 20 }, 0, 0);
    expect(pos).toHaveProperty('x');
    expect(pos).toHaveProperty('y');
  });

  it('updateProjectilePosition returns a projectile state', () => {
    const projectile = {
      position: { x: 0, y: 0 },
      velocity: { vx: 1, vy: 1 },
      weaponType: 'standard' as const,
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };
    const result = updateProjectilePosition(projectile, 0.016, 0);
    expect(result).toHaveProperty('position');
  });
});
