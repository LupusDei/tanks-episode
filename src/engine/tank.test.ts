import { describe, it, expect } from 'vitest';
import { placeTanks, generateAINames } from './tank';

describe('tank', () => {
  it('placeTanks returns an array', () => {
    const terrain = { heights: [], width: 100, height: 50 };
    const tanks = placeTanks(3, terrain);
    expect(Array.isArray(tanks)).toBe(true);
  });

  it('generateAINames returns the correct number of names', () => {
    const names = generateAINames(3);
    expect(names).toHaveLength(3);
  });
});
