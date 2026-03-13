import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { PlayerStats, StoredPlayerProfile, WeaponInventory } from '../types/game';
import { loadProfile, saveProfile, getDefaultProfile } from '../services/storage';

// === Types ===

export interface UserContextValue {
  playerName: string;
  balance: number;
  stats: PlayerStats;
  weaponInventory: WeaponInventory;
  hasProfile: boolean;
  setPlayerName: (name: string) => void;
  updateBalance: (delta: number) => void;
  updateStats: (gamesPlayed?: number, gamesWon?: number, totalKills?: number) => void;
  updateWeaponInventory: (inventory: WeaponInventory) => void;
}

// === Default values ===

const defaultStats: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  totalKills: 0,
};

const defaultInventory: WeaponInventory = {
  sniper: 0,
  heavy: 0,
};

const defaultContextValue: UserContextValue = {
  playerName: '',
  balance: 0,
  stats: defaultStats,
  weaponInventory: defaultInventory,
  hasProfile: false,
  setPlayerName: () => {},
  updateBalance: () => {},
  updateStats: () => {},
  updateWeaponInventory: () => {},
};

// === Context ===

export const UserContext = createContext<UserContextValue>(defaultContextValue);

export function useUserContext(): UserContextValue {
  return useContext(UserContext);
}

// === Provider ===

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps): React.JSX.Element {
  const [profile, setProfile] = useState<StoredPlayerProfile | null>(null);
  const initializedRef = useRef(false);

  // Load profile on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const stored = loadProfile();
    if (stored) {
      setProfile(stored);
    }
  }, []);

  // Auto-save whenever profile changes (skip initial null)
  useEffect(() => {
    if (profile !== null) {
      saveProfile(profile);
    }
  }, [profile]);

  const setPlayerName = useCallback((name: string) => {
    setProfile((prev) => {
      if (prev) {
        return { ...prev, name };
      }
      return getDefaultProfile(name);
    });
  }, []);

  const updateBalance = useCallback((delta: number) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return { ...prev, balance: prev.balance + delta };
    });
  }, []);

  const updateStats = useCallback((gamesPlayed?: number, gamesWon?: number, totalKills?: number) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        stats: {
          gamesPlayed: prev.stats.gamesPlayed + (gamesPlayed ?? 0),
          gamesWon: prev.stats.gamesWon + (gamesWon ?? 0),
          totalKills: prev.stats.totalKills + (totalKills ?? 0),
        },
      };
    });
  }, []);

  const updateWeaponInventory = useCallback((inventory: WeaponInventory) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return { ...prev, weaponInventory: inventory };
    });
  }, []);

  const value = useMemo<UserContextValue>(() => ({
    playerName: profile?.name ?? '',
    balance: profile?.balance ?? 0,
    stats: profile?.stats ?? defaultStats,
    weaponInventory: profile?.weaponInventory ?? defaultInventory,
    hasProfile: profile !== null,
    setPlayerName,
    updateBalance,
    updateStats,
    updateWeaponInventory,
  }), [profile, setPlayerName, updateBalance, updateStats, updateWeaponInventory]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}
