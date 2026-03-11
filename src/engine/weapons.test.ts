import { describe, it, expect } from 'vitest';
import {
  WEAPON_CONFIGS,
  ECONOMY,
  DIFFICULTY_MULTIPLIERS,
  calculateDamage,
  calculateEarnings,
} from './weapons.ts';
import { WeaponType, AIDifficulty } from '../types/game.ts';
import type { TankState } from '../types/game.ts';

// ── Test helpers ──────────────────────────────────────────────────────────

function makeTank(overrides: Partial<TankState> = {}): TankState {
  return {
    id: 'tank-1',
    name: 'Test Tank',
    position: { x: 100, y: 100 },
    barrelAngle: 45,
    hp: 100,
    maxHp: 100,
    color: '#ff0000',
    isPlayer: true,
    isAlive: true,
    fuel: 100,
    queuedShot: null,
    ...overrides,
  };
}

// ── WEAPON_CONFIGS ────────────────────────────────────────────────────────

describe('WEAPON_CONFIGS', () => {
  describe('Standard Shell', () => {
    const standard = WEAPON_CONFIGS[WeaponType.Standard];

    it('has correct damage', () => {
      expect(standard.damage).toBe(35);
    });

    it('has correct blast radius', () => {
      expect(standard.blastRadius).toBe(20);
    });

    it('has zero cost', () => {
      expect(standard.cost).toBe(0);
    });

    it('has infinite ammo', () => {
      expect(standard.ammo).toBe(Infinity);
    });

    it('has speed multiplier of 1.0', () => {
      expect(standard.speedMultiplier).toBe(1.0);
    });

    it('has correct name and description', () => {
      expect(standard.name).toBe('Standard Shell');
      expect(standard.description).toBe('Basic explosive shell. Reliable and free.');
    });

    it('has correct explosion colors', () => {
      expect(standard.explosionColor).toEqual({ center: '#FF4400', outer: '#FF8800' });
    });
  });

  describe('Sniper Shot', () => {
    const sniper = WEAPON_CONFIGS[WeaponType.Sniper];

    it('has 100% damage (instant kill)', () => {
      expect(sniper.damage).toBe(100);
    });

    it('has blast radius of 12', () => {
      expect(sniper.blastRadius).toBe(12);
    });

    it('costs 200', () => {
      expect(sniper.cost).toBe(200);
    });

    it('has 0 starting ammo', () => {
      expect(sniper.ammo).toBe(0);
    });

    it('has speed multiplier of 1.3', () => {
      expect(sniper.speedMultiplier).toBe(1.3);
    });

    it('has correct explosion colors', () => {
      expect(sniper.explosionColor).toEqual({ center: '#FFFFFF', outer: '#4488FF' });
    });
  });

  describe('Heavy Artillery', () => {
    const heavy = WEAPON_CONFIGS[WeaponType.Heavy];

    it('has damage of 65', () => {
      expect(heavy.damage).toBe(65);
    });

    it('has blast radius of 35', () => {
      expect(heavy.blastRadius).toBe(35);
    });

    it('costs 250', () => {
      expect(heavy.cost).toBe(250);
    });

    it('has 0 starting ammo', () => {
      expect(heavy.ammo).toBe(0);
    });

    it('has speed multiplier of 0.8', () => {
      expect(heavy.speedMultiplier).toBe(0.8);
    });

    it('has correct explosion colors', () => {
      expect(heavy.explosionColor).toEqual({ center: '#FF2200', outer: '#FF6600' });
    });
  });
});

// ── calculateDamage ───────────────────────────────────────────────────────

describe('calculateDamage', () => {
  const standardWeapon = WEAPON_CONFIGS[WeaponType.Standard];
  const sniperWeapon = WEAPON_CONFIGS[WeaponType.Sniper];

  it('applies damage to tanks within blast radius', () => {
    const tank = makeTank({ position: { x: 105, y: 100 } });
    const results = calculateDamage({ x: 100, y: 100 }, [tank], standardWeapon);

    expect(results).toHaveLength(1);
    expect(results[0]!.tankId).toBe('tank-1');
    expect(results[0]!.damage).toBe(35); // 35% of 100 maxHp
  });

  it('does not apply damage to tanks outside blast radius', () => {
    const tank = makeTank({ position: { x: 200, y: 200 } });
    const results = calculateDamage({ x: 100, y: 100 }, [tank], standardWeapon);

    expect(results).toHaveLength(0);
  });

  it('applies damage to multiple tanks within blast radius', () => {
    const tank1 = makeTank({ id: 'tank-1', position: { x: 105, y: 100 } });
    const tank2 = makeTank({ id: 'tank-2', position: { x: 95, y: 100 } });
    const results = calculateDamage({ x: 100, y: 100 }, [tank1, tank2], standardWeapon);

    expect(results).toHaveLength(2);
    expect(results[0]!.tankId).toBe('tank-1');
    expect(results[1]!.tankId).toBe('tank-2');
  });

  it('does not damage dead tanks', () => {
    const deadTank = makeTank({ isAlive: false, position: { x: 100, y: 100 } });
    const results = calculateDamage({ x: 100, y: 100 }, [deadTank], standardWeapon);

    expect(results).toHaveLength(0);
  });

  it('calculates damage as percentage of maxHp', () => {
    const tank = makeTank({ hp: 100, maxHp: 100, position: { x: 100, y: 100 } });
    const results = calculateDamage({ x: 100, y: 100 }, [tank], standardWeapon);

    expect(results[0]!.damage).toBe(35); // 35% of 100
  });

  it('sniper kills in one hit (100% damage)', () => {
    const tank = makeTank({ hp: 100, maxHp: 100, position: { x: 100, y: 100 } });
    const results = calculateDamage({ x: 100, y: 100 }, [tank], sniperWeapon);

    expect(results[0]!.damage).toBe(100);
    expect(results[0]!.killed).toBe(true);
  });

  it('marks killed when damage exceeds remaining hp', () => {
    const tank = makeTank({ hp: 30, maxHp: 100, position: { x: 100, y: 100 } });
    const results = calculateDamage({ x: 100, y: 100 }, [tank], standardWeapon);

    expect(results[0]!.killed).toBe(true);
  });

  it('does not mark killed when tank survives', () => {
    const tank = makeTank({ hp: 100, maxHp: 100, position: { x: 100, y: 100 } });
    const results = calculateDamage({ x: 100, y: 100 }, [tank], standardWeapon);

    expect(results[0]!.killed).toBe(false);
  });

  it('applies damage at exact blast radius boundary', () => {
    // Standard blast radius = 20, place tank exactly 20 units away
    const tank = makeTank({ position: { x: 120, y: 100 } });
    const results = calculateDamage({ x: 100, y: 100 }, [tank], standardWeapon);

    expect(results).toHaveLength(1);
  });

  it('does not apply damage just outside blast radius', () => {
    // Standard blast radius = 20, place tank 21 units away
    const tank = makeTank({ position: { x: 121, y: 100 } });
    const results = calculateDamage({ x: 100, y: 100 }, [tank], standardWeapon);

    expect(results).toHaveLength(0);
  });

  it('returns empty array when no tanks provided', () => {
    const results = calculateDamage({ x: 100, y: 100 }, [], standardWeapon);
    expect(results).toHaveLength(0);
  });

  it('only damages alive tanks in mixed alive/dead group', () => {
    const alive = makeTank({ id: 'alive', position: { x: 100, y: 100 }, isAlive: true });
    const dead = makeTank({ id: 'dead', position: { x: 100, y: 100 }, isAlive: false });
    const results = calculateDamage({ x: 100, y: 100 }, [alive, dead], standardWeapon);

    expect(results).toHaveLength(1);
    expect(results[0]!.tankId).toBe('alive');
  });
});

// ── ECONOMY ───────────────────────────────────────────────────────────────

describe('ECONOMY', () => {
  it('has starting balance of 500', () => {
    expect(ECONOMY.startingBalance).toBe(500);
  });

  it('has kill reward of 200', () => {
    expect(ECONOMY.killReward).toBe(200);
  });

  it('has win bonus of 250', () => {
    expect(ECONOMY.winBonus).toBe(250);
  });

  it('has loss consolation of 50', () => {
    expect(ECONOMY.lossConsolation).toBe(50);
  });
});

// ── DIFFICULTY_MULTIPLIERS ────────────────────────────────────────────────

describe('DIFFICULTY_MULTIPLIERS', () => {
  it('BlindFool multiplier is 0.5', () => {
    expect(DIFFICULTY_MULTIPLIERS[AIDifficulty.BlindFool]).toBe(0.5);
  });

  it('Private multiplier is 0.75', () => {
    expect(DIFFICULTY_MULTIPLIERS[AIDifficulty.Private]).toBe(0.75);
  });

  it('Veteran multiplier is 1.0', () => {
    expect(DIFFICULTY_MULTIPLIERS[AIDifficulty.Veteran]).toBe(1.0);
  });

  it('Centurion multiplier is 1.25', () => {
    expect(DIFFICULTY_MULTIPLIERS[AIDifficulty.Centurion]).toBe(1.25);
  });

  it('Primus multiplier is 1.5', () => {
    expect(DIFFICULTY_MULTIPLIERS[AIDifficulty.Primus]).toBe(1.5);
  });
});

// ── calculateEarnings ─────────────────────────────────────────────────────

describe('calculateEarnings', () => {
  it('calculates 2 kills + win at Veteran = 650', () => {
    const earnings = calculateEarnings(2, true, AIDifficulty.Veteran);
    // 2 * 200 * 1.0 + 250 * 1.0 = 650
    expect(earnings).toBe(650);
  });

  it('calculates 1 kill + loss at BlindFool = 125', () => {
    const earnings = calculateEarnings(1, false, AIDifficulty.BlindFool);
    // 1 * 200 * 0.5 + 50 * 0.5 = 125
    expect(earnings).toBe(125);
  });

  it('calculates 0 kills + win at Primus = 375', () => {
    const earnings = calculateEarnings(0, true, AIDifficulty.Primus);
    // 0 * 200 * 1.5 + 250 * 1.5 = 375
    expect(earnings).toBe(375);
  });

  it('calculates 0 kills + loss at Veteran = 50', () => {
    const earnings = calculateEarnings(0, false, AIDifficulty.Veteran);
    // 0 * 200 * 1.0 + 50 * 1.0 = 50
    expect(earnings).toBe(50);
  });

  it('calculates 3 kills + win at Centurion = 1063', () => {
    const earnings = calculateEarnings(3, true, AIDifficulty.Centurion);
    // 3 * 200 * 1.25 + 250 * 1.25 = 750 + 312.5 = 1062.5 -> 1063
    expect(earnings).toBe(1063);
  });

  it('returns rounded result for fractional earnings', () => {
    const earnings = calculateEarnings(1, true, AIDifficulty.Private);
    // 1 * 200 * 0.75 + 250 * 0.75 = 150 + 187.5 = 337.5 -> 338
    expect(earnings).toBe(338);
  });
});
