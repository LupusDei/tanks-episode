import type { Velocity, Position } from '../types/game.ts';

export function calculateVelocity(angle: number, power: number): Velocity {
  return { vx: Math.cos(angle) * power, vy: Math.sin(angle) * power };
}

export function updateProjectilePosition(
  position: Position,
  velocity: Velocity,
  _dt: number,
): Position {
  return { x: position.x + velocity.vx, y: position.y + velocity.vy };
}

export function worldToScreen(
  worldPos: Position,
  _cameraOffset: Position,
): Position {
  return { x: worldPos.x, y: worldPos.y };
}

export function screenToWorld(
  screenPos: Position,
  _cameraOffset: Position,
): Position {
  return { x: screenPos.x, y: screenPos.y };
}
