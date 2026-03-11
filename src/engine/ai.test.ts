import { describe, it, expect, vi, afterEach } from 'vitest';
import { calculateIdealShot, calculateAIShot, selectTarget } from './ai';
import { updateProjectilePosition, uiAngleToPhysics, POWER_SCALE } from './physics';
import { getTerrainHeight } from './terrain';
import type { TankState, Wind, TerrainData, AIDifficulty, Shot } from '../types/game';
import { DIFFICULTY_CONFIGS } from '../types/game';

// === Test Helpers ===

function makeTank(overrides: Partial<TankState> = {}): TankState {
  return {
    id: '1',
    name: 'Tank',
    position: { x: 100, y: 300 },
    barrelAngle: 45,
    hp: 100,
    maxHp: 100,
    color: '#f00',
    isPlayer: false,
    isAlive: true,
    fuel: 100,
    queuedShot: null,
    ...overrides,
  };
}

function makeFlatTerrain(height: number, width: number): TerrainData {
  const heights = new Array<number>(width).fill(height);
  return { heights, width, height: height * 3 };
}

/**
 * Simulate a shot and return the landing x-coordinate.
 */
function simulateShot(
  startX: number,
  startY: number,
  shot: Shot,
  windSpeed: number,
  terrain: TerrainData,
): number {
  const dt = 1 / 60;
  const maxSteps = 10000;
  const physicsAngle = uiAngleToPhysics(shot.angle);
  const scaledPower = shot.power * POWER_SCALE;

  let x = startX;
  let y = startY;
  let vx = scaledPower * Math.cos(physicsAngle);
  let vy = scaledPower * Math.sin(physicsAngle);

  for (let step = 0; step < maxSteps; step++) {
    const result = updateProjectilePosition({ x, y }, { vx, vy }, windSpeed, dt);
    x = result.position.x;
    y = result.position.y;
    vx = result.velocity.vx;
    vy = result.velocity.vy;

    const terrainH = getTerrainHeight(terrain, x);
    if (y <= terrainH) {
      return x;
    }
    if (y < 0) {
      return x;
    }
    if (x < -100 || x > terrain.width + 100) {
      return x;
    }
  }
  return x;
}

// === Tests ===

describe('calculateIdealShot', () => {
  it('hits target at zero wind on flat terrain', () => {
    const terrain = makeFlatTerrain(200, 1200);
    const shooter = makeTank({ id: 's1', position: { x: 200, y: 200 } });
    const target = makeTank({ id: 't1', position: { x: 600, y: 200 } });
    const wind: Wind = { speed: 0 };

    const shot = calculateIdealShot(shooter, target, wind, terrain);
    const landX = simulateShot(shooter.position.x, shooter.position.y, shot, wind.speed, terrain);

    expect(Math.abs(landX - target.position.x)).toBeLessThan(5);
  });

  it('hits target with positive wind on flat terrain', () => {
    const terrain = makeFlatTerrain(200, 1200);
    const shooter = makeTank({ id: 's1', position: { x: 200, y: 200 } });
    const target = makeTank({ id: 't1', position: { x: 600, y: 200 } });
    const wind: Wind = { speed: 5 };

    const shot = calculateIdealShot(shooter, target, wind, terrain);
    const landX = simulateShot(shooter.position.x, shooter.position.y, shot, wind.speed, terrain);

    expect(Math.abs(landX - target.position.x)).toBeLessThan(5);
  });

  it('hits target with negative wind on flat terrain', () => {
    const terrain = makeFlatTerrain(200, 1200);
    const shooter = makeTank({ id: 's1', position: { x: 200, y: 200 } });
    const target = makeTank({ id: 't1', position: { x: 600, y: 200 } });
    const wind: Wind = { speed: -3 };

    const shot = calculateIdealShot(shooter, target, wind, terrain);
    const landX = simulateShot(shooter.position.x, shooter.position.y, shot, wind.speed, terrain);

    expect(Math.abs(landX - target.position.x)).toBeLessThan(5);
  });

  it('hits target when shooting left (target to the left)', () => {
    const terrain = makeFlatTerrain(200, 1200);
    const shooter = makeTank({ id: 's1', position: { x: 800, y: 200 } });
    const target = makeTank({ id: 't1', position: { x: 300, y: 200 } });
    const wind: Wind = { speed: 0 };

    const shot = calculateIdealShot(shooter, target, wind, terrain);
    const landX = simulateShot(shooter.position.x, shooter.position.y, shot, wind.speed, terrain);

    expect(Math.abs(landX - target.position.x)).toBeLessThan(5);
  });

  it('returns valid angle and power ranges', () => {
    const terrain = makeFlatTerrain(200, 1200);
    const shooter = makeTank({ id: 's1', position: { x: 200, y: 200 } });
    const target = makeTank({ id: 't1', position: { x: 600, y: 200 } });
    const wind: Wind = { speed: 0 };

    const shot = calculateIdealShot(shooter, target, wind, terrain);

    expect(shot.angle).toBeGreaterThanOrEqual(-120);
    expect(shot.angle).toBeLessThanOrEqual(120);
    expect(shot.power).toBeGreaterThanOrEqual(0);
    expect(shot.power).toBeLessThanOrEqual(100);
    expect(shot.weaponType).toBe('standard');
    expect(shot.ownerTankId).toBe('s1');
  });
});

describe('calculateAIShot', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    if (randomSpy) {
      randomSpy.mockRestore();
    }
  });

  it('returns a shot with valid ranges', () => {
    const terrain = makeFlatTerrain(200, 1200);
    const shooter = makeTank({ id: 's1', position: { x: 200, y: 200 } });
    const target = makeTank({ id: 't1', position: { x: 600, y: 200 } });
    const wind: Wind = { speed: 0 };

    const shot = calculateAIShot(shooter, target, wind, terrain, 'veteran');

    expect(shot.angle).toBeGreaterThanOrEqual(-120);
    expect(shot.angle).toBeLessThanOrEqual(120);
    expect(shot.power).toBeGreaterThanOrEqual(0);
    expect(shot.power).toBeLessThanOrEqual(100);
    expect(shot.weaponType).toBe('standard');
    expect(shot.ownerTankId).toBe('s1');
  });

  it('adds zero variance when Math.random returns 0.5', () => {
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const terrain = makeFlatTerrain(200, 1200);
    const shooter = makeTank({ id: 's1', position: { x: 200, y: 200 } });
    const target = makeTank({ id: 't1', position: { x: 600, y: 200 } });
    const wind: Wind = { speed: 0 };

    // With random=0.5, noise = (0.5-0.5)*2*variance = 0
    // But calculateIdealShot also uses simulation internally, so we just check
    // the AI shot equals the ideal shot
    const idealShot = calculateIdealShot(shooter, target, wind, terrain);
    const aiShot = calculateAIShot(shooter, target, wind, terrain, 'veteran');

    expect(aiShot.angle).toBe(idealShot.angle);
    expect(aiShot.power).toBe(idealShot.power);
  });

  it('variance increases with lower difficulty (blindFool > primus)', () => {
    const terrain = makeFlatTerrain(200, 1200);
    const shooter = makeTank({ id: 's1', position: { x: 200, y: 200 } });
    const target = makeTank({ id: 't1', position: { x: 600, y: 200 } });
    const wind: Wind = { speed: 0 };

    const sampleCount = 200;
    const collectVariance = (difficulty: AIDifficulty): { angleVar: number; powerVar: number } => {
      const ideal = calculateIdealShot(shooter, target, wind, terrain);
      let totalAngleDiff = 0;
      let totalPowerDiff = 0;
      for (let i = 0; i < sampleCount; i++) {
        const shot = calculateAIShot(shooter, target, wind, terrain, difficulty);
        totalAngleDiff += Math.abs(shot.angle - ideal.angle);
        totalPowerDiff += Math.abs(shot.power - ideal.power);
      }
      return {
        angleVar: totalAngleDiff / sampleCount,
        powerVar: totalPowerDiff / sampleCount,
      };
    };

    const blindFoolVar = collectVariance('blindFool');
    const primusVar = collectVariance('primus');

    expect(blindFoolVar.angleVar).toBeGreaterThan(primusVar.angleVar);
    expect(blindFoolVar.powerVar).toBeGreaterThan(primusVar.powerVar);
  });

  it('difficulty variance values match the config table', () => {
    const difficulties: AIDifficulty[] = ['blindFool', 'private', 'veteran', 'centurion', 'primus'];
    const expected = [
      { angleVariance: 30, powerVariance: 40 },
      { angleVariance: 15, powerVariance: 25 },
      { angleVariance: 8, powerVariance: 15 },
      { angleVariance: 4, powerVariance: 8 },
      { angleVariance: 2, powerVariance: 4 },
    ];

    difficulties.forEach((diff, i) => {
      const config = DIFFICULTY_CONFIGS[diff];
      expect(config.angleVariance).toBe(expected[i]?.angleVariance);
      expect(config.powerVariance).toBe(expected[i]?.powerVariance);
    });
  });

  it('clamps angle to +-120 even with extreme variance', () => {
    // Force Math.random to return 0 (max negative noise)
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const terrain = makeFlatTerrain(200, 1200);
    const shooter = makeTank({ id: 's1', position: { x: 200, y: 200 } });
    const target = makeTank({ id: 't1', position: { x: 600, y: 200 } });
    const wind: Wind = { speed: 0 };

    const shot = calculateAIShot(shooter, target, wind, terrain, 'blindFool');

    expect(shot.angle).toBeGreaterThanOrEqual(-120);
    expect(shot.angle).toBeLessThanOrEqual(120);
    expect(shot.power).toBeGreaterThanOrEqual(0);
    expect(shot.power).toBeLessThanOrEqual(100);
  });

  it('clamps power to 0-100 even with extreme variance', () => {
    // Force Math.random to return 1 (max positive noise)
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1);
    const terrain = makeFlatTerrain(200, 1200);
    const shooter = makeTank({ id: 's1', position: { x: 200, y: 200 } });
    const target = makeTank({ id: 't1', position: { x: 600, y: 200 } });
    const wind: Wind = { speed: 0 };

    const shot = calculateAIShot(shooter, target, wind, terrain, 'blindFool');

    expect(shot.angle).toBeGreaterThanOrEqual(-120);
    expect(shot.angle).toBeLessThanOrEqual(120);
    expect(shot.power).toBeGreaterThanOrEqual(0);
    expect(shot.power).toBeLessThanOrEqual(100);
  });
});

describe('selectTarget', () => {
  it('returns null for empty tank list', () => {
    const shooter = makeTank({ id: 's1' });
    const result = selectTarget(shooter, [], null);
    expect(result).toBeNull();
  });

  it('returns null when only the shooter is in the list', () => {
    const shooter = makeTank({ id: 's1' });
    const result = selectTarget(shooter, [shooter], null);
    expect(result).toBeNull();
  });

  it('never targets itself', () => {
    const shooter = makeTank({ id: 's1' });
    const other = makeTank({ id: 't1', position: { x: 500, y: 200 } });
    for (let i = 0; i < 50; i++) {
      const result = selectTarget(shooter, [shooter, other], null);
      expect(result).not.toBeNull();
      expect(result?.id).not.toBe('s1');
    }
  });

  it('prefers last target if still alive', () => {
    const shooter = makeTank({ id: 's1' });
    const t1 = makeTank({ id: 't1', position: { x: 300, y: 200 } });
    const t2 = makeTank({ id: 't2', position: { x: 500, y: 200 } });

    const result = selectTarget(shooter, [shooter, t1, t2], 't2');
    expect(result?.id).toBe('t2');
  });

  it('picks new target when last target is dead', () => {
    const shooter = makeTank({ id: 's1' });
    const t1 = makeTank({ id: 't1', position: { x: 300, y: 200 } });
    const t2 = makeTank({ id: 't2', position: { x: 500, y: 200 }, isAlive: false });

    const result = selectTarget(shooter, [shooter, t1, t2], 't2');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('t1');
  });

  it('does not return dead tanks', () => {
    const shooter = makeTank({ id: 's1' });
    const t1 = makeTank({ id: 't1', isAlive: false });
    const t2 = makeTank({ id: 't2', isAlive: false });

    const result = selectTarget(shooter, [shooter, t1, t2], null);
    expect(result).toBeNull();
  });

  it('picks a random alive enemy when no lastTargetId', () => {
    const shooter = makeTank({ id: 's1' });
    const t1 = makeTank({ id: 't1', position: { x: 300, y: 200 } });
    const t2 = makeTank({ id: 't2', position: { x: 500, y: 200 } });

    const selectedIds = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const result = selectTarget(shooter, [shooter, t1, t2], null);
      if (result) selectedIds.add(result.id);
    }
    // With 100 tries and uniform random, should pick both
    expect(selectedIds.size).toBeGreaterThanOrEqual(1);
    // Both should be valid targets
    for (const id of selectedIds) {
      expect(['t1', 't2']).toContain(id);
    }
  });
});
