import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GameProvider, useGameContext } from './GameContext';
import type { BattleConfig } from './GameContext';
import { TANK_COLORS } from '../engine/tank';

const DEFAULT_CONFIG: BattleConfig = {
  terrainSize: 'medium',
  enemyCount: 3,
  difficulty: 'veteran',
  playerColor: TANK_COLORS[0]!,
  playerName: 'Player',
};

function wrapper({ children }: { children: ReactNode }) {
  return <GameProvider>{children}</GameProvider>;
}

function wrapperWithPhase(phase: 'nameEntry' | 'config') {
  return function PhaseWrapper({ children }: { children: ReactNode }) {
    return <GameProvider initialPhase={phase}>{children}</GameProvider>;
  };
}

function renderGameContext() {
  return renderHook(() => useGameContext(), { wrapper });
}

function renderGameContextWithPhase(phase: 'nameEntry' | 'config') {
  return renderHook(() => useGameContext(), { wrapper: wrapperWithPhase(phase) });
}

/**
 * Helper to advance fake timers enough for the full turn resolution
 * (projectile flight + explosion animation) to complete.
 */
function advancePastAnimation() {
  for (let i = 0; i < 60; i++) {
    act(() => {
      vi.advanceTimersByTime(500);
    });
  }
}

describe('GameContext', () => {
  describe('initial state (no battle started)', () => {
    it('phase defaults to nameEntry', () => {
      const { result } = renderGameContext();
      expect(result.current.gameState.phase).toBe('nameEntry');
    });

    it('phase can be initialized to config', () => {
      const { result } = renderGameContextWithPhase('config');
      expect(result.current.gameState.phase).toBe('config');
    });

    it('turnNumber starts at 0', () => {
      const { result } = renderGameContext();
      expect(result.current.gameState.turnNumber).toBe(0);
    });

    it('has no tanks initially', () => {
      const { result } = renderGameContext();
      expect(result.current.gameState.tanks).toHaveLength(0);
    });

    it('terrain is null', () => {
      const { result } = renderGameContext();
      expect(result.current.gameState.terrain).toBeNull();
    });

    it('isPlayerTurn is false', () => {
      const { result } = renderGameContext();
      expect(result.current.isPlayerTurn).toBe(false);
    });

    it('isAnimating is false', () => {
      const { result } = renderGameContext();
      expect(result.current.isAnimating).toBe(false);
    });

    it('battleConfig is null', () => {
      const { result } = renderGameContext();
      expect(result.current.battleConfig).toBeNull();
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

  describe('phase transitions', () => {
    it('goToConfig transitions to config phase', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.goToConfig();
      });
      expect(result.current.gameState.phase).toBe('config');
    });

    it('startBattle transitions to playing phase', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });
      expect(result.current.gameState.phase).toBe('playing');
    });

    it('endGame transitions to gameOver phase', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });

      const winner = result.current.gameState.tanks[0]!;
      act(() => {
        result.current.endGame(winner);
      });
      expect(result.current.gameState.phase).toBe('gameOver');
    });

    it('playAgain transitions to config phase', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });

      act(() => {
        result.current.playAgain();
      });
      expect(result.current.gameState.phase).toBe('config');
    });

    it('setPhase transitions to arbitrary phase', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.setPhase('shop');
      });
      expect(result.current.gameState.phase).toBe('shop');
    });
  });

  describe('startBattle with config', () => {
    it('initializes terrain at selected size', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle({ ...DEFAULT_CONFIG, terrainSize: 'small' });
      });
      expect(result.current.gameState.terrain).not.toBeNull();
      expect(result.current.gameState.terrain!.width).toBe(800);
      expect(result.current.gameState.terrain!.height).toBe(600);
    });

    it('creates correct number of tanks from enemyCount', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle({ ...DEFAULT_CONFIG, enemyCount: 5 });
      });
      expect(result.current.gameState.tanks).toHaveLength(6); // 1 player + 5 AI
    });

    it('sets player tank name from config', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle({ ...DEFAULT_CONFIG, playerName: 'TestHero' });
      });
      const player = result.current.gameState.tanks.find((t) => t.isPlayer);
      expect(player).toBeDefined();
      expect(player!.name).toBe('TestHero');
    });

    it('sets player tank color from config', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle({ ...DEFAULT_CONFIG, playerColor: '#FF0000' });
      });
      const player = result.current.gameState.tanks.find((t) => t.isPlayer);
      expect(player!.color).toBe('#FF0000');
    });

    it('stores battleConfig', () => {
      const { result } = renderGameContext();
      const config = { ...DEFAULT_CONFIG, enemyCount: 7 };
      act(() => {
        result.current.startBattle(config);
      });
      expect(result.current.battleConfig).toEqual(config);
    });

    it('sets isPlayerTurn to true', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });
      expect(result.current.isPlayerTurn).toBe(true);
    });

    it('resets playerPower to 50', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });
      expect(result.current.playerPower).toBe(50);
    });

    it('wind is initialized', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });
      expect(typeof result.current.gameState.wind.speed).toBe('number');
    });

    it('turnNumber starts at 1', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });
      expect(result.current.gameState.turnNumber).toBe(1);
    });

    it('AI tanks have isPlayer=false', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });
      const aiTanks = result.current.gameState.tanks.filter((t) => !t.isPlayer);
      expect(aiTanks).toHaveLength(3);
      for (const tank of aiTanks) {
        expect(tank.isPlayer).toBe(false);
      }
    });

    it('selectedWeapon defaults to standard', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });
      expect(result.current.gameState.selectedWeapon).toBe('standard');
    });
  });

  describe('endGame', () => {
    it('sets winner on gameState', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });

      const winner = result.current.gameState.tanks[0]!;
      act(() => {
        result.current.endGame(winner);
      });
      expect(result.current.gameState.winner).toEqual(winner);
    });

    it('clears projectiles and explosions', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });

      const winner = result.current.gameState.tanks[0]!;
      act(() => {
        result.current.endGame(winner);
      });
      expect(result.current.gameState.projectiles).toHaveLength(0);
      expect(result.current.gameState.explosions).toHaveLength(0);
    });

    it('sets isAnimating to false', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });

      const winner = result.current.gameState.tanks[0]!;
      act(() => {
        result.current.endGame(winner);
      });
      expect(result.current.isAnimating).toBe(false);
    });
  });

  describe('playAgain', () => {
    it('resets to config phase with clean state', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });
      act(() => {
        result.current.playAgain();
      });
      expect(result.current.gameState.phase).toBe('config');
      expect(result.current.gameState.tanks).toHaveLength(0);
      expect(result.current.gameState.terrain).toBeNull();
      expect(result.current.gameState.winner).toBeNull();
    });

    it('sets isPlayerTurn to false', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });
      act(() => {
        result.current.playAgain();
      });
      expect(result.current.isPlayerTurn).toBe(false);
    });
  });

  describe('setPlayerAngle', () => {
    it('updates the player tank barrel angle', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });

      act(() => {
        result.current.setPlayerAngle(45);
      });

      const player = result.current.gameState.tanks.find((t) => t.isPlayer);
      expect(player!.barrelAngle).toBe(45);
    });

    it('clamps angle to max +120', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });

      act(() => {
        result.current.setPlayerAngle(150);
      });

      const player = result.current.gameState.tanks.find((t) => t.isPlayer);
      expect(player!.barrelAngle).toBe(120);
    });

    it('clamps angle to min -120', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });

      act(() => {
        result.current.setPlayerAngle(-200);
      });

      const player = result.current.gameState.tanks.find((t) => t.isPlayer);
      expect(player!.barrelAngle).toBe(-120);
    });

    it('does not affect AI tank angles', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });

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
        result.current.startBattle(DEFAULT_CONFIG);
      });

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
        result.current.startBattle(DEFAULT_CONFIG);
      });

      act(() => {
        result.current.firePlayerShot();
      });

      expect(result.current.isPlayerTurn).toBe(false);
    });

    it('creates projectiles in gameState after firing', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });

      act(() => {
        result.current.setPlayerAngle(45);
        result.current.setPlayerPower(60);
      });

      act(() => {
        result.current.firePlayerShot();
      });

      expect(result.current.gameState.projectiles.length).toBeGreaterThan(0);
    });

    it('creates player projectile', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });

      act(() => {
        result.current.firePlayerShot();
      });

      const projectiles = result.current.gameState.projectiles;
      const playerProj = projectiles.find((p) => p.ownerTankId === 'player');
      expect(playerProj).toBeDefined();
    });

    it('does not fire when already animating', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });

      act(() => {
        result.current.firePlayerShot();
      });

      const projectileCount = result.current.gameState.projectiles.length;

      act(() => {
        result.current.firePlayerShot();
      });

      expect(result.current.gameState.projectiles.length).toBeLessThanOrEqual(projectileCount);
    });

    it('after animation completes, isAnimating becomes false', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });

      act(() => {
        result.current.firePlayerShot();
      });

      expect(result.current.isAnimating).toBe(true);

      advancePastAnimation();

      expect(result.current.isAnimating).toBe(false);
    });

    it('projectiles are cleared after animation completes', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });

      act(() => {
        result.current.firePlayerShot();
      });

      advancePastAnimation();

      expect(result.current.gameState.projectiles).toHaveLength(0);
    });

    it('explosions are cleared after animation completes', () => {
      const { result } = renderGameContext();
      act(() => {
        result.current.startBattle(DEFAULT_CONFIG);
      });

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
        result.current.startBattle(DEFAULT_CONFIG);
      });

      act(() => {
        result.current.firePlayerShot();
      });

      advancePastAnimation();

      const phase = result.current.gameState.phase;
      expect(['playing', 'gameOver']).toContain(phase);
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
      expect(result.current.battleConfig).toBeNull();
    });
  });
});
