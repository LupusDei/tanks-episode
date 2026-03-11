import { describe, it, expect } from 'vitest';
import { selectTarget } from './ai.ts';

describe('ai', () => {
  it('placeholder', () => {
    const result = selectTarget(
      { id: '1', name: 'A', position: { x: 0, y: 0 }, barrelAngle: 0, hp: 100, maxHp: 100, color: '#f00', isPlayer: false, isAlive: true, fuel: 100, queuedShot: null },
      [],
    );
    expect(result).toBeNull();
  });
});
