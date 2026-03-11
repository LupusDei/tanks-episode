import { WeaponType, AIDifficulty } from '../types/game.ts';
import type { WeaponConfig, Position, TankState } from '../types/game.ts';

// ── Weapon Configurations ─────────────────────────────────────────────────

export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  [WeaponType.Standard]: {
    type: WeaponType.Standard,
    name: 'Standard Shell',
    description: 'Basic explosive shell. Reliable and free.',
    damage: 35,
    blastRadius: 20,
    cost: 0,
    ammo: Infinity,
    speedMultiplier: 1.0,
    explosionColor: { center: '#FF4400', outer: '#FF8800' },
  },
  [WeaponType.Sniper]: {
    type: WeaponType.Sniper,
    name: 'Sniper Shot',
    description: 'Precision round. One-shot kill but tiny blast radius.',
    damage: 100,
    blastRadius: 12,
    cost: 200,
    ammo: 0,
    speedMultiplier: 1.3,
    explosionColor: { center: '#FFFFFF', outer: '#4488FF' },
  },
  [WeaponType.Heavy]: {
    type: WeaponType.Heavy,
    name: 'Heavy Artillery',
    description: 'Massive blast radius. Doesn\'t need to be accurate.',
    damage: 65,
    blastRadius: 35,
    cost: 250,
    ammo: 0,
    speedMultiplier: 0.8,
    explosionColor: { center: '#FF2200', outer: '#FF6600' },
  },
};

// ── Economy ───────────────────────────────────────────────────────────────

export const ECONOMY = {
  startingBalance: 500,
  killReward: 200,
  winBonus: 250,
  lossConsolation: 50,
} as const;

// ── Difficulty Multipliers ────────────────────────────────────────────────

export const DIFFICULTY_MULTIPLIERS: Record<AIDifficulty, number> = {
  [AIDifficulty.BlindFool]: 0.5,
  [AIDifficulty.Private]: 0.75,
  [AIDifficulty.Veteran]: 1.0,
  [AIDifficulty.Centurion]: 1.25,
  [AIDifficulty.Primus]: 1.5,
};

// ── Damage Result ─────────────────────────────────────────────────────────

export interface DamageResult {
  tankId: string;
  damage: number;
  killed: boolean;
}

// ── Helper: distance between two points ───────────────────────────────────

function distanceBetween(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Helper: compute damage for a single tank ─────────────────────────────

function computeTankDamage(
  impactPos: Position,
  tank: TankState,
  weapon: WeaponConfig,
): DamageResult | null {
  if (!tank.isAlive) return null;

  const distance = distanceBetween(impactPos, tank.position);
  if (distance > weapon.blastRadius) return null;

  const actualDamage = (weapon.damage / 100) * tank.maxHp;
  const killed = tank.hp - actualDamage <= 0;

  return { tankId: tank.id, damage: actualDamage, killed };
}

// ── Calculate Damage ──────────────────────────────────────────────────────

export function calculateDamage(
  impactPos: Position,
  tanks: TankState[],
  weapon: WeaponConfig,
): DamageResult[] {
  const results: DamageResult[] = [];

  for (const tank of tanks) {
    const result = computeTankDamage(impactPos, tank, weapon);
    if (result !== null) {
      results.push(result);
    }
  }

  return results;
}

// ── Calculate Earnings ────────────────────────────────────────────────────

export function calculateEarnings(
  kills: number,
  won: boolean,
  difficulty: AIDifficulty,
): number {
  const multiplier = DIFFICULTY_MULTIPLIERS[difficulty];
  const killEarnings = kills * ECONOMY.killReward * multiplier;
  const bonusEarnings = won
    ? ECONOMY.winBonus * multiplier
    : ECONOMY.lossConsolation * multiplier;

  return Math.round(killEarnings + bonusEarnings);
}
