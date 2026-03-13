import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { UserProvider, useUserContext } from './UserContext';
import * as storage from '../services/storage';

vi.mock('../services/storage', () => ({
  loadProfile: vi.fn(),
  saveProfile: vi.fn(),
  getDefaultProfile: vi.fn((name: string) => ({
    name,
    balance: 500,
    stats: { gamesPlayed: 0, gamesWon: 0, totalKills: 0 },
    weaponInventory: { sniper: 0, heavy: 0 },
  })),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}

function renderUserContext() {
  return renderHook(() => useUserContext(), { wrapper });
}

describe('UserContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storage.loadProfile).mockReturnValue(null);
  });

  describe('initial state with no stored profile', () => {
    it('hasProfile is false', () => {
      const { result } = renderUserContext();
      expect(result.current.hasProfile).toBe(false);
    });

    it('playerName is empty', () => {
      const { result } = renderUserContext();
      expect(result.current.playerName).toBe('');
    });

    it('balance is 0', () => {
      const { result } = renderUserContext();
      expect(result.current.balance).toBe(0);
    });

    it('stats are zeroed', () => {
      const { result } = renderUserContext();
      expect(result.current.stats).toEqual({
        gamesPlayed: 0,
        gamesWon: 0,
        totalKills: 0,
      });
    });

    it('weaponInventory is empty', () => {
      const { result } = renderUserContext();
      expect(result.current.weaponInventory).toEqual({
        sniper: 0,
        heavy: 0,
      });
    });
  });

  describe('initial state with stored profile', () => {
    it('loads profile from storage on mount', () => {
      vi.mocked(storage.loadProfile).mockReturnValue({
        name: 'StoredPlayer',
        balance: 750,
        stats: { gamesPlayed: 5, gamesWon: 3, totalKills: 12 },
        weaponInventory: { sniper: 2, heavy: 1 },
      });

      const { result } = renderUserContext();
      expect(result.current.hasProfile).toBe(true);
      expect(result.current.playerName).toBe('StoredPlayer');
      expect(result.current.balance).toBe(750);
      expect(result.current.stats.gamesPlayed).toBe(5);
    });
  });

  describe('setPlayerName', () => {
    it('creates a new profile if none exists', () => {
      const { result } = renderUserContext();
      act(() => {
        result.current.setPlayerName('NewPlayer');
      });

      expect(result.current.hasProfile).toBe(true);
      expect(result.current.playerName).toBe('NewPlayer');
      expect(result.current.balance).toBe(500);
    });

    it('updates name if profile already exists', () => {
      vi.mocked(storage.loadProfile).mockReturnValue({
        name: 'OldName',
        balance: 750,
        stats: { gamesPlayed: 5, gamesWon: 3, totalKills: 12 },
        weaponInventory: { sniper: 2, heavy: 1 },
      });

      const { result } = renderUserContext();
      act(() => {
        result.current.setPlayerName('NewName');
      });

      expect(result.current.playerName).toBe('NewName');
      expect(result.current.balance).toBe(750); // preserved
    });

    it('auto-saves to storage', () => {
      const { result } = renderUserContext();
      act(() => {
        result.current.setPlayerName('SavedPlayer');
      });

      expect(storage.saveProfile).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'SavedPlayer' }),
      );
    });
  });

  describe('updateBalance', () => {
    it('adds credits', () => {
      vi.mocked(storage.loadProfile).mockReturnValue({
        name: 'Player',
        balance: 500,
        stats: { gamesPlayed: 0, gamesWon: 0, totalKills: 0 },
        weaponInventory: { sniper: 0, heavy: 0 },
      });

      const { result } = renderUserContext();
      act(() => {
        result.current.updateBalance(100);
      });

      expect(result.current.balance).toBe(600);
    });

    it('subtracts credits', () => {
      vi.mocked(storage.loadProfile).mockReturnValue({
        name: 'Player',
        balance: 500,
        stats: { gamesPlayed: 0, gamesWon: 0, totalKills: 0 },
        weaponInventory: { sniper: 0, heavy: 0 },
      });

      const { result } = renderUserContext();
      act(() => {
        result.current.updateBalance(-200);
      });

      expect(result.current.balance).toBe(300);
    });

    it('does nothing if no profile exists', () => {
      const { result } = renderUserContext();
      act(() => {
        result.current.updateBalance(100);
      });
      expect(result.current.balance).toBe(0);
      expect(result.current.hasProfile).toBe(false);
    });

    it('auto-saves to storage', () => {
      vi.mocked(storage.loadProfile).mockReturnValue({
        name: 'Player',
        balance: 500,
        stats: { gamesPlayed: 0, gamesWon: 0, totalKills: 0 },
        weaponInventory: { sniper: 0, heavy: 0 },
      });

      const { result } = renderUserContext();
      vi.clearAllMocks();

      act(() => {
        result.current.updateBalance(50);
      });

      expect(storage.saveProfile).toHaveBeenCalledWith(
        expect.objectContaining({ balance: 550 }),
      );
    });
  });

  describe('updateStats', () => {
    it('increments gamesPlayed', () => {
      vi.mocked(storage.loadProfile).mockReturnValue({
        name: 'Player',
        balance: 500,
        stats: { gamesPlayed: 3, gamesWon: 1, totalKills: 5 },
        weaponInventory: { sniper: 0, heavy: 0 },
      });

      const { result } = renderUserContext();
      act(() => {
        result.current.updateStats(1);
      });

      expect(result.current.stats.gamesPlayed).toBe(4);
      expect(result.current.stats.gamesWon).toBe(1); // unchanged
      expect(result.current.stats.totalKills).toBe(5); // unchanged
    });

    it('increments gamesWon', () => {
      vi.mocked(storage.loadProfile).mockReturnValue({
        name: 'Player',
        balance: 500,
        stats: { gamesPlayed: 3, gamesWon: 1, totalKills: 5 },
        weaponInventory: { sniper: 0, heavy: 0 },
      });

      const { result } = renderUserContext();
      act(() => {
        result.current.updateStats(0, 1);
      });

      expect(result.current.stats.gamesWon).toBe(2);
    });

    it('increments totalKills', () => {
      vi.mocked(storage.loadProfile).mockReturnValue({
        name: 'Player',
        balance: 500,
        stats: { gamesPlayed: 3, gamesWon: 1, totalKills: 5 },
        weaponInventory: { sniper: 0, heavy: 0 },
      });

      const { result } = renderUserContext();
      act(() => {
        result.current.updateStats(0, 0, 3);
      });

      expect(result.current.stats.totalKills).toBe(8);
    });

    it('increments all stats at once', () => {
      vi.mocked(storage.loadProfile).mockReturnValue({
        name: 'Player',
        balance: 500,
        stats: { gamesPlayed: 0, gamesWon: 0, totalKills: 0 },
        weaponInventory: { sniper: 0, heavy: 0 },
      });

      const { result } = renderUserContext();
      act(() => {
        result.current.updateStats(1, 1, 4);
      });

      expect(result.current.stats).toEqual({
        gamesPlayed: 1,
        gamesWon: 1,
        totalKills: 4,
      });
    });

    it('does nothing if no profile exists', () => {
      const { result } = renderUserContext();
      act(() => {
        result.current.updateStats(1, 1, 1);
      });
      expect(result.current.stats.gamesPlayed).toBe(0);
    });
  });

  describe('updateWeaponInventory', () => {
    it('replaces weapon inventory', () => {
      vi.mocked(storage.loadProfile).mockReturnValue({
        name: 'Player',
        balance: 500,
        stats: { gamesPlayed: 0, gamesWon: 0, totalKills: 0 },
        weaponInventory: { sniper: 0, heavy: 0 },
      });

      const { result } = renderUserContext();
      act(() => {
        result.current.updateWeaponInventory({ sniper: 5, heavy: 3 });
      });

      expect(result.current.weaponInventory).toEqual({ sniper: 5, heavy: 3 });
    });

    it('does nothing if no profile exists', () => {
      const { result } = renderUserContext();
      act(() => {
        result.current.updateWeaponInventory({ sniper: 5, heavy: 3 });
      });
      expect(result.current.weaponInventory).toEqual({ sniper: 0, heavy: 0 });
    });

    it('auto-saves to storage', () => {
      vi.mocked(storage.loadProfile).mockReturnValue({
        name: 'Player',
        balance: 500,
        stats: { gamesPlayed: 0, gamesWon: 0, totalKills: 0 },
        weaponInventory: { sniper: 0, heavy: 0 },
      });

      const { result } = renderUserContext();
      vi.clearAllMocks();

      act(() => {
        result.current.updateWeaponInventory({ sniper: 2, heavy: 1 });
      });

      expect(storage.saveProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          weaponInventory: { sniper: 2, heavy: 1 },
        }),
      );
    });
  });

  describe('useUserContext outside provider', () => {
    it('returns default context value', () => {
      const { result } = renderHook(() => useUserContext());
      expect(result.current.hasProfile).toBe(false);
      expect(result.current.playerName).toBe('');
      expect(result.current.balance).toBe(0);
    });
  });
});
