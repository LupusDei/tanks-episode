import type { ExplosionState, Position, WeaponType } from '../types/game';

export function createExplosion(
  position: Position,
  maxRadius: number,
  weaponType: WeaponType
): ExplosionState {
  return {
    position: { x: position.x, y: position.y },
    radius: 0,
    maxRadius,
    phase: 'growing',
    particles: [],
    weaponType,
    timer: 0,
  };
}

export function updateExplosion(
  explosion: ExplosionState,
  _dt: number
): ExplosionState {
  return { ...explosion };
}
