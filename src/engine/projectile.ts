import type {
  ProjectileState,
  Shot,
  Position,
  TerrainData,
  TankState,
  Wind,
} from '../types/game.ts';

export function createProjectile(
  shot: Shot,
  startPosition: Position,
): ProjectileState {
  return {
    position: { ...startPosition },
    velocity: {
      vx: Math.cos(shot.angle) * shot.power,
      vy: Math.sin(shot.angle) * shot.power,
    },
    weaponType: shot.weaponType,
    ownerTankId: shot.ownerTankId,
    active: true,
    trail: [],
  };
}

export function updateProjectile(
  projectile: ProjectileState,
  _dt: number,
  _wind: Wind,
): ProjectileState {
  return { ...projectile };
}

export function checkTerrainCollision(
  projectile: ProjectileState,
  _terrain: TerrainData,
): boolean {
  return !projectile.active;
}

export function checkTankCollision(
  _projectile: ProjectileState,
  _tanks: TankState[],
): TankState | null {
  return null;
}
