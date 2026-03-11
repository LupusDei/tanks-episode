import type { TankState, TerrainData } from '../types/game';

export function placeTanks(
  _count: number,
  _terrain: TerrainData
): TankState[] {
  return [];
}

export function generateAINames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `AI Tank ${i + 1}`);
}
