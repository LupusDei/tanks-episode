import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useKeyboard, UseKeyboardOptions } from './useKeyboard';

function createOptions(overrides: Partial<UseKeyboardOptions> = {}): UseKeyboardOptions {
  return {
    onAngleChange: vi.fn(),
    onPowerChange: vi.fn(),
    onFire: vi.fn(),
    enabled: true,
    ...overrides,
  };
}

function pressKey(key: string, modifiers: { shiftKey?: boolean } = {}) {
  fireEvent.keyDown(window, { key, ...modifiers });
}

describe('useKeyboard', () => {
  describe('angle change', () => {
    it('W key calls onAngleChange(1)', () => {
      const opts = createOptions();
      renderHook(() => useKeyboard(opts));
      pressKey('w');
      expect(opts.onAngleChange).toHaveBeenCalledWith(1);
    });

    it('S key calls onAngleChange(-1)', () => {
      const opts = createOptions();
      renderHook(() => useKeyboard(opts));
      pressKey('s');
      expect(opts.onAngleChange).toHaveBeenCalledWith(-1);
    });

    it('ArrowUp calls onAngleChange(1)', () => {
      const opts = createOptions();
      renderHook(() => useKeyboard(opts));
      pressKey('ArrowUp');
      expect(opts.onAngleChange).toHaveBeenCalledWith(1);
    });

    it('ArrowDown calls onAngleChange(-1)', () => {
      const opts = createOptions();
      renderHook(() => useKeyboard(opts));
      pressKey('ArrowDown');
      expect(opts.onAngleChange).toHaveBeenCalledWith(-1);
    });
  });

  describe('power change', () => {
    it('A key calls onPowerChange(-1)', () => {
      const opts = createOptions();
      renderHook(() => useKeyboard(opts));
      pressKey('a');
      expect(opts.onPowerChange).toHaveBeenCalledWith(-1);
    });

    it('D key calls onPowerChange(1)', () => {
      const opts = createOptions();
      renderHook(() => useKeyboard(opts));
      pressKey('d');
      expect(opts.onPowerChange).toHaveBeenCalledWith(1);
    });

    it('ArrowLeft calls onPowerChange(-1)', () => {
      const opts = createOptions();
      renderHook(() => useKeyboard(opts));
      pressKey('ArrowLeft');
      expect(opts.onPowerChange).toHaveBeenCalledWith(-1);
    });

    it('ArrowRight calls onPowerChange(1)', () => {
      const opts = createOptions();
      renderHook(() => useKeyboard(opts));
      pressKey('ArrowRight');
      expect(opts.onPowerChange).toHaveBeenCalledWith(1);
    });
  });

  describe('shift modifier (5x multiplier)', () => {
    it('Shift+W calls onAngleChange(5)', () => {
      const opts = createOptions();
      renderHook(() => useKeyboard(opts));
      pressKey('w', { shiftKey: true });
      expect(opts.onAngleChange).toHaveBeenCalledWith(5);
    });

    it('Shift+S calls onAngleChange(-5)', () => {
      const opts = createOptions();
      renderHook(() => useKeyboard(opts));
      pressKey('s', { shiftKey: true });
      expect(opts.onAngleChange).toHaveBeenCalledWith(-5);
    });

    it('Shift+A calls onPowerChange(-5)', () => {
      const opts = createOptions();
      renderHook(() => useKeyboard(opts));
      pressKey('a', { shiftKey: true });
      expect(opts.onPowerChange).toHaveBeenCalledWith(-5);
    });

    it('Shift+D calls onPowerChange(5)', () => {
      const opts = createOptions();
      renderHook(() => useKeyboard(opts));
      pressKey('d', { shiftKey: true });
      expect(opts.onPowerChange).toHaveBeenCalledWith(5);
    });
  });

  describe('fire', () => {
    it('Space calls onFire()', () => {
      const opts = createOptions();
      renderHook(() => useKeyboard(opts));
      pressKey(' ');
      expect(opts.onFire).toHaveBeenCalledOnce();
    });

    it('Enter calls onFire()', () => {
      const opts = createOptions();
      renderHook(() => useKeyboard(opts));
      pressKey('Enter');
      expect(opts.onFire).toHaveBeenCalledOnce();
    });
  });

  describe('enabled flag', () => {
    it('when enabled=false, no callbacks called for any key', () => {
      const opts = createOptions({ enabled: false });
      renderHook(() => useKeyboard(opts));

      pressKey('w');
      pressKey('s');
      pressKey('a');
      pressKey('d');
      pressKey('ArrowUp');
      pressKey('ArrowDown');
      pressKey('ArrowLeft');
      pressKey('ArrowRight');
      pressKey(' ');
      pressKey('Enter');

      expect(opts.onAngleChange).not.toHaveBeenCalled();
      expect(opts.onPowerChange).not.toHaveBeenCalled();
      expect(opts.onFire).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('removes event listener on unmount', () => {
      const opts = createOptions();
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderHook(() => useKeyboard(opts));

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeSpy.mockRestore();
    });
  });

  describe('non-game keys', () => {
    it('non-game keys do not trigger any callback', () => {
      const opts = createOptions();
      renderHook(() => useKeyboard(opts));

      pressKey('q');
      pressKey('e');
      pressKey('1');
      pressKey('Escape');
      pressKey('Tab');

      expect(opts.onAngleChange).not.toHaveBeenCalled();
      expect(opts.onPowerChange).not.toHaveBeenCalled();
      expect(opts.onFire).not.toHaveBeenCalled();
    });
  });

  describe('preventDefault', () => {
    it('prevents default for game keys', () => {
      const opts = createOptions();
      renderHook(() => useKeyboard(opts));

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
        cancelable: true,
      });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      expect(preventSpy).toHaveBeenCalledOnce();
    });

    it('does not prevent default for non-game keys', () => {
      const opts = createOptions();
      renderHook(() => useKeyboard(opts));

      const event = new KeyboardEvent('keydown', {
        key: 'q',
        bubbles: true,
        cancelable: true,
      });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      expect(preventSpy).not.toHaveBeenCalled();
    });
  });
});
