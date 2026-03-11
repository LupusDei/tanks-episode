import type { TerrainData, TerrainConfig } from '../types/game';

export function generateTerrain(config: TerrainConfig): TerrainData {
  return {
    heights: new Array(config.width).fill(0) as number[],
    width: config.width,
    height: config.height,
  };
}

export function getTerrainHeight(terrain: TerrainData, x: number): number {
  const index = Math.floor(x);
  if (index < 0 || index >= terrain.heights.length) {
    return 0;
  }
  return terrain.heights[index] ?? 0;
}

export function carveCrater(terrain: TerrainData, _x: number, _radius: number): TerrainData {
  return { ...terrain };
}
