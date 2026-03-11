import type { WeaponType, WeaponConfig } from '../types/game';

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
    description: 'Massive blast radius. Doesn\'t need to be accurate.',
    damage: 65,
    blastRadius: 35,
    cost: 250,
    ammo: 0,
    speedMultiplier: 0.8,
    explosionColor: { center: '#FF2200', outer: '#FF6600' },
  },
};

export function calculateDamage(
  _weaponType: WeaponType,
  _distance: number,
  _blastRadius: number
): number {
  return 0;
}
