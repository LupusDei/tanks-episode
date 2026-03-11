import { describe, it, expect } from 'vitest';
import {
  WEAPON_CONFIGS,
  ECONOMY,
  DIFFICULTY_MULTIPLIERS,
  calculateDamage,
  calculateEarnings,
} from './weapons';
import type { TankState } from '../types/game';

function makeTank(overrides: Partial<TankState> = {}): TankState {
  return {
    id: 'tank-1',
    name: 'Tank 1',
    position: { x: 100, y: 100 },
    barrelAngle: 45,
    hp: 100,
    maxHp: 100,
    color: '#FF0000',
    isPlayer: true,
    isAlive: true,
    fuel: 100,
    queuedShot: null,
    ...overrides,
  };
}

describe('WEAPON_CONFIGS', () => {
  it('has all weapon types', () => {
    expect(WEAPON_CONFIGS).toHaveProperty('standard');
    expect(WEAPON_CONFIGS).toHaveProperty('sniper');
    expect(WEAPON_CONFIGS).toHaveProperty('heavy');
  });

  it('standard shell: 35 damage, 20px blast, cost 0', () => {
    const s = WEAPON_CONFIGS.standard;
    expect(s.damage).toBe(35);
    expect(s.blastRadius).toBe(20);
    expect(s.cost).toBe(0);
    expect(s.ammo).toBe(Infinity);
  });

  it('sniper shot: 100 damage (instant kill), 12px blast, cost 200', () => {
    const s = WEAPON_CONFIGS.sniper;
    expect(s.damage).toBe(100);
    expect(s.blastRadius).toBe(12);
    expect(s.cost).toBe(200);
    expect(s.ammo).toBe(0);
  });

  it('heavy artillery: 65 damage, 35px blast, cost 250', () => {
    const h = WEAPON_CONFIGS.heavy;
    expect(h.damage).toBe(65);
    expect(h.blastRadius).toBe(35);
    expect(h.cost).toBe(250);
    expect(h.ammo).toBe(0);
  });
});

describe('calculateDamage', () => {
  it('applies damage to a tank within blast radius', () => {
    const tank = makeTank({ id: 'a', position: { x: 100, y: 100 } });
    const results = calculateDamage({ x: 105, y: 100 }, [tank], WEAPON_CONFIGS.standard);
    expect(results).toHaveLength(1);
    const r = results[0]!;
    expect(r.tankId).toBe('a');
    expect(r.damage).toBe(35); // 35% of 100 maxHp
    expect(r.killed).toBe(false);
  });

  it('does NOT apply damage to tanks outside blast radius', () => {
    const tank = makeTank({ id: 'a', position: { x: 200, y: 200 } });
    const results = calculateDamage({ x: 0, y: 0 }, [tank], WEAPON_CONFIGS.standard);
    expect(results).toHaveLength(0);
  });

  it('applies damage to multiple tanks within blast radius', () => {
    const tanks = [
      makeTank({ id: 'a', position: { x: 100, y: 100 } }),
      makeTank({ id: 'b', position: { x: 110, y: 100 } }),
    ];
    const results = calculateDamage({ x: 105, y: 100 }, tanks, WEAPON_CONFIGS.standard);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.tankId).sort()).toEqual(['a', 'b']);
  });

  it('does NOT apply damage to dead tanks', () => {
    const tank = makeTank({ id: 'a', position: { x: 100, y: 100 }, isAlive: false });
    const results = calculateDamage({ x: 100, y: 100 }, [tank], WEAPON_CONFIGS.standard);
    expect(results).toHaveLength(0);
  });

  it('sniper shot kills a full-hp tank (100% of maxHp)', () => {
    const tank = makeTank({ id: 'a', position: { x: 100, y: 100 }, hp: 100, maxHp: 100 });
    const results = calculateDamage({ x: 100, y: 100 }, [tank], WEAPON_CONFIGS.sniper);
    expect(results).toHaveLength(1);
    const r = results[0]!;
    expect(r.damage).toBe(100);
    expect(r.killed).toBe(true);
  });

  it('heavy artillery applies 65% damage', () => {
    const tank = makeTank({ id: 'a', position: { x: 100, y: 100 }, hp: 100, maxHp: 100 });
    const results = calculateDamage({ x: 100, y: 100 }, [tank], WEAPON_CONFIGS.heavy);
    const r = results[0]!;
    expect(r.damage).toBe(65);
    expect(r.killed).toBe(false);
  });

  it('killed flag is true when hp - damage <= 0', () => {
    const tank = makeTank({ id: 'a', position: { x: 100, y: 100 }, hp: 30, maxHp: 100 });
    const results = calculateDamage({ x: 100, y: 100 }, [tank], WEAPON_CONFIGS.standard);
    // damage = 35, hp = 30, so 30 - 35 = -5 <= 0
    expect(results[0]!.killed).toBe(true);
  });

  it('killed flag is false when hp - damage > 0', () => {
    const tank = makeTank({ id: 'a', position: { x: 100, y: 100 }, hp: 100, maxHp: 100 });
    const results = calculateDamage({ x: 100, y: 100 }, [tank], WEAPON_CONFIGS.standard);
    // damage = 35, hp = 100, so 100 - 35 = 65 > 0
    expect(results[0]!.killed).toBe(false);
  });

  it('tank exactly at blast radius edge still takes damage', () => {
    const tank = makeTank({ id: 'a', position: { x: 120, y: 100 } });
    // distance = 20, blastRadius = 20
    const results = calculateDamage({ x: 100, y: 100 }, [tank], WEAPON_CONFIGS.standard);
    expect(results).toHaveLength(1);
  });

  it('tank just outside blast radius takes no damage', () => {
    const tank = makeTank({ id: 'a', position: { x: 121, y: 100 } });
    // distance = 21, blastRadius = 20
    const results = calculateDamage({ x: 100, y: 100 }, [tank], WEAPON_CONFIGS.standard);
    expect(results).toHaveLength(0);
  });

  it('returns empty array for empty tank list', () => {
    const results = calculateDamage({ x: 100, y: 100 }, [], WEAPON_CONFIGS.standard);
    expect(results).toEqual([]);
  });

  it('damage scales with maxHp', () => {
    const tank = makeTank({ id: 'a', position: { x: 100, y: 100 }, hp: 200, maxHp: 200 });
    const results = calculateDamage({ x: 100, y: 100 }, [tank], WEAPON_CONFIGS.standard);
    // 35% of 200 = 70
    expect(results[0]!.damage).toBe(70);
  });
});

describe('ECONOMY', () => {
  it('has correct values', () => {
    expect(ECONOMY.startingBalance).toBe(500);
    expect(ECONOMY.killReward).toBe(200);
    expect(ECONOMY.winBonus).toBe(250);
    expect(ECONOMY.lossConsolation).toBe(50);
  });
});

describe('DIFFICULTY_MULTIPLIERS', () => {
  it('blindFool is 0.5', () => expect(DIFFICULTY_MULTIPLIERS.blindFool).toBe(0.5));
  it('private is 0.75', () => expect(DIFFICULTY_MULTIPLIERS.private).toBe(0.75));
  it('veteran is 1.0', () => expect(DIFFICULTY_MULTIPLIERS.veteran).toBe(1.0));
  it('centurion is 1.25', () => expect(DIFFICULTY_MULTIPLIERS.centurion).toBe(1.25));
  it('primus is 1.5', () => expect(DIFFICULTY_MULTIPLIERS.primus).toBe(1.5));
});

describe('calculateEarnings', () => {
  it('2 kills, won, Veteran = 650', () => {
    expect(calculateEarnings(2, true, 'veteran')).toBe(650);
  });

  it('1 kill, lost, Blind Fool = 125', () => {
    expect(calculateEarnings(1, false, 'blindFool')).toBe(125);
  });

  it('0 kills, won, Primus = 375', () => {
    // (0*200 + 250) * 1.5 = 375
    expect(calculateEarnings(0, true, 'primus')).toBe(375);
  });

  it('0 kills, lost, Private = 38', () => {
    // (0*200 + 50) * 0.75 = 37.5, rounded = 38
    expect(calculateEarnings(0, false, 'private')).toBe(38);
  });

  it('3 kills, won, Centurion = 1063', () => {
    // (3*200 + 250) * 1.25 = 850 * 1.25 = 1062.5, rounded = 1063
    expect(calculateEarnings(3, true, 'centurion')).toBe(1063);
  });

  it('5 kills, lost, Primus = 1575', () => {
    // (5*200 + 50) * 1.5 = 1050 * 1.5 = 1575
    expect(calculateEarnings(5, false, 'primus')).toBe(1575);
  });

  it('returns integer value (rounds result)', () => {
    const result = calculateEarnings(0, false, 'private');
    expect(Number.isInteger(result)).toBe(true);
  });
});
