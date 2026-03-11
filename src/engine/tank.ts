import type { TankState, TerrainData } from '../types/game.ts';
import { getTerrainHeight } from './terrain.ts';

/** Pool of military-themed AI names. */
export const AI_NAME_POOL: string[] = [
  'Viper', 'Ironside', 'Blitz', 'Havoc', 'Ghost',
  'Cobra', 'Reaper', 'Phoenix', 'Hammer', 'Storm',
  'Shadow', 'Titan', 'Falcon', 'Rogue', 'Saber',
  'Wolf', 'Diesel', 'Knox', 'Tank', 'Magnus',
];

/** Distinct color hex values for tank selection. */
export const TANK_COLORS: string[] = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
  '#d35400', '#c0392b',
];

/**
 * Pick `count` random unique names from AI_NAME_POOL.
 * Uses Fisher-Yates partial shuffle on a copy.
 */
export function pickUniqueNames(count: number): string[] {
  const pool = [...AI_NAME_POOL];
  const picked: string[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const name = pool[idx];
    if (name !== undefined) {
      picked.push(name);
    }
    pool.splice(idx, 1);
  }
  return picked;
}

/**
 * Pick `count` colors from TANK_COLORS, excluding `excludeColor`.
 */
export function pickColors(count: number, excludeColor: string): string[] {
  const available = TANK_COLORS.filter((c) => c !== excludeColor);
  return available.slice(0, count);
}

/** Compute evenly spaced X positions across terrain width. */
function computeXPositions(terrainWidth: number, totalTanks: number): number[] {
  const spacing = terrainWidth / (totalTanks + 1);
  return Array.from({ length: totalTanks }, (_, i) => spacing * (i + 1));
}

/** Create a single TankState at the given position. */
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
 * Place tanks at evenly spaced horizontal positions across the terrain.
 * Player is at index 0, followed by AI enemies.
 */
export function placeTanks(
  terrain: TerrainData,
  playerName: string,
  playerColor: string,
  enemyCount: number,
): TankState[] {
  const totalTanks = 1 + enemyCount;
  const xPositions = computeXPositions(terrain.width, totalTanks);
  const aiNames = pickUniqueNames(enemyCount);
  const aiColors = pickColors(enemyCount, playerColor);

  const playerX = xPositions[0] ?? 0;
  const tanks: TankState[] = [
    createTank('player-0', playerName, playerX, terrain, playerColor, true),
  ];

  for (let i = 0; i < enemyCount; i++) {
    const aiX = xPositions[i + 1] ?? 0;
    const aiName = aiNames[i] ?? `AI ${i + 1}`;
    const aiColor = aiColors[i] ?? '#888888';
    tanks.push(
      createTank(`ai-${i + 1}`, aiName, aiX, terrain, aiColor, false),
    );
  }

  return tanks;
}

/**
 * Return a new TankState with Y updated to match current terrain height.
 * Used after crater carving to settle tanks to new ground level.
 */
export function settleTank(tank: TankState, terrain: TerrainData): TankState {
  return {
    ...tank,
    position: {
      ...tank.position,
      y: getTerrainHeight(terrain, tank.position.x),
    },
  };
}
