import type {
  ProjectileState,
  TankState,
  TerrainData,
  WeaponType,
} from '../types/game';
import { WEAPON_CONFIGS } from './weapons';

const BARREL_LENGTH = 25;
const POWER_SCALE = 1.12;
const GRAVITY = 10;
const WIND_FACTOR = 0.15;
const OUT_OF_BOUNDS_Y = -500;

/** Convert UI angle (0=up, positive=left, negative=right) to physics radians. */
function uiAngleToPhysicsRadians(uiAngle: number): number {
  const physicsDeg = 90 - uiAngle;
  return (physicsDeg * Math.PI) / 180;
}

export function createProjectile(
  tank: TankState,
  angle: number,
  power: number,
  weaponType: WeaponType,
): ProjectileState {
  const physicsAngle = uiAngleToPhysicsRadians(angle);
  const speedMultiplier = WEAPON_CONFIGS[weaponType].speedMultiplier;
  const speed = power * POWER_SCALE * speedMultiplier;

  const barrelTipX = tank.position.x + Math.cos(physicsAngle) * BARREL_LENGTH;
  const barrelTipY = tank.position.y + Math.sin(physicsAngle) * BARREL_LENGTH;

  return {
    position: { x: barrelTipX, y: barrelTipY },
    velocity: {
      vx: Math.cos(physicsAngle) * speed,
      vy: Math.sin(physicsAngle) * speed,
    },
    weaponType,
    ownerTankId: tank.id,
    active: true,
    trail: [],
  };
}

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

  const newTrail = [...proj.trail, { x: proj.position.x, y: proj.position.y }];

  return {
    ...proj,
    position: { x: newX, y: newY },
    velocity: { vx: newVx, vy: newVy },
    trail: newTrail,
  };
}

/** Get interpolated terrain height at a given x coordinate. */
function getTerrainHeightAt(terrain: TerrainData, x: number): number {
  if (x <= 0) return terrain.heights[0] ?? 0;
  if (x >= terrain.width) return terrain.heights[terrain.heights.length - 1] ?? 0;

  const index = x;
  const low = Math.floor(index);
  const high = Math.ceil(index);

  const hLow = terrain.heights[low] ?? 0;
  if (low === high) return hLow;

  const hHigh = terrain.heights[high] ?? 0;
  const fraction = index - low;
  return hLow + (hHigh - hLow) * fraction;
}

export function checkTerrainCollision(
  proj: ProjectileState,
  terrain: TerrainData,
): boolean {
  const terrainHeight = getTerrainHeightAt(terrain, proj.position.x);
  return proj.position.y <= terrainHeight;
}

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
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= blastRadius) {
      return tank;
    }
  }
  return null;
}

export function isOutOfBounds(
  proj: ProjectileState,
  terrain: TerrainData,
): boolean {
  return (
    proj.position.x < 0 ||
    proj.position.x > terrain.width ||
    proj.position.y < OUT_OF_BOUNDS_Y
  );
}
