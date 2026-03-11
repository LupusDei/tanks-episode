import type { StoredPlayerProfile } from '../types/game';

const DEFAULT_PROFILE: StoredPlayerProfile = {
  name: '',
  balance: 0,
  stats: { gamesPlayed: 0, gamesWon: 0, totalKills: 0 },
  weaponInventory: { sniper: 0, heavy: 0 },
};

export function saveProfile(_profile: StoredPlayerProfile): void {
  // Stub: will persist to localStorage
}

export function loadProfile(): StoredPlayerProfile {
  return { ...DEFAULT_PROFILE };
}

export function clearProfile(): void {
  // Stub: will clear from localStorage
}
