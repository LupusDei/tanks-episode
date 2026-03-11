import { describe, it, expect } from 'vitest';
import { generateTerrain, getTerrainHeight, carveCrater } from './terrain';

describe('terrain', () => {
  it('generateTerrain returns terrain data', () => {
    const terrain = generateTerrain({ width: 100, height: 50 });
    expect(terrain.width).toBe(100);
    expect(terrain.height).toBe(50);
    expect(terrain.heights).toHaveLength(100);
  });

  it('getTerrainHeight returns a number', () => {
    const terrain = generateTerrain({ width: 100, height: 50 });
    const height = getTerrainHeight(terrain, 10);
    expect(typeof height).toBe('number');
  });

  it('carveCrater returns terrain data', () => {
    const terrain = generateTerrain({ width: 100, height: 50 });
    const result = carveCrater(terrain, 50, 10);
    expect(result).toHaveProperty('heights');
  });
});
