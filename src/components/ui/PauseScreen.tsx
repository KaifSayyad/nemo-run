import React from 'react';
import { useGameState } from '../../contexts/GameStateContext';

interface PauseScreenProps {
  // We can add any additional props if needed
}

const PauseScreen: React.FC<PauseScreenProps> = () => {
  const { score, togglePause, goToMainMenu } = useGameState();

  return (
    <div className="pause-screen">
      <h2>Game Paused</h2>
      <div className="score-display">Score: {score}</div>
      
      <div className="pause-buttons">
        <button 
          className="menu-button"
          onClick={togglePause}
        >
          Resume
        </button>
        
        <button 
          className="menu-button"
          onClick={goToMainMenu}
        >
          Main Menu
        </button>
      </div>
      
      <div className="controls-reminder">
        <p>Press <kbd>Space</kbd> to resume</p>
        <p>Press <kbd>Esc</kbd> to quit</p>
      </div>
    </div>
  );
};

export default PauseScreen;

