import { describe, it, expect } from 'vitest';
import { calculateAIShot, selectTarget } from './ai';

describe('ai', () => {
  it('calculateAIShot returns a shot', () => {
    const shooter = {
      id: '1', name: 'AI', position: { x: 0, y: 0 },
      barrelAngle: 45, hp: 100, maxHp: 100, color: '#f00',
      isPlayer: false, isAlive: true, fuel: 100, queuedShot: null,
    };
    const target = { ...shooter, id: '2' };
    const shot = calculateAIShot(shooter, target, 'veteran', 0);
    expect(shot).toHaveProperty('angle');
    expect(shot).toHaveProperty('power');
  });

  it('selectTarget returns null for empty tank list', () => {
    const shooter = {
      id: '1', name: 'AI', position: { x: 0, y: 0 },
      barrelAngle: 45, hp: 100, maxHp: 100, color: '#f00',
      isPlayer: false, isAlive: true, fuel: 100, queuedShot: null,
    };
    const result = selectTarget(shooter, []);
    expect(result).toBeNull();
  });
});
