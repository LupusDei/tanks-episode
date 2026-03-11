import { describe, it, expect } from 'vitest';
import {
  createExplosion,
  updateExplosion,
  createDestructionEffect,
  isExplosionComplete,
} from './explosion';
import type { ExplosionState, TankState } from '../types/game';

function makeTank(overrides: Partial<TankState> = {}): TankState {
  return {
    id: 'tank-1',
    name: 'TestTank',
    position: { x: 100, y: 200 },
    barrelAngle: 45,
    hp: 100,
    maxHp: 100,
    color: '#00FF00',
    isPlayer: true,
    isAlive: true,
    fuel: 100,
    queuedShot: null,
    ...overrides,
  };
}

function advanceExplosion(explosion: ExplosionState, totalTime: number, step: number): ExplosionState {
  let state = explosion;
  let elapsed = 0;
  while (elapsed < totalTime) {
    const dt = Math.min(step, totalTime - elapsed);
    state = updateExplosion(state, dt);
    elapsed += dt;
  }
  return state;
}

describe('createExplosion', () => {
  it('starts at phase growing with radius 0', () => {
    const explosion = createExplosion({ x: 50, y: 50 }, 'standard');
    expect(explosion.phase).toBe('growing');
    expect(explosion.radius).toBe(0);
    expect(explosion.timer).toBe(0);
  });

  it('uses blastRadius from WEAPON_CONFIGS for standard', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    expect(explosion.maxRadius).toBe(20);
  });

  it('uses blastRadius from WEAPON_CONFIGS for sniper', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'sniper');
    expect(explosion.maxRadius).toBe(12);
  });

  it('uses blastRadius from WEAPON_CONFIGS for heavy', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'heavy');
    expect(explosion.maxRadius).toBe(35);
  });

  it('copies position without sharing reference', () => {
    const pos = { x: 10, y: 20 };
    const explosion = createExplosion(pos, 'standard');
    pos.x = 999;
    expect(explosion.position.x).toBe(10);
  });

  it('generates particles within bounds (10-50)', () => {
    // Run multiple times to check bounds probabilistically
    for (let i = 0; i < 20; i++) {
      const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
      expect(explosion.particles.length).toBeGreaterThanOrEqual(10);
      expect(explosion.particles.length).toBeLessThanOrEqual(50);
    }
  });

  it('particles have non-zero outward velocity', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    for (const particle of explosion.particles) {
      const speed = Math.sqrt(
        particle.velocity.vx * particle.velocity.vx +
        particle.velocity.vy * particle.velocity.vy,
      );
      expect(speed).toBeGreaterThan(0);
    }
  });

  it('particles have life and maxLife between 1 and 2 seconds', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    for (const particle of explosion.particles) {
      expect(particle.life).toBeGreaterThanOrEqual(1.0);
      expect(particle.life).toBeLessThanOrEqual(2.0);
      expect(particle.maxLife).toBe(particle.life);
    }
  });

  it('standard weapon uses correct colors', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    const colors = new Set(explosion.particles.map((p) => p.color));
    // All colors should be either center or outer
    for (const color of colors) {
      expect(['#FF4400', '#FF8800']).toContain(color);
    }
  });

  it('sniper weapon uses correct colors', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'sniper');
    const colors = new Set(explosion.particles.map((p) => p.color));
    for (const color of colors) {
      expect(['#FFFFFF', '#4488FF']).toContain(color);
    }
  });

  it('heavy weapon uses correct colors', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'heavy');
    const colors = new Set(explosion.particles.map((p) => p.color));
    for (const color of colors) {
      expect(['#FF2200', '#FF6600']).toContain(color);
    }
  });

  it('stores the correct weaponType', () => {
    expect(createExplosion({ x: 0, y: 0 }, 'standard').weaponType).toBe('standard');
    expect(createExplosion({ x: 0, y: 0 }, 'sniper').weaponType).toBe('sniper');
    expect(createExplosion({ x: 0, y: 0 }, 'heavy').weaponType).toBe('heavy');
  });
});

describe('updateExplosion', () => {
  it('does not mutate the input explosion', () => {
    const explosion = createExplosion({ x: 50, y: 50 }, 'standard');
    const originalPhase = explosion.phase;
    const originalRadius = explosion.radius;
    const originalTimer = explosion.timer;
    updateExplosion(explosion, 0.1);
    expect(explosion.phase).toBe(originalPhase);
    expect(explosion.radius).toBe(originalRadius);
    expect(explosion.timer).toBe(originalTimer);
  });

  it('radius increases during growing phase', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    const updated = updateExplosion(explosion, 0.1);
    expect(updated.radius).toBeGreaterThan(0);
    expect(updated.phase).toBe('growing');
  });

  it('transitions from growing to peak when radius reaches maxRadius', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    // Advance past the growing duration (0.5s)
    const peaked = advanceExplosion(explosion, 0.55, 0.016);
    expect(peaked.phase).toBe('peak');
    expect(peaked.radius).toBe(peaked.maxRadius);
  });

  it('transitions from peak to fading after peak duration', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    // Advance past growing (0.5s) + peak (0.2s)
    const fading = advanceExplosion(explosion, 0.8, 0.016);
    expect(fading.phase).toBe('fading');
  });

  it('transitions from fading to done after fading duration', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    // Advance past all phases: growing (0.5) + peak (0.2) + fading (0.5) = 1.2
    const done = advanceExplosion(explosion, 1.5, 0.016);
    expect(done.phase).toBe('done');
  });

  it('transitions through all phases in order: growing -> peak -> fading -> done', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    const phases: string[] = [explosion.phase];
    let state = explosion;
    for (let i = 0; i < 200; i++) {
      state = updateExplosion(state, 0.016);
      if (state.phase !== phases[phases.length - 1]) {
        phases.push(state.phase);
      }
      if (state.phase === 'done') break;
    }
    expect(phases).toEqual(['growing', 'peak', 'fading', 'done']);
  });

  it('total duration is approximately 1-2 seconds', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    let state = explosion;
    let totalTime = 0;
    const dt = 0.016;
    while (state.phase !== 'done' && totalTime < 5) {
      state = updateExplosion(state, dt);
      totalTime += dt;
    }
    expect(totalTime).toBeGreaterThanOrEqual(0.9);
    expect(totalTime).toBeLessThanOrEqual(2.5);
  });

  it('done phase remains done', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    const done = advanceExplosion(explosion, 2.0, 0.016);
    expect(done.phase).toBe('done');
    const stillDone = updateExplosion(done, 0.1);
    expect(stillDone.phase).toBe('done');
  });

  it('particles are pulled by gravity (vy increases after updates)', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    const updated = updateExplosion(explosion, 0.1);
    // Each particle's vy should increase by gravity * dt = 10 * 0.1 = 1
    for (let i = 0; i < explosion.particles.length; i++) {
      const originalParticle = explosion.particles[i]!;
      const updatedParticle = updated.particles[i]!;
      expect(updatedParticle.velocity.vy).toBeCloseTo(originalParticle.velocity.vy + 10 * 0.1, 5);
    }
  });

  it('particle positions update based on velocity', () => {
    const explosion = createExplosion({ x: 50, y: 50 }, 'standard');
    const dt = 0.1;
    const updated = updateExplosion(explosion, dt);
    for (let i = 0; i < explosion.particles.length; i++) {
      const orig = explosion.particles[i]!;
      const upd = updated.particles[i]!;
      expect(upd.position.x).toBeCloseTo(orig.position.x + orig.velocity.vx * dt, 5);
      expect(upd.position.y).toBeCloseTo(orig.position.y + orig.velocity.vy * dt, 5);
    }
  });

  it('particle life decreases by dt each update', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    const dt = 0.1;
    const updated = updateExplosion(explosion, dt);
    for (let i = 0; i < explosion.particles.length; i++) {
      expect(updated.particles[i]!.life).toBeCloseTo(
        explosion.particles[i]!.life - dt,
        5,
      );
    }
  });

  it('radius decreases during fading phase', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    // Get to fading
    const fading = advanceExplosion(explosion, 0.8, 0.016);
    expect(fading.phase).toBe('fading');
    const moreFaded = updateExplosion(fading, 0.1);
    expect(moreFaded.radius).toBeLessThan(fading.maxRadius);
  });
});

describe('createDestructionEffect', () => {
  it('creates debris particles', () => {
    const tank = makeTank();
    const effect = createDestructionEffect(tank);
    expect(effect.particles.length).toBeGreaterThan(0);
  });

  it('uses tank color for particles', () => {
    const tank = makeTank({ color: '#FF00FF' });
    const effect = createDestructionEffect(tank);
    for (const particle of effect.particles) {
      expect(particle.color).toBe('#FF00FF');
    }
  });

  it('creates particles at tank position', () => {
    const tank = makeTank({ position: { x: 42, y: 84 } });
    const effect = createDestructionEffect(tank);
    expect(effect.position.x).toBe(42);
    expect(effect.position.y).toBe(84);
  });

  it('destruction particles have outward velocity', () => {
    const tank = makeTank();
    const effect = createDestructionEffect(tank);
    for (const particle of effect.particles) {
      const speed = Math.sqrt(
        particle.velocity.vx * particle.velocity.vx +
        particle.velocity.vy * particle.velocity.vy,
      );
      expect(speed).toBeGreaterThan(0);
    }
  });

  it('destruction animation lasts approximately 2 seconds', () => {
    const tank = makeTank();
    const effect = createDestructionEffect(tank);
    // Particles should have life near 2 seconds
    for (const particle of effect.particles) {
      expect(particle.maxLife).toBeGreaterThanOrEqual(1.5);
      expect(particle.maxLife).toBeLessThanOrEqual(2.0);
    }
  });

  it('does not share position reference with tank', () => {
    const tank = makeTank({ position: { x: 10, y: 20 } });
    const effect = createDestructionEffect(tank);
    tank.position.x = 999;
    expect(effect.position.x).toBe(10);
  });
});

describe('isExplosionComplete', () => {
  it('returns false for growing phase', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    expect(isExplosionComplete(explosion)).toBe(false);
  });

  it('returns false for peak phase', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    const peaked = advanceExplosion(explosion, 0.55, 0.016);
    expect(peaked.phase).toBe('peak');
    expect(isExplosionComplete(peaked)).toBe(false);
  });

  it('returns false for fading phase', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    const fading = advanceExplosion(explosion, 0.8, 0.016);
    expect(fading.phase).toBe('fading');
    expect(isExplosionComplete(fading)).toBe(false);
  });

  it('returns true for done phase', () => {
    const explosion = createExplosion({ x: 0, y: 0 }, 'standard');
    const done = advanceExplosion(explosion, 2.0, 0.016);
    expect(done.phase).toBe('done');
    expect(isExplosionComplete(done)).toBe(true);
  });
});
