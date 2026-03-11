import type { Shot, TankState, TerrainData, Wind, DifficultyConfig, WeaponType } from '../types/game.ts';

export function calculateAIShot(
  tank: TankState,
  _target: TankState,
  _terrain: TerrainData,
  _wind: Wind,
  _difficulty: DifficultyConfig,
  weaponType: WeaponType,
): Shot {
  return {
    angle: 45,
    power: 50,
    weaponType,
    ownerTankId: tank.id,
  };
}

export function selectTarget(
  tank: TankState,
  tanks: TankState[],
): TankState | null {
  return tanks.find((t) => t.isAlive && t.id !== tank.id) ?? null;
}
