import { useState } from 'react';
import { useUserContext } from '../context/UserContext';
import { useGameContext } from '../context/GameContext';

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 20;

export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= MIN_NAME_LENGTH && trimmed.length <= MAX_NAME_LENGTH;
}

export default function PlayerNameEntry(): React.JSX.Element {
  const [name, setName] = useState('');
  const { setPlayerName } = useUserContext();
  const { goToConfig } = useGameContext();

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!isValidName(name)) return;
    setPlayerName(name.trim());
    goToConfig();
  }

  return (
    <div className="name-entry" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <h1>Tank Battle</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <label htmlFor="player-name">Enter your name</label>
        <input
          id="player-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Commander..."
          autoFocus
        />
        <button type="submit" disabled={!isValidName(name)}>
          Start
        </button>
      </form>
    </div>
  );
}
