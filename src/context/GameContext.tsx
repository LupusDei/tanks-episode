import { createContext } from 'react';
import type { GameState } from '../types/game.ts';
import { GamePhase, WeaponType } from '../types/game.ts';

export interface GameContextValue {
  state: GameState;
  dispatch: (action: unknown) => void;
}

const defaultState: GameState = {
  phase: GamePhase.NameEntry,
  turnNumber: 0,
  tanks: [],
  terrain: { heights: [], width: 0, height: 0 },
  wind: { speed: 0 },
  selectedWeapon: WeaponType.Standard,
  winner: null,
  projectiles: [],
  explosions: [],
};

export const GameContext = createContext<GameContextValue>({
  state: defaultState,
  dispatch: () => {},
});
