// === Enums / String Literal Union Types ===

export type GamePhase = 'nameEntry' | 'config' | 'shop' | 'playing' | 'gameOver';

export type WeaponType = 'standard' | 'sniper' | 'heavy';

export type AIDifficulty = 'blindFool' | 'private' | 'veteran' | 'centurion' | 'primus';

export type TerrainSize = 'small' | 'medium' | 'large' | 'huge' | 'epic';

// === Interfaces ===

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface TerrainConfig {
  width: number;
  height: number;
}

export interface TerrainData {
  heights: number[];
  width: number;
  height: number;
}

export interface Shot {
  angle: number;
  power: number;
  weaponType: WeaponType;
  ownerTankId: string;
}

export interface ExplosionColor {
  center: string;
  outer: string;
}

export interface WeaponConfig {
  type: WeaponType;
  name: string;
  description: string;
  damage: number;
  blastRadius: number;
  cost: number;
  ammo: number;
  speedMultiplier: number;
  explosionColor: ExplosionColor;
}

export interface TankState {
  id: string;
  name: string;
  position: Position;
  barrelAngle: number;
  hp: number;
  maxHp: number;
  color: string;
  isPlayer: boolean;
  isAlive: boolean;
  fuel: number;
  queuedShot: Shot | null;
}

export interface ProjectileState {
  position: Position;
  velocity: Velocity;
  weaponType: WeaponType;
  ownerTankId: string;
  active: boolean;
  trail: Position[];
}

export interface Particle {
  position: Position;
  velocity: Velocity;
  color: string;
  life: number;
  maxLife: number;
}

export type ExplosionPhase = 'growing' | 'peak' | 'fading' | 'done';

export interface ExplosionState {
  position: Position;
  radius: number;
  maxRadius: number;
  phase: ExplosionPhase;
  particles: Particle[];
  weaponType: WeaponType;
  timer: number;
}

export interface Wind {
  speed: number;
}

export interface GameState {
  phase: GamePhase;
  turnNumber: number;
  tanks: TankState[];
  terrain: TerrainData | null;
  wind: Wind;
  selectedWeapon: WeaponType;
  winner: TankState | null;
  projectiles: ProjectileState[];
  explosions: ExplosionState[];
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalKills: number;
}

export interface WeaponInventory {
  sniper: number;
  heavy: number;
}

export interface StoredPlayerProfile {
  name: string;
  balance: number;
  stats: PlayerStats;
  weaponInventory: WeaponInventory;
}

export interface DifficultyConfig {
  angleVariance: number;
  powerVariance: number;
  multiplier: number;
}

// === Constants ===

export const TERRAIN_CONFIGS: Record<TerrainSize, TerrainConfig> = {
  small: { width: 800, height: 600 },
  medium: { width: 1024, height: 768 },
  large: { width: 1280, height: 960 },
  huge: { width: 1600, height: 1200 },
  epic: { width: 2100, height: 2800 },
};

export const DIFFICULTY_CONFIGS: Record<AIDifficulty, DifficultyConfig> = {
  blindFool: { angleVariance: 30, powerVariance: 40, multiplier: 0.5 },
  private: { angleVariance: 15, powerVariance: 25, multiplier: 0.75 },
  veteran: { angleVariance: 8, powerVariance: 15, multiplier: 1.0 },
  centurion: { angleVariance: 4, powerVariance: 8, multiplier: 1.25 },
  primus: { angleVariance: 2, powerVariance: 4, multiplier: 1.5 },
};
