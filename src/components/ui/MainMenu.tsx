import React from 'react';
import { useGameState } from '../../contexts/GameStateContext';
import { useSounds } from '../../hooks/useSounds';

interface MainMenuProps {
  // We can add any additional props if needed
}

const MainMenu: React.FC<MainMenuProps> = () => {
  const {
    startGame,
    toggleInstructions,
    addProfile,
    selectProfile,
    profiles,
    currentProfile,
    showInstructions,
    isDev
  } = useGameState();

  const handleAddProfile = () => {
    const name = prompt('Enter your name:');
    if (name) addProfile(name);
  };

  return (
    <div className="start-screen">
      <h1>Nemo Run</h1>
      
      {currentProfile && (
        <div className="profile-info">
          <p>Player: {currentProfile.name}</p>
          <p>High Score: {currentProfile.highScore}</p>
        </div>
      )}
      
      <button 
        className="start-button"
        onClick={startGame}
      >
        Start Game
      </button>
      
      <div className="menu-buttons">
        <button 
          className="menu-button"
          onClick={toggleInstructions}
        >
          {showInstructions ? 'Hide Instructions' : 'How to Play'}
        </button>
        
        <button 
          className="menu-button"
          onClick={handleAddProfile}
          disabled={profiles.length >= 5} // Using the constant value directly
        >
          New Profile
        </button>
      </div>
      
      {/* Profiles List */}
      {profiles.length > 0 && (
        <div className="profiles-list">
          <h3>Select Profile</h3>
          <div className="profiles">
            {profiles.map(profile => (
              <div 
                key={profile.name}
                className={`profile ${currentProfile?.name === profile.name ? 'active' : ''}`}
                onClick={() => selectProfile(profile)}
              >
                <div>{profile.name}</div>
                <div>High: {profile.highScore}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Instructions */}
      {showInstructions && (
        <div className="instructions">
          <h3>How to Play</h3>
          <ul>
            <li>Use <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> to move Nemo</li>
            <li>Hold <kbd>Shift</kbd> to swim faster</li>
            <li>Avoid obstacles to survive</li>
            <li>Press <kbd>Space</kbd> to pause/resume</li>
            <li>Press <kbd>Esc</kbd> to return to menu</li>
          </ul>
        </div>
      )}
      
      {isDev && (
        <div className="dev-info">
          <p>Development Mode Active</p>
          <p>Press <kbd>`</kbd> to toggle dev controls</p>
        </div>
      )}
    </div>
  );
};

export default MainMenu;

