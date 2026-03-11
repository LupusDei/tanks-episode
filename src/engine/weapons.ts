import type { WeaponType, WeaponConfig, AIDifficulty, Position, TankState } from '../types/game';

export interface DamageResult {
  tankId: string;
  damage: number;
  killed: boolean;
}

export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  standard: {
    type: 'standard',
    name: 'Standard Shell',
    description: 'Basic explosive shell. Reliable and free.',
    damage: 35,
    blastRadius: 20,
    cost: 0,
    ammo: Infinity,
    speedMultiplier: 1.0,
    explosionColor: { center: '#FF4400', outer: '#FF8800' },
  },
  sniper: {
    type: 'sniper',
    name: 'Sniper Shot',
    description: 'Precision round. One-shot kill but tiny blast radius.',
    damage: 100,
    blastRadius: 12,
    cost: 200,
    ammo: 0,
    speedMultiplier: 1.3,
    explosionColor: { center: '#FFFFFF', outer: '#4488FF' },
  },
  heavy: {
    type: 'heavy',
    name: 'Heavy Artillery',
    description: "Massive blast radius. Doesn't need to be accurate.",
    damage: 65,
    blastRadius: 35,
    cost: 250,
    ammo: 0,
    speedMultiplier: 0.8,
    explosionColor: { center: '#FF2200', outer: '#FF6600' },
  },
};

export const ECONOMY = {
  startingBalance: 500,
  killReward: 200,
  winBonus: 250,
  lossConsolation: 50,
} as const;

export const DIFFICULTY_MULTIPLIERS: Record<AIDifficulty, number> = {
  blindFool: 0.5,
  private: 0.75,
  veteran: 1.0,
  centurion: 1.25,
  primus: 1.5,
};

function distanceBetween(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateDamage(
  impactPos: Position,
  tanks: TankState[],
  weapon: WeaponConfig
): DamageResult[] {
  const results: DamageResult[] = [];

  for (const tank of tanks) {
    if (!tank.isAlive) {
      continue;
    }

    const distance = distanceBetween(impactPos, tank.position);

    if (distance > weapon.blastRadius) {
      continue;
    }

    const damage = Math.round((weapon.damage / 100) * tank.maxHp);
    const killed = tank.hp - damage <= 0;

    results.push({ tankId: tank.id, damage, killed });
  }

  return results;
}

export function calculateEarnings(
  kills: number,
  won: boolean,
  difficulty: AIDifficulty
): number {
  const base = kills * ECONOMY.killReward + (won ? ECONOMY.winBonus : ECONOMY.lossConsolation);
  return Math.round(base * DIFFICULTY_MULTIPLIERS[difficulty]);
}
