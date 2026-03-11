import { createContext, useContext } from 'react';
import type { GameState } from '../types/game';

const defaultGameState: GameState = {
  phase: 'nameEntry',
  turnNumber: 0,
  tanks: [],
  terrain: null,
  wind: { speed: 0 },
  selectedWeapon: 'standard',
  winner: null,
  projectiles: [],
  explosions: [],
};

export const GameContext = createContext<GameState>(defaultGameState);

export function useGameContext(): GameState {
  return useContext(GameContext);
}
