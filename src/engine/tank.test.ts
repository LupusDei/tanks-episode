import { describe, it, expect } from 'vitest';
import { generateAINames } from './tank.ts';

describe('tank', () => {
  it('placeholder', () => {
    const names = generateAINames(3);
    expect(names).toHaveLength(3);
  });
});
