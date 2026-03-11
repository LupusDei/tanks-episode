import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import Canvas from './Canvas';
import type { TerrainData, TankState, ProjectileState, ExplosionState } from '../types/game';

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    createLinearGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn(),
    }),
    setLineDash: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 50 }),
    canvas: { width: 1024, height: 768 },
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D);
});

function makeTerrain(width = 1024, height = 768): TerrainData {
  const heights = new Array<number>(width).fill(200);
  return { heights, width, height };
}

function makeTank(overrides: Partial<TankState> = {}): TankState {
  return {
    id: 'tank-1',
    name: 'Player',
    position: { x: 200, y: 200 },
    barrelAngle: 0,
    hp: 100,
    maxHp: 100,
    color: '#ff0000',
    isPlayer: true,
    isAlive: true,
    fuel: 100,
    queuedShot: null,
    ...overrides,
  };
}

function makeProjectile(overrides: Partial<ProjectileState> = {}): ProjectileState {
  return {
    position: { x: 300, y: 400 },
    velocity: { vx: 10, vy: 20 },
    weaponType: 'standard',
    ownerTankId: 'tank-1',
    active: true,
    trail: [],
    ...overrides,
  };
}

function makeExplosion(overrides: Partial<ExplosionState> = {}): ExplosionState {
  return {
    position: { x: 300, y: 300 },
    radius: 10,
    maxRadius: 20,
    phase: 'growing',
    particles: [],
    weaponType: 'standard',
    timer: 0,
    ...overrides,
  };
}

describe('Canvas', () => {
  it('renders without crashing', () => {
    render(
      <Canvas
        terrain={makeTerrain()}
        tanks={[]}
        projectiles={[]}
        explosions={[]}
        currentTankId={null}
      />,
    );
  });

  it('renders a canvas element in the DOM', () => {
    const { container } = render(
      <Canvas
        terrain={makeTerrain()}
        tanks={[]}
        projectiles={[]}
        explosions={[]}
        currentTankId={null}
      />,
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('sets canvas width and height to match terrain dimensions', () => {
    const terrain = makeTerrain(800, 600);
    const { container } = render(
      <Canvas
        terrain={terrain}
        tanks={[]}
        projectiles={[]}
        explosions={[]}
        currentTankId={null}
      />,
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveAttribute('width', '800');
    expect(canvas).toHaveAttribute('height', '600');
  });

  it('accepts all required props without errors', () => {
    const terrain = makeTerrain();
    const tanks = [makeTank(), makeTank({ id: 'tank-2', name: 'Enemy', isPlayer: false, color: '#0000ff' })];
    const projectiles = [makeProjectile()];
    const explosions = [makeExplosion()];

    expect(() => {
      render(
        <Canvas
          terrain={terrain}
          tanks={tanks}
          projectiles={projectiles}
          explosions={explosions}
          currentTankId="tank-1"
        />,
      );
    }).not.toThrow();
  });

  it('handles empty tanks array', () => {
    expect(() => {
      render(
        <Canvas
          terrain={makeTerrain()}
          tanks={[]}
          projectiles={[makeProjectile()]}
          explosions={[makeExplosion()]}
          currentTankId={null}
        />,
      );
    }).not.toThrow();
  });

  it('handles empty projectiles array', () => {
    expect(() => {
      render(
        <Canvas
          terrain={makeTerrain()}
          tanks={[makeTank()]}
          projectiles={[]}
          explosions={[makeExplosion()]}
          currentTankId="tank-1"
        />,
      );
    }).not.toThrow();
  });

  it('handles empty explosions array', () => {
    expect(() => {
      render(
        <Canvas
          terrain={makeTerrain()}
          tanks={[makeTank()]}
          projectiles={[makeProjectile()]}
          explosions={[]}
          currentTankId="tank-1"
        />,
      );
    }).not.toThrow();
  });

  it('uses different terrain dimensions correctly', () => {
    const terrain = makeTerrain(1600, 1200);
    const { container } = render(
      <Canvas
        terrain={terrain}
        tanks={[]}
        projectiles={[]}
        explosions={[]}
        currentTankId={null}
      />,
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveAttribute('width', '1600');
    expect(canvas).toHaveAttribute('height', '1200');
  });

  it('handles dead tanks without crashing', () => {
    const deadTank = makeTank({ isAlive: false });
    expect(() => {
      render(
        <Canvas
          terrain={makeTerrain()}
          tanks={[deadTank]}
          projectiles={[]}
          explosions={[]}
          currentTankId={null}
        />,
      );
    }).not.toThrow();
  });

  it('handles inactive projectiles without crashing', () => {
    const inactiveProjectile = makeProjectile({ active: false });
    expect(() => {
      render(
        <Canvas
          terrain={makeTerrain()}
          tanks={[]}
          projectiles={[inactiveProjectile]}
          explosions={[]}
          currentTankId={null}
        />,
      );
    }).not.toThrow();
  });

  it('handles done explosions without crashing', () => {
    const doneExplosion = makeExplosion({ phase: 'done' });
    expect(() => {
      render(
        <Canvas
          terrain={makeTerrain()}
          tanks={[]}
          projectiles={[]}
          explosions={[doneExplosion]}
          currentTankId={null}
        />,
      );
    }).not.toThrow();
  });
});
