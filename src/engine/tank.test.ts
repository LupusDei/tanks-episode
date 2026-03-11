import { describe, it, expect } from 'vitest';
import type { TerrainData, TankState } from '../types/game.ts';
import {
  AI_NAME_POOL,
  TANK_COLORS,
  placeTanks,
  settleTank,
  pickUniqueNames,
  pickColors,
} from './tank.ts';

/** Assert a value is defined and return it (avoids TS strict index errors in tests). */
function defined<T>(value: T | undefined): T {
  expect(value).toBeDefined();
  return value as T;
}

/** Helper to create a flat terrain at a given height. */
function flatTerrain(width: number, height: number, groundHeight: number): TerrainData {
  return {
    heights: new Array(width).fill(groundHeight),
    width,
    height,
  };
}

/** Helper to create a terrain with varying heights. */
function slopedTerrain(width: number, height: number): TerrainData {
  const heights = Array.from({ length: width }, (_, i) => i * 0.5);
  return { heights, width, height };
}

describe('AI_NAME_POOL', () => {
  it('has at least 20 names', () => {
    expect(AI_NAME_POOL.length).toBeGreaterThanOrEqual(20);
  });

  it('has no duplicate names', () => {
    const unique = new Set(AI_NAME_POOL);
    expect(unique.size).toBe(AI_NAME_POOL.length);
  });
});

describe('TANK_COLORS', () => {
  it('has at least 8 colors', () => {
    expect(TANK_COLORS.length).toBeGreaterThanOrEqual(8);
  });

  it('has no duplicate colors', () => {
    const unique = new Set(TANK_COLORS);
    expect(unique.size).toBe(TANK_COLORS.length);
  });

  it('all colors are valid hex values', () => {
    for (const color of TANK_COLORS) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe('pickUniqueNames', () => {
  it('returns the requested number of names', () => {
    const names = pickUniqueNames(5);
    expect(names).toHaveLength(5);
  });

  it('returns no duplicates', () => {
    const names = pickUniqueNames(10);
    const unique = new Set(names);
    expect(unique.size).toBe(10);
  });

  it('all names come from the pool', () => {
    const names = pickUniqueNames(8);
    for (const name of names) {
      expect(AI_NAME_POOL).toContain(name);
    }
  });

  it('returns empty array when count is 0', () => {
    expect(pickUniqueNames(0)).toHaveLength(0);
  });

  it('caps at pool size when count exceeds pool', () => {
    const names = pickUniqueNames(AI_NAME_POOL.length + 5);
    expect(names).toHaveLength(AI_NAME_POOL.length);
  });
});

describe('pickColors', () => {
  it('returns the requested number of colors', () => {
    const colors = pickColors(3, '#000000');
    expect(colors).toHaveLength(3);
  });

  it('excludes the specified color', () => {
    const excluded = defined(TANK_COLORS[0]);
    const colors = pickColors(TANK_COLORS.length, excluded);
    expect(colors).not.toContain(excluded);
  });

  it('returns available colors when excludeColor is not in TANK_COLORS', () => {
    const colors = pickColors(3, '#000000');
    expect(colors).toHaveLength(3);
  });
});

describe('placeTanks', () => {
  const terrain = flatTerrain(800, 600, 300);
  const playerName = 'Hero';
  const playerColor = '#ff0000';

  it('returns 1 player + N enemies', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 3);
    expect(tanks).toHaveLength(4);
  });

  it('player tank is at index 0 with isPlayer=true', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 2);
    const player = defined(tanks[0]);
    expect(player.isPlayer).toBe(true);
    expect(player.name).toBe(playerName);
    expect(player.color).toBe(playerColor);
  });

  it('AI tanks have isPlayer=false', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 3);
    for (let i = 1; i < tanks.length; i++) {
      expect(defined(tanks[i]).isPlayer).toBe(false);
    }
  });

  it('tanks are at evenly spaced horizontal positions', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 3);
    const expectedSpacing = 800 / (4 + 1); // 160
    for (let i = 0; i < tanks.length; i++) {
      expect(defined(tanks[i]).position.x).toBeCloseTo(expectedSpacing * (i + 1), 5);
    }
  });

  it('tank Y matches terrain height at its X position', () => {
    const sloped = slopedTerrain(800, 600);
    const tanks = placeTanks(sloped, playerName, playerColor, 2);
    for (const tank of tanks) {
      // On sloped terrain, height at integer x = x * 0.5
      // getTerrainHeight interpolates, so for non-integer x we check closeness
      const floorX = Math.floor(tank.position.x);
      const frac = tank.position.x - floorX;
      const h0 = floorX * 0.5;
      const h1 = (floorX + 1) * 0.5;
      const expectedY = h0 + (h1 - h0) * frac;
      expect(tank.position.y).toBeCloseTo(expectedY, 5);
    }
  });

  it('no duplicate colors among all tanks', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 5);
    const colors = tanks.map((t) => t.color);
    const unique = new Set(colors);
    expect(unique.size).toBe(colors.length);
  });

  it('player color not reused by AI tanks', () => {
    // Use a color that IS in TANK_COLORS to test exclusion
    const pColor = defined(TANK_COLORS[0]);
    const tanks = placeTanks(terrain, playerName, pColor, 5);
    const aiColors = tanks.slice(1).map((t) => t.color);
    expect(aiColors).not.toContain(pColor);
  });

  it('AI names drawn from pool with no duplicates', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 8);
    const aiNames = tanks.slice(1).map((t) => t.name);
    const unique = new Set(aiNames);
    expect(unique.size).toBe(aiNames.length);
    for (const name of aiNames) {
      expect(AI_NAME_POOL).toContain(name);
    }
  });

  it('all tanks have correct default values', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 2);
    for (const tank of tanks) {
      expect(tank.hp).toBe(100);
      expect(tank.maxHp).toBe(100);
      expect(tank.isAlive).toBe(true);
      expect(tank.barrelAngle).toBe(0);
      expect(tank.fuel).toBe(100);
      expect(tank.queuedShot).toBeNull();
    }
  });

  it('each tank has a unique id', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 5);
    const ids = tanks.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('works with 0 enemies (player only)', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 0);
    expect(tanks).toHaveLength(1);
    expect(defined(tanks[0]).isPlayer).toBe(true);
  });
});

describe('settleTank', () => {
  it('updates Y to new terrain height', () => {
    const terrain = flatTerrain(800, 600, 300);
    const tank: TankState = {
      id: 'test-1',
      name: 'Test',
      position: { x: 400, y: 500 },
      barrelAngle: 45,
      hp: 80,
      maxHp: 100,
      color: '#ff0000',
      isPlayer: true,
      isAlive: true,
      fuel: 50,
      queuedShot: null,
    };

    const settled = settleTank(tank, terrain);
    expect(settled.position.y).toBe(300);
    expect(settled.position.x).toBe(400);
  });

  it('preserves all other tank properties', () => {
    const terrain = flatTerrain(800, 600, 200);
    const tank: TankState = {
      id: 'preserve-test',
      name: 'Preserver',
      position: { x: 100, y: 999 },
      barrelAngle: 30,
      hp: 50,
      maxHp: 100,
      color: '#abcdef',
      isPlayer: false,
      isAlive: true,
      fuel: 75,
      queuedShot: null,
    };

    const settled = settleTank(tank, terrain);
    expect(settled.id).toBe(tank.id);
    expect(settled.name).toBe(tank.name);
    expect(settled.barrelAngle).toBe(tank.barrelAngle);
    expect(settled.hp).toBe(tank.hp);
    expect(settled.maxHp).toBe(tank.maxHp);
    expect(settled.color).toBe(tank.color);
    expect(settled.isPlayer).toBe(tank.isPlayer);
    expect(settled.isAlive).toBe(tank.isAlive);
    expect(settled.fuel).toBe(tank.fuel);
    expect(settled.queuedShot).toBe(tank.queuedShot);
  });

  it('returns a new object (immutable)', () => {
    const terrain = flatTerrain(800, 600, 300);
    const tank: TankState = {
      id: 'immutable-test',
      name: 'Immutable',
      position: { x: 200, y: 400 },
      barrelAngle: 0,
      hp: 100,
      maxHp: 100,
      color: '#000000',
      isPlayer: true,
      isAlive: true,
      fuel: 100,
      queuedShot: null,
    };

    const settled = settleTank(tank, terrain);
    expect(settled).not.toBe(tank);
    expect(settled.position).not.toBe(tank.position);
  });

  it('works with sloped terrain', () => {
    const sloped = slopedTerrain(800, 600);
    const tank: TankState = {
      id: 'slope-test',
      name: 'Sloper',
      position: { x: 100, y: 0 },
      barrelAngle: 0,
      hp: 100,
      maxHp: 100,
      color: '#000000',
      isPlayer: true,
      isAlive: true,
      fuel: 100,
      queuedShot: null,
    };

    const settled = settleTank(tank, sloped);
    expect(settled.position.y).toBeCloseTo(50, 5); // 100 * 0.5
  });
});
