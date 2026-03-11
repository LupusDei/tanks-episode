import { describe, it, expect } from 'vitest';
import { calculateVelocity } from './physics.ts';

describe('physics', () => {
  it('placeholder', () => {
    const velocity = calculateVelocity(0, 10);
    expect(velocity).toBeDefined();
  });
});
