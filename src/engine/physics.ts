import type { Velocity, Position } from '../types/game.ts';

// ── Constants ──────────────────────────────────────────────────────────────

export const POWER_SCALE = 1.12;
export const GRAVITY = 10;
export const WIND_FACTOR = 0.15;

// ── Angle Conversion ───────────────────────────────────────────────────────

/** Convert UI angle (0=up, positive=left, negative=right, ±120°) to physics radians. */
export function uiAngleToPhysics(uiAngle: number): number {
  const physicsDegrees = 90 - uiAngle;
  return (physicsDegrees * Math.PI) / 180;
}

// ── Velocity ───────────────────────────────────────────────────────────────

/** Calculate initial velocity from power (0-100), UI angle, and weapon speed multiplier. */
export function calculateVelocity(
  power: number,
  angle: number,
  speedMultiplier: number,
): Velocity {
  const physicsAngle = uiAngleToPhysics(angle);
  const speed = power * POWER_SCALE;
  return {
    vx: speed * Math.cos(physicsAngle) * speedMultiplier,
    vy: speed * Math.sin(physicsAngle) * speedMultiplier,
  };
}

// ── Projectile Motion ──────────────────────────────────────────────────────

/** Advance a projectile one timestep under gravity and wind. Returns new position and velocity. */
export function updateProjectilePosition(
  pos: Position,
  vel: Velocity,
  wind: number,
  dt: number,
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

// ── Coordinate Conversion ──────────────────────────────────────────────────

/** Convert world coordinates (y-up) to screen coordinates (y-down). */
export function worldToScreen(worldPos: Position, canvasHeight: number): Position {
  return {
    x: worldPos.x,
    y: canvasHeight - worldPos.y,
  };
}

/** Convert screen coordinates (y-down) to world coordinates (y-up). */
export function screenToWorld(screenPos: Position, canvasHeight: number): Position {
  return {
    x: screenPos.x,
    y: canvasHeight - screenPos.y,
  };
}
