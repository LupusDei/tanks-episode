import { describe, it, expect } from 'vitest';
import { generateInitialWind, updateWind, normalRandom } from './wind';

describe('normalRandom', () => {
  it('produces expected distribution (mean near 0, stdDev near target) over 10000 samples', () => {
    const samples: number[] = [];
    const targetStdDev = 10;
    for (let i = 0; i < 10000; i++) {
      samples.push(normalRandom(0, targetStdDev));
    }

    const mean = samples.reduce((sum, v) => sum + v, 0) / samples.length;
    const variance =
      samples.reduce((sum, v) => sum + (v - mean) ** 2, 0) / samples.length;
    const stdDev = Math.sqrt(variance);

    expect(mean).toBeCloseTo(0, 0); // within ~0.5 of 0
    expect(stdDev).toBeGreaterThan(targetStdDev * 0.8);
    expect(stdDev).toBeLessThan(targetStdDev * 1.2);
  });

  it('with different mean shifts the distribution center', () => {
    const samples: number[] = [];
    const targetMean = 50;
    for (let i = 0; i < 10000; i++) {
      samples.push(normalRandom(targetMean, 5));
    }

    const mean = samples.reduce((sum, v) => sum + v, 0) / samples.length;
    expect(mean).toBeGreaterThan(targetMean - 1);
    expect(mean).toBeLessThan(targetMean + 1);
  });

  it('with different stdDev changes spread', () => {
    const narrowSamples: number[] = [];
    const wideSamples: number[] = [];
    for (let i = 0; i < 10000; i++) {
      narrowSamples.push(normalRandom(0, 2));
      wideSamples.push(normalRandom(0, 20));
    }

    const narrowMean =
      narrowSamples.reduce((sum, v) => sum + v, 0) / narrowSamples.length;
    const narrowVariance =
      narrowSamples.reduce((sum, v) => sum + (v - narrowMean) ** 2, 0) /
      narrowSamples.length;
    const narrowStdDev = Math.sqrt(narrowVariance);

    const wideMean =
      wideSamples.reduce((sum, v) => sum + v, 0) / wideSamples.length;
    const wideVariance =
      wideSamples.reduce((sum, v) => sum + (v - wideMean) ** 2, 0) /
      wideSamples.length;
    const wideStdDev = Math.sqrt(wideVariance);

    expect(wideStdDev).toBeGreaterThan(narrowStdDev * 5);
  });
});

describe('generateInitialWind', () => {
  it('returns a Wind object with speed property', () => {
    const wind = generateInitialWind();
    expect(wind).toHaveProperty('speed');
    expect(typeof wind.speed).toBe('number');
  });

  it('initial wind within +/-30 bounds (1000 iterations)', () => {
    for (let i = 0; i < 1000; i++) {
      const wind = generateInitialWind();
      expect(wind.speed).toBeGreaterThanOrEqual(-30);
      expect(wind.speed).toBeLessThanOrEqual(30);
    }
  });
});

describe('updateWind', () => {
  it('updated wind within +/-30 bounds (1000 iterations)', () => {
    let wind = { speed: 25 };
    for (let i = 0; i < 1000; i++) {
      wind = updateWind(wind);
      expect(wind.speed).toBeGreaterThanOrEqual(-30);
      expect(wind.speed).toBeLessThanOrEqual(30);
    }
  });

  it('wind regresses toward zero over many updates from high starting value', () => {
    const startSpeed = 28;
    let wind = { speed: startSpeed };
    let totalSpeed = 0;

    for (let i = 0; i < 100; i++) {
      wind = updateWind(wind);
      totalSpeed += wind.speed;
    }

    const averageSpeed = totalSpeed / 100;
    expect(Math.abs(averageSpeed)).toBeLessThan(Math.abs(startSpeed));
  });

  it('does not mutate the input Wind object', () => {
    const original = { speed: 15 };
    const originalSpeed = original.speed;
    updateWind(original);
    expect(original.speed).toBe(originalSpeed);
  });
});
