import type { TerrainData, TerrainSize } from '../types/game';
import { TERRAIN_CONFIGS } from '../types/game';

export { TERRAIN_CONFIGS } from '../types/game';

/**
 * Simple seeded pseudo-random number generator (mulberry32).
 * Returns a function that produces deterministic values in [0, 1).
 */
function createSeededRng(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Return the smallest power of 2 >= n */
function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) {
    p *= 2;
  }
  return p;
}

/** Clamp a value between min and max */
function clampValue(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Generate terrain heights using midpoint displacement algorithm.
 * Heights range roughly between 20% and 80% of the terrain height.
 */
export function generateTerrain(size: TerrainSize, seed?: number): TerrainData {
  const config = TERRAIN_CONFIGS[size];
  const { width, height } = config;
  const rng = createSeededRng(seed ?? Date.now());

  const minH = height * 0.2;
  const maxH = height * 0.8;
  const midH = (minH + maxH) / 2;

  // Use midpoint displacement on a power-of-2 array, then sample to width
  const powerOf2 = nextPowerOf2(width);
  const buffer = new Array<number>(powerOf2 + 1);

  // Seed endpoints
  buffer[0] = midH + (rng() - 0.5) * (maxH - minH);
  buffer[powerOf2] = midH + (rng() - 0.5) * (maxH - minH);

  // Midpoint displacement
  let stepSize = powerOf2;
  let roughness = (maxH - minH) * 0.5;

  while (stepSize > 1) {
    const halfStep = stepSize / 2;
    for (let i = halfStep; i < powerOf2; i += stepSize) {
      const left = buffer[i - halfStep] as number;
      const right = buffer[i + halfStep] as number;
      const avg = (left + right) / 2;
      buffer[i] = avg + (rng() - 0.5) * roughness;
    }
    roughness *= 0.55;
    stepSize = halfStep;
  }

  // Sample and clamp to [minH, maxH], then store in final array
  const heights = new Array<number>(width);
  for (let x = 0; x < width; x++) {
    const raw = buffer[x] as number;
    heights[x] = clampValue(raw, minH, maxH);
  }

  return { heights, width, height };
}

/**
 * Get terrain height at a given x coordinate with linear interpolation.
 * Handles edge cases: negative x and x beyond width.
 */
export function getTerrainHeight(terrain: TerrainData, x: number): number {
  const { heights, width } = terrain;

  if (x <= 0) {
    return heights[0] ?? 0;
  }
  if (x >= width - 1) {
    return heights[width - 1] ?? 0;
  }

  const index = Math.floor(x);
  const fraction = x - index;

  const h0 = heights[index] ?? 0;
  const h1 = heights[index + 1] ?? 0;

  return h0 + (h1 - h0) * fraction;
}

/**
 * Carve a circular crater into the terrain, modifying heights in place.
 *
 * For each X pixel in range [impactX - blastRadius, impactX + blastRadius]:
 *   dx = X - impactX
 *   carveDepth = blastRadius - abs(dx)
 *   terrain.heights[X] = min(terrain.heights[X], impactY - carveDepth)
 *   Clamp terrain.heights[X] to >= 0
 */
export function carveCrater(
  terrain: TerrainData,
  impactX: number,
  impactY: number,
  blastRadius: number,
): void {
  const { heights, width } = terrain;
  const startX = Math.max(0, Math.ceil(impactX - blastRadius));
  const endX = Math.min(width - 1, Math.floor(impactX + blastRadius));

  for (let x = startX; x <= endX; x++) {
    const dx = x - impactX;
    const carveDepth = blastRadius - Math.abs(dx);
    if (carveDepth <= 0) continue;

    const newHeight = impactY - carveDepth;
    const currentHeight = heights[x] ?? 0;
    heights[x] = Math.max(0, Math.min(currentHeight, newHeight));
  }
}
