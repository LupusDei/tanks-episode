import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GameOverScreen from './GameOverScreen';
import { UserContext } from '../context/UserContext';
import { GameContext } from '../context/GameContext';
import type { UserContextValue } from '../context/UserContext';
import type { GameContextValue } from '../context/GameContext';
import type { TankState, GameState } from '../types/game';

function createTank(overrides: Partial<TankState> = {}): TankState {
  return {
    id: 'tank-1',
    name: 'TestTank',
    position: { x: 100, y: 100 },
    barrelAngle: 0,
    hp: 100,
    maxHp: 100,
    color: '#FF0000',
    isPlayer: false,
    isAlive: true,
    fuel: 100,
    queuedShot: null,
    ...overrides,
  };
}

function createMockUserContext(overrides: Partial<UserContextValue> = {}): UserContextValue {
  return {
    playerName: 'TestPlayer',
    balance: 500,
    stats: { gamesPlayed: 5, gamesWon: 3, totalKills: 12 },
    weaponInventory: { sniper: 0, heavy: 0 },
    hasProfile: true,
    setPlayerName: vi.fn(),
    updateBalance: vi.fn(),
    updateStats: vi.fn(),
    updateWeaponInventory: vi.fn(),
    ...overrides,
  };
}

function createMockGameContext(overrides: Partial<GameContextValue> = {}): GameContextValue {
  const playerTank = createTank({ id: 'player', name: 'TestPlayer', isPlayer: true });
  const aiTank1 = createTank({ id: 'ai-1', name: 'Viper', isAlive: false });
  const aiTank2 = createTank({ id: 'ai-2', name: 'Cobra', isAlive: false });

  const defaultGameState: GameState = {
    phase: 'gameOver',
    turnNumber: 10,
    tanks: [playerTank, aiTank1, aiTank2],
    terrain: null,
    wind: { speed: 0 },
    selectedWeapon: 'standard',
    winner: playerTank,
    projectiles: [],
    explosions: [],
  };

  return {
    gameState: defaultGameState,
    isPlayerTurn: false,
    isAnimating: false,
    playerPower: 50,
    battleConfig: null,
    setPlayerAngle: vi.fn(),
    setPlayerPower: vi.fn(),
    firePlayerShot: vi.fn(),
    goToConfig: vi.fn(),
    startBattle: vi.fn(),
    endGame: vi.fn(),
    playAgain: vi.fn(),
    setPhase: vi.fn(),
    ...overrides,
  };
}

function renderWithContexts(
  userOverrides: Partial<UserContextValue> = {},
  gameOverrides: Partial<GameContextValue> = {},
) {
  const userCtx = createMockUserContext(userOverrides);
  const gameCtx = createMockGameContext(gameOverrides);

  const result = render(
    <UserContext.Provider value={userCtx}>
      <GameContext.Provider value={gameCtx}>
        <GameOverScreen />
      </GameContext.Provider>
    </UserContext.Provider>,
  );

  return { ...result, userCtx, gameCtx };
}

describe('GameOverScreen', () => {
  it('displays Victory when player wins', () => {
    renderWithContexts();
    expect(screen.getByText('Victory!')).toBeInTheDocument();
  });

  it('displays Defeat when AI wins', () => {
    const aiWinner = createTank({ id: 'ai-1', name: 'Viper', isPlayer: false });
    const playerTank = createTank({ id: 'player', name: 'TestPlayer', isPlayer: true, isAlive: false });

    renderWithContexts({}, {
      gameState: {
        phase: 'gameOver',
        turnNumber: 10,
        tanks: [playerTank, aiWinner],
        terrain: null,
        wind: { speed: 0 },
        selectedWeapon: 'standard',
        winner: aiWinner,
        projectiles: [],
        explosions: [],
      },
    });

    expect(screen.getByText('Defeat!')).toBeInTheDocument();
  });

  it('displays winner name', () => {
    renderWithContexts();
    expect(screen.getByTestId('winner-name')).toHaveTextContent('TestPlayer wins!');
  });

  it('displays player stats', () => {
    renderWithContexts({ stats: { gamesPlayed: 10, gamesWon: 7, totalKills: 25 } });
    expect(screen.getByText('Games Played: 10')).toBeInTheDocument();
    expect(screen.getByText('Games Won: 7')).toBeInTheDocument();
    expect(screen.getByText('Total Kills: 25')).toBeInTheDocument();
  });

  it('calls updateStats on mount with game results', () => {
    const { userCtx } = renderWithContexts();
    // 2 dead AI tanks = 2 kills, player won
    expect(userCtx.updateStats).toHaveBeenCalledWith(1, 1, 2);
  });

  it('calls updateStats with 0 gamesWon when player loses', () => {
    const aiWinner = createTank({ id: 'ai-1', name: 'Viper', isPlayer: false });
    const playerTank = createTank({ id: 'player', name: 'TestPlayer', isPlayer: true, isAlive: false });
    const aiDead = createTank({ id: 'ai-2', name: 'Cobra', isPlayer: false, isAlive: false });

    const { userCtx } = renderWithContexts({}, {
      gameState: {
        phase: 'gameOver',
        turnNumber: 10,
        tanks: [playerTank, aiWinner, aiDead],
        terrain: null,
        wind: { speed: 0 },
        selectedWeapon: 'standard',
        winner: aiWinner,
        projectiles: [],
        explosions: [],
      },
    });

    // 1 dead AI tank, player lost
    expect(userCtx.updateStats).toHaveBeenCalledWith(1, 0, 1);
  });

  it('Play Again button calls playAgain', () => {
    const { gameCtx } = renderWithContexts();
    const button = screen.getByText('Play Again');
    fireEvent.click(button);
    expect(gameCtx.playAgain).toHaveBeenCalled();
  });

  it('renders earnings placeholder', () => {
    renderWithContexts();
    expect(screen.getByTestId('earnings-placeholder')).toBeInTheDocument();
  });

  it('handles null winner gracefully', () => {
    renderWithContexts({}, {
      gameState: {
        phase: 'gameOver',
        turnNumber: 10,
        tanks: [],
        terrain: null,
        wind: { speed: 0 },
        selectedWeapon: 'standard',
        winner: null,
        projectiles: [],
        explosions: [],
      },
    });

    expect(screen.getByTestId('winner-name')).toHaveTextContent('Unknown wins!');
  });
});
