import { useEffect, useCallback } from 'react';

export interface UseKeyboardOptions {
  onAngleChange: (delta: number) => void;
  onPowerChange: (delta: number) => void;
  onFire: () => void;
  enabled: boolean;
}

const SHIFT_MULTIPLIER = 5;

const GAME_KEYS = new Set([
  'w', 's', 'a', 'd',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  ' ', 'Enter',
]);

function isGameKey(key: string): boolean {
  return GAME_KEYS.has(key);
}

export function useKeyboard(options: UseKeyboardOptions): void {
  const { onAngleChange, onPowerChange, onFire, enabled } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const { key, shiftKey } = event;

      if (!isGameKey(key)) return;

      event.preventDefault();

      const multiplier = shiftKey ? SHIFT_MULTIPLIER : 1;

      switch (key) {
        case 'w':
        case 'ArrowUp':
          onAngleChange(1 * multiplier);
          break;
        case 's':
        case 'ArrowDown':
          onAngleChange(-1 * multiplier);
          break;
        case 'a':
        case 'ArrowLeft':
          onPowerChange(-1 * multiplier);
          break;
        case 'd':
        case 'ArrowRight':
          onPowerChange(1 * multiplier);
          break;
        case ' ':
        case 'Enter':
          onFire();
          break;
      }
    },
    [enabled, onAngleChange, onPowerChange, onFire],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
