import './App.css';
import { useEffect } from 'react';
import { UserProvider, useUserContext } from './context/UserContext';
import { GameProvider, useGameContext } from './context/GameContext';
import PlayerNameEntry from './components/PlayerNameEntry';
import GameConfigScreen from './components/GameConfigScreen';
import GameOverScreen from './components/GameOverScreen';
import Canvas from './components/Canvas';
import ControlPanel from './components/ControlPanel';

function PhaseRouter(): React.JSX.Element {
  const { gameState } = useGameContext();
  const phase = gameState.phase;

  switch (phase) {
    case 'nameEntry':
      return <PlayerNameEntry />;
    case 'config':
      return <GameConfigScreen />;
    case 'shop':
      return <ShopPlaceholder />;
    case 'playing':
      return <BattleView />;
    case 'gameOver':
      return <GameOverScreen />;
  }
}

function ShopPlaceholder(): React.JSX.Element {
  const { setPhase } = useGameContext();

  // Auto-advance shop to playing (placeholder until Spec 006)
  useEffect(() => {
    setPhase('playing');
  }, [setPhase]);

  return <div>Loading...</div>;
}

function BattleView(): React.JSX.Element {
  const { gameState } = useGameContext();
  const { terrain, tanks, projectiles, explosions } = gameState;

  if (!terrain) {
    return <div>Loading battle...</div>;
  }

  const playerTank = tanks.find((t) => t.isPlayer);

  return (
    <div className="battle-view">
      <Canvas
        terrain={terrain}
        tanks={tanks}
        projectiles={projectiles}
        explosions={explosions}
        currentTankId={playerTank?.id ?? null}
      />
      <ControlPanel />
    </div>
  );
}

function AppContent(): React.JSX.Element {
  const { hasProfile } = useUserContext();

  return (
    <GameProvider initialPhase={hasProfile ? 'config' : 'nameEntry'}>
      <div className="app">
        <PhaseRouter />
      </div>
    </GameProvider>
  );
}

function App(): React.JSX.Element {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
