import type { Wind } from '../types/game.ts';

export function generateInitialWind(): Wind {
  return { speed: 0 };
}

export function updateWind(wind: Wind): Wind {
  return { ...wind };
}
