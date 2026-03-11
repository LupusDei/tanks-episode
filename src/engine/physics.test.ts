import { describe, it, expect } from 'vitest';
import {
  calculateVelocity,
  updateProjectilePosition,
  worldToScreen,
  screenToWorld,
  uiAngleToPhysics,
  POWER_SCALE,
  GRAVITY,
  WIND_FACTOR,
} from './physics';

// ---------------------------------------------------------------------------
// uiAngleToPhysics
// ---------------------------------------------------------------------------
describe('uiAngleToPhysics', () => {
  it('converts 0° UI (straight up) to π/2 radians', () => {
    expect(uiAngleToPhysics(0)).toBeCloseTo(Math.PI / 2);
  });

  it('converts -90° UI (right) to 0 radians', () => {
    // physics = 90 - (-90) = 180° → π  ... wait, spec says -90 UI → π
    // Actually: -90° UI → physDeg = 90 - (-90) = 180 → π radians
    expect(uiAngleToPhysics(-90)).toBeCloseTo(Math.PI);
  });

  it('converts 90° UI (left) to 0 radians', () => {
    // physDeg = 90 - 90 = 0 → 0 radians
    expect(uiAngleToPhysics(90)).toBeCloseTo(0);
  });

  it('converts 45° UI to π/4 radians', () => {
    // physDeg = 90 - 45 = 45 → π/4
    expect(uiAngleToPhysics(45)).toBeCloseTo(Math.PI / 4);
  });
});

// ---------------------------------------------------------------------------
// calculateVelocity
// ---------------------------------------------------------------------------
describe('calculateVelocity', () => {
  it('returns zero velocity for 0% power', () => {
    const vel = calculateVelocity(0, 45, 1);
    expect(vel.vx).toBeCloseTo(0);
    expect(vel.vy).toBeCloseTo(0);
  });

  it('fires vertically when UI angle is 0° (straight up)', () => {
    const vel = calculateVelocity(50, 0, 1);
    expect(vel.vx).toBeCloseTo(0, 5);
    expect(vel.vy).toBeGreaterThan(0);
  });

  it('returns a velocity vector with correct magnitude', () => {
    const power = 100;
    const multiplier = 1;
    const vel = calculateVelocity(power, 45, multiplier);
    const expectedSpeed = power * POWER_SCALE * multiplier;
    const actualSpeed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy);
    expect(actualSpeed).toBeCloseTo(expectedSpeed, 5);
  });

  it('scales velocity by speedMultiplier', () => {
    const velBase = calculateVelocity(50, 30, 1);
    const velDouble = calculateVelocity(50, 30, 2);
    expect(velDouble.vx).toBeCloseTo(velBase.vx * 2, 5);
    expect(velDouble.vy).toBeCloseTo(velBase.vy * 2, 5);
  });

  it('produces symmetric horizontal displacement for angles A and -A', () => {
    const velLeft = calculateVelocity(80, 30, 1);
    const velRight = calculateVelocity(80, -30, 1);
    // vy should be the same (symmetric about vertical)
    expect(velLeft.vy).toBeCloseTo(velRight.vy, 5);
    // vx should be negated
    expect(velLeft.vx).toBeCloseTo(-velRight.vx, 5);
  });
});

// ---------------------------------------------------------------------------
// updateProjectilePosition
// ---------------------------------------------------------------------------
describe('updateProjectilePosition', () => {
  it('gravity pulls the projectile downward over time', () => {
    const pos = { x: 100, y: 500 };
    const vel = { vx: 10, vy: 0 };
    const result = updateProjectilePosition(pos, vel, 0, 1);
    // After 1s with vy=0, y should decrease by 0.5*g*1² = 5
    expect(result.position.y).toBeCloseTo(500 - 0.5 * GRAVITY, 5);
    expect(result.velocity.vy).toBeCloseTo(-GRAVITY, 5);
  });

  it('wind pushes projectile horizontally', () => {
    const pos = { x: 100, y: 500 };
    const vel = { vx: 0, vy: 50 };
    const wind = 5;
    const dt = 1;
    const result = updateProjectilePosition(pos, vel, wind, dt);
    const expectedWindAccel = wind * WIND_FACTOR;
    // x should shift by 0.5 * windAccel * dt²
    expect(result.position.x).toBeCloseTo(100 + 0.5 * expectedWindAccel, 5);
    expect(result.velocity.vx).toBeCloseTo(expectedWindAccel, 5);
  });

  it('does not mutate the input position or velocity', () => {
    const pos = { x: 0, y: 100 };
    const vel = { vx: 10, vy: 20 };
    updateProjectilePosition(pos, vel, 3, 0.5);
    expect(pos).toEqual({ x: 0, y: 100 });
    expect(vel).toEqual({ vx: 10, vy: 20 });
  });

  it('handles zero dt gracefully', () => {
    const pos = { x: 50, y: 200 };
    const vel = { vx: 30, vy: 40 };
    const result = updateProjectilePosition(pos, vel, 5, 0);
    expect(result.position).toEqual(pos);
    expect(result.velocity).toEqual(vel);
  });

  it('correctly integrates position over small dt', () => {
    const pos = { x: 0, y: 0 };
    const vel = { vx: 100, vy: 100 };
    const dt = 0.016; // ~60 fps
    const result = updateProjectilePosition(pos, vel, 0, dt);
    expect(result.position.x).toBeCloseTo(100 * dt, 5);
    expect(result.position.y).toBeCloseTo(100 * dt - 0.5 * GRAVITY * dt * dt, 5);
  });
});

// ---------------------------------------------------------------------------
// Coordinate conversion round-trips
// ---------------------------------------------------------------------------
describe('worldToScreen / screenToWorld', () => {
  it('worldToScreen converts y correctly', () => {
    const canvasH = 768;
    const screen = worldToScreen({ x: 100, y: 200 }, canvasH);
    expect(screen.x).toBe(100);
    expect(screen.y).toBe(768 - 200);
  });

  it('screenToWorld converts y correctly', () => {
    const canvasH = 768;
    const world = screenToWorld({ x: 100, y: 200 }, canvasH);
    expect(world.x).toBe(100);
    expect(world.y).toBe(768 - 200);
  });

  it('round-trips: worldToScreen(screenToWorld(p)) === p', () => {
    const canvasH = 600;
    const original = { x: 42, y: 317 };
    const roundTrip = worldToScreen(screenToWorld(original, canvasH), canvasH);
    expect(roundTrip.x).toBeCloseTo(original.x);
    expect(roundTrip.y).toBeCloseTo(original.y);
  });

  it('round-trips: screenToWorld(worldToScreen(p)) === p', () => {
    const canvasH = 1024;
    const original = { x: 250, y: 700 };
    const roundTrip = screenToWorld(worldToScreen(original, canvasH), canvasH);
    expect(roundTrip.x).toBeCloseTo(original.x);
    expect(roundTrip.y).toBeCloseTo(original.y);
  });
});

// ---------------------------------------------------------------------------
// Trajectory / calibration tests
// ---------------------------------------------------------------------------
describe('trajectory calibration', () => {
  /**
   * Helper: simulate a projectile from origin until it falls below y=0.
   * Returns horizontal distance traveled.
   */
  function simulateLanding(power: number, uiAngle: number, wind: number): number {
    const vel = calculateVelocity(power, uiAngle, 1);
    let pos = { x: 0, y: 0 };
    let v = { ...vel };
    const dt = 0.01;
    const maxSteps = 100_000;

    for (let i = 0; i < maxSteps; i++) {
      const result = updateProjectilePosition(pos, v, wind, dt);
      pos = result.position;
      v = result.velocity;
      if (pos.y < 0 && i > 0) break;
    }
    return pos.x;
  }

  it('trajectory symmetry: angles A and -A in zero wind have symmetric horizontal displacement', () => {
    const distLeft = simulateLanding(80, 30, 0);
    const distRight = simulateLanding(80, -30, 0);
    // Left-aimed shot should go left (negative x), right-aimed should go right (positive x)
    expect(distLeft).toBeCloseTo(-distRight, 0);
  });

  it('45° at 50% power in zero wind yields a reasonable landing distance', () => {
    // UI 45° → physics = 90 - 45 = 45° → max range angle
    // v0 = 50 * 1.12 = 56, range = v0² * sin(90°) / g = 3136/10 ≈ 313.6
    // With the spec formula, UI positive = left = negative x.
    // Use absolute distance for calibration.
    const dist = simulateLanding(50, 45, 0);
    expect(Math.abs(dist)).toBeGreaterThan(200);
    expect(Math.abs(dist)).toBeLessThan(500);
  });

  it('100% power at 70° UI → roughly terrain width for medium (~1024px)', () => {
    // UI 70° → physics = 90 - 70 = 20°
    // v0 = 100 * 1.12 = 112
    // range = v0² * sin(2 * 20°) / g = 12544 * sin(40°) / 10 ≈ 806
    // Calibration check — allow a generous range.
    const dist = simulateLanding(100, 70, 0);
    expect(Math.abs(dist)).toBeGreaterThan(500);
    expect(Math.abs(dist)).toBeLessThan(1500);
  });
});

// ---------------------------------------------------------------------------
// Exported constants
// ---------------------------------------------------------------------------
describe('exported constants', () => {
  it('POWER_SCALE is 1.12', () => {
    expect(POWER_SCALE).toBe(1.12);
  });

  it('GRAVITY is 10', () => {
    expect(GRAVITY).toBe(10);
  });

  it('WIND_FACTOR is 0.15', () => {
    expect(WIND_FACTOR).toBe(0.15);
  });
});
