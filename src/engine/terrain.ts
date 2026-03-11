import type { TerrainData } from '../types/game.ts';
import { TerrainSize, TERRAIN_CONFIGS } from '../types/game.ts';

/**
 * Simple seeded pseudo-random number generator (mulberry32).
 * Returns a function that produces values in [0, 1).
 */
function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Midpoint displacement algorithm to generate a terrain heightmap.
 * The seed parameter enables reproducible terrain for testing.
 */
export function generateTerrain(size: TerrainSize, seed?: number): TerrainData {
  const config = TERRAIN_CONFIGS[size];
  const { width, height } = config;
  const rng = createRng(seed ?? Date.now());

  const heights = midpointDisplacement(width, height, rng);

  return { heights, width, height };
}

/**
 * Produce a height array of the given length using midpoint displacement.
 * Heights are kept within [0, maxHeight].
 */
function midpointDisplacement(
  length: number,
  maxHeight: number,
  rng: () => number,
): number[] {
  // Start with a power-of-two sized array, then trim
  const n = nextPowerOfTwo(length);
  const arr = new Array<number>(n + 1).fill(0);

  // Seed endpoints
  const baseHeight = maxHeight * 0.4;
  const variance = maxHeight * 0.2;
  arr[0] = baseHeight + (rng() - 0.5) * variance;
  arr[n] = baseHeight + (rng() - 0.5) * variance;

  let step = n;
  let roughness = maxHeight * 0.3;

  while (step > 1) {
    const half = step / 2;
    for (let i = half; i < n; i += step) {
      const left = arr[i - half] ?? 0;
      const right = arr[i + half] ?? 0;
      const avg = (left + right) / 2;
      arr[i] = avg + (rng() - 0.5) * roughness;
    }
    roughness *= 0.5;
    step = half;
  }

  // Clamp and trim to requested width
  const result = new Array<number>(length);
  for (let i = 0; i < length; i++) {
    result[i] = clampHeight(arr[i] ?? 0, maxHeight);
  }
  return result;
}

/** Return the smallest power of two >= n. */
function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) {
    p *= 2;
  }
  return p;
}

/** Clamp a value to [0, max]. */
function clampHeight(value: number, max: number): number {
  if (value < 0) return 0;
  if (value > max) return max;
  return value;
}

/**
 * Get the terrain height at a fractional x position using linear interpolation.
 * Returns 0 for out-of-bounds positions.
 */
export function getTerrainHeight(terrain: TerrainData, x: number): number {
  if (x < 0 || x >= terrain.width) {
    return 0;
  }

  const index = Math.floor(x);
  const fraction = x - index;

  const h0 = terrain.heights[index] ?? 0;

  // If at the last pixel or no fraction, return the exact height
  if (fraction === 0 || index + 1 >= terrain.width) {
    return h0;
  }

  const h1 = terrain.heights[index + 1] ?? 0;
  return h0 + (h1 - h0) * fraction;
}

/**
 * Carve a circular crater into the terrain IN PLACE.
 * Uses the formula: carveDepth = blastRadius - |dx|
 * New height = min(current, impactY - carveDepth), clamped to >= 0.
 */
export function carveCrater(
  terrain: TerrainData,
  impactX: number,
  impactY: number,
  blastRadius: number,
): void {
  const startX = Math.max(0, Math.ceil(impactX - blastRadius));
  const endX = Math.min(terrain.width - 1, Math.floor(impactX + blastRadius));

  for (let x = startX; x <= endX; x++) {
    const dx = x - impactX;
    const carveDepth = blastRadius - Math.abs(dx);
    const newHeight = impactY - carveDepth;
    const currentHeight = terrain.heights[x] ?? 0;
    terrain.heights[x] = Math.max(0, Math.min(currentHeight, newHeight));
  }
}
