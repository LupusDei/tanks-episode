import { describe, it, expect } from 'vitest';
import { createExplosion, updateExplosion } from './explosion';

describe('explosion', () => {
  it('createExplosion returns an explosion state', () => {
    const explosion = createExplosion({ x: 50, y: 50 }, 20, 'standard');
    expect(explosion.phase).toBe('growing');
    expect(explosion.maxRadius).toBe(20);
  });

  it('updateExplosion returns an explosion state', () => {
    const explosion = createExplosion({ x: 50, y: 50 }, 20, 'standard');
    const updated = updateExplosion(explosion, 0.016);
    expect(updated).toHaveProperty('phase');
  });
});
