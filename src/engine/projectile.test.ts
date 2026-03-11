import { describe, it, expect } from 'vitest';
import {
  createProjectile,
  updateProjectile,
  checkTerrainCollision,
  checkTankCollision,
  isOutOfBounds,
} from './projectile';
import type { TankState, ProjectileState, TerrainData } from '../types/game';

function makeTank(overrides: Partial<TankState> = {}): TankState {
  return {
    id: 'tank1',
    name: 'Tank 1',
    position: { x: 100, y: 200 },
    barrelAngle: 0,
    hp: 100,
    maxHp: 100,
    color: '#FF0000',
    isPlayer: true,
    isAlive: true,
    fuel: 100,
    queuedShot: null,
    ...overrides,
  };
}

function makeTerrain(overrides: Partial<TerrainData> = {}): TerrainData {
  return {
    heights: new Array(801).fill(100) as number[],
    width: 800,
    height: 600,
    ...overrides,
  };
}

describe('createProjectile', () => {
  it('creates a projectile at the barrel-tip position offset from tank', () => {
    const tank = makeTank({ position: { x: 100, y: 200 } });
    // angle=0 means straight up: physicsAngle = 90 deg
    // cos(90deg) ~ 0, sin(90deg) ~ 1
    // barrel tip should be ~25 pixels above tank
    const proj = createProjectile(tank, 0, 50, 'standard');

    expect(proj.position.x).toBeCloseTo(100, 0);
    expect(proj.position.y).toBeCloseTo(225, 0);
    expect(proj.ownerTankId).toBe('tank1');
    expect(proj.active).toBe(true);
    expect(proj.trail).toEqual([]);
    expect(proj.weaponType).toBe('standard');
  });

  it('offsets barrel tip correctly for angled shots', () => {
    const tank = makeTank({ position: { x: 100, y: 200 } });
    // angle=90 (pointing left in UI): physicsAngle = 90 - 90 = 0 deg
    // cos(0)=1, sin(0)=0 => barrel tip at (125, 200)
    const proj = createProjectile(tank, 90, 50, 'standard');
    expect(proj.position.x).toBeCloseTo(125, 0);
    expect(proj.position.y).toBeCloseTo(200, 0);
  });

  it('uses weapon speedMultiplier for initial velocity', () => {
    const tank = makeTank();
    const standard = createProjectile(tank, 0, 50, 'standard');
    const sniper = createProjectile(tank, 0, 50, 'sniper');
    const heavy = createProjectile(tank, 0, 50, 'heavy');

    // Fired straight up: vy should reflect power * POWER_SCALE * speedMultiplier
    // standard: 50 * 1.12 * 1.0 = 56
    // sniper: 50 * 1.12 * 1.3 = 72.8
    // heavy: 50 * 1.12 * 0.8 = 44.8
    expect(standard.velocity.vy).toBeCloseTo(56, 1);
    expect(sniper.velocity.vy).toBeCloseTo(72.8, 1);
    expect(heavy.velocity.vy).toBeCloseTo(44.8, 1);
  });

  it('sets active to true and trail to empty', () => {
    const tank = makeTank();
    const proj = createProjectile(tank, 45, 80, 'standard');
    expect(proj.active).toBe(true);
    expect(proj.trail).toEqual([]);
  });
});

describe('updateProjectile', () => {
  it('applies gravity so y decreases over time', () => {
    const proj: ProjectileState = {
      position: { x: 100, y: 300 },
      velocity: { vx: 10, vy: 0 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };

    const updated = updateProjectile(proj, 0, 1.0);
    // vy starts at 0, gravity pulls down: newY = 300 + 0*1 - 0.5*10*1 = 295
    expect(updated.position.y).toBeCloseTo(295, 5);
    // vy should decrease: 0 - 10*1 = -10
    expect(updated.velocity.vy).toBeCloseTo(-10, 5);
  });

  it('applies wind to horizontal movement', () => {
    const proj: ProjectileState = {
      position: { x: 100, y: 300 },
      velocity: { vx: 0, vy: 0 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };

    // Positive wind should push projectile in positive x direction
    const updated = updateProjectile(proj, 10, 1.0);
    // windAccel = 10 * 0.15 = 1.5
    // newX = 100 + 0*1 + 0.5*1.5*1 = 100.75
    expect(updated.position.x).toBeCloseTo(100.75, 5);
    // newVx = 0 + 1.5*1 = 1.5
    expect(updated.velocity.vx).toBeCloseTo(1.5, 5);
  });

  it('accumulates trail points on each update', () => {
    const proj: ProjectileState = {
      position: { x: 100, y: 300 },
      velocity: { vx: 50, vy: 50 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };

    const updated1 = updateProjectile(proj, 0, 0.1);
    expect(updated1.trail).toHaveLength(1);
    expect(updated1.trail[0]).toEqual({ x: 100, y: 300 });

    const updated2 = updateProjectile(updated1, 0, 0.1);
    expect(updated2.trail).toHaveLength(2);
    expect(updated2.trail[0]).toEqual({ x: 100, y: 300 });
  });

  it('correctly integrates position over small timestep', () => {
    const proj: ProjectileState = {
      position: { x: 0, y: 100 },
      velocity: { vx: 100, vy: 50 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };

    const dt = 0.016;
    const updated = updateProjectile(proj, 0, dt);
    // x = 0 + 100*0.016 = 1.6
    expect(updated.position.x).toBeCloseTo(1.6, 3);
    // y = 100 + 50*0.016 - 0.5*10*0.016^2
    expect(updated.position.y).toBeCloseTo(100 + 50 * 0.016 - 0.5 * 10 * dt * dt, 3);
  });
});

describe('checkTerrainCollision', () => {
  it('detects collision when projectile Y <= terrain height', () => {
    const terrain = makeTerrain();
    const proj: ProjectileState = {
      position: { x: 400, y: 90 }, // below terrain height of 100
      velocity: { vx: 0, vy: -10 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };

    expect(checkTerrainCollision(proj, terrain)).toBe(true);
  });

  it('detects collision when projectile Y equals terrain height', () => {
    const terrain = makeTerrain();
    const proj: ProjectileState = {
      position: { x: 400, y: 100 },
      velocity: { vx: 0, vy: -10 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };

    expect(checkTerrainCollision(proj, terrain)).toBe(true);
  });

  it('does NOT detect collision when projectile is above terrain', () => {
    const terrain = makeTerrain();
    const proj: ProjectileState = {
      position: { x: 400, y: 200 },
      velocity: { vx: 0, vy: -10 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };

    expect(checkTerrainCollision(proj, terrain)).toBe(false);
  });

  it('interpolates terrain height between integer positions', () => {
    const heights = new Array(801).fill(100) as number[];
    heights[50] = 100;
    heights[51] = 200;
    const terrain: TerrainData = { heights, width: 800, height: 600 };

    // At x=50.5, interpolated height should be 150
    const projAbove: ProjectileState = {
      position: { x: 50.5, y: 155 },
      velocity: { vx: 0, vy: -10 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };
    expect(checkTerrainCollision(projAbove, terrain)).toBe(false);

    const projBelow: ProjectileState = {
      ...projAbove,
      position: { x: 50.5, y: 145 },
    };
    expect(checkTerrainCollision(projBelow, terrain)).toBe(true);
  });
});

describe('checkTankCollision', () => {
  it('detects collision when projectile is within blast radius of a tank', () => {
    const tank = makeTank({ id: 'enemy', position: { x: 200, y: 200 } });
    const proj: ProjectileState = {
      position: { x: 205, y: 200 },
      velocity: { vx: 0, vy: 0 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };

    const result = checkTankCollision(proj, [tank], 20);
    expect(result).toBe(tank);
  });

  it('does NOT detect collision when projectile is outside blast radius', () => {
    const tank = makeTank({ id: 'enemy', position: { x: 200, y: 200 } });
    const proj: ProjectileState = {
      position: { x: 250, y: 200 },
      velocity: { vx: 0, vy: 0 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };

    const result = checkTankCollision(proj, [tank], 20);
    expect(result).toBeNull();
  });

  it('does NOT collide with the owner tank', () => {
    const ownerTank = makeTank({ id: 'tank1', position: { x: 100, y: 200 } });
    const proj: ProjectileState = {
      position: { x: 100, y: 200 }, // right on top of owner
      velocity: { vx: 0, vy: 0 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };

    const result = checkTankCollision(proj, [ownerTank], 20);
    expect(result).toBeNull();
  });

  it('does NOT collide with dead tanks', () => {
    const deadTank = makeTank({ id: 'enemy', isAlive: false, position: { x: 100, y: 200 } });
    const proj: ProjectileState = {
      position: { x: 100, y: 200 },
      velocity: { vx: 0, vy: 0 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };

    const result = checkTankCollision(proj, [deadTank], 20);
    expect(result).toBeNull();
  });

  it('returns the first tank hit when multiple are in range', () => {
    const tank1 = makeTank({ id: 'enemy1', position: { x: 105, y: 200 } });
    const tank2 = makeTank({ id: 'enemy2', position: { x: 110, y: 200 } });
    const proj: ProjectileState = {
      position: { x: 100, y: 200 },
      velocity: { vx: 0, vy: 0 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };

    const result = checkTankCollision(proj, [tank1, tank2], 20);
    expect(result).toBe(tank1);
  });
});

describe('isOutOfBounds', () => {
  const terrain = makeTerrain();

  it('returns true when projectile X < 0', () => {
    const proj: ProjectileState = {
      position: { x: -1, y: 300 },
      velocity: { vx: -10, vy: 0 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };

    expect(isOutOfBounds(proj, terrain)).toBe(true);
  });

  it('returns true when projectile X > terrain width', () => {
    const proj: ProjectileState = {
      position: { x: 801, y: 300 },
      velocity: { vx: 10, vy: 0 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };

    expect(isOutOfBounds(proj, terrain)).toBe(true);
  });

  it('returns true when projectile Y < -500', () => {
    const proj: ProjectileState = {
      position: { x: 400, y: -501 },
      velocity: { vx: 0, vy: -10 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };

    expect(isOutOfBounds(proj, terrain)).toBe(true);
  });

  it('returns false when projectile is within bounds', () => {
    const proj: ProjectileState = {
      position: { x: 400, y: 300 },
      velocity: { vx: 10, vy: 10 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };

    expect(isOutOfBounds(proj, terrain)).toBe(false);
  });

  it('returns false at terrain boundary edges (x=0, y=-500)', () => {
    const proj: ProjectileState = {
      position: { x: 0, y: -500 },
      velocity: { vx: 0, vy: 0 },
      weaponType: 'standard',
      ownerTankId: 'tank1',
      active: true,
      trail: [],
    };

    expect(isOutOfBounds(proj, terrain)).toBe(false);
  });
});
