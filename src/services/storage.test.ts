import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveProfile, loadProfile, clearProfile, getDefaultProfile } from './storage';
import type { StoredPlayerProfile } from '../types/game';

function createMockStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { for (const key of Object.keys(store)) delete store[key]; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
}

describe('storage service', () => {
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    vi.stubGlobal('localStorage', mockStorage);
  });

  describe('getDefaultProfile', () => {
    it('returns profile with given name', () => {
      const profile = getDefaultProfile('Alice');
      expect(profile.name).toBe('Alice');
    });

    it('returns balance of 500', () => {
      const profile = getDefaultProfile('Bob');
      expect(profile.balance).toBe(500);
    });

    it('returns zeroed stats', () => {
      const profile = getDefaultProfile('Test');
      expect(profile.stats).toEqual({
        gamesPlayed: 0,
        gamesWon: 0,
        totalKills: 0,
      });
    });

    it('returns empty weapon inventory', () => {
      const profile = getDefaultProfile('Test');
      expect(profile.weaponInventory).toEqual({
        sniper: 0,
        heavy: 0,
      });
    });
  });

  describe('saveProfile / loadProfile round-trip', () => {
    it('preserves all fields', () => {
      const profile: StoredPlayerProfile = {
        name: 'TestPlayer',
        balance: 750,
        stats: { gamesPlayed: 10, gamesWon: 5, totalKills: 30 },
        weaponInventory: { sniper: 3, heavy: 1 },
      };

      saveProfile(profile);
      const loaded = loadProfile();
      expect(loaded).toEqual(profile);
    });

    it('overwrites previous profile on save', () => {
      saveProfile(getDefaultProfile('First'));
      saveProfile(getDefaultProfile('Second'));

      const loaded = loadProfile();
      expect(loaded?.name).toBe('Second');
    });
  });

  describe('loadProfile', () => {
    it('returns null when no data stored', () => {
      expect(loadProfile()).toBeNull();
    });

    it('returns null on corrupted JSON', () => {
      mockStorage.setItem('tank-battle-player', '{invalid json!!!');
      expect(loadProfile()).toBeNull();
    });

    it('returns null on empty string', () => {
      mockStorage.setItem('tank-battle-player', '');
      expect(loadProfile()).toBeNull();
    });
  });

  describe('clearProfile', () => {
    it('removes stored data', () => {
      saveProfile(getDefaultProfile('Test'));
      clearProfile();
      expect(loadProfile()).toBeNull();
    });

    it('does not throw when no data exists', () => {
      expect(() => clearProfile()).not.toThrow();
    });
  });
});
