import type { Wind } from '../types/game';

const WIND_DECAY_FACTOR = 0.7;
const WIND_INITIAL_STD_DEV = 10;
const WIND_UPDATE_STD_DEV = 5;
const WIND_MAX_SPEED = 30;

/**
 * Generates a normally distributed random number using the Box-Muller transform.
 */
export function normalRandom(mean: number, stdDev: number): number {
  let u1 = Math.random();
  const u2 = Math.random();

  // Avoid log(0)
  while (u1 === 0) {
    u1 = Math.random();
  }

  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

function clampWind(speed: number): number {
  return Math.max(-WIND_MAX_SPEED, Math.min(WIND_MAX_SPEED, speed));
}

/**
 * Generates initial wind with speed drawn from a normal distribution (mean=0, stdDev=10),
 * clamped to +/-30.
 */
export function generateInitialWind(): Wind {
  const speed = clampWind(normalRandom(0, WIND_INITIAL_STD_DEV));
  return { speed };
}

/**
 * Updates wind by applying decay toward zero and adding random perturbation.
 * Formula: newSpeed = currentSpeed * 0.7 + normalRandom(0, 5), clamped to +/-30.
 */
export function updateWind(currentWind: Wind): Wind {
  const newSpeed = clampWind(
    currentWind.speed * WIND_DECAY_FACTOR + normalRandom(0, WIND_UPDATE_STD_DEV)
  );
  return { speed: newSpeed };
}
