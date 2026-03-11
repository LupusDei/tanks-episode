import { describe, it, expect } from 'vitest';
import {
  createProjectile,
  updateProjectile,
  checkTerrainCollision,
  checkTankCollision,
  isOutOfBounds,
} from './projectile.ts';
import { WeaponType } from '../types/game.ts';
import type { TankState, ProjectileState, TerrainData } from '../types/game.ts';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeTank(overrides: Partial<TankState> = {}): TankState {
  return {
    id: 't1',
    name: 'Tank',
    position: { x: 100, y: 200 },
    barrelAngle: 45,
    hp: 100,
    maxHp: 100,
    color: '#ff0000',
    isPlayer: true,
    isAlive: true,
    fuel: 100,
    queuedShot: null,
    ...overrides,
  };
}

function makeProjectile(overrides: Partial<ProjectileState> = {}): ProjectileState {
  return {
    position: { x: 100, y: 200 },
    velocity: { vx: 50, vy: 50 },
    weaponType: WeaponType.Standard,
    ownerTankId: 't1',
    active: true,
    trail: [],
    ...overrides,
  };
}

function makeTerrain(overrides: Partial<TerrainData> = {}): TerrainData {
  return {
    heights: new Array(1000).fill(100) as number[],
    width: 1000,
    height: 600,
    ...overrides,
  };
}

// ── createProjectile ─────────────────────────────────────────────────────────

describe('createProjectile', () => {
  it('creates projectile at barrel-tip position for 45-degree angle', () => {
    const tank = makeTank({ position: { x: 100, y: 200 } });
    const proj = createProjectile(tank, 45, 50, WeaponType.Standard);

    // physicsAngle = 90 - 45 = 45 degrees = π/4 rad
    // barrel tip: x = 100 + 25*cos(π/4), y = (200+16) + 25*sin(π/4)
    const expectedX = 100 + 25 * Math.cos(Math.PI / 4);
    const expectedY = 216 + 25 * Math.sin(Math.PI / 4);
    expect(proj.position.x).toBeCloseTo(expectedX, 5);
    expect(proj.position.y).toBeCloseTo(expectedY, 5);
  });

  it('creates projectile at barrel-tip for 0-degree UI angle (straight right)', () => {
    const tank = makeTank({ position: { x: 50, y: 100 } });
    const proj = createProjectile(tank, 0, 50, WeaponType.Standard);

    // physicsAngle = 90 degrees = π/2
    // barrel tip: x = 50 + 25*cos(π/2) ≈ 50, y = 116 + 25*sin(π/2) = 141
    expect(proj.position.x).toBeCloseTo(50, 0);
    expect(proj.position.y).toBeCloseTo(141, 0);
  });

  it('calculates initial velocity using POWER_SCALE and angle conversion', () => {
    const tank = makeTank();
    const power = 50;
    const proj = createProjectile(tank, 45, power, WeaponType.Standard);

    // speed = 50 * 1.12 * 1.0 = 56
    const speed = power * 1.12 * 1.0;
    const angle = Math.PI / 4;
    expect(proj.velocity.vx).toBeCloseTo(speed * Math.cos(angle), 5);
    expect(proj.velocity.vy).toBeCloseTo(speed * Math.sin(angle), 5);
  });

  it('applies weapon speed multiplier for Sniper', () => {
    const tank = makeTank();
    const power = 50;
    const proj = createProjectile(tank, 45, power, WeaponType.Sniper);

    // speed = 50 * 1.12 * 1.3 (Sniper speedMultiplier)
    const speed = power * 1.12 * 1.3;
    const angle = Math.PI / 4;
    expect(proj.velocity.vx).toBeCloseTo(speed * Math.cos(angle), 5);
    expect(proj.velocity.vy).toBeCloseTo(speed * Math.sin(angle), 5);
  });

  it('applies weapon speed multiplier for Heavy', () => {
    const tank = makeTank();
    const power = 50;
    const proj = createProjectile(tank, 45, power, WeaponType.Heavy);

    const speed = power * 1.12 * 0.8;
    const angle = Math.PI / 4;
    expect(proj.velocity.vx).toBeCloseTo(speed * Math.cos(angle), 5);
    expect(proj.velocity.vy).toBeCloseTo(speed * Math.sin(angle), 5);
  });

  it('sets active=true, empty trail, and correct metadata', () => {
    const tank = makeTank({ id: 'tank-42' });
    const proj = createProjectile(tank, 45, 50, WeaponType.Heavy);

    expect(proj.active).toBe(true);
    expect(proj.trail).toEqual([]);
    expect(proj.weaponType).toBe(WeaponType.Heavy);
    expect(proj.ownerTankId).toBe('tank-42');
  });
});

// ── updateProjectile ─────────────────────────────────────────────────────────

describe('updateProjectile', () => {
  it('applies gravity: y decreases over time for a horizontal shot', () => {
    const proj = makeProjectile({ velocity: { vx: 100, vy: 0 } });
    const updated = updateProjectile(proj, 0, 1);

    // y = 200 + 0*1 - 0.5*10*1 = 195
    expect(updated.position.y).toBeCloseTo(195, 5);
    expect(updated.velocity.vy).toBeCloseTo(-10, 5);
  });

  it('applies wind acceleration to x velocity', () => {
    const proj = makeProjectile({ velocity: { vx: 0, vy: 0 }, position: { x: 0, y: 500 } });
    const wind = 10;
    const dt = 1;
    const updated = updateProjectile(proj, wind, dt);

    // windAccel = 10 * 0.15 = 1.5
    // x = 0 + 0*1 + 0.5*1.5*1 = 0.75
    expect(updated.position.x).toBeCloseTo(0.75, 5);
    expect(updated.velocity.vx).toBeCloseTo(1.5, 5);
  });

  it('applies both gravity and wind simultaneously', () => {
    const proj = makeProjectile({
      position: { x: 100, y: 300 },
      velocity: { vx: 50, vy: 30 },
    });
    const wind = 5;
    const dt = 0.5;
    const updated = updateProjectile(proj, wind, dt);

    const windAccel = 5 * 0.15;
    const expectedX = 100 + 50 * 0.5 + 0.5 * windAccel * 0.25;
    const expectedY = 300 + 30 * 0.5 - 0.5 * 10 * 0.25;
    expect(updated.position.x).toBeCloseTo(expectedX, 5);
    expect(updated.position.y).toBeCloseTo(expectedY, 5);
  });

  it('accumulates trail points on each update', () => {
    const proj = makeProjectile({ position: { x: 10, y: 20 } });
    const step1 = updateProjectile(proj, 0, 0.1);
    const step2 = updateProjectile(step1, 0, 0.1);

    expect(step1.trail).toHaveLength(1);
    expect(step1.trail[0]).toEqual({ x: 10, y: 20 });
    expect(step2.trail).toHaveLength(2);
    expect(step2.trail[0]).toEqual({ x: 10, y: 20 });
  });

  it('returns a new object (immutable update)', () => {
    const proj = makeProjectile();
    const updated = updateProjectile(proj, 0, 0.1);

    expect(updated).not.toBe(proj);
    expect(updated.position).not.toBe(proj.position);
    expect(updated.velocity).not.toBe(proj.velocity);
    expect(updated.trail).not.toBe(proj.trail);
  });

  it('handles negative wind (blowing left)', () => {
    const proj = makeProjectile({ velocity: { vx: 50, vy: 0 }, position: { x: 100, y: 300 } });
    const updated = updateProjectile(proj, -10, 1);

    // windAccel = -10 * 0.15 = -1.5
    // vx_new = 50 + (-1.5) = 48.5
    expect(updated.velocity.vx).toBeCloseTo(48.5, 5);
  });
});

// ── checkTerrainCollision ────────────────────────────────────────────────────

describe('checkTerrainCollision', () => {
  it('detects collision when projectile Y <= terrain height', () => {
    const terrain = makeTerrain({ heights: [100, 100, 100] });
    const proj = makeProjectile({ position: { x: 1, y: 99 } });

    expect(checkTerrainCollision(proj, terrain)).toBe(true);
  });

  it('detects collision when projectile Y equals terrain height exactly', () => {
    const terrain = makeTerrain({ heights: [100, 100, 100] });
    const proj = makeProjectile({ position: { x: 1, y: 100 } });

    expect(checkTerrainCollision(proj, terrain)).toBe(true);
  });

  it('returns false when projectile is above terrain', () => {
    const terrain = makeTerrain({ heights: [100, 100, 100] });
    const proj = makeProjectile({ position: { x: 1, y: 101 } });

    expect(checkTerrainCollision(proj, terrain)).toBe(false);
  });

  it('interpolates terrain height at fractional x positions', () => {
    // heights[2]=100, heights[3]=200 → at x=2.5 height should be 150
    const heights = [100, 100, 100, 200, 200];
    const terrain = makeTerrain({ heights, width: 5 });

    const above = makeProjectile({ position: { x: 2.5, y: 151 } });
    expect(checkTerrainCollision(above, terrain)).toBe(false);

    const below = makeProjectile({ position: { x: 2.5, y: 149 } });
    expect(checkTerrainCollision(below, terrain)).toBe(true);
  });
});

// ── checkTankCollision ───────────────────────────────────────────────────────

describe('checkTankCollision', () => {
  it('detects collision when projectile within blast radius of a tank', () => {
    const enemy = makeTank({ id: 'enemy', position: { x: 105, y: 200 } });
    const proj = makeProjectile({ position: { x: 100, y: 200 }, ownerTankId: 'me' });

    const hit = checkTankCollision(proj, [enemy], 30);
    expect(hit).toBe(enemy);
  });

  it('returns null when projectile is outside blast radius', () => {
    const enemy = makeTank({ id: 'enemy', position: { x: 200, y: 200 } });
    const proj = makeProjectile({ position: { x: 100, y: 200 }, ownerTankId: 'me' });

    const hit = checkTankCollision(proj, [enemy], 30);
    expect(hit).toBeNull();
  });

  it('excludes the owning tank (no self-hit)', () => {
    const owner = makeTank({ id: 'me', position: { x: 100, y: 200 } });
    const proj = makeProjectile({ position: { x: 100, y: 200 }, ownerTankId: 'me' });

    const hit = checkTankCollision(proj, [owner], 30);
    expect(hit).toBeNull();
  });

  it('skips dead tanks', () => {
    const dead = makeTank({ id: 'enemy', isAlive: false, position: { x: 100, y: 200 } });
    const proj = makeProjectile({ position: { x: 100, y: 200 }, ownerTankId: 'me' });

    const hit = checkTankCollision(proj, [dead], 30);
    expect(hit).toBeNull();
  });

  it('returns the first collided tank when multiple are in range', () => {
    const e1 = makeTank({ id: 'e1', position: { x: 101, y: 200 } });
    const e2 = makeTank({ id: 'e2', position: { x: 102, y: 200 } });
    const proj = makeProjectile({ position: { x: 100, y: 200 }, ownerTankId: 'me' });

    const hit = checkTankCollision(proj, [e1, e2], 30);
    expect(hit).toBe(e1);
  });

  it('detects collision at exactly the blast radius boundary', () => {
    const enemy = makeTank({ id: 'enemy', position: { x: 130, y: 200 } });
    const proj = makeProjectile({ position: { x: 100, y: 200 }, ownerTankId: 'me' });

    const hit = checkTankCollision(proj, [enemy], 30);
    expect(hit).toBe(enemy);
  });
});

// ── isOutOfBounds ────────────────────────────────────────────────────────────

describe('isOutOfBounds', () => {
  it('returns true when X < 0', () => {
    const proj = makeProjectile({ position: { x: -1, y: 300 } });
    expect(isOutOfBounds(proj, makeTerrain())).toBe(true);
  });

  it('returns true when X > terrain width', () => {
    const terrain = makeTerrain({ width: 1000 });
    const proj = makeProjectile({ position: { x: 1001, y: 300 } });
    expect(isOutOfBounds(proj, terrain)).toBe(true);
  });

  it('returns true when Y < -500', () => {
    const proj = makeProjectile({ position: { x: 500, y: -501 } });
    expect(isOutOfBounds(proj, makeTerrain())).toBe(true);
  });

  it('returns false when within terrain area', () => {
    const proj = makeProjectile({ position: { x: 500, y: 300 } });
    expect(isOutOfBounds(proj, makeTerrain())).toBe(false);
  });

  it('returns false at terrain boundaries (x=0, x=width)', () => {
    const terrain = makeTerrain({ width: 1000 });
    expect(isOutOfBounds(makeProjectile({ position: { x: 0, y: 300 } }), terrain)).toBe(false);
    expect(isOutOfBounds(makeProjectile({ position: { x: 1000, y: 300 } }), terrain)).toBe(false);
  });

  it('returns false at Y = -500 exactly', () => {
    const proj = makeProjectile({ position: { x: 500, y: -500 } });
    expect(isOutOfBounds(proj, makeTerrain())).toBe(false);
  });
});
