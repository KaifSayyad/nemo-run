import React from 'react';
import { useGameState } from '../../contexts/GameStateContext';
import DifficultyNotification from './DifficultyNotification';
import ScoreMultiplier from './ScoreMultiplier';

interface HUDProps {
  // We can add any additional props if needed
}

const HUD: React.FC<HUDProps> = () => {
  const { 
    score, 
    highScore, 
    currentProfile, 
    gameParameters, 
    difficultyName 
  } = useGameState();

  // Format numbers with commas
  const formattedScore = score.toLocaleString();
  const formattedHighScore = highScore.toLocaleString();
  
  // Calculate progress to next milestone
  const nextMilestone = gameParameters.nextMilestone;
  const progressToNext = nextMilestone ? 
    Math.min(100, Math.floor((score / nextMilestone) * 100)) : 100;

  return (
    <div className="game-hud">
      <div className="hud-top">
        <div className="score" aria-live="polite">
          <span className="score-label">Score:</span> {formattedScore}
        </div>
        <div className="high-score">
          <span className="score-label">High Score:</span> {formattedHighScore}
        </div>
        {currentProfile && (
          <div className="profile-display">
            <span className="profile-label">Player:</span> {currentProfile.name}
          </div>
        )}
      </div>
      
      <div className="hud-center">
        <DifficultyNotification />
      </div>
      
      <div className="hud-bottom">
        <div className="difficulty-info">
          <div className="difficulty-name">{difficultyName}</div>
          {nextMilestone && (
            <div className="next-milestone">
              <div className="milestone-label">Next Level:</div>
              <div className="milestone-progress-container">
                <div 
                  className="milestone-progress" 
                  style={{ width: `${progressToNext}%` }}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressToNext}
                  role="progressbar"
                  aria-label="Progress to next difficulty level"
                />
              </div>
              <div className="milestone-value">{nextMilestone.toLocaleString()}</div>
            </div>
          )}
        </div>
        <ScoreMultiplier />
      </div>
    </div>
  );
};

export default HUD;

