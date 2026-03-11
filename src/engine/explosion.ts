import type { ExplosionState, Position, WeaponType } from '../types/game.ts';

export function createExplosion(
  position: Position,
  weaponType: WeaponType,
  maxRadius: number,
): ExplosionState {
  return {
    position: { ...position },
    radius: 0,
    maxRadius,
    phase: 0,
    particles: [],
    weaponType,
    timer: 0,
  };
}

export function updateExplosion(
  explosion: ExplosionState,
  _dt: number,
): ExplosionState {
  return { ...explosion };
}
