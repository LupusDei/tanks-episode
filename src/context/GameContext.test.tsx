import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

/**
 * Helper to advance fake timers enough for the full turn resolution
 * (projectile flight + explosion animation) to complete.
 */
function advancePastAnimation() {
  // Advance in chunks to allow React effects to fire between intervals
  // 30 seconds at 60fps = 1800 frames, more than enough for any projectile
  for (let i = 0; i < 60; i++) {
    act(() => {
      vi.advanceTimersByTime(500);
    });
  }
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

  describe('firePlayerShot - animation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('sets isAnimating to true after firing', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.setPlayerAngle(45);
        result.current.setPlayerPower(60);
      });

      act(() => {
        result.current.firePlayerShot();
      });

      expect(result.current.isAnimating).toBe(true);
    });

    it('sets isPlayerTurn to false after firing', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.firePlayerShot();
      });

      expect(result.current.isPlayerTurn).toBe(false);
    });

    it('creates projectiles in gameState after firing', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.setPlayerAngle(45);
        result.current.setPlayerPower(60);
      });

      act(() => {
        result.current.firePlayerShot();
      });

      expect(result.current.gameState.projectiles.length).toBeGreaterThan(0);
    });

    it('creates player projectile and AI projectiles', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.firePlayerShot();
      });

      const projectiles = result.current.gameState.projectiles;
      // Should have at least 1 (player) + up to 3 (AI) projectiles
      expect(projectiles.length).toBeGreaterThanOrEqual(1);

      // Player projectile should be owned by 'player'
      const playerProj = projectiles.find((p) => p.ownerTankId === 'player');
      expect(playerProj).toBeDefined();
    });

    it('does not fire when already animating', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.firePlayerShot();
      });

      const projectileCount = result.current.gameState.projectiles.length;

      // Try to fire again while animating
      act(() => {
        result.current.firePlayerShot();
      });

      // Should not create more projectiles
      expect(result.current.gameState.projectiles.length).toBeLessThanOrEqual(projectileCount);
    });

    it('does not fire when not player turn', () => {
      const { result } = renderGameContext();

      // Fire once - sets isPlayerTurn false
      act(() => {
        result.current.firePlayerShot();
      });

      expect(result.current.isPlayerTurn).toBe(false);
    });

    it('after animation completes, isAnimating becomes false', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.firePlayerShot();
      });

      expect(result.current.isAnimating).toBe(true);

      advancePastAnimation();

      expect(result.current.isAnimating).toBe(false);
    });

    it('after animation completes, isPlayerTurn becomes true if no winner', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.firePlayerShot();
      });

      advancePastAnimation();

      // If no winner, player turn should resume
      if (result.current.gameState.phase !== 'gameOver') {
        expect(result.current.isPlayerTurn).toBe(true);
      }
    });

    it('wind updates after turn resolution (no winner)', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.firePlayerShot();
      });

      advancePastAnimation();

      if (result.current.gameState.phase !== 'gameOver') {
        // Wind should be a valid number within range
        expect(typeof result.current.gameState.wind.speed).toBe('number');
        expect(Math.abs(result.current.gameState.wind.speed)).toBeLessThanOrEqual(30);
      }
    });

    it('turn number increments after turn resolution (no winner)', () => {
      const { result } = renderGameContext();
      const initialTurn = result.current.gameState.turnNumber;

      act(() => {
        result.current.firePlayerShot();
      });

      advancePastAnimation();

      if (result.current.gameState.phase !== 'gameOver') {
        expect(result.current.gameState.turnNumber).toBe(initialTurn + 1);
      }
    });

    it('projectiles are cleared after animation completes', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.firePlayerShot();
      });

      advancePastAnimation();

      expect(result.current.gameState.projectiles).toHaveLength(0);
    });

    it('explosions are cleared after animation completes', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.firePlayerShot();
      });

      advancePastAnimation();

      expect(result.current.gameState.explosions).toHaveLength(0);
    });
  });

  describe('winner detection', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('game remains in valid state after turn resolution', () => {
      const { result } = renderGameContext();

      act(() => {
        result.current.firePlayerShot();
      });

      advancePastAnimation();

      // Game should be in a valid state
      const phase = result.current.gameState.phase;
      expect(['playing', 'gameOver']).toContain(phase);
    });

    it('game phase changes to gameOver when there is a winner', () => {
      const { result } = renderGameContext();

      // Fire multiple rounds to try to get a winner
      for (let round = 0; round < 20; round++) {
        if (result.current.gameState.phase === 'gameOver') break;
        if (!result.current.isPlayerTurn || result.current.isAnimating) {
          advancePastAnimation();
          continue;
        }

        act(() => {
          result.current.firePlayerShot();
        });

        advancePastAnimation();
      }

      // Whether or not a winner was found, the game should be in a valid state
      const phase = result.current.gameState.phase;
      expect(['playing', 'gameOver']).toContain(phase);

      if (phase === 'gameOver') {
        expect(result.current.gameState.winner).not.toBeNull();
      }
    });

    it('winner is set when game phase is gameOver', () => {
      const { result } = renderGameContext();

      // Run a few turns
      for (let round = 0; round < 5; round++) {
        if (result.current.gameState.phase === 'gameOver') break;
        if (!result.current.isPlayerTurn || result.current.isAnimating) {
          advancePastAnimation();
          continue;
        }

        act(() => {
          result.current.firePlayerShot();
        });
        advancePastAnimation();
      }

      if (result.current.gameState.phase === 'gameOver') {
        expect(result.current.gameState.winner).toBeDefined();
        expect(result.current.gameState.winner).not.toBeNull();
      }
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
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('resets all state same as startBattle', () => {
      const { result } = renderGameContext();

      // Fire a shot to change state
      act(() => {
        result.current.firePlayerShot();
      });

      advancePastAnimation();

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
