import { describe, it, expect } from 'vitest';
import { generateTerrain, getTerrainHeight, carveCrater, TERRAIN_CONFIGS } from './terrain';
import type { TerrainData, TerrainSize } from '../types/game';

describe('generateTerrain', () => {
  it('produces valid heights array matching terrain width', () => {
    const terrain = generateTerrain('medium', 42);
    expect(terrain.heights).toHaveLength(terrain.width);
    expect(terrain.width).toBe(1024);
    expect(terrain.height).toBe(768);
  });

  it('produces all non-negative heights', () => {
    const terrain = generateTerrain('large', 123);
    for (const h of terrain.heights) {
      expect(h).toBeGreaterThanOrEqual(0);
    }
  });

  it('produces heights within 20%-80% of terrain height', () => {
    const terrain = generateTerrain('medium', 99);
    const minH = terrain.height * 0.2;
    const maxH = terrain.height * 0.8;
    for (const h of terrain.heights) {
      expect(h).toBeGreaterThanOrEqual(minH);
      expect(h).toBeLessThanOrEqual(maxH);
    }
  });

  const sizes: TerrainSize[] = ['small', 'medium', 'large', 'huge', 'epic'];

  it.each(sizes)('generates correctly for size "%s"', (size) => {
    const config = TERRAIN_CONFIGS[size];
    const terrain = generateTerrain(size, 7);
    expect(terrain.width).toBe(config.width);
    expect(terrain.height).toBe(config.height);
    expect(terrain.heights).toHaveLength(config.width);
    for (const h of terrain.heights) {
      expect(h).toBeGreaterThanOrEqual(0);
    }
  });

  it('is deterministic with the same seed', () => {
    const t1 = generateTerrain('medium', 12345);
    const t2 = generateTerrain('medium', 12345);
    expect(t1.heights).toEqual(t2.heights);
  });

  it('produces different terrain with different seeds', () => {
    const t1 = generateTerrain('medium', 1);
    const t2 = generateTerrain('medium', 2);
    const allSame = t1.heights.every((h, i) => h === t2.heights[i]);
    expect(allSame).toBe(false);
  });

  it('produces varied heights (not all the same value)', () => {
    const terrain = generateTerrain('small', 55);
    const uniqueHeights = new Set(terrain.heights);
    expect(uniqueHeights.size).toBeGreaterThan(1);
  });
});

describe('getTerrainHeight', () => {
  function makeSimpleTerrain(): TerrainData {
    const heights = [100, 200, 300, 400, 500];
    return { heights, width: 5, height: 600 };
  }

  it('returns exact height at integer positions', () => {
    const terrain = makeSimpleTerrain();
    expect(getTerrainHeight(terrain, 0)).toBe(100);
    expect(getTerrainHeight(terrain, 1)).toBe(200);
    expect(getTerrainHeight(terrain, 4)).toBe(500);
  });

  it('interpolates between adjacent samples', () => {
    const terrain = makeSimpleTerrain();
    const h = getTerrainHeight(terrain, 1.5);
    expect(h).toBe(250);
  });

  it('interpolates at fractional positions correctly', () => {
    const terrain = makeSimpleTerrain();
    const h = getTerrainHeight(terrain, 0.25);
    expect(h).toBeCloseTo(125);
  });

  it('returns value between adjacent samples for any fractional x', () => {
    const terrain = makeSimpleTerrain();
    const h = getTerrainHeight(terrain, 2.7);
    expect(h).toBeGreaterThanOrEqual(300);
    expect(h).toBeLessThanOrEqual(400);
  });

  it('clamps negative x to first height', () => {
    const terrain = makeSimpleTerrain();
    expect(getTerrainHeight(terrain, -5)).toBe(100);
    expect(getTerrainHeight(terrain, -0.1)).toBe(100);
  });

  it('clamps x beyond width to last height', () => {
    const terrain = makeSimpleTerrain();
    expect(getTerrainHeight(terrain, 4)).toBe(500);
    expect(getTerrainHeight(terrain, 10)).toBe(500);
  });

  it('handles x = 0 correctly', () => {
    const terrain = makeSimpleTerrain();
    expect(getTerrainHeight(terrain, 0)).toBe(100);
  });

  it('handles empty terrain gracefully', () => {
    const empty: TerrainData = { heights: [], width: 0, height: 0 };
    expect(getTerrainHeight(empty, 0)).toBe(0);
  });
});

describe('carveCrater', () => {
  function makeFlatTerrain(height: number, width: number): TerrainData {
    const heights = new Array<number>(width).fill(height);
    return { heights, width, height: height * 2 };
  }

  it('reduces heights within blast radius', () => {
    const terrain = makeFlatTerrain(500, 100);
    const originalHeights = [...terrain.heights];
    carveCrater(terrain, 50, 500, 10);

    let anyReduced = false;
    for (let x = 41; x <= 59; x++) {
      if ((terrain.heights[x] ?? 0) < (originalHeights[x] ?? 0)) {
        anyReduced = true;
      }
    }
    expect(anyReduced).toBe(true);
  });

  it('does not modify heights outside blast radius', () => {
    const terrain = makeFlatTerrain(500, 100);
    const originalHeights = [...terrain.heights];
    carveCrater(terrain, 50, 500, 10);

    expect(terrain.heights[0]).toBe(originalHeights[0]);
    expect(terrain.heights[39]).toBe(originalHeights[39]);
    expect(terrain.heights[61]).toBe(originalHeights[61]);
    expect(terrain.heights[99]).toBe(originalHeights[99]);
  });

  it('crater depth matches circular profile formula', () => {
    const terrain = makeFlatTerrain(500, 100);
    const impactX = 50;
    const impactY = 500;
    const blastRadius = 10;
    carveCrater(terrain, impactX, impactY, blastRadius);

    // At center (x=50): carveDepth = 10 - 0 = 10, newHeight = 500 - 10 = 490
    expect(terrain.heights[50]).toBe(490);

    // At x=45: carveDepth = 10 - 5 = 5, newHeight = 500 - 5 = 495
    expect(terrain.heights[45]).toBe(495);

    // At x=55: carveDepth = 10 - 5 = 5, newHeight = 500 - 5 = 495
    expect(terrain.heights[55]).toBe(495);

    // At x=41: carveDepth = 10 - 9 = 1, newHeight = 500 - 1 = 499
    expect(terrain.heights[41]).toBe(499);
  });

  it('clamps terrain heights to >= 0', () => {
    const terrain = makeFlatTerrain(5, 100);
    carveCrater(terrain, 50, 5, 20);

    for (const h of terrain.heights) {
      expect(h).toBeGreaterThanOrEqual(0);
    }
  });

  it('handles multiple overlapping craters at same position', () => {
    const terrain = makeFlatTerrain(500, 100);
    carveCrater(terrain, 50, 500, 10);
    const afterFirst = terrain.heights[50] ?? 490;

    carveCrater(terrain, 50, afterFirst, 10);
    expect(terrain.heights[50]).toBeLessThan(afterFirst);
  });

  it('accumulates overlapping craters at offset positions', () => {
    const terrain = makeFlatTerrain(500, 100);

    carveCrater(terrain, 45, 500, 10);
    const heightAfterFirst = terrain.heights[50] ?? 0;

    carveCrater(terrain, 55, 500, 10);
    const heightAfterSecond = terrain.heights[50] ?? 0;

    expect(heightAfterSecond).toBeLessThanOrEqual(heightAfterFirst);
  });

  it('handles edge crater near left boundary', () => {
    const terrain = makeFlatTerrain(500, 100);
    carveCrater(terrain, 3, 500, 10);

    expect(terrain.heights[0]).toBeLessThan(500);

    for (const h of terrain.heights) {
      expect(h).toBeGreaterThanOrEqual(0);
    }
  });

  it('handles edge crater near right boundary', () => {
    const terrain = makeFlatTerrain(500, 100);
    carveCrater(terrain, 97, 500, 10);

    expect(terrain.heights[99]).toBeLessThan(500);

    for (const h of terrain.heights) {
      expect(h).toBeGreaterThanOrEqual(0);
    }
  });

  it('modifies terrain in place (returns void)', () => {
    const terrain = makeFlatTerrain(500, 100);
    const result = carveCrater(terrain, 50, 500, 10);
    expect(result).toBeUndefined();
    expect(terrain.heights[50]).toBe(490);
  });

  it('handles zero blast radius (no change)', () => {
    const terrain = makeFlatTerrain(500, 100);
    const originalHeights = [...terrain.heights];
    carveCrater(terrain, 50, 500, 0);
    expect(terrain.heights).toEqual(originalHeights);
  });

  it('only carves down, never raises terrain', () => {
    const terrain: TerrainData = {
      heights: new Array<number>(100).fill(500),
      width: 100,
      height: 1000,
    };
    terrain.heights[50] = 100; // deep valley at center

    carveCrater(terrain, 50, 500, 10);

    // min(100, 490) = 100, valley stays
    expect(terrain.heights[50]).toBe(100);
  });
});
