import { createContext } from 'react';
import type { StoredPlayerProfile } from '../types/game.ts';

export interface UserContextValue {
  profile: StoredPlayerProfile | null;
  setProfile: (profile: StoredPlayerProfile) => void;
}

export const UserContext = createContext<UserContextValue>({
  profile: null,
  setProfile: () => {},
});
