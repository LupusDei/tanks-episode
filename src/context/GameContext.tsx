import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { GameState, TankState } from '../types/game';
import { generateTerrain } from '../engine/terrain';
import { placeTanks, TANK_COLORS } from '../engine/tank';
import { generateInitialWind, updateWind } from '../engine/wind';
import { calculateAIShot, selectTarget } from '../engine/ai';
import { createProjectile } from '../engine/projectile';

// === Constants ===

const MIN_ANGLE = -120;
const MAX_ANGLE = 120;
const MIN_POWER = 0;
const MAX_POWER = 100;
const DEFAULT_ENEMY_COUNT = 3;
const DEFAULT_PLAYER_NAME = 'Player';

// === Types ===

export interface GameContextValue {
  gameState: GameState;
  isPlayerTurn: boolean;
  isAnimating: boolean;
  playerPower: number;
  setPlayerAngle: (angle: number) => void;
  setPlayerPower: (power: number) => void;
  firePlayerShot: () => void;
  startBattle: () => void;
  restartBattle: () => void;
}

// === Helpers ===

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function findPlayerTank(tanks: TankState[]): TankState | undefined {
  return tanks.find((t) => t.isPlayer);
}

function checkWinner(tanks: TankState[]): TankState | null {
  const player = tanks.find((t) => t.isPlayer);
  const aliveAI = tanks.filter((t) => !t.isPlayer && t.isAlive);

  if (player && !player.isAlive) {
    // If player is dead, pick the first alive AI as winner (or null)
    return aliveAI[0] ?? null;
  }

  if (aliveAI.length === 0 && player && player.isAlive) {
    return player;
  }

  return null;
}

function initializeBattle(): { gameState: GameState; playerPower: number } {
  const terrain = generateTerrain('medium');
  const tanks = placeTanks(terrain, DEFAULT_PLAYER_NAME, TANK_COLORS[0]!, DEFAULT_ENEMY_COUNT);
  const wind = generateInitialWind();

  return {
    gameState: {
      phase: 'playing',
      turnNumber: 1,
      tanks,
      terrain,
      wind,
      selectedWeapon: 'standard',
      winner: null,
      projectiles: [],
      explosions: [],
    },
    playerPower: 50,
  };
}

// === Default context value ===

const defaultGameState: GameState = {
  phase: 'nameEntry',
  turnNumber: 0,
  tanks: [],
  terrain: null,
  wind: { speed: 0 },
  selectedWeapon: 'standard',
  winner: null,
  projectiles: [],
  explosions: [],
};

const defaultContextValue: GameContextValue = {
  gameState: defaultGameState,
  isPlayerTurn: false,
  isAnimating: false,
  playerPower: 50,
  setPlayerAngle: () => {},
  setPlayerPower: () => {},
  firePlayerShot: () => {},
  startBattle: () => {},
  restartBattle: () => {},
};

// === Context ===

export const GameContext = createContext<GameContextValue>(defaultContextValue);

export function useGameContext(): GameContextValue {
  return useContext(GameContext);
}

// === Provider ===

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps): React.JSX.Element {
  const [gameState, setGameState] = useState<GameState>(() => initializeBattle().gameState);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [playerPower, setPlayerPowerState] = useState(50);

  const setPlayerAngle = useCallback((angle: number) => {
    const clamped = clamp(angle, MIN_ANGLE, MAX_ANGLE);
    setGameState((prev) => ({
      ...prev,
      tanks: prev.tanks.map((tank) =>
        tank.isPlayer ? { ...tank, barrelAngle: clamped } : tank,
      ),
    }));
  }, []);

  const setPlayerPower = useCallback((power: number) => {
    const clamped = clamp(power, MIN_POWER, MAX_POWER);
    setPlayerPowerState(clamped);
  }, []);

  const firePlayerShot = useCallback(() => {
    if (!isPlayerTurn || isAnimating) return;

    setIsAnimating(true);
    setIsPlayerTurn(false);

    setGameState((prev) => {
      const player = findPlayerTank(prev.tanks);
      if (!player || !prev.terrain) return prev;

      // Create player projectile
      const playerProjectile = createProjectile(
        player,
        player.barrelAngle,
        playerPower,
        prev.selectedWeapon,
      );

      // Generate AI shots
      const aiTanks = prev.tanks.filter((t) => !t.isPlayer && t.isAlive);
      const aiProjectiles = aiTanks.map((aiTank) => {
        const target = selectTarget(aiTank, prev.tanks, null);
        if (!target) return null;
        const shot = calculateAIShot(aiTank, target, prev.wind, prev.terrain!, 'veteran');
        return createProjectile(aiTank, shot.angle, shot.power, shot.weaponType);
      }).filter((p): p is NonNullable<typeof p> => p !== null);

      const newWind = updateWind(prev.wind);

      // Check for winner
      const winner = checkWinner(prev.tanks);

      return {
        ...prev,
        projectiles: [playerProjectile, ...aiProjectiles],
        wind: newWind,
        turnNumber: prev.turnNumber + 1,
        winner,
        phase: winner ? 'gameOver' : prev.phase,
      };
    });

    // Mark animation as complete after projectiles are queued
    // In a real game loop this would be driven by the animation frame,
    // but for now we mark it done and re-enable player turn
    setIsAnimating(false);
    setIsPlayerTurn(true);
  }, [isPlayerTurn, isAnimating, playerPower]);

  const startBattle = useCallback(() => {
    const { gameState: newState, playerPower: newPower } = initializeBattle();
    setGameState(newState);
    setIsPlayerTurn(true);
    setIsAnimating(false);
    setPlayerPowerState(newPower);
  }, []);

  const restartBattle = useCallback(() => {
    startBattle();
  }, [startBattle]);

  const value = useMemo<GameContextValue>(() => ({
    gameState,
    isPlayerTurn,
    isAnimating,
    playerPower,
    setPlayerAngle,
    setPlayerPower,
    firePlayerShot,
    startBattle,
    restartBattle,
  }), [
    gameState,
    isPlayerTurn,
    isAnimating,
    playerPower,
    setPlayerAngle,
    setPlayerPower,
    firePlayerShot,
    startBattle,
    restartBattle,
  ]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
