import { describe, it, expect } from 'vitest';
import { generateTerrain } from './terrain.ts';

describe('terrain', () => {
  it('placeholder', () => {
    const terrain = generateTerrain({ width: 100, height: 100 });
    expect(terrain).toBeDefined();
  });
});
