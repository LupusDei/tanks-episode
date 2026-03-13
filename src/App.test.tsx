import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import * as storage from './services/storage';

vi.mock('./services/storage', () => ({
  loadProfile: vi.fn(),
  saveProfile: vi.fn(),
  getDefaultProfile: vi.fn((name: string) => ({
    name,
    balance: 500,
    stats: { gamesPlayed: 0, gamesWon: 0, totalKills: 0 },
    weaponInventory: { sniper: 0, heavy: 0 },
  })),
  clearProfile: vi.fn(),
}));

// Mock Canvas to avoid canvas rendering issues in jsdom
vi.mock('./components/Canvas', () => ({
  default: () => <div data-testid="canvas-mock">Canvas</div>,
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storage.loadProfile).mockReturnValue(null);
  });

  describe('fresh visit (no stored profile)', () => {
    it('shows name entry screen', () => {
      render(<App />);
      expect(screen.getByLabelText('Enter your name')).toBeInTheDocument();
    });

    it('does not show config screen', () => {
      render(<App />);
      expect(screen.queryByText('Configure Battle')).not.toBeInTheDocument();
    });
  });

  describe('return visit (stored profile)', () => {
    it('shows config screen when profile exists', () => {
      vi.mocked(storage.loadProfile).mockReturnValue({
        name: 'ReturningPlayer',
        balance: 500,
        stats: { gamesPlayed: 2, gamesWon: 1, totalKills: 5 },
        weaponInventory: { sniper: 0, heavy: 0 },
      });

      render(<App />);
      expect(screen.getByText('Configure Battle')).toBeInTheDocument();
      expect(screen.getByText('Welcome, ReturningPlayer!')).toBeInTheDocument();
    });
  });

  describe('name entry to config flow', () => {
    it('transitions from name entry to config after entering name', () => {
      render(<App />);

      const input = screen.getByLabelText('Enter your name');
      fireEvent.change(input, { target: { value: 'NewPlayer' } });

      const form = input.closest('form')!;
      fireEvent.submit(form);

      expect(screen.getByText('Configure Battle')).toBeInTheDocument();
      expect(screen.getByText('Welcome, NewPlayer!')).toBeInTheDocument();
    });
  });

  describe('config to playing flow', () => {
    it('transitions from config to playing when Start Battle is clicked', () => {
      vi.mocked(storage.loadProfile).mockReturnValue({
        name: 'Player',
        balance: 500,
        stats: { gamesPlayed: 0, gamesWon: 0, totalKills: 0 },
        weaponInventory: { sniper: 0, heavy: 0 },
      });

      render(<App />);
      fireEvent.click(screen.getByText('Start Battle'));

      // Should show the battle view with canvas
      expect(screen.getByTestId('canvas-mock')).toBeInTheDocument();
    });
  });

  describe('phase routing', () => {
    it('renders PhaseRouter within providers', () => {
      render(<App />);
      // App should render without errors - name entry is the default
      expect(screen.getByText('Tank Battle')).toBeInTheDocument();
    });
  });
});
