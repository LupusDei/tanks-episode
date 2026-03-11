import type { TerrainData, TerrainConfig, Position } from '../types/game.ts';

export function generateTerrain(config: TerrainConfig): TerrainData {
  return {
    heights: new Array(config.width).fill(config.height / 2) as number[],
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

export function carveCrater(
  terrain: TerrainData,
  _position: Position,
  _radius: number,
): TerrainData {
  return { ...terrain };
}
