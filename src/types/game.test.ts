import { describe, it, expect } from 'vitest';
import {
  GamePhase,
  WeaponType,
  AIDifficulty,
  TerrainSize,
  TERRAIN_CONFIGS,
  DIFFICULTY_CONFIGS,
} from './game';
import type {
  Position,
  Velocity,
  TerrainConfig,
  TerrainData,
  ExplosionColor,
  WeaponConfig,
  Shot,
  TankState,
  ProjectileState,
  Particle,
  ExplosionState,
  Wind,
  GameState,
  PlayerStats,
  WeaponInventory,
  StoredPlayerProfile,
  DifficultyConfig,
} from './game';

// ── Enum value tests ───────────────────────────────────────────────────────

describe('GamePhase', () => {
  it('has all expected values', () => {
    expect(GamePhase.NameEntry).toBe('nameEntry');
    expect(GamePhase.Config).toBe('config');
    expect(GamePhase.Shop).toBe('shop');
    expect(GamePhase.Playing).toBe('playing');
    expect(GamePhase.GameOver).toBe('gameOver');
  });

  it('has exactly 5 members', () => {
    const values = Object.values(GamePhase);
    expect(values).toHaveLength(5);
  });
});

describe('WeaponType', () => {
  it('has all expected values', () => {
    expect(WeaponType.Standard).toBe('standard');
    expect(WeaponType.Sniper).toBe('sniper');
    expect(WeaponType.Heavy).toBe('heavy');
  });

  it('has exactly 3 members', () => {
    const values = Object.values(WeaponType);
    expect(values).toHaveLength(3);
  });
});

describe('AIDifficulty', () => {
  it('has all expected values', () => {
    expect(AIDifficulty.BlindFool).toBe('blindFool');
    expect(AIDifficulty.Private).toBe('private');
    expect(AIDifficulty.Veteran).toBe('veteran');
    expect(AIDifficulty.Centurion).toBe('centurion');
    expect(AIDifficulty.Primus).toBe('primus');
  });

  it('has exactly 5 members', () => {
    const values = Object.values(AIDifficulty);
    expect(values).toHaveLength(5);
  });
});

describe('TerrainSize', () => {
  it('has all expected values', () => {
    expect(TerrainSize.Small).toBe('small');
    expect(TerrainSize.Medium).toBe('medium');
    expect(TerrainSize.Large).toBe('large');
    expect(TerrainSize.Huge).toBe('huge');
    expect(TerrainSize.Epic).toBe('epic');
  });

  it('has exactly 5 members', () => {
    const values = Object.values(TerrainSize);
    expect(values).toHaveLength(5);
  });
});

// ── TERRAIN_CONFIGS tests ──────────────────────────────────────────────────

describe('TERRAIN_CONFIGS', () => {
  it('maps every TerrainSize to a config', () => {
    for (const size of Object.values(TerrainSize)) {
      expect(TERRAIN_CONFIGS[size]).toBeDefined();
      expect(TERRAIN_CONFIGS[size].width).toBeGreaterThan(0);
      expect(TERRAIN_CONFIGS[size].height).toBeGreaterThan(0);
    }
  });

  it('has correct dimensions for each size', () => {
    expect(TERRAIN_CONFIGS[TerrainSize.Small]).toEqual({ width: 800, height: 600 });
    expect(TERRAIN_CONFIGS[TerrainSize.Medium]).toEqual({ width: 1024, height: 768 });
    expect(TERRAIN_CONFIGS[TerrainSize.Large]).toEqual({ width: 1280, height: 960 });
    expect(TERRAIN_CONFIGS[TerrainSize.Huge]).toEqual({ width: 1600, height: 1200 });
    expect(TERRAIN_CONFIGS[TerrainSize.Epic]).toEqual({ width: 2100, height: 2800 });
  });
});

// ── DIFFICULTY_CONFIGS tests ───────────────────────────────────────────────

describe('DIFFICULTY_CONFIGS', () => {
  it('maps every AIDifficulty to a config', () => {
    for (const diff of Object.values(AIDifficulty)) {
      const cfg = DIFFICULTY_CONFIGS[diff];
      expect(cfg).toBeDefined();
      expect(cfg.angleVariance).toBeGreaterThan(0);
      expect(cfg.powerVariance).toBeGreaterThan(0);
      expect(cfg.multiplier).toBeGreaterThan(0);
    }
  });

  it('has correct values for each difficulty', () => {
    expect(DIFFICULTY_CONFIGS[AIDifficulty.BlindFool]).toEqual({
      angleVariance: 30,
      powerVariance: 40,
      multiplier: 0.5,
    });
    expect(DIFFICULTY_CONFIGS[AIDifficulty.Private]).toEqual({
      angleVariance: 15,
      powerVariance: 25,
      multiplier: 0.75,
    });
    expect(DIFFICULTY_CONFIGS[AIDifficulty.Veteran]).toEqual({
      angleVariance: 8,
      powerVariance: 15,
      multiplier: 1.0,
    });
    expect(DIFFICULTY_CONFIGS[AIDifficulty.Centurion]).toEqual({
      angleVariance: 4,
      powerVariance: 8,
      multiplier: 1.25,
    });
    expect(DIFFICULTY_CONFIGS[AIDifficulty.Primus]).toEqual({
      angleVariance: 2,
      powerVariance: 4,
      multiplier: 1.5,
    });
  });

  it('has decreasing variance as difficulty increases', () => {
    const order: AIDifficulty[] = [
      AIDifficulty.BlindFool,
      AIDifficulty.Private,
      AIDifficulty.Veteran,
      AIDifficulty.Centurion,
      AIDifficulty.Primus,
    ];
    for (let i = 1; i < order.length; i++) {
      const current = order[i] as AIDifficulty;
      const previous = order[i - 1] as AIDifficulty;
      expect(DIFFICULTY_CONFIGS[current].angleVariance)
        .toBeLessThan(DIFFICULTY_CONFIGS[previous].angleVariance);
      expect(DIFFICULTY_CONFIGS[current].powerVariance)
        .toBeLessThan(DIFFICULTY_CONFIGS[previous].powerVariance);
    }
  });

  it('has increasing multiplier as difficulty increases', () => {
    const order: AIDifficulty[] = [
      AIDifficulty.BlindFool,
      AIDifficulty.Private,
      AIDifficulty.Veteran,
      AIDifficulty.Centurion,
      AIDifficulty.Primus,
    ];
    for (let i = 1; i < order.length; i++) {
      const current = order[i] as AIDifficulty;
      const previous = order[i - 1] as AIDifficulty;
      expect(DIFFICULTY_CONFIGS[current].multiplier)
        .toBeGreaterThan(DIFFICULTY_CONFIGS[previous].multiplier);
    }
  });
});

// ── Interface structural tests (compile-time + runtime shape checks) ───────

describe('Interface structural conformance', () => {
  it('Position has x and y', () => {
    const pos: Position = { x: 10, y: 20 };
    expect(pos.x).toBe(10);
    expect(pos.y).toBe(20);
  });

  it('Velocity has vx and vy', () => {
    const vel: Velocity = { vx: 1.5, vy: -3.2 };
    expect(vel.vx).toBe(1.5);
    expect(vel.vy).toBe(-3.2);
  });

  it('TerrainConfig has width and height', () => {
    const tc: TerrainConfig = { width: 800, height: 600 };
    expect(tc.width).toBe(800);
  });

  it('TerrainData has heights array, width, and height', () => {
    const td: TerrainData = { heights: [100, 200, 150], width: 800, height: 600 };
    expect(td.heights).toHaveLength(3);
    expect(td.width).toBe(800);
  });

  it('ExplosionColor has center and outer', () => {
    const ec: ExplosionColor = { center: '#ff0', outer: '#f00' };
    expect(ec.center).toBe('#ff0');
  });

  it('Shot has angle, power, weaponType, and ownerTankId', () => {
    const shot: Shot = {
      angle: 45,
      power: 80,
      weaponType: WeaponType.Standard,
      ownerTankId: 'tank-1',
    };
    expect(shot.angle).toBe(45);
    expect(shot.weaponType).toBe(WeaponType.Standard);
  });

  it('WeaponConfig has all required fields', () => {
    const wc: WeaponConfig = {
      type: WeaponType.Standard,
      name: 'Standard Shell',
      description: 'A basic shell',
      damage: 25,
      blastRadius: 30,
      cost: 0,
      ammo: Infinity,
      speedMultiplier: 1.0,
      explosionColor: { center: '#ff0', outer: '#f00' },
    };
    expect(wc.type).toBe(WeaponType.Standard);
    expect(wc.ammo).toBe(Infinity);
  });

  it('TankState has all required fields', () => {
    const tank: TankState = {
      id: 'tank-1',
      name: 'Player',
      position: { x: 100, y: 200 },
      barrelAngle: 0,
      hp: 100,
      maxHp: 100,
      color: '#f00',
      isPlayer: true,
      isAlive: true,
      fuel: 100,
      queuedShot: null,
    };
    expect(tank.id).toBe('tank-1');
    expect(tank.queuedShot).toBeNull();
  });

  it('TankState queuedShot can hold a Shot', () => {
    const tank: TankState = {
      id: 'tank-2',
      name: 'Bot',
      position: { x: 300, y: 400 },
      barrelAngle: 45,
      hp: 80,
      maxHp: 100,
      color: '#00f',
      isPlayer: false,
      isAlive: true,
      fuel: 50,
      queuedShot: {
        angle: 45,
        power: 60,
        weaponType: WeaponType.Sniper,
        ownerTankId: 'tank-2',
      },
    };
    expect(tank.queuedShot).not.toBeNull();
    expect(tank.queuedShot!.weaponType).toBe(WeaponType.Sniper);
  });

  it('ProjectileState has all required fields including trail', () => {
    const proj: ProjectileState = {
      position: { x: 50, y: 50 },
      velocity: { vx: 10, vy: -5 },
      weaponType: WeaponType.Heavy,
      ownerTankId: 'tank-1',
      active: true,
      trail: [{ x: 40, y: 55 }, { x: 45, y: 52 }],
    };
    expect(proj.active).toBe(true);
    expect(proj.trail).toHaveLength(2);
  });

  it('Particle has position, velocity, color, life, maxLife', () => {
    const p: Particle = {
      position: { x: 10, y: 20 },
      velocity: { vx: 1, vy: -1 },
      color: '#fff',
      life: 0.5,
      maxLife: 1.0,
    };
    expect(p.life).toBeLessThanOrEqual(p.maxLife);
  });

  it('ExplosionState has all required fields', () => {
    const exp: ExplosionState = {
      position: { x: 100, y: 100 },
      radius: 10,
      maxRadius: 30,
      phase: 0,
      particles: [],
      weaponType: WeaponType.Standard,
      timer: 0,
    };
    expect(exp.radius).toBeLessThanOrEqual(exp.maxRadius);
  });

  it('Wind has speed', () => {
    const wind: Wind = { speed: -15 };
    expect(wind.speed).toBe(-15);
  });

  it('PlayerStats has gamesPlayed, gamesWon, totalKills', () => {
    const stats: PlayerStats = { gamesPlayed: 10, gamesWon: 3, totalKills: 15 };
    expect(stats.gamesWon).toBeLessThanOrEqual(stats.gamesPlayed);
  });

  it('WeaponInventory has sniper and heavy counts', () => {
    const inv: WeaponInventory = { sniper: 5, heavy: 2 };
    expect(inv.sniper).toBe(5);
    expect(inv.heavy).toBe(2);
  });

  it('StoredPlayerProfile has name, balance, stats, weaponInventory', () => {
    const profile: StoredPlayerProfile = {
      name: 'TestPlayer',
      balance: 500,
      stats: { gamesPlayed: 0, gamesWon: 0, totalKills: 0 },
      weaponInventory: { sniper: 0, heavy: 0 },
    };
    expect(profile.name).toBe('TestPlayer');
    expect(profile.balance).toBe(500);
  });

  it('DifficultyConfig has angleVariance, powerVariance, multiplier', () => {
    const dc: DifficultyConfig = { angleVariance: 10, powerVariance: 20, multiplier: 1.0 };
    expect(dc.multiplier).toBe(1.0);
  });

  it('GameState has all required fields', () => {
    const state: GameState = {
      phase: GamePhase.Playing,
      turnNumber: 1,
      tanks: [],
      terrain: { heights: [], width: 800, height: 600 },
      wind: { speed: 5 },
      selectedWeapon: WeaponType.Standard,
      winner: null,
      projectiles: [],
      explosions: [],
    };
    expect(state.phase).toBe(GamePhase.Playing);
    expect(state.winner).toBeNull();
  });

  it('GameState winner can be a TankState', () => {
    const winnerTank: TankState = {
      id: 'tank-1',
      name: 'Winner',
      position: { x: 100, y: 200 },
      barrelAngle: 0,
      hp: 50,
      maxHp: 100,
      color: '#0f0',
      isPlayer: true,
      isAlive: true,
      fuel: 100,
      queuedShot: null,
    };
    const state: GameState = {
      phase: GamePhase.GameOver,
      turnNumber: 10,
      tanks: [winnerTank],
      terrain: { heights: [100], width: 800, height: 600 },
      wind: { speed: 0 },
      selectedWeapon: WeaponType.Standard,
      winner: winnerTank,
      projectiles: [],
      explosions: [],
    };
    expect(state.winner).not.toBeNull();
    expect(state.winner!.name).toBe('Winner');
  });
});
