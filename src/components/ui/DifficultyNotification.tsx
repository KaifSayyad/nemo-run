import React, { useEffect, useState } from 'react';
import { useGameState } from '../../contexts/GameStateContext';

interface DifficultyNotificationProps {
  // Optional props
}

/**
 * Component that displays a notification when difficulty increases
 */
const DifficultyNotification: React.FC<DifficultyNotificationProps> = () => {
  const { showDifficultyNotification, difficultyName, dismissDifficultyNotification } = useGameState();
  const [animationClass, setAnimationClass] = useState('');
  
  // Handle animation states
  useEffect(() => {
    if (showDifficultyNotification) {
      // Start with enter animation
      setAnimationClass('enter');
      
      // After a delay, start exit animation
      const timer = setTimeout(() => {
        setAnimationClass('exit');
      }, 2000);
      
      return () => clearTimeout(timer);
    } else {
      setAnimationClass('');
    }
  }, [showDifficultyNotification]);
  
  if (!showDifficultyNotification && animationClass !== 'exit') {
    return null;
  }
  
  return (
    <div 
      className={`difficulty-notification ${animationClass}`}
      aria-live="polite"
      role="status"
      onClick={dismissDifficultyNotification}
    >
      <div className="difficulty-icon">
        <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
          <path 
            fill="#ffcc00" 
            d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"
          />
        </svg>
      </div>
      <div className="difficulty-content">
        <h3>Difficulty Increased!</h3>
        <p>New level: <span className="difficulty-level">{difficultyName}</span></p>
      </div>
    </div>
  );
};

export default DifficultyNotification;

