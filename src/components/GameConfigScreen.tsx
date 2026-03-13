import { useState } from 'react';
import { useGameContext } from '../context/GameContext';
import { useUserContext } from '../context/UserContext';
import { TANK_COLORS } from '../engine/tank';
import type { TerrainSize, AIDifficulty } from '../types/game';
import { TERRAIN_CONFIGS } from '../types/game';

// === Constants ===

const TERRAIN_SIZE_OPTIONS: { value: TerrainSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'huge', label: 'Huge' },
  { value: 'epic', label: 'Epic' },
];

const DIFFICULTY_OPTIONS: { value: AIDifficulty; label: string }[] = [
  { value: 'blindFool', label: 'Blind Fool' },
  { value: 'private', label: 'Private' },
  { value: 'veteran', label: 'Veteran' },
  { value: 'centurion', label: 'Centurion' },
  { value: 'primus', label: 'Primus' },
];

const MIN_ENEMIES = 1;
const MAX_ENEMIES = 10;
const DEFAULT_ENEMY_COUNT = 3;
const DEFAULT_TERRAIN_SIZE: TerrainSize = 'medium';
const DEFAULT_DIFFICULTY: AIDifficulty = 'veteran';

export function formatTerrainDimensions(size: TerrainSize): string {
  const config = TERRAIN_CONFIGS[size];
  return `${config.width}x${config.height}`;
}

// === Component ===

export default function GameConfigScreen(): React.JSX.Element {
  const { startBattle } = useGameContext();
  const { playerName } = useUserContext();

  const [terrainSize, setTerrainSize] = useState<TerrainSize>(DEFAULT_TERRAIN_SIZE);
  const [enemyCount, setEnemyCount] = useState(DEFAULT_ENEMY_COUNT);
  const [difficulty, setDifficulty] = useState<AIDifficulty>(DEFAULT_DIFFICULTY);
  const [playerColor, setPlayerColor] = useState(TANK_COLORS[0]!);

  function handleStartBattle(): void {
    startBattle({
      terrainSize,
      enemyCount,
      difficulty,
      playerColor,
      playerName,
    });
  }

  function handleEnemyCountChange(value: number): void {
    const clamped = Math.max(MIN_ENEMIES, Math.min(MAX_ENEMIES, value));
    setEnemyCount(clamped);
  }

  return (
    <div className="config-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px', gap: '24px' }}>
      <h1>Welcome, {playerName}!</h1>
      <h2>Configure Battle</h2>

      {/* Terrain Size */}
      <fieldset>
        <legend>Terrain Size</legend>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {TERRAIN_SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTerrainSize(opt.value)}
              aria-pressed={terrainSize === opt.value}
              style={{
                fontWeight: terrainSize === opt.value ? 'bold' : 'normal',
                border: terrainSize === opt.value ? '2px solid #333' : '1px solid #999',
              }}
            >
              {opt.label} ({formatTerrainDimensions(opt.value)})
            </button>
          ))}
        </div>
      </fieldset>

      {/* Enemy Count */}
      <fieldset>
        <legend>Enemy Count</legend>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="range"
            min={MIN_ENEMIES}
            max={MAX_ENEMIES}
            value={enemyCount}
            onChange={(e) => handleEnemyCountChange(Number(e.target.value))}
            aria-label="Enemy count"
          />
          <span data-testid="enemy-count-display">{enemyCount}</span>
        </div>
      </fieldset>

      {/* Difficulty */}
      <fieldset>
        <legend>Difficulty</legend>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDifficulty(opt.value)}
              aria-pressed={difficulty === opt.value}
              style={{
                fontWeight: difficulty === opt.value ? 'bold' : 'normal',
                border: difficulty === opt.value ? '2px solid #333' : '1px solid #999',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Color Picker */}
      <fieldset>
        <legend>Tank Color</legend>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {TANK_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setPlayerColor(color)}
              aria-label={`Color ${color}`}
              aria-pressed={playerColor === color}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: color,
                border: playerColor === color ? '3px solid #000' : '1px solid #999',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </fieldset>

      {/* Start Button */}
      <button
        type="button"
        onClick={handleStartBattle}
        style={{ padding: '12px 32px', fontSize: '18px', fontWeight: 'bold' }}
      >
        Start Battle
      </button>
    </div>
  );
}
