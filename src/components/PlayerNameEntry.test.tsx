import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerNameEntry, { isValidName } from './PlayerNameEntry';
import { UserContext } from '../context/UserContext';
import { GameContext } from '../context/GameContext';
import type { UserContextValue } from '../context/UserContext';
import type { GameContextValue } from '../context/GameContext';

function createMockUserContext(overrides: Partial<UserContextValue> = {}): UserContextValue {
  return {
    playerName: '',
    balance: 0,
    stats: { gamesPlayed: 0, gamesWon: 0, totalKills: 0 },
    weaponInventory: { sniper: 0, heavy: 0 },
    hasProfile: false,
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
      phase: 'nameEntry',
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
        <PlayerNameEntry />
      </GameContext.Provider>
    </UserContext.Provider>,
  );

  return { ...result, userCtx, gameCtx };
}

describe('isValidName', () => {
  it('returns true for valid names', () => {
    expect(isValidName('A')).toBe(true);
    expect(isValidName('Commander')).toBe(true);
    expect(isValidName('abcdefghijklmnopqrst')).toBe(true); // 20 chars
  });

  it('returns false for empty or whitespace-only', () => {
    expect(isValidName('')).toBe(false);
    expect(isValidName('   ')).toBe(false);
  });

  it('returns false for names over 20 chars after trim', () => {
    expect(isValidName('abcdefghijklmnopqrstu')).toBe(false); // 21 chars
  });

  it('trims whitespace before validation', () => {
    expect(isValidName('  Bob  ')).toBe(true);
  });
});

describe('PlayerNameEntry', () => {
  it('renders title and input', () => {
    renderWithContexts();
    expect(screen.getByText('Tank Battle')).toBeInTheDocument();
    expect(screen.getByLabelText('Enter your name')).toBeInTheDocument();
  });

  it('Start button is disabled when name is empty', () => {
    renderWithContexts();
    const button = screen.getByRole('button', { name: 'Start' });
    expect(button).toBeDisabled();
  });

  it('Start button is enabled when name is valid', () => {
    renderWithContexts();
    const input = screen.getByLabelText('Enter your name');
    fireEvent.change(input, { target: { value: 'Player1' } });

    const button = screen.getByRole('button', { name: 'Start' });
    expect(button).not.toBeDisabled();
  });

  it('calls setPlayerName and goToConfig on submit', () => {
    const { userCtx, gameCtx } = renderWithContexts();
    const input = screen.getByLabelText('Enter your name');
    fireEvent.change(input, { target: { value: 'MyName' } });

    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(userCtx.setPlayerName).toHaveBeenCalledWith('MyName');
    expect(gameCtx.goToConfig).toHaveBeenCalled();
  });

  it('trims name before saving', () => {
    const { userCtx } = renderWithContexts();
    const input = screen.getByLabelText('Enter your name');
    fireEvent.change(input, { target: { value: '  TrimMe  ' } });

    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(userCtx.setPlayerName).toHaveBeenCalledWith('TrimMe');
  });

  it('does not submit when name is only whitespace', () => {
    const { userCtx, gameCtx } = renderWithContexts();
    const input = screen.getByLabelText('Enter your name');
    fireEvent.change(input, { target: { value: '   ' } });

    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(userCtx.setPlayerName).not.toHaveBeenCalled();
    expect(gameCtx.goToConfig).not.toHaveBeenCalled();
  });
});
