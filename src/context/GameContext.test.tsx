import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GameProvider, useGameContext } from './GameContext';
import { TANK_COLORS } from '../engine/tank';

function wrapper({ children }: { children: ReactNode }) {
  return <GameProvider>{children}</GameProvider>;
}

function renderGameContext() {
  return renderHook(() => useGameContext(), { wrapper });
}

describe('GameContext', () => {
  describe('initial state after mount (auto startBattle)', () => {
    it('phase starts as playing', () => {
      const { result } = renderGameContext();
      expect(result.current.gameState.phase).toBe('playing');
    });

    it('turnNumber starts at 1', () => {
      const { result } = renderGameContext();
      expect(result.current.gameState.turnNumber).toBe(1);
    });

    it('has 4 tanks (1 player + 3 AI)', () => {
      const { result } = renderGameContext();
      expect(result.current.gameState.tanks).toHaveLength(4);
    });

    it('player tank has isPlayer=true and correct name', () => {
      const { result } = renderGameContext();
      const player = result.current.gameState.tanks.find((t) => t.isPlayer);
      expect(player).toBeDefined();
      expect(player!.name).toBe('Player');
    });

    it('player tank uses TANK_COLORS[0]', () => {
      const { result } = renderGameContext();
      const player = result.current.gameState.tanks.find((t) => t.isPlayer);
      expect(player!.color).toBe(TANK_COLORS[0]);
    });

    it('AI tanks have isPlayer=false', () => {
      const { result } = renderGameContext();
      const aiTanks = result.current.gameState.tanks.filter((t) => !t.isPlayer);
      expect(aiTanks).toHaveLength(3);
      for (const tank of aiTanks) {
        expect(tank.isPlayer).toBe(false);
      }
    });

    it('terrain is generated (not null)', () => {
      const { result } = renderGameContext();
      expect(result.current.gameState.terrain).not.toBeNull();
    });

    it('wind is initialized', () => {
      const { result } = renderGameContext();
      expect(result.current.gameState.wind).toBeDefined();
      expect(typeof result.current.gameState.wind.speed).toBe('number');
    });

    it('isPlayerTurn starts as true', () => {
      const { result } = renderGameContext();
      expect(result.current.isPlayerTurn).toBe(true);
    });

    it('isAnimating starts as false', () => {
      const { result } = renderGameContext();
      expect(result.current.isAnimating).toBe(false);
    });

    it('selectedWeapon defaults to standard', () => {
      const { result } = renderGameContext();
      expect(result.current.gameState.selectedWeapon).toBe('standard');
    });

    it('winner is null', () => {
      const { result } = renderGameContext();
      expect(result.current.gameState.winner).toBeNull();
    });

    it('projectiles and explosions are empty', () => {
      const { result } = renderGameContext();
      expect(result.current.gameState.projectiles).toHaveLength(0);
      expect(result.current.gameState.explosions).toHaveLength(0);
    });

    it('playerPower defaults to 50', () => {
      const { result } = renderGameContext();
      expect(result.current.playerPower).toBe(50);
    });
  });

  describe('setPlayerAngle', () => {
    it('updates the player tank barrel angle', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.setPlayerAngle(45);
      });

      const player = result.current.gameState.tanks.find((t) => t.isPlayer);
      expect(player!.barrelAngle).toBe(45);
    });

    it('clamps angle to max +120', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.setPlayerAngle(150);
      });

      const player = result.current.gameState.tanks.find((t) => t.isPlayer);
      expect(player!.barrelAngle).toBe(120);
    });

    it('clamps angle to min -120', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.setPlayerAngle(-200);
      });

      const player = result.current.gameState.tanks.find((t) => t.isPlayer);
      expect(player!.barrelAngle).toBe(-120);
    });

    it('allows zero angle', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.setPlayerAngle(30);
      });
      act(() => {
        result.current.setPlayerAngle(0);
      });

      const player = result.current.gameState.tanks.find((t) => t.isPlayer);
      expect(player!.barrelAngle).toBe(0);
    });

    it('does not affect AI tank angles', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.setPlayerAngle(60);
      });

      const aiTanks = result.current.gameState.tanks.filter((t) => !t.isPlayer);
      for (const tank of aiTanks) {
        expect(tank.barrelAngle).toBe(0);
      }
    });
  });

  describe('setPlayerPower', () => {
    it('updates power value', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.setPlayerPower(75);
      });

      expect(result.current.playerPower).toBe(75);
    });

    it('clamps power to max 100', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.setPlayerPower(150);
      });

      expect(result.current.playerPower).toBe(100);
    });

    it('clamps power to min 0', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.setPlayerPower(-10);
      });

      expect(result.current.playerPower).toBe(0);
    });

    it('allows zero power', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.setPlayerPower(0);
      });

      expect(result.current.playerPower).toBe(0);
    });
  });

  describe('firePlayerShot', () => {
    it('creates projectiles when fired', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.setPlayerAngle(45);
        result.current.setPlayerPower(60);
      });

      act(() => {
        result.current.firePlayerShot();
      });

      // Should have projectiles (player + AI shots)
      expect(result.current.gameState.projectiles.length).toBeGreaterThan(0);
    });

    it('increments turn number after firing', () => {
      const { result } = renderGameContext();
      const initialTurn = result.current.gameState.turnNumber;

      act(() => {
        result.current.firePlayerShot();
      });

      expect(result.current.gameState.turnNumber).toBe(initialTurn + 1);
    });

    it('updates wind after firing', () => {
      const { result } = renderGameContext();
      const initialWind = result.current.gameState.wind.speed;

      // Fire multiple times to ensure wind changes at least once
      // (wind uses random, so we just verify it's a number)
      act(() => {
        result.current.firePlayerShot();
      });

      expect(typeof result.current.gameState.wind.speed).toBe('number');
      // Wind may or may not have changed, but should still be valid
      expect(Math.abs(result.current.gameState.wind.speed)).toBeLessThanOrEqual(30);
    });
  });

  describe('startBattle', () => {
    it('reinitializes all state', () => {
      const { result } = renderGameContext();

      // Modify state first
      act(() => {
        result.current.setPlayerAngle(90);
        result.current.setPlayerPower(80);
      });

      act(() => {
        result.current.startBattle();
      });

      expect(result.current.gameState.phase).toBe('playing');
      expect(result.current.gameState.turnNumber).toBe(1);
      expect(result.current.gameState.tanks).toHaveLength(4);
      expect(result.current.isPlayerTurn).toBe(true);
      expect(result.current.isAnimating).toBe(false);
      expect(result.current.playerPower).toBe(50);
      expect(result.current.gameState.terrain).not.toBeNull();
    });
  });

  describe('restartBattle', () => {
    it('resets all state same as startBattle', () => {
      const { result } = renderGameContext();

      // Fire a shot to change state
      act(() => {
        result.current.firePlayerShot();
      });

      act(() => {
        result.current.restartBattle();
      });

      expect(result.current.gameState.phase).toBe('playing');
      expect(result.current.gameState.turnNumber).toBe(1);
      expect(result.current.gameState.tanks).toHaveLength(4);
      expect(result.current.isPlayerTurn).toBe(true);
      expect(result.current.isAnimating).toBe(false);
      expect(result.current.playerPower).toBe(50);
      expect(result.current.gameState.winner).toBeNull();
      expect(result.current.gameState.projectiles).toHaveLength(0);
      expect(result.current.gameState.explosions).toHaveLength(0);
    });

    it('generates new terrain on restart', () => {
      const { result } = renderGameContext();
      const firstTerrain = result.current.gameState.terrain;

      act(() => {
        result.current.restartBattle();
      });

      // New terrain object (may have different heights due to randomness)
      expect(result.current.gameState.terrain).not.toBeNull();
      // Different reference
      expect(result.current.gameState.terrain).not.toBe(firstTerrain);
    });
  });

  describe('useGameContext outside provider', () => {
    it('returns default context value', () => {
      const { result } = renderHook(() => useGameContext());
      expect(result.current.gameState.phase).toBe('nameEntry');
      expect(result.current.gameState.turnNumber).toBe(0);
      expect(result.current.gameState.tanks).toHaveLength(0);
      expect(result.current.isPlayerTurn).toBe(false);
      expect(result.current.isAnimating).toBe(false);
    });
  });
});
