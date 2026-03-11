import { describe, it, expect } from 'vitest';
import { generateInitialWind, updateWind } from './wind';

describe('wind', () => {
  it('generateInitialWind returns a wind object', () => {
    const wind = generateInitialWind();
    expect(wind).toHaveProperty('speed');
  });

  it('updateWind returns a wind object', () => {
    const wind = updateWind({ speed: 5 });
    expect(wind).toHaveProperty('speed');
  });
});
