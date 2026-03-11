import type { Position, Velocity, ProjectileState } from '../types/game';

export function calculateVelocity(_angle: number, _power: number): Velocity {
  return { vx: 0, vy: 0 };
}

export function updateProjectilePosition(
  projectile: ProjectileState,
  _dt: number,
  _windSpeed: number
): ProjectileState {
  return { ...projectile };
}

export function worldToScreen(worldPos: Position, _cameraX: number, _cameraY: number): Position {
  return { x: worldPos.x, y: worldPos.y };
}

export function screenToWorld(screenPos: Position, _cameraX: number, _cameraY: number): Position {
  return { x: screenPos.x, y: screenPos.y };
}
