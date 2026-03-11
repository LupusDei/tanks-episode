import type { Position, Velocity } from '../types/game';

// === Constants ===

export const POWER_SCALE = 1.12;
export const GRAVITY = 10;
export const WIND_FACTOR = 0.15;

// === Coordinate Conversion ===

/**
 * Convert a UI angle to physics radians.
 * UI convention: 0 = straight up, positive = left, negative = right, range ±120°.
 * Physics convention: standard math angle in radians (0 = right, π/2 = up).
 */
export function uiAngleToPhysics(uiAngle: number): number {
  const physicsDegrees = 90 - uiAngle;
  return (physicsDegrees * Math.PI) / 180;
}

/**
 * Convert world coordinates to screen coordinates.
 * World: y increases upward. Screen: y increases downward.
 */
export function worldToScreen(worldPos: Position, canvasHeight: number): Position {
  return {
    x: worldPos.x,
    y: canvasHeight - worldPos.y,
  };
}

/**
 * Convert screen coordinates to world coordinates.
 * Screen: y increases downward. World: y increases upward.
 */
export function screenToWorld(screenPos: Position, canvasHeight: number): Position {
  return {
    x: screenPos.x,
    y: canvasHeight - screenPos.y,
  };
}

// === Velocity / Projectile Physics ===

/**
 * Calculate the initial velocity vector from power, UI angle, and weapon speed multiplier.
 */
export function calculateVelocity(
  power: number,
  angle: number,
  speedMultiplier: number
): Velocity {
  const physicsAngle = uiAngleToPhysics(angle);
  const scaledPower = power * POWER_SCALE * speedMultiplier;
  return {
    vx: scaledPower * Math.cos(physicsAngle),
    vy: scaledPower * Math.sin(physicsAngle),
  };
}

/**
 * Advance a projectile by one time step, applying gravity and wind.
 * Returns new position and velocity (does not mutate inputs).
 */
export function updateProjectilePosition(
  pos: Position,
  vel: Velocity,
  wind: number,
  dt: number
): { position: Position; velocity: Velocity } {
  const windAccel = wind * WIND_FACTOR;

  const newX = pos.x + vel.vx * dt + 0.5 * windAccel * dt * dt;
  const newY = pos.y + vel.vy * dt - 0.5 * GRAVITY * dt * dt;

  const newVx = vel.vx + windAccel * dt;
  const newVy = vel.vy - GRAVITY * dt;

  return {
    position: { x: newX, y: newY },
    velocity: { vx: newVx, vy: newVy },
  };
}
