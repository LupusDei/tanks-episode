import type { StoredPlayerProfile } from '../types/game';

const STORAGE_KEY = 'tank-battle-player';
const DEFAULT_BALANCE = 500;

export function getDefaultProfile(name: string): StoredPlayerProfile {
  return {
    name,
    balance: DEFAULT_BALANCE,
    stats: { gamesPlayed: 0, gamesWon: 0, totalKills: 0 },
    weaponInventory: { sniper: 0, heavy: 0 },
  };
}

export function saveProfile(profile: StoredPlayerProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function loadProfile(): StoredPlayerProfile | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;

  try {
    return JSON.parse(raw) as StoredPlayerProfile;
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  localStorage.removeItem(STORAGE_KEY);
}
