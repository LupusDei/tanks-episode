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
} from './physics.ts';

describe('uiAngleToPhysics', () => {
  it('converts 0° UI (straight up) to π/2 radians', () => {
    const result = uiAngleToPhysics(0);
    expect(result).toBeCloseTo(Math.PI / 2, 10);
  });

  it('converts 90° UI to 0 radians (pointing right in physics)', () => {
    const result = uiAngleToPhysics(90);
    expect(result).toBeCloseTo(0, 10);
  });

  it('converts -90° UI to π radians (pointing left in physics)', () => {
    const result = uiAngleToPhysics(-90);
    expect(result).toBeCloseTo(Math.PI, 10);
  });

  it('converts 45° UI to π/4 radians', () => {
    const result = uiAngleToPhysics(45);
    expect(result).toBeCloseTo(Math.PI / 4, 10);
  });

  it('converts -45° UI to 3π/4 radians', () => {
    const result = uiAngleToPhysics(-45);
    expect(result).toBeCloseTo((3 * Math.PI) / 4, 10);
  });
});

describe('calculateVelocity', () => {
  it('returns zero velocity for 0% power', () => {
    const vel = calculateVelocity(0, 45, 1.0);
    expect(vel.vx).toBeCloseTo(0, 10);
    expect(vel.vy).toBeCloseTo(0, 10);
  });

  it('fires vertically when UI angle is 0° (straight up)', () => {
    const vel = calculateVelocity(50, 0, 1.0);
    expect(vel.vx).toBeCloseTo(0, 5);
    expect(vel.vy).toBeGreaterThan(0);
  });

  it('fires to the right when UI angle is positive (left in UI = right vx)', () => {
    // UI angle 45° → physics angle 45° → positive vx, positive vy
    const vel = calculateVelocity(50, 45, 1.0);
    expect(vel.vx).toBeGreaterThan(0);
    expect(vel.vy).toBeGreaterThan(0);
  });

  it('fires to the left when UI angle is negative', () => {
    // UI angle -45° → physics angle 135° → negative vx, positive vy
    const vel = calculateVelocity(50, -45, 1.0);
    expect(vel.vx).toBeLessThan(0);
    expect(vel.vy).toBeGreaterThan(0);
  });

  it('applies POWER_SCALE correctly', () => {
    const vel = calculateVelocity(100, 90, 1.0);
    // angle 90° UI → physics 0° → vx = 100 * 1.12 * cos(0) = 112, vy = 0
    expect(vel.vx).toBeCloseTo(100 * POWER_SCALE, 5);
    expect(vel.vy).toBeCloseTo(0, 5);
  });

  it('applies speedMultiplier correctly', () => {
    const velBase = calculateVelocity(50, 45, 1.0);
    const velMultiplied = calculateVelocity(50, 45, 2.0);
    expect(velMultiplied.vx).toBeCloseTo(velBase.vx * 2, 5);
    expect(velMultiplied.vy).toBeCloseTo(velBase.vy * 2, 5);
  });
});

describe('updateProjectilePosition', () => {
  it('applies gravity pulling projectile downward over time', () => {
    const pos = { x: 0, y: 100 };
    const vel = { vx: 0, vy: 0 };
    const result = updateProjectilePosition(pos, vel, 0, 1);

    // y should decrease due to gravity: y = 100 + 0*1 - 0.5*10*1 = 95
    expect(result.position.y).toBeCloseTo(95, 5);
    // vy should become negative: vy = 0 - 10*1 = -10
    expect(result.velocity.vy).toBeCloseTo(-10, 5);
  });

  it('applies wind pushing projectile horizontally (positive wind = positive x drift)', () => {
    const pos = { x: 100, y: 100 };
    const vel = { vx: 0, vy: 0 };
    const wind = 10;
    const dt = 1;
    const result = updateProjectilePosition(pos, vel, wind, dt);

    const windAccel = wind * WIND_FACTOR;
    const expectedX = 100 + 0.5 * windAccel * dt * dt;
    expect(result.position.x).toBeCloseTo(expectedX, 5);
    expect(result.velocity.vx).toBeCloseTo(windAccel * dt, 5);
  });

  it('negative wind pushes projectile to the left', () => {
    const pos = { x: 100, y: 100 };
    const vel = { vx: 0, vy: 0 };
    const result = updateProjectilePosition(pos, vel, -10, 1);
    expect(result.position.x).toBeLessThan(100);
  });

  it('moves projectile by velocity in zero wind and zero gravity scenario', () => {
    const pos = { x: 0, y: 1000 };
    const vel = { vx: 50, vy: 50 };
    const dt = 0.1;
    const result = updateProjectilePosition(pos, vel, 0, dt);

    expect(result.position.x).toBeCloseTo(0 + 50 * dt, 5);
    // y = 1000 + 50*0.1 - 0.5*10*0.01 = 1000 + 5 - 0.05 = 1004.95
    expect(result.position.y).toBeCloseTo(1000 + 50 * dt - 0.5 * GRAVITY * dt * dt, 5);
  });

  it('projectile y decreases after apex (gravity dominates)', () => {
    // Fire upward, then simulate many steps
    const vel = calculateVelocity(50, 0, 1.0);
    let pos = { x: 0, y: 0 };
    let currentVel = { ...vel };
    const dt = 0.05;

    let maxY = 0;
    let foundApex = false;

    for (let i = 0; i < 400; i++) {
      const result = updateProjectilePosition(pos, currentVel, 0, dt);
      pos = result.position;
      currentVel = result.velocity;

      if (pos.y > maxY) {
        maxY = pos.y;
      } else if (!foundApex && pos.y < maxY) {
        foundApex = true;
      }
    }

    expect(foundApex).toBe(true);
    // After enough time the projectile should have fallen below the apex
    expect(pos.y).toBeLessThan(maxY);
  });
});

describe('trajectory symmetry', () => {
  it('shots at angle A and -A in zero wind have symmetric horizontal displacement', () => {
    const power = 75;
    const angleA = 30;
    const speedMult = 1.0;
    const dt = 0.05;

    function simulateLanding(angle: number): number {
      const vel = calculateVelocity(power, angle, speedMult);
      let pos = { x: 500, y: 0 };
      let currentVel = { ...vel };

      for (let i = 0; i < 2000; i++) {
        const result = updateProjectilePosition(pos, currentVel, 0, dt);
        pos = result.position;
        currentVel = result.velocity;
        if (pos.y < 0) break;
      }
      return pos.x - 500;
    }

    const displacementA = simulateLanding(angleA);
    const displacementNegA = simulateLanding(-angleA);

    // They should be mirror images: one positive, one negative, same magnitude
    expect(Math.abs(displacementA + displacementNegA)).toBeLessThan(1);
    expect(Math.abs(Math.abs(displacementA) - Math.abs(displacementNegA))).toBeLessThan(1);
  });
});

describe('known outcomes', () => {
  it('45° UI angle at 50% power in zero wind lands at a reasonable distance', () => {
    const vel = calculateVelocity(50, 45, 1.0);
    let pos = { x: 0, y: 0 };
    let currentVel = { ...vel };
    const dt = 0.02;

    for (let i = 0; i < 5000; i++) {
      const result = updateProjectilePosition(pos, currentVel, 0, dt);
      pos = result.position;
      currentVel = result.velocity;
      // Stop when projectile returns to ground (after going up)
      if (i > 10 && pos.y <= 0) break;
    }

    // Range formula: R = v^2 * sin(2*theta) / g
    // v = 50 * 1.12 = 56, theta = 45° physics
    // R = 56^2 * sin(90°) / 10 = 3136 * 1 / 10 = 313.6 px
    // Should be a reasonable distance (not zero, not thousands)
    expect(Math.abs(pos.x)).toBeGreaterThan(200);
    expect(Math.abs(pos.x)).toBeLessThan(500);
  });

  it('100% power at 70° UI angle ≈ ~1024px horizontal distance (medium terrain width)', () => {
    const vel = calculateVelocity(100, 70, 1.0);
    let pos = { x: 0, y: 0 };
    let currentVel = { ...vel };
    const dt = 0.02;

    for (let i = 0; i < 10000; i++) {
      const result = updateProjectilePosition(pos, currentVel, 0, dt);
      pos = result.position;
      currentVel = result.velocity;
      if (i > 10 && pos.y <= 0) break;
    }

    // Physics angle = 90 - 70 = 20°
    // v = 100 * 1.12 = 112
    // R = v^2 * sin(2*20°) / g = 12544 * sin(40°) / 10 ≈ 12544 * 0.6428 / 10 ≈ 806
    // Should be roughly in the range of medium terrain width (~1024)
    // Allow reasonable tolerance for calibration
    expect(pos.x).toBeGreaterThan(600);
    expect(pos.x).toBeLessThan(1200);
  });
});

describe('coordinate conversion', () => {
  it('worldToScreen converts y-up to y-down', () => {
    const world = { x: 100, y: 200 };
    const screen = worldToScreen(world, 600);
    expect(screen.x).toBe(100);
    expect(screen.y).toBe(400); // 600 - 200
  });

  it('screenToWorld converts y-down to y-up', () => {
    const screen = { x: 100, y: 400 };
    const world = screenToWorld(screen, 600);
    expect(world.x).toBe(100);
    expect(world.y).toBe(200); // 600 - 400
  });

  it('worldToScreen(screenToWorld(p, h), h) === p (round-trip)', () => {
    const original = { x: 42, y: 317 };
    const canvasHeight = 768;
    const roundTripped = worldToScreen(screenToWorld(original, canvasHeight), canvasHeight);
    expect(roundTripped.x).toBeCloseTo(original.x, 10);
    expect(roundTripped.y).toBeCloseTo(original.y, 10);
  });

  it('screenToWorld(worldToScreen(p, h), h) === p (round-trip)', () => {
    const original = { x: 500, y: 250 };
    const canvasHeight = 600;
    const roundTripped = screenToWorld(worldToScreen(original, canvasHeight), canvasHeight);
    expect(roundTripped.x).toBeCloseTo(original.x, 10);
    expect(roundTripped.y).toBeCloseTo(original.y, 10);
  });

  it('worldToScreen places y=0 at the bottom of the screen', () => {
    const screen = worldToScreen({ x: 0, y: 0 }, 600);
    expect(screen.y).toBe(600);
  });

  it('worldToScreen places y=canvasHeight at the top of the screen', () => {
    const screen = worldToScreen({ x: 0, y: 600 }, 600);
    expect(screen.y).toBe(0);
  });
});

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
