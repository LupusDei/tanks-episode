import type { TankState, TerrainData } from '../types/game';
import { getTerrainHeight } from './terrain';

/** Pool of military-themed AI names */
export const AI_NAME_POOL: readonly string[] = [
  'Viper', 'Ironside', 'Blitz', 'Havoc', 'Ghost',
  'Cobra', 'Reaper', 'Phoenix', 'Hammer', 'Storm',
  'Shadow', 'Titan', 'Falcon', 'Rogue', 'Saber',
  'Wolf', 'Diesel', 'Knox', 'Tank', 'Magnus',
];

/** Distinct tank color hex values */
export const TANK_COLORS: readonly string[] = [
  '#E63946', // red
  '#457B9D', // steel blue
  '#2A9D8F', // teal
  '#E9C46A', // gold
  '#F4A261', // orange
  '#264653', // dark teal
  '#A855F7', // purple
  '#84CC16', // lime
];

/** Pick `count` random unique items from an array */
function pickRandom<T>(pool: readonly T[], count: number): T[] {
  const copy = [...pool];
  const result: T[] = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy[idx]!);
    copy.splice(idx, 1);
  }
  return result;
}

/** Generate unique AI names from the name pool */
export function generateAINames(count: number): string[] {
  return pickRandom(AI_NAME_POOL, count);
}

/** Pick `count` colors from TANK_COLORS, excluding `excludeColor` */
function pickColors(count: number, excludeColor: string): string[] {
  const available = TANK_COLORS.filter((c) => c !== excludeColor);
  return pickRandom(available, count);
}

/** Compute evenly-spaced X positions across terrain width */
function computeSpacedPositions(terrainWidth: number, count: number): number[] {
  const spacing = terrainWidth / (count + 1);
  const positions: number[] = [];
  for (let i = 1; i <= count; i++) {
    positions.push(spacing * i);
  }
  return positions;
}

/** Create a single TankState with the given parameters */
function createTank(
  id: string,
  name: string,
  x: number,
  terrain: TerrainData,
  color: string,
  isPlayer: boolean,
): TankState {
  return {
    id,
    name,
    position: { x, y: getTerrainHeight(terrain, x) },
    barrelAngle: 0,
    hp: 100,
    maxHp: 100,
    color,
    isPlayer,
    isAlive: true,
    fuel: 100,
    queuedShot: null,
  };
}

/**
 * Place tanks at evenly spaced positions across the terrain.
 * Player tank is placed at the leftmost position.
 * AI tanks get distinct colors (avoiding the player color) and unique random names.
 */
export function placeTanks(
  terrain: TerrainData,
  playerName: string,
  playerColor: string,
  enemyCount: number,
): TankState[] {
  const totalCount = 1 + enemyCount;
  const xPositions = computeSpacedPositions(terrain.width, totalCount);

  const playerTank = createTank(
    'player',
    playerName,
    xPositions[0]!,
    terrain,
    playerColor,
    true,
  );

  const aiNames = generateAINames(enemyCount);
  const aiColors = pickColors(enemyCount, playerColor);

  const aiTanks: TankState[] = [];
  for (let i = 0; i < enemyCount; i++) {
    aiTanks.push(
      createTank(
        `ai-${i}`,
        aiNames[i]!,
        xPositions[i + 1]!,
        terrain,
        aiColors[i]!,
        false,
      ),
    );
  }

  return [playerTank, ...aiTanks];
}

/**
 * Settle a tank to the current terrain height at its X position.
 * Used after crater carving to update tank positions.
 */
export function settleTank(tank: TankState, terrain: TerrainData): TankState {
  return {
    ...tank,
    position: {
      x: tank.position.x,
      y: getTerrainHeight(terrain, tank.position.x),
    },
  };
}
