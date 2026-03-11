import { describe, it, expect } from 'vitest';
import { generateInitialWind } from './wind.ts';

describe('wind', () => {
  it('placeholder', () => {
    const wind = generateInitialWind();
    expect(wind).toBeDefined();
  });
});
