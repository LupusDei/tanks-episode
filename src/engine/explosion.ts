import type { ExplosionState, Particle, Position, TankState, WeaponType } from '../types/game';
import { WEAPON_CONFIGS } from './weapons';

const GROWING_DURATION = 0.5;
const PEAK_DURATION = 0.2;
const FADING_DURATION = 0.5;
const PARTICLE_GRAVITY = 10;
const MIN_PARTICLES = 10;
const MAX_PARTICLES = 50;
const MIN_PARTICLE_LIFE = 1.0;
const MAX_PARTICLE_LIFE = 2.0;
const MIN_PARTICLE_SPEED = 20;
const MAX_PARTICLE_SPEED = 80;
const DESTRUCTION_PARTICLE_COUNT = 30;
const DESTRUCTION_DURATION = 2.0;

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function generateParticles(
  position: Position,
  count: number,
  centerColor: string,
  outerColor: string,
  minLife: number,
  maxLife: number,
  minSpeed: number,
  maxSpeed: number,
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomInRange(minSpeed, maxSpeed);
    const life = randomInRange(minLife, maxLife);
    const color = Math.random() < 0.5 ? centerColor : outerColor;
    particles.push({
      position: { x: position.x, y: position.y },
      velocity: { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed },
      color,
      life,
      maxLife: life,
    });
  }
  return particles;
}

export function createExplosion(
  position: Position,
  weaponType: WeaponType,
): ExplosionState {
  const config = WEAPON_CONFIGS[weaponType];
  const count = Math.floor(randomInRange(MIN_PARTICLES, MAX_PARTICLES + 1));
  const particles = generateParticles(
    position,
    count,
    config.explosionColor.center,
    config.explosionColor.outer,
    MIN_PARTICLE_LIFE,
    MAX_PARTICLE_LIFE,
    MIN_PARTICLE_SPEED,
    MAX_PARTICLE_SPEED,
  );

  return {
    position: { x: position.x, y: position.y },
    radius: 0,
    maxRadius: config.blastRadius,
    phase: 'growing',
    particles,
    weaponType,
    timer: 0,
  };
}

function updateParticles(particles: Particle[], dt: number): Particle[] {
  return particles.map((p) => ({
    ...p,
    position: {
      x: p.position.x + p.velocity.vx * dt,
      y: p.position.y + p.velocity.vy * dt,
    },
    velocity: {
      vx: p.velocity.vx,
      vy: p.velocity.vy + PARTICLE_GRAVITY * dt,
    },
    life: p.life - dt,
  }));
}

export function updateExplosion(
  explosion: ExplosionState,
  dt: number,
): ExplosionState {
  if (explosion.phase === 'done') {
    return { ...explosion };
  }

  const newTimer = explosion.timer + dt;
  const updatedParticles = updateParticles(explosion.particles, dt);

  if (explosion.phase === 'growing') {
    const progress = Math.min(newTimer / GROWING_DURATION, 1);
    const newRadius = progress * explosion.maxRadius;
    if (newRadius >= explosion.maxRadius) {
      return {
        ...explosion,
        radius: explosion.maxRadius,
        phase: 'peak',
        timer: 0,
        particles: updatedParticles,
      };
    }
    return {
      ...explosion,
      radius: newRadius,
      timer: newTimer,
      particles: updatedParticles,
    };
  }

  if (explosion.phase === 'peak') {
    if (newTimer >= PEAK_DURATION) {
      return {
        ...explosion,
        phase: 'fading',
        timer: 0,
        particles: updatedParticles,
      };
    }
    return {
      ...explosion,
      timer: newTimer,
      particles: updatedParticles,
    };
  }

  // fading phase
  const fadeProgress = Math.min(newTimer / FADING_DURATION, 1);
  const fadedRadius = explosion.maxRadius * (1 - fadeProgress);
  if (fadeProgress >= 1) {
    return {
      ...explosion,
      radius: 0,
      phase: 'done',
      timer: newTimer,
      particles: updatedParticles,
    };
  }
  return {
    ...explosion,
    radius: fadedRadius,
    timer: newTimer,
    particles: updatedParticles,
  };
}

export function createDestructionEffect(tank: TankState): ExplosionState {
  const particles = generateParticles(
    tank.position,
    DESTRUCTION_PARTICLE_COUNT,
    tank.color,
    tank.color,
    DESTRUCTION_DURATION * 0.8,
    DESTRUCTION_DURATION,
    MIN_PARTICLE_SPEED,
    MAX_PARTICLE_SPEED,
  );

  return {
    position: { x: tank.position.x, y: tank.position.y },
    radius: 0,
    maxRadius: 15,
    phase: 'growing',
    particles,
    weaponType: 'standard',
    timer: 0,
  };
}

export function isExplosionComplete(explosion: ExplosionState): boolean {
  return explosion.phase === 'done';
}
