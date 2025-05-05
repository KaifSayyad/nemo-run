import React from 'react';
import { useGameState } from '../../contexts/GameStateContext';
import MainMenu from './MainMenu';
import HUD from './HUD';
import PauseScreen from './PauseScreen';
import GameOver from './GameOver';

interface GameUIProps {
  // We can add any additional props if needed
}

const GameUI: React.FC<GameUIProps> = () => {
  const { gameStatus } = useGameState();

  return (
    <div 
      className="game-ui"
      role="application"
      aria-label="Nemo Run Game Interface"
    >
      {/* Conditionally render UI components based on game status */}
      {gameStatus === 'menu' && <MainMenu />}
      {gameStatus === 'playing' && <HUD />}
      {gameStatus === 'paused' && <PauseScreen />}
      {gameStatus === 'gameOver' && <GameOver />}
    </div>
  );
};

export default GameUI;

