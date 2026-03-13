import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GameConfigScreen, { formatTerrainDimensions } from './GameConfigScreen';
import { UserContext } from '../context/UserContext';
import { GameContext } from '../context/GameContext';
import type { UserContextValue } from '../context/UserContext';
import type { GameContextValue } from '../context/GameContext';
import { TANK_COLORS } from '../engine/tank';

function createMockUserContext(overrides: Partial<UserContextValue> = {}): UserContextValue {
  return {
    playerName: 'TestPlayer',
    balance: 500,
    stats: { gamesPlayed: 0, gamesWon: 0, totalKills: 0 },
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
  return {
    gameState: {
      phase: 'config',
      turnNumber: 0,
      tanks: [],
      terrain: null,
      wind: { speed: 0 },
      selectedWeapon: 'standard',
      winner: null,
      projectiles: [],
      explosions: [],
    },
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
        <GameConfigScreen />
      </GameContext.Provider>
    </UserContext.Provider>,
  );

  return { ...result, userCtx, gameCtx };
}

describe('formatTerrainDimensions', () => {
  it('returns correct dimensions for small', () => {
    expect(formatTerrainDimensions('small')).toBe('800x600');
  });

  it('returns correct dimensions for medium', () => {
    expect(formatTerrainDimensions('medium')).toBe('1024x768');
  });

  it('returns correct dimensions for epic', () => {
    expect(formatTerrainDimensions('epic')).toBe('2100x2800');
  });
});

describe('GameConfigScreen', () => {
  it('displays player name greeting', () => {
    renderWithContexts({ playerName: 'Alice' });
    expect(screen.getByText('Welcome, Alice!')).toBeInTheDocument();
  });

  it('renders all terrain size options', () => {
    renderWithContexts();
    expect(screen.getByText(/Small/)).toBeInTheDocument();
    expect(screen.getByText(/Medium/)).toBeInTheDocument();
    expect(screen.getByText(/Large/)).toBeInTheDocument();
    expect(screen.getByText(/Huge/)).toBeInTheDocument();
    expect(screen.getByText(/Epic/)).toBeInTheDocument();
  });

  it('renders all difficulty options', () => {
    renderWithContexts();
    expect(screen.getByText('Blind Fool')).toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByText('Veteran')).toBeInTheDocument();
    expect(screen.getByText('Centurion')).toBeInTheDocument();
    expect(screen.getByText('Primus')).toBeInTheDocument();
  });

  it('renders color swatches for all tank colors', () => {
    renderWithContexts();
    for (const color of TANK_COLORS) {
      expect(screen.getByLabelText(`Color ${color}`)).toBeInTheDocument();
    }
  });

  it('renders enemy count slider', () => {
    renderWithContexts();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('displays default enemy count of 3', () => {
    renderWithContexts();
    expect(screen.getByTestId('enemy-count-display')).toHaveTextContent('3');
  });

  it('updates enemy count when slider changes', () => {
    renderWithContexts();
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '7' } });
    expect(screen.getByTestId('enemy-count-display')).toHaveTextContent('7');
  });

  it('terrain size buttons show selected state', () => {
    renderWithContexts();
    const mediumButton = screen.getByText(/Medium/);
    expect(mediumButton).toHaveAttribute('aria-pressed', 'true');

    const smallButton = screen.getByText(/Small/);
    expect(smallButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking terrain size changes selection', () => {
    renderWithContexts();
    const smallButton = screen.getByText(/Small/);
    fireEvent.click(smallButton);
    expect(smallButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking difficulty changes selection', () => {
    renderWithContexts();
    const primusButton = screen.getByText('Primus');
    fireEvent.click(primusButton);
    expect(primusButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking color swatch changes selection', () => {
    renderWithContexts();
    const secondColor = TANK_COLORS[1]!;
    const colorButton = screen.getByLabelText(`Color ${secondColor}`);
    fireEvent.click(colorButton);
    expect(colorButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('Start Battle button calls startBattle with config', () => {
    const { gameCtx } = renderWithContexts({ playerName: 'Hero' });
    const startButton = screen.getByText('Start Battle');
    fireEvent.click(startButton);

    expect(gameCtx.startBattle).toHaveBeenCalledWith({
      terrainSize: 'medium',
      enemyCount: 3,
      difficulty: 'veteran',
      playerColor: TANK_COLORS[0],
      playerName: 'Hero',
    });
  });

  it('Start Battle with custom config', () => {
    const { gameCtx } = renderWithContexts({ playerName: 'Custom' });

    // Change terrain to small
    fireEvent.click(screen.getByText(/Small/));
    // Change difficulty to primus
    fireEvent.click(screen.getByText('Primus'));
    // Change enemy count
    fireEvent.change(screen.getByRole('slider'), { target: { value: '5' } });

    fireEvent.click(screen.getByText('Start Battle'));

    expect(gameCtx.startBattle).toHaveBeenCalledWith({
      terrainSize: 'small',
      enemyCount: 5,
      difficulty: 'primus',
      playerColor: TANK_COLORS[0],
      playerName: 'Custom',
    });
  });

  it('default difficulty is Veteran', () => {
    renderWithContexts();
    const veteranButton = screen.getByText('Veteran');
    expect(veteranButton).toHaveAttribute('aria-pressed', 'true');
  });
});
