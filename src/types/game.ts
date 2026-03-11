// ── Enums ──────────────────────────────────────────────────────────────────

export enum GamePhase {
  NameEntry = 'nameEntry',
  Config = 'config',
  Shop = 'shop',
  Playing = 'playing',
  GameOver = 'gameOver',
}

export enum WeaponType {
  Standard = 'standard',
  Sniper = 'sniper',
  Heavy = 'heavy',
}

export enum AIDifficulty {
  BlindFool = 'blindFool',
  Private = 'private',
  Veteran = 'veteran',
  Centurion = 'centurion',
  Primus = 'primus',
}

export enum TerrainSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  Huge = 'huge',
  Epic = 'epic',
}

// ── Core value types ───────────────────────────────────────────────────────

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

// ── Terrain ────────────────────────────────────────────────────────────────

export interface TerrainConfig {
  width: number;
  height: number;
}

export interface TerrainData {
  heights: number[];
  width: number;
  height: number;
}

// ── Weapons ────────────────────────────────────────────────────────────────

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

export interface Shot {
  angle: number;
  power: number;
  weaponType: WeaponType;
  ownerTankId: string;
}

// ── Tanks ──────────────────────────────────────────────────────────────────

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

// ── Projectiles & Explosions ───────────────────────────────────────────────

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

export interface ExplosionState {
  position: Position;
  radius: number;
  maxRadius: number;
  phase: number;
  particles: Particle[];
  weaponType: WeaponType;
  timer: number;
}

// ── Wind ───────────────────────────────────────────────────────────────────

export interface Wind {
  speed: number;
}

// ── Game state ─────────────────────────────────────────────────────────────

export interface GameState {
  phase: GamePhase;
  turnNumber: number;
  tanks: TankState[];
  terrain: TerrainData;
  wind: Wind;
  selectedWeapon: WeaponType;
  winner: TankState | null;
  projectiles: ProjectileState[];
  explosions: ExplosionState[];
}

// ── Player profile (persisted in LocalStorage) ─────────────────────────────

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

// ── AI difficulty ──────────────────────────────────────────────────────────

export interface DifficultyConfig {
  angleVariance: number;
  powerVariance: number;
  multiplier: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

export const TERRAIN_CONFIGS: Record<TerrainSize, TerrainConfig> = {
  [TerrainSize.Small]: { width: 800, height: 600 },
  [TerrainSize.Medium]: { width: 1024, height: 768 },
  [TerrainSize.Large]: { width: 1280, height: 960 },
  [TerrainSize.Huge]: { width: 1600, height: 1200 },
  [TerrainSize.Epic]: { width: 2100, height: 2800 },
};

export const DIFFICULTY_CONFIGS: Record<AIDifficulty, DifficultyConfig> = {
  [AIDifficulty.BlindFool]: { angleVariance: 30, powerVariance: 40, multiplier: 0.5 },
  [AIDifficulty.Private]: { angleVariance: 15, powerVariance: 25, multiplier: 0.75 },
  [AIDifficulty.Veteran]: { angleVariance: 8, powerVariance: 15, multiplier: 1.0 },
  [AIDifficulty.Centurion]: { angleVariance: 4, powerVariance: 8, multiplier: 1.25 },
  [AIDifficulty.Primus]: { angleVariance: 2, powerVariance: 4, multiplier: 1.5 },
};
