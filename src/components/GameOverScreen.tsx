import { useEffect, useRef } from 'react';
import { useGameContext } from '../context/GameContext';
import { useUserContext } from '../context/UserContext';

export default function GameOverScreen(): React.JSX.Element {
  const { gameState, playAgain } = useGameContext();
  const { playerName, stats, updateStats } = useUserContext();
  const statsUpdatedRef = useRef(false);

  const winner = gameState.winner;
  const isPlayerWinner = winner?.isPlayer ?? false;

  // Update stats once on mount
  useEffect(() => {
    if (statsUpdatedRef.current) return;
    statsUpdatedRef.current = true;

    const killCount = gameState.tanks.filter((t) => !t.isPlayer && !t.isAlive).length;
    updateStats(1, isPlayerWinner ? 1 : 0, killCount);
  }, [gameState.tanks, isPlayerWinner, updateStats]);

  return (
    <div className="game-over" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
      <h1>{isPlayerWinner ? 'Victory!' : 'Defeat!'}</h1>
      <h2 data-testid="winner-name">{winner?.name ?? 'Unknown'} wins!</h2>

      {/* Stats */}
      <div data-testid="player-stats" style={{ textAlign: 'center' }}>
        <h3>{playerName}&apos;s Stats</h3>
        <p>Games Played: {stats.gamesPlayed}</p>
        <p>Games Won: {stats.gamesWon}</p>
        <p>Total Kills: {stats.totalKills}</p>
      </div>

      {/* Placeholder for earnings breakdown (Spec 006) */}
      <div data-testid="earnings-placeholder" style={{ opacity: 0.5, fontStyle: 'italic' }}>
        Earnings breakdown coming soon
      </div>

      <button
        type="button"
        onClick={playAgain}
        style={{ padding: '12px 32px', fontSize: '18px', fontWeight: 'bold' }}
      >
        Play Again
      </button>
    </div>
  );
}
