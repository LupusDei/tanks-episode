import { createContext, useContext } from 'react';
import type { StoredPlayerProfile } from '../types/game';

const defaultProfile: StoredPlayerProfile = {
  name: '',
  balance: 0,
  stats: {
    gamesPlayed: 0,
    gamesWon: 0,
    totalKills: 0,
  },
  weaponInventory: {
    sniper: 0,
    heavy: 0,
  },
};

export const UserContext = createContext<StoredPlayerProfile>(defaultProfile);

export function useUserContext(): StoredPlayerProfile {
  return useContext(UserContext);
}
