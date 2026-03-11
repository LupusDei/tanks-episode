import { describe, it, expect } from 'vitest';
import {
  placeTanks,
  generateAINames,
  settleTank,
  AI_NAME_POOL,
  TANK_COLORS,
} from './tank';
import type { TerrainData, TankState } from '../types/game';

/** Create a flat terrain at a given height for predictable testing */
function makeFlatTerrain(width: number, flatHeight: number): TerrainData {
  const heights = new Array<number>(width).fill(flatHeight);
  return { heights, width, height: 600 };
}

/** Create terrain with a simple slope for non-uniform height testing */
function makeSlopeTerrain(width: number): TerrainData {
  const heights = new Array<number>(width);
  for (let i = 0; i < width; i++) {
    heights[i] = i * 0.5; // height = x * 0.5
  }
  return { heights, width, height: 600 };
}

describe('AI_NAME_POOL', () => {
  it('contains at least 20 names', () => {
    expect(AI_NAME_POOL.length).toBeGreaterThanOrEqual(20);
  });

  it('contains no duplicate names', () => {
    const unique = new Set(AI_NAME_POOL);
    expect(unique.size).toBe(AI_NAME_POOL.length);
  });
});

describe('TANK_COLORS', () => {
  it('contains at least 8 colors', () => {
    expect(TANK_COLORS.length).toBeGreaterThanOrEqual(8);
  });

  it('contains no duplicate colors', () => {
    const unique = new Set(TANK_COLORS);
    expect(unique.size).toBe(TANK_COLORS.length);
  });

  it('all colors are valid hex strings', () => {
    for (const color of TANK_COLORS) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('generateAINames', () => {
  it('returns the correct number of names', () => {
    const names = generateAINames(5);
    expect(names).toHaveLength(5);
  });

  it('returns no duplicates', () => {
    const names = generateAINames(10);
    const unique = new Set(names);
    expect(unique.size).toBe(10);
  });

  it('all names are from AI_NAME_POOL', () => {
    const names = generateAINames(15);
    for (const name of names) {
      expect(AI_NAME_POOL).toContain(name);
    }
  });

  it('returns empty array for count 0', () => {
    expect(generateAINames(0)).toHaveLength(0);
  });

  it('caps at pool size when count exceeds pool', () => {
    const names = generateAINames(AI_NAME_POOL.length + 5);
    expect(names).toHaveLength(AI_NAME_POOL.length);
  });
});

describe('placeTanks', () => {
  const terrain = makeFlatTerrain(1000, 300);
  const playerName = 'Commander';
  const playerColor = '#E63946';

  it('returns correct total number of tanks (1 player + N enemies)', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 3);
    expect(tanks).toHaveLength(4);
  });

  it('returns 1 tank when enemyCount is 0', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 0);
    expect(tanks).toHaveLength(1);
    expect(tanks[0]!.isPlayer).toBe(true);
  });

  it('player tank is the first element', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 3);
    expect(tanks[0]!.isPlayer).toBe(true);
    expect(tanks[0]!.name).toBe(playerName);
  });

  it('player tank uses the provided name and color', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 2);
    expect(tanks[0]!.name).toBe(playerName);
    expect(tanks[0]!.color).toBe(playerColor);
  });

  it('AI tanks have isPlayer=false', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 3);
    for (let i = 1; i < tanks.length; i++) {
      expect(tanks[i]!.isPlayer).toBe(false);
    }
  });

  it('tanks are at evenly spaced horizontal positions', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 3);
    const totalCount = 4;
    const expectedSpacing = terrain.width / (totalCount + 1);
    for (let i = 0; i < tanks.length; i++) {
      const expectedX = expectedSpacing * (i + 1);
      expect(tanks[i]!.position.x).toBeCloseTo(expectedX, 5);
    }
  });

  it('player tank is at the leftmost position', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 4);
    const playerX = tanks[0]!.position.x;
    for (let i = 1; i < tanks.length; i++) {
      expect(tanks[i]!.position.x).toBeGreaterThan(playerX);
    }
  });

  it('tank Y position matches terrain height at its X', () => {
    const slopeTerrain = makeSlopeTerrain(1000);
    const tanks = placeTanks(slopeTerrain, playerName, playerColor, 3);
    for (const tank of tanks) {
      const expectedY = tank.position.x * 0.5;
      expect(tank.position.y).toBeCloseTo(expectedY, 1);
    }
  });

  it('tank Y on flat terrain equals flat height', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 2);
    for (const tank of tanks) {
      expect(tank.position.y).toBe(300);
    }
  });

  it('no duplicate colors among all tanks', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 5);
    const colors = tanks.map((t) => t.color);
    const unique = new Set(colors);
    expect(unique.size).toBe(colors.length);
  });

  it('player color is not reused by AI tanks', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 5);
    for (let i = 1; i < tanks.length; i++) {
      expect(tanks[i]!.color).not.toBe(playerColor);
    }
  });

  it('AI names are drawn from AI_NAME_POOL with no duplicates', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 7);
    const aiNames = tanks.slice(1).map((t) => t.name);
    const unique = new Set(aiNames);
    expect(unique.size).toBe(aiNames.length);
    for (const name of aiNames) {
      expect(AI_NAME_POOL).toContain(name);
    }
  });

  it('all tanks start with correct defaults', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 2);
    for (const tank of tanks) {
      expect(tank.hp).toBe(100);
      expect(tank.maxHp).toBe(100);
      expect(tank.barrelAngle).toBe(0);
      expect(tank.isAlive).toBe(true);
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

  it('player tank id is "player"', () => {
    const tanks = placeTanks(terrain, playerName, playerColor, 2);
    expect(tanks[0]!.id).toBe('player');
  });
});

describe('settleTank', () => {
  it('updates Y to new terrain height', () => {
    const tank: TankState = {
      id: 'test',
      name: 'Test',
      position: { x: 500, y: 300 },
      barrelAngle: 45,
      hp: 80,
      maxHp: 100,
      color: '#E63946',
      isPlayer: false,
      isAlive: true,
      fuel: 60,
      queuedShot: null,
    };

    // Simulate terrain change — new terrain has lower height
    const newTerrain = makeFlatTerrain(1000, 200);
    const settled = settleTank(tank, newTerrain);
    expect(settled.position.y).toBe(200);
  });

  it('does not change X position', () => {
    const terrain = makeFlatTerrain(1000, 250);
    const tank: TankState = {
      id: 'test',
      name: 'Test',
      position: { x: 400, y: 300 },
      barrelAngle: 0,
      hp: 100,
      maxHp: 100,
      color: '#457B9D',
      isPlayer: true,
      isAlive: true,
      fuel: 100,
      queuedShot: null,
    };

    const settled = settleTank(tank, terrain);
    expect(settled.position.x).toBe(400);
  });

  it('preserves all non-position properties', () => {
    const terrain = makeFlatTerrain(1000, 150);
    const tank: TankState = {
      id: 'preserve-test',
      name: 'Preserver',
      position: { x: 300, y: 400 },
      barrelAngle: 30,
      hp: 75,
      maxHp: 100,
      color: '#2A9D8F',
      isPlayer: false,
      isAlive: true,
      fuel: 50,
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

  it('returns a new object, does not mutate the original', () => {
    const terrain = makeFlatTerrain(1000, 200);
    const tank: TankState = {
      id: 'immutable',
      name: 'Immutable',
      position: { x: 500, y: 350 },
      barrelAngle: 0,
      hp: 100,
      maxHp: 100,
      color: '#E63946',
      isPlayer: true,
      isAlive: true,
      fuel: 100,
      queuedShot: null,
    };

    const settled = settleTank(tank, terrain);
    expect(settled).not.toBe(tank);
    expect(tank.position.y).toBe(350); // original unchanged
  });

  it('works with slope terrain for accurate interpolation', () => {
    const slopeTerrain = makeSlopeTerrain(1000);
    const tank: TankState = {
      id: 'slope',
      name: 'Slope',
      position: { x: 400, y: 999 },
      barrelAngle: 0,
      hp: 100,
      maxHp: 100,
      color: '#E9C46A',
      isPlayer: false,
      isAlive: true,
      fuel: 100,
      queuedShot: null,
    };

    const settled = settleTank(tank, slopeTerrain);
    expect(settled.position.y).toBeCloseTo(200, 1); // 400 * 0.5
  });
});
