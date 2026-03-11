import type { Wind } from '../types/game';

export function generateInitialWind(): Wind {
  return { speed: 0 };
}

export function updateWind(currentWind: Wind): Wind {
  return { speed: currentWind.speed };
}
