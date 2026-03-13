import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  GameState,
  TankState,
  ProjectileState,
  ExplosionState,
  TerrainData,
  TerrainSize,
  AIDifficulty,
  GamePhase,
} from '../types/game';
import { generateTerrain } from '../engine/terrain';
import { carveCrater } from '../engine/terrain';
import { placeTanks, settleTank } from '../engine/tank';
import { generateInitialWind, updateWind } from '../engine/wind';
import { calculateAIShot, selectTarget } from '../engine/ai';
import { createProjectile, updateProjectile, checkTerrainCollision, checkTankCollision, isOutOfBounds } from '../engine/projectile';
import { calculateDamage, WEAPON_CONFIGS } from '../engine/weapons';
import { createExplosion, updateExplosion, isExplosionComplete, createDestructionEffect } from '../engine/explosion';

// === Constants ===

const MIN_ANGLE = -120;
const MAX_ANGLE = 120;
const MIN_POWER = 0;
const MAX_POWER = 100;
const SIMULATION_DT = (1 / 60) * 5; // 5x visual speed multiplier
const FRAME_INTERVAL_MS = 1000 / 60; // 60fps

// === Types ===

export interface BattleConfig {
  terrainSize: TerrainSize;
  enemyCount: number;
  difficulty: AIDifficulty;
  playerColor: string;
  playerName: string;
}

export interface GameContextValue {
  gameState: GameState;
  isPlayerTurn: boolean;
  isAnimating: boolean;
  playerPower: number;
  battleConfig: BattleConfig | null;
  setPlayerAngle: (angle: number) => void;
  setPlayerPower: (power: number) => void;
  firePlayerShot: () => void;
  goToConfig: () => void;
  startBattle: (config: BattleConfig) => void;
  endGame: (winner: TankState) => void;
  playAgain: () => void;
  setPhase: (phase: GamePhase) => void;
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
    return aliveAI[0] ?? null;
  }

  if (aliveAI.length === 0 && player && player.isAlive) {
    return player;
  }

  return null;
}

function initializeBattle(config: BattleConfig): { gameState: GameState; playerPower: number } {
  const terrain = generateTerrain(config.terrainSize);
  const tanks = placeTanks(terrain, config.playerName, config.playerColor, config.enemyCount);
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

// === Simulation Step Helpers ===

interface CollisionResult {
  projectile: ProjectileState;
  newExplosions: ExplosionState[];
  updatedTanks: TankState[];
  updatedTerrain: TerrainData;
}

function handleProjectileCollision(
  proj: ProjectileState,
  tanks: TankState[],
  terrain: TerrainData,
): CollisionResult {
  const weaponConfig = WEAPON_CONFIGS[proj.weaponType];
  const newExplosions: ExplosionState[] = [];
  const impactPos = { x: proj.position.x, y: proj.position.y };

  // Clone terrain heights for immutability
  const clonedTerrain: TerrainData = {
    ...terrain,
    heights: [...terrain.heights],
  };

  // Carve crater
  carveCrater(clonedTerrain, impactPos.x, impactPos.y, weaponConfig.blastRadius);

  // Calculate damage
  const damageResults = calculateDamage(impactPos, tanks, weaponConfig);

  // Apply damage to tanks
  let updatedTanks = tanks.map((tank) => {
    const damageResult = damageResults.find((r) => r.tankId === tank.id);
    if (!damageResult) return tank;

    const newHp = Math.max(0, tank.hp - damageResult.damage);
    return {
      ...tank,
      hp: newHp,
      isAlive: newHp > 0,
    };
  });

  // Create explosion at impact
  newExplosions.push(createExplosion(impactPos, proj.weaponType));

  // Create destruction effects for newly killed tanks
  for (const result of damageResults) {
    if (result.killed) {
      const killedTank = updatedTanks.find((t) => t.id === result.tankId);
      if (killedTank) {
        newExplosions.push(createDestructionEffect(killedTank));
      }
    }
  }

  // Settle alive tanks to new terrain
  updatedTanks = updatedTanks.map((tank) =>
    tank.isAlive ? settleTank(tank, clonedTerrain) : tank,
  );

  return {
    projectile: { ...proj, active: false },
    newExplosions,
    updatedTanks,
    updatedTerrain: clonedTerrain,
  };
}

function stepSimulation(prev: GameState): GameState {
  if (!prev.terrain) return prev;

  let currentTerrain = prev.terrain;
  let currentTanks = prev.tanks;
  const allNewExplosions: ExplosionState[] = [];

  // Update each active projectile
  const updatedProjectiles = prev.projectiles.map((proj) => {
    if (!proj.active) return proj;
    return updateProjectile(proj, prev.wind.speed, SIMULATION_DT);
  });

  // Check collisions for each active projectile
  const finalProjectiles: ProjectileState[] = [];
  for (const proj of updatedProjectiles) {
    if (!proj.active) {
      finalProjectiles.push(proj);
      continue;
    }

    const terrainCollision = checkTerrainCollision(proj, currentTerrain);
    const tankHit = checkTankCollision(
      proj,
      currentTanks,
      WEAPON_CONFIGS[proj.weaponType].blastRadius,
    );
    const outOfBounds = isOutOfBounds(proj, currentTerrain);

    if (terrainCollision || tankHit) {
      const result = handleProjectileCollision(proj, currentTanks, currentTerrain);
      finalProjectiles.push(result.projectile);
      allNewExplosions.push(...result.newExplosions);
      currentTanks = result.updatedTanks;
      currentTerrain = result.updatedTerrain;
    } else if (outOfBounds) {
      finalProjectiles.push({ ...proj, active: false });
    } else {
      finalProjectiles.push(proj);
    }
  }

  // Update existing explosions
  const updatedExplosions = prev.explosions
    .map((exp) => updateExplosion(exp, SIMULATION_DT))
    .filter((exp) => !isExplosionComplete(exp));

  const combinedExplosions = [...updatedExplosions, ...allNewExplosions];

  return {
    ...prev,
    projectiles: finalProjectiles,
    explosions: combinedExplosions,
    tanks: currentTanks,
    terrain: currentTerrain,
  };
}

function isSimulationDone(state: GameState): boolean {
  const allProjectilesInactive = state.projectiles.every((p) => !p.active);
  const allExplosionsDone = state.explosions.every(isExplosionComplete);
  return allProjectilesInactive && (state.explosions.length === 0 || allExplosionsDone);
}

function resolveEndOfTurn(state: GameState): GameState {
  const winner = checkWinner(state.tanks);

  if (winner) {
    return {
      ...state,
      winner,
      phase: 'gameOver',
      projectiles: [],
      explosions: [],
    };
  }

  const newWind = updateWind(state.wind);
  return {
    ...state,
    wind: newWind,
    turnNumber: state.turnNumber + 1,
    projectiles: [],
    explosions: [],
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
  battleConfig: null,
  setPlayerAngle: () => {},
  setPlayerPower: () => {},
  firePlayerShot: () => {},
  goToConfig: () => {},
  startBattle: () => {},
  endGame: () => {},
  playAgain: () => {},
  setPhase: () => {},
};

// === Context ===

export const GameContext = createContext<GameContextValue>(defaultContextValue);

export function useGameContext(): GameContextValue {
  return useContext(GameContext);
}

// === Provider ===

interface GameProviderProps {
  children: ReactNode;
  initialPhase?: GamePhase;
}

export function GameProvider({ children, initialPhase = 'nameEntry' }: GameProviderProps): React.JSX.Element {
  const [gameState, setGameState] = useState<GameState>(() => ({
    ...defaultGameState,
    phase: initialPhase,
  }));
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [playerPower, setPlayerPowerState] = useState(50);
  const [battleConfig, setBattleConfig] = useState<BattleConfig | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingResolutionRef = useRef(false);
  const battleConfigRef = useRef<BattleConfig | null>(null);

  // Animation loop effect
  useEffect(() => {
    if (!isAnimating) return;

    intervalRef.current = setInterval(() => {
      // Guard against stale interval callbacks after clearInterval
      if (pendingResolutionRef.current) return;

      setGameState((prev) => {
        // Double-check guard inside updater (batched calls)
        if (pendingResolutionRef.current) return prev;

        const next = stepSimulation(prev);

        if (isSimulationDone(next)) {
          // Clear interval to stop the loop
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Mark pending resolution so subsequent batched calls are no-ops
          pendingResolutionRef.current = true;

          // Resolve the turn and return final state
          return resolveEndOfTurn(next);
        }

        return next;
      });
    }, FRAME_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAnimating]);

  // Effect to handle post-resolution state changes
  // This fires after gameState updates, so it's safely inside an act() boundary
  useEffect(() => {
    if (pendingResolutionRef.current) {
      pendingResolutionRef.current = false;
      setIsAnimating(false);
      setIsPlayerTurn(true);
    }
  }, [gameState]);

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

    setIsPlayerTurn(false);

    setGameState((prev) => {
      const player = findPlayerTank(prev.tanks);
      if (!player || !prev.terrain) return prev;

      const currentDifficulty = battleConfigRef.current?.difficulty ?? 'veteran';

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
        const shot = calculateAIShot(aiTank, target, prev.wind, prev.terrain!, currentDifficulty);
        return createProjectile(aiTank, shot.angle, shot.power, shot.weaponType);
      }).filter((p): p is NonNullable<typeof p> => p !== null);

      return {
        ...prev,
        projectiles: [playerProjectile, ...aiProjectiles],
      };
    });

    setIsAnimating(true);
  }, [isPlayerTurn, isAnimating, playerPower]);

  const goToConfig = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      phase: 'config',
    }));
  }, []);

  const startBattle = useCallback((config: BattleConfig) => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    pendingResolutionRef.current = false;
    setBattleConfig(config);
    battleConfigRef.current = config;
    const { gameState: newState, playerPower: newPower } = initializeBattle(config);
    setGameState(newState);
    setIsPlayerTurn(true);
    setIsAnimating(false);
    setPlayerPowerState(newPower);
  }, []);

  const endGame = useCallback((winner: TankState) => {
    setGameState((prev) => ({
      ...prev,
      phase: 'gameOver',
      winner,
      projectiles: [],
      explosions: [],
    }));
    setIsAnimating(false);
  }, []);

  const playAgain = useCallback(() => {
    setGameState((prev) => ({
      ...defaultGameState,
      phase: 'config',
      turnNumber: prev.turnNumber,
    }));
    setIsPlayerTurn(false);
    setIsAnimating(false);
  }, []);

  const setPhase = useCallback((phase: GamePhase) => {
    setGameState((prev) => ({
      ...prev,
      phase,
    }));
  }, []);

  const value = useMemo<GameContextValue>(() => ({
    gameState,
    isPlayerTurn,
    isAnimating,
    playerPower,
    battleConfig,
    setPlayerAngle,
    setPlayerPower,
    firePlayerShot,
    goToConfig,
    startBattle,
    endGame,
    playAgain,
    setPhase,
  }), [
    gameState,
    isPlayerTurn,
    isAnimating,
    playerPower,
    battleConfig,
    setPlayerAngle,
    setPlayerPower,
    firePlayerShot,
    goToConfig,
    startBattle,
    endGame,
    playAgain,
    setPhase,
  ]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
