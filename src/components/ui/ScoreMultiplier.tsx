import React, { useEffect, useState } from 'react';
import { useGameState } from '../../contexts/GameStateContext';

interface ScoreMultiplierProps {
  // Optional props
}

/**
 * Component that displays the current score multiplier
 */
const ScoreMultiplier: React.FC<ScoreMultiplierProps> = () => {
  const { gameParameters, isPlaying } = useGameState();
  const [showAnimation, setShowAnimation] = useState(false);
  const [prevMultiplier, setPrevMultiplier] = useState(1);
  
  // Show animation when multiplier changes
  useEffect(() => {
    if (!isPlaying) return;
    
    // Check if multiplier changed
    if (gameParameters.scoreMultiplier !== prevMultiplier) {
      setPrevMultiplier(gameParameters.scoreMultiplier);
      setShowAnimation(true);
      
      // Hide animation after a delay
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [gameParameters.scoreMultiplier, isPlaying, prevMultiplier]);
  
  if (!isPlaying) {
    return null;
  }
  
  const multiplierValue = gameParameters.scoreMultiplier.toFixed(1);
  const multiplierClass = showAnimation ? 'multiplier-changed' : '';
  
  return (
    <div 
      className={`score-multiplier ${multiplierClass}`}
      aria-live="polite"
    >
      <span className="multiplier-value">×{multiplierValue}</span>
    </div>
  );
};

export default ScoreMultiplier;

