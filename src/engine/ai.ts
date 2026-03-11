import type { Shot, TankState, AIDifficulty } from '../types/game';

export function calculateAIShot(
  _shooter: TankState,
  _target: TankState,
  _difficulty: AIDifficulty,
  _windSpeed: number
): Shot {
  return {
    angle: 45,
    power: 50,
    weaponType: 'standard',
    ownerTankId: '',
  };
}

export function selectTarget(
  _shooter: TankState,
  tanks: TankState[]
): TankState | null {
  const alive = tanks.filter((t) => t.isAlive);
  return alive[0] ?? null;
}
