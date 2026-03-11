import type { StoredPlayerProfile } from '../types/game.ts';

const STORAGE_KEY = 'tank-battle-profile';

export function saveProfile(profile: StoredPlayerProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function loadProfile(): StoredPlayerProfile | null {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  return JSON.parse(data) as StoredPlayerProfile;
}

export function clearProfile(): void {
  localStorage.removeItem(STORAGE_KEY);
}
