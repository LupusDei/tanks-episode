import type {
  ProjectileState,
  Position,
  TankState,
  TerrainData,
  WeaponType,
} from '../types/game';

export function createProjectile(
  position: Position,
  angle: number,
  power: number,
  weaponType: WeaponType,
  ownerTankId: string
): ProjectileState {
  return {
    position: { x: position.x, y: position.y },
    velocity: { vx: Math.cos(angle) * power, vy: Math.sin(angle) * power },
    weaponType,
    ownerTankId,
    active: true,
    trail: [],
  };
}

export function updateProjectile(
  projectile: ProjectileState,
  _dt: number,
  _windSpeed: number
): ProjectileState {
  return { ...projectile };
}

export function checkTerrainCollision(
  _projectile: ProjectileState,
  _terrain: TerrainData
): boolean {
  return false;
}

export function checkTankCollision(
  _projectile: ProjectileState,
  _tanks: TankState[]
): TankState | null {
  return null;
}
