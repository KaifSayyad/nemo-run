import React from 'react';
import { useGameState } from '../../contexts/GameStateContext';

interface GameOverProps {
  // We can add any additional props if needed
}

const GameOver: React.FC<GameOverProps> = () => {
  const { score, highScore, startGame, goToMainMenu } = useGameState();

  return (
    <div className="game-over-screen">
      <h2>Game Over</h2>
      
      <div className="final-score">
        <p>Score: {score}</p>
        <p>High Score: {highScore}</p>
        {score === highScore && score > 0 && (
          <div className="new-high-score">New High Score!</div>
        )}
      </div>
      
      <div className="game-over-buttons">
        <button 
          className="menu-button"
          onClick={startGame}
        >
          Play Again
        </button>
        
        <button 
          className="menu-button"
          onClick={goToMainMenu}
        >
          Main Menu
        </button>
      </div>
    </div>
  );
};

export default GameOver;

