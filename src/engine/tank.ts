import type { TankState, TerrainData } from '../types/game.ts';

export function placeTanks(
  _count: number,
  _terrain: TerrainData,
): TankState[] {
  return [];
}

export function generateAINames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Tank ${i + 1}`);
}
