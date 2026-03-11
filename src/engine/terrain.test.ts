import { describe, it, expect } from 'vitest';
import { generateTerrain, getTerrainHeight, carveCrater } from './terrain.ts';
import { TerrainSize, TERRAIN_CONFIGS } from '../types/game.ts';
import type { TerrainData } from '../types/game.ts';

// ── Helper ──────────────────────────────────────────────────────────────────

function makeFlatTerrain(width: number, height: number, fillHeight: number): TerrainData {
  return {
    heights: new Array(width).fill(fillHeight) as number[],
    width,
    height,
  };
}

// ── generateTerrain ─────────────────────────────────────────────────────────

describe('generateTerrain', () => {
  it('produces heights with correct length matching terrain width', () => {
    const terrain = generateTerrain(TerrainSize.Small, 42);
    expect(terrain.heights.length).toBe(TERRAIN_CONFIGS[TerrainSize.Small].width);
    expect(terrain.width).toBe(TERRAIN_CONFIGS[TerrainSize.Small].width);
    expect(terrain.height).toBe(TERRAIN_CONFIGS[TerrainSize.Small].height);
  });

  it('produces all non-negative heights', () => {
    const terrain = generateTerrain(TerrainSize.Medium, 99);
    for (const h of terrain.heights) {
      expect(h).toBeGreaterThanOrEqual(0);
    }
  });

  it('produces heights that do not exceed terrain height', () => {
    const terrain = generateTerrain(TerrainSize.Large, 7);
    const maxH = TERRAIN_CONFIGS[TerrainSize.Large].height;
    for (const h of terrain.heights) {
      expect(h).toBeLessThanOrEqual(maxH);
    }
  });

  it('generates all 5 terrain sizes correctly', () => {
    const sizes = [
      TerrainSize.Small,
      TerrainSize.Medium,
      TerrainSize.Large,
      TerrainSize.Huge,
      TerrainSize.Epic,
    ];
    for (const size of sizes) {
      const config = TERRAIN_CONFIGS[size];
      const terrain = generateTerrain(size, 123);
      expect(terrain.heights.length).toBe(config.width);
      expect(terrain.width).toBe(config.width);
      expect(terrain.height).toBe(config.height);
    }
  });

  it('produces reproducible terrain with same seed', () => {
    const a = generateTerrain(TerrainSize.Small, 42);
    const b = generateTerrain(TerrainSize.Small, 42);
    expect(a.heights).toEqual(b.heights);
  });

  it('produces different terrain with different seeds', () => {
    const a = generateTerrain(TerrainSize.Small, 1);
    const b = generateTerrain(TerrainSize.Small, 2);
    // It's theoretically possible for them to be equal, but extremely unlikely
    const same = a.heights.every((h, i) => h === b.heights[i]);
    expect(same).toBe(false);
  });

  it('produces terrain with some height variation (not flat)', () => {
    const terrain = generateTerrain(TerrainSize.Medium, 55);
    const uniqueHeights = new Set(terrain.heights);
    expect(uniqueHeights.size).toBeGreaterThan(1);
  });
});

// ── getTerrainHeight ────────────────────────────────────────────────────────

describe('getTerrainHeight', () => {
  it('returns exact height at integer positions', () => {
    const terrain = makeFlatTerrain(10, 100, 50);
    terrain.heights[3] = 70;
    expect(getTerrainHeight(terrain, 3)).toBe(70);
  });

  it('interpolates between adjacent samples', () => {
    const terrain = makeFlatTerrain(10, 100, 0);
    terrain.heights[2] = 10;
    terrain.heights[3] = 20;
    const h = getTerrainHeight(terrain, 2.5);
    expect(h).toBe(15);
  });

  it('interpolation at 0.25 fraction', () => {
    const terrain = makeFlatTerrain(10, 100, 0);
    terrain.heights[0] = 0;
    terrain.heights[1] = 100;
    expect(getTerrainHeight(terrain, 0.25)).toBe(25);
  });

  it('returns value between adjacent samples for any sub-pixel position', () => {
    const terrain = generateTerrain(TerrainSize.Small, 42);
    const x = 100.7;
    const h100 = terrain.heights[100] ?? 0;
    const h101 = terrain.heights[101] ?? 0;
    const low = Math.min(h100, h101);
    const high = Math.max(h100, h101);
    const h = getTerrainHeight(terrain, x);
    expect(h).toBeGreaterThanOrEqual(low - 1e-9);
    expect(h).toBeLessThanOrEqual(high + 1e-9);
  });

  it('returns 0 for negative x', () => {
    const terrain = makeFlatTerrain(10, 100, 50);
    expect(getTerrainHeight(terrain, -1)).toBe(0);
  });

  it('returns 0 for x >= width', () => {
    const terrain = makeFlatTerrain(10, 100, 50);
    expect(getTerrainHeight(terrain, 10)).toBe(0);
    expect(getTerrainHeight(terrain, 100)).toBe(0);
  });

  it('returns height at x = 0', () => {
    const terrain = makeFlatTerrain(10, 100, 50);
    expect(getTerrainHeight(terrain, 0)).toBe(50);
  });

  it('returns height at last valid integer', () => {
    const terrain = makeFlatTerrain(10, 100, 50);
    terrain.heights[9] = 30;
    expect(getTerrainHeight(terrain, 9)).toBe(30);
  });
});

// ── carveCrater ─────────────────────────────────────────────────────────────

describe('carveCrater', () => {
  it('reduces heights within blast radius', () => {
    const terrain = makeFlatTerrain(100, 200, 150);
    carveCrater(terrain, 50, 150, 10);
    // At impact center, carveDepth = 10, newHeight = 150 - 10 = 140
    expect(terrain.heights[50]).toBeLessThan(150);
  });

  it('does not affect heights outside blast radius', () => {
    const terrain = makeFlatTerrain(100, 200, 150);
    carveCrater(terrain, 50, 150, 10);
    expect(terrain.heights[39]).toBe(150);
    expect(terrain.heights[61]).toBe(150);
  });

  it('crater depth matches circular profile formula at center', () => {
    const terrain = makeFlatTerrain(100, 200, 150);
    const impactX = 50;
    const impactY = 150;
    const blastRadius = 10;
    carveCrater(terrain, impactX, impactY, blastRadius);
    // At center: dx=0, carveDepth=10, newHeight = 150 - 10 = 140
    expect(terrain.heights[50]).toBe(140);
  });

  it('crater depth matches formula at offset positions', () => {
    const terrain = makeFlatTerrain(100, 200, 150);
    const impactX = 50;
    const impactY = 150;
    const blastRadius = 10;
    carveCrater(terrain, impactX, impactY, blastRadius);
    // At x=45: dx=-5, carveDepth=5, newHeight = 150 - 5 = 145
    expect(terrain.heights[45]).toBe(145);
    // At x=55: dx=5, carveDepth=5, newHeight = 150 - 5 = 145
    expect(terrain.heights[55]).toBe(145);
  });

  it('crater at edge: carveDepth=0 means no change when newHeight >= current', () => {
    const terrain = makeFlatTerrain(100, 200, 150);
    carveCrater(terrain, 50, 150, 10);
    // At x=40: dx=-10, carveDepth=0, newHeight = 150 - 0 = 150 (no change since min(150, 150) = 150)
    expect(terrain.heights[40]).toBe(150);
    expect(terrain.heights[60]).toBe(150);
  });

  it('clamps terrain heights to >= 0', () => {
    const terrain = makeFlatTerrain(100, 200, 5);
    // impactY=5, blastRadius=20 → center newHeight = 5 - 20 = -15 → clamped to 0
    carveCrater(terrain, 50, 5, 20);
    expect(terrain.heights[50]).toBe(0);
    for (const h of terrain.heights) {
      expect(h).toBeGreaterThanOrEqual(0);
    }
  });

  it('mutates terrain in place', () => {
    const terrain = makeFlatTerrain(100, 200, 150);
    const originalRef = terrain.heights;
    carveCrater(terrain, 50, 150, 10);
    // Same array reference
    expect(terrain.heights).toBe(originalRef);
  });

  it('multiple overlapping craters accumulate correctly', () => {
    const terrain = makeFlatTerrain(100, 200, 150);
    // First crater: center at x=50, carveDepth=10 → 140
    carveCrater(terrain, 50, 150, 10);
    expect(terrain.heights[50]).toBe(140);

    // Second crater at same spot, impactY=140, radius=10 → newHeight = 140 - 10 = 130
    carveCrater(terrain, 50, 140, 10);
    expect(terrain.heights[50]).toBe(130);
  });

  it('overlapping craters at different positions', () => {
    const terrain = makeFlatTerrain(100, 200, 150);
    carveCrater(terrain, 45, 150, 10);
    carveCrater(terrain, 55, 150, 10);
    // Overlap region around x=50: both craters affect it
    // First crater at x=50: dx=5, carveDepth=5, newHeight=145
    // Second crater at x=50: dx=-5, carveDepth=5, newHeight=145
    // min(145, 145) = 145
    expect(terrain.heights[50]).toBe(145);
  });

  it('edge crater near left boundary does not go out of bounds', () => {
    const terrain = makeFlatTerrain(100, 200, 150);
    carveCrater(terrain, 2, 150, 10);
    // Should not throw and heights[0] should be affected
    expect(terrain.heights[0]).toBeLessThan(150);
    for (const h of terrain.heights) {
      expect(h).toBeGreaterThanOrEqual(0);
    }
  });

  it('edge crater near right boundary does not go out of bounds', () => {
    const terrain = makeFlatTerrain(100, 200, 150);
    carveCrater(terrain, 97, 150, 10);
    expect(terrain.heights[99]).toBeLessThan(150);
    for (const h of terrain.heights) {
      expect(h).toBeGreaterThanOrEqual(0);
    }
  });

  it('crater with zero blast radius does nothing', () => {
    const terrain = makeFlatTerrain(100, 200, 150);
    carveCrater(terrain, 50, 150, 0);
    // carveDepth at x=50 is 0 - 0 = 0, newHeight = 150 - 0 = 150
    expect(terrain.heights[50]).toBe(150);
  });

  it('only lowers terrain, never raises it', () => {
    const terrain = makeFlatTerrain(100, 200, 50);
    // impactY is above current height, so newHeight = 200 - carveDepth > 50 for most positions
    carveCrater(terrain, 50, 200, 10);
    for (const h of terrain.heights) {
      expect(h).toBeLessThanOrEqual(50);
    }
  });
});
