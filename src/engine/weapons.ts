import { WeaponType } from '../types/game.ts';
import type { WeaponConfig } from '../types/game.ts';

export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  [WeaponType.Standard]: {
    type: WeaponType.Standard,
    name: 'Standard',
    description: 'Basic shell',
    damage: 25,
    blastRadius: 30,
    cost: 0,
    ammo: Infinity,
    speedMultiplier: 1.0,
    explosionColor: { center: '#ff4400', outer: '#ff8800' },
  },
  [WeaponType.Sniper]: {
    type: WeaponType.Sniper,
    name: 'Sniper',
    description: 'High-speed precision round',
    damage: 35,
    blastRadius: 15,
    cost: 100,
    ammo: 3,
    speedMultiplier: 1.5,
    explosionColor: { center: '#00ccff', outer: '#0066ff' },
  },
  [WeaponType.Heavy]: {
    type: WeaponType.Heavy,
    name: 'Heavy',
    description: 'Massive blast radius',
    damage: 50,
    blastRadius: 60,
    cost: 200,
    ammo: 2,
    speedMultiplier: 0.7,
    explosionColor: { center: '#ff0000', outer: '#ffcc00' },
  },
};

export function calculateDamage(
  _distance: number,
  config: WeaponConfig,
): number {
  return config.damage;
}
