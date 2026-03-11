import { useEffect } from 'react';

export function useKeyboard(onKey: (key: string) => void): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      onKey(e.key);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onKey]);
}
