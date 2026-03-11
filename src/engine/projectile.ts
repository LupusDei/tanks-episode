import type {
  ProjectileState,
  TankState,
  TerrainData,
} from '../types/game.ts';
import { WeaponType } from '../types/game.ts';
import { WEAPON_CONFIGS } from './weapons.ts';

// Physics constants
const POWER_SCALE = 1.12;
const GRAVITY = 10;
const WIND_FACTOR = 0.15;
const BARREL_LENGTH = 25;
const TANK_BODY_HEIGHT = 16;
const OUT_OF_BOUNDS_Y = -500;

/** Convert UI angle to physics angle in radians. */
function toPhysicsAngleRad(uiAngleDeg: number): number {
  const physDeg = 90 - uiAngleDeg;
  return (physDeg * Math.PI) / 180;
}

/** Calculate barrel tip position from tank state and barrel angle. */
function barrelTipPosition(tank: TankState, physAngleRad: number): { x: number; y: number } {
  const turretX = tank.position.x;
  const turretY = tank.position.y + TANK_BODY_HEIGHT;
  return {
    x: turretX + BARREL_LENGTH * Math.cos(physAngleRad),
    y: turretY + BARREL_LENGTH * Math.sin(physAngleRad),
  };
}

/** Create a new projectile fired from the given tank. */
export function createProjectile(
  tank: TankState,
  angle: number,
  power: number,
  weaponType: WeaponType,
): ProjectileState {
  const physAngle = toPhysicsAngleRad(angle);
  const tip = barrelTipPosition(tank, physAngle);
  const speedMul = WEAPON_CONFIGS[weaponType].speedMultiplier;
  const speed = power * POWER_SCALE * speedMul;

  return {
    position: { x: tip.x, y: tip.y },
    velocity: {
      vx: speed * Math.cos(physAngle),
      vy: speed * Math.sin(physAngle),
    },
    weaponType,
    ownerTankId: tank.id,
    active: true,
    trail: [],
  };
}

/** Advance a projectile by dt seconds under gravity and wind. Returns a new state (immutable). */
export function updateProjectile(
  proj: ProjectileState,
  wind: number,
  dt: number,
): ProjectileState {
  const windAccel = wind * WIND_FACTOR;
  const newX = proj.position.x + proj.velocity.vx * dt + 0.5 * windAccel * dt * dt;
  const newY = proj.position.y + proj.velocity.vy * dt - 0.5 * GRAVITY * dt * dt;
  const newVx = proj.velocity.vx + windAccel * dt;
  const newVy = proj.velocity.vy - GRAVITY * dt;

  return {
    ...proj,
    position: { x: newX, y: newY },
    velocity: { vx: newVx, vy: newVy },
    trail: [...proj.trail, { x: proj.position.x, y: proj.position.y }],
  };
}

/** Get interpolated terrain height at a fractional x position. */
function terrainHeightAt(terrain: TerrainData, x: number): number {
  const idx = Math.floor(x);
  const frac = x - idx;
  const h0 = terrain.heights[idx] ?? 0;
  const h1 = terrain.heights[idx + 1] ?? h0;
  return h0 + frac * (h1 - h0);
}

/** Check whether the projectile has hit the terrain surface. */
export function checkTerrainCollision(
  proj: ProjectileState,
  terrain: TerrainData,
): boolean {
  const terrainH = terrainHeightAt(terrain, proj.position.x);
  return proj.position.y <= terrainH;
}

/** Check whether the projectile is within blast radius of any alive enemy tank. */
export function checkTankCollision(
  proj: ProjectileState,
  tanks: TankState[],
  blastRadius: number,
): TankState | null {
  for (const tank of tanks) {
    if (!tank.isAlive) continue;
    if (tank.id === proj.ownerTankId) continue;
    const dx = proj.position.x - tank.position.x;
    const dy = proj.position.y - tank.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= blastRadius) return tank;
  }
  return null;
}

/** Check whether the projectile has left the playable area. */
export function isOutOfBounds(
  proj: ProjectileState,
  terrain: TerrainData,
): boolean {
  if (proj.position.x < 0) return true;
  if (proj.position.x > terrain.width) return true;
  if (proj.position.y < OUT_OF_BOUNDS_Y) return true;
  return false;
}
