import { useRef, useEffect } from 'react';
import type {
  TerrainData,
  TankState,
  ProjectileState,
  ExplosionState,
} from '../types/game';

interface CanvasProps {
  terrain: TerrainData;
  tanks: TankState[];
  projectiles: ProjectileState[];
  explosions: ExplosionState[];
  currentTankId: string | null;
}

// === Drawing Helpers ===

function drawSky(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.5, '#16213e');
  gradient.addColorStop(1, '#0f3460');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawTerrain(ctx: CanvasRenderingContext2D, terrain: TerrainData): void {
  const { heights, width, height: canvasHeight } = terrain;
  ctx.beginPath();
  ctx.moveTo(0, canvasHeight);
  for (let x = 0; x < width; x++) {
    const screenY = canvasHeight - (heights[x] ?? 0);
    ctx.lineTo(x, screenY);
  }
  ctx.lineTo(width, canvasHeight);
  ctx.closePath();
  ctx.fillStyle = '#2d5016';
  ctx.fill();
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  hp: number,
  maxHp: number,
): void {
  const barWidth = 50;
  const barHeight = 4;
  const barX = screenX - barWidth / 2;
  const barY = screenY - 40;
  const ratio = hp / maxHp;

  // Background
  ctx.fillStyle = '#333333';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Health fill - green to yellow to red
  let color: string;
  if (ratio > 0.6) {
    color = '#00cc00';
  } else if (ratio > 0.3) {
    color = '#cccc00';
  } else {
    color = '#cc0000';
  }
  ctx.fillStyle = color;
  ctx.fillRect(barX, barY, barWidth * ratio, barHeight);
}

function drawNameLabel(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  name: string,
): void {
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, screenX, screenY - 46);
}

function drawTurnIndicator(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
): void {
  const tipY = screenY - 56;
  ctx.beginPath();
  ctx.moveTo(screenX, tipY + 10);
  ctx.lineTo(screenX - 6, tipY);
  ctx.lineTo(screenX + 6, tipY);
  ctx.closePath();
  ctx.fillStyle = '#ffff00';
  ctx.fill();
}

function drawTankBody(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  color: string,
): void {
  const bodyWidth = 50;
  const bodyHeight = 16;
  ctx.fillStyle = color;
  ctx.fillRect(
    screenX - bodyWidth / 2,
    screenY - bodyHeight,
    bodyWidth,
    bodyHeight,
  );
}

function drawTurret(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  color: string,
): void {
  const turretRadius = 8;
  ctx.beginPath();
  ctx.arc(screenX, screenY - 16, turretRadius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawBarrel(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  barrelAngle: number,
): void {
  const barrelLength = 25;
  // UI angle: 0=up, positive=left, negative=right
  // Canvas angle: convert so 0 points up on screen
  const canvasAngleDeg = -(90 - barrelAngle);
  const canvasAngleRad = (canvasAngleDeg * Math.PI) / 180;

  const turretCenterY = screenY - 16;
  const endX = screenX + Math.cos(canvasAngleRad) * barrelLength;
  const endY = turretCenterY + Math.sin(canvasAngleRad) * barrelLength;

  ctx.beginPath();
  ctx.moveTo(screenX, turretCenterY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawWheels(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
): void {
  const wheelRadius = 4;
  const wheelY = screenY + 2;
  const offsets = [-15, -5, 5, 15];
  ctx.fillStyle = '#333333';
  for (const offset of offsets) {
    ctx.beginPath();
    ctx.arc(screenX + offset, wheelY, wheelRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTank(
  ctx: CanvasRenderingContext2D,
  tank: TankState,
  canvasHeight: number,
  isCurrent: boolean,
): void {
  if (!tank.isAlive) return;

  const screenX = tank.position.x;
  const screenY = canvasHeight - tank.position.y;

  drawTankBody(ctx, screenX, screenY, tank.color);
  drawTurret(ctx, screenX, screenY, tank.color);
  drawBarrel(ctx, screenX, screenY, tank.barrelAngle);
  drawWheels(ctx, screenX, screenY);
  drawNameLabel(ctx, screenX, screenY, tank.name);
  drawHealthBar(ctx, screenX, screenY, tank.hp, tank.maxHp);

  if (isCurrent) {
    drawTurnIndicator(ctx, screenX, screenY);
  }
}

function drawProjectile(
  ctx: CanvasRenderingContext2D,
  projectile: ProjectileState,
  canvasHeight: number,
): void {
  if (!projectile.active) return;

  const screenX = projectile.position.x;
  const screenY = canvasHeight - projectile.position.y;

  // Draw trail
  if (projectile.trail.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.4)';
    ctx.lineWidth = 1;
    const first = projectile.trail[0]!;
    ctx.moveTo(first.x, canvasHeight - first.y);
    for (let i = 1; i < projectile.trail.length; i++) {
      const pt = projectile.trail[i]!;
      ctx.lineTo(pt.x, canvasHeight - pt.y);
    }
    ctx.stroke();
  }

  // Draw projectile dot
  ctx.beginPath();
  ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

function drawExplosion(
  ctx: CanvasRenderingContext2D,
  explosion: ExplosionState,
  canvasHeight: number,
): void {
  if (explosion.phase === 'done') return;

  const screenX = explosion.position.x;
  const screenY = canvasHeight - explosion.position.y;

  // Draw explosion circle
  if (explosion.radius > 0) {
    ctx.beginPath();
    ctx.arc(screenX, screenY, explosion.radius, 0, Math.PI * 2);
    const alpha = explosion.phase === 'fading' ? 0.5 : 0.8;
    ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
    ctx.fill();
  }

  // Draw particles
  for (const particle of explosion.particles) {
    if (particle.life <= 0) continue;
    const pScreenX = particle.position.x;
    const pScreenY = canvasHeight - particle.position.y;
    const alpha = particle.life / particle.maxLife;
    ctx.beginPath();
    ctx.arc(pScreenX, pScreenY, 2, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = alpha;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// === Main Component ===

export default function Canvas({
  terrain,
  tanks,
  projectiles,
  explosions,
  currentTankId,
}: CanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    function render(): void {
      if (!ctx) return;
      const { width, height } = terrain;

      ctx.clearRect(0, 0, width, height);

      drawSky(ctx, width, height);
      drawTerrain(ctx, terrain);

      for (const tank of tanks) {
        drawTank(ctx, tank, height, tank.id === currentTankId);
      }

      for (const projectile of projectiles) {
        drawProjectile(ctx, projectile, height);
      }

      for (const explosion of explosions) {
        drawExplosion(ctx, explosion, height);
      }

      animationId = requestAnimationFrame(render);
    }

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [terrain, tanks, projectiles, explosions, currentTankId]);

  return (
    <canvas
      ref={canvasRef}
      width={terrain.width}
      height={terrain.height}
      style={{ display: 'block' }}
    />
  );
}
