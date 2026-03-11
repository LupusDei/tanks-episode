import type { Shot, TankState, AIDifficulty, Wind, TerrainData } from '../types/game';
import { DIFFICULTY_CONFIGS } from '../types/game';
import {
  POWER_SCALE,
  uiAngleToPhysics,
  updateProjectilePosition,
} from './physics';
import { getTerrainHeight } from './terrain';

// === Constants ===

const MAX_ANGLE = 120;
const MIN_POWER = 0;
const MAX_POWER = 100;
const SIMULATION_DT = 1 / 60;
const MAX_SIMULATION_STEPS = 10000;

// === Helpers ===

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Simulate a projectile from the shooter's position with given angle/power/wind
 * and return the x-coordinate where it lands (hits terrain height or goes out of bounds).
 */
function simulateLandingX(
  startX: number,
  startY: number,
  uiAngle: number,
  power: number,
  windSpeed: number,
  terrain: TerrainData,
): number {
  const physicsAngle = uiAngleToPhysics(uiAngle);
  const scaledPower = power * POWER_SCALE;
  let vx = scaledPower * Math.cos(physicsAngle);
  let vy = scaledPower * Math.sin(physicsAngle);
  let x = startX;
  let y = startY;

  for (let step = 0; step < MAX_SIMULATION_STEPS; step++) {
    const result = updateProjectilePosition(
      { x, y },
      { vx, vy },
      windSpeed,
      SIMULATION_DT,
    );
    x = result.position.x;
    y = result.position.y;
    vx = result.velocity.vx;
    vy = result.velocity.vy;

    // Check if projectile is below terrain
    const terrainH = getTerrainHeight(terrain, x);
    if (y <= terrainH) {
      return x;
    }

    // Out of bounds horizontally
    if (x < -100 || x > terrain.width + 100) {
      return x;
    }

    // Fell below ground level
    if (y < 0) {
      return x;
    }
  }

  return x;
}

/**
 * Calculate the ideal shot that would hit the target, accounting for
 * gravity, wind, distance, and height difference.
 *
 * Uses iterative binary search over power at a fixed initial angle guess,
 * then refines the angle.
 */
export function calculateIdealShot(
  shooter: TankState,
  target: TankState,
  wind: Wind,
  terrain: TerrainData,
): Shot {
  const shooterY = shooter.position.y;
  const targetX = target.position.x;

  let bestAngle = 0;
  let bestPower = 50;
  let bestError = Infinity;

  // Phase 1: Coarse search over angle and power
  for (let angleStep = -12; angleStep <= 12; angleStep++) {
    const testAngle = angleStep * 10;
    for (let powerStep = 1; powerStep <= 10; powerStep++) {
      const testPower = powerStep * 10;
      const landX = simulateLandingX(
        shooter.position.x, shooterY, testAngle, testPower, wind.speed, terrain,
      );
      const error = Math.abs(landX - targetX);
      if (error < bestError) {
        bestError = error;
        bestAngle = testAngle;
        bestPower = testPower;
      }
    }
  }

  // Phase 2: Refine angle with finer steps
  for (let i = 0; i < 3; i++) {
    const angleRange = 10 / Math.pow(2, i);
    const powerRange = 10 / Math.pow(2, i);
    const steps = 10;

    const startAngle = bestAngle - angleRange;
    const startPower = bestPower - powerRange;

    for (let aStep = 0; aStep <= steps; aStep++) {
      const testAngle = startAngle + (aStep / steps) * angleRange * 2;
      for (let pStep = 0; pStep <= steps; pStep++) {
        const testPower = clamp(startPower + (pStep / steps) * powerRange * 2, 1, MAX_POWER);
        const landX = simulateLandingX(
          shooter.position.x, shooterY, testAngle, testPower, wind.speed, terrain,
        );
        const error = Math.abs(landX - targetX);
        if (error < bestError) {
          bestError = error;
          bestAngle = testAngle;
          bestPower = testPower;
        }
      }
    }
  }

  // Clamp results
  bestAngle = clamp(bestAngle, -MAX_ANGLE, MAX_ANGLE);
  bestPower = clamp(bestPower, MIN_POWER, MAX_POWER);

  return {
    angle: bestAngle,
    power: bestPower,
    weaponType: 'standard',
    ownerTankId: shooter.id,
  };
}

/**
 * Calculate an AI shot by computing the ideal shot and adding
 * difficulty-based random variance.
 */
export function calculateAIShot(
  shooter: TankState,
  target: TankState,
  wind: Wind,
  terrain: TerrainData,
  difficulty: AIDifficulty,
): Shot {
  const ideal = calculateIdealShot(shooter, target, wind, terrain);
  const config = DIFFICULTY_CONFIGS[difficulty];

  // Add random variance: uniform random in [-variance, +variance]
  const angleNoise = (Math.random() - 0.5) * 2 * config.angleVariance;
  const powerNoise = (Math.random() - 0.5) * 2 * config.powerVariance;

  const noisyAngle = clamp(ideal.angle + angleNoise, -MAX_ANGLE, MAX_ANGLE);
  const noisyPower = clamp(ideal.power + powerNoise, MIN_POWER, MAX_POWER);

  return {
    angle: noisyAngle,
    power: noisyPower,
    weaponType: 'standard',
    ownerTankId: shooter.id,
  };
}

/**
 * Select a target for the AI shooter.
 * Prefers the last target if still alive; otherwise picks a random alive enemy.
 */
export function selectTarget(
  shooter: TankState,
  tanks: TankState[],
  lastTargetId: string | null,
): TankState | null {
  const aliveEnemies = tanks.filter((t) => t.isAlive && t.id !== shooter.id);

  if (aliveEnemies.length === 0) {
    return null;
  }

  // Prefer last target if still alive
  if (lastTargetId !== null) {
    const lastTarget = aliveEnemies.find((t) => t.id === lastTargetId);
    if (lastTarget) {
      return lastTarget;
    }
  }

  // Pick random alive enemy
  const index = Math.floor(Math.random() * aliveEnemies.length);
  return aliveEnemies[index] ?? null;
}
