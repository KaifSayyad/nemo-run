import React, { useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { useStorage } from '../hooks/useStorage';
import { useSounds } from '../hooks/useSounds';

interface DevToolsProps {
  isVisible: boolean;
}

/**
 * DevTools component for debugging the game
 */
const DevTools: React.FC<DevToolsProps> = ({ isVisible }) => {
  const { 
    gameStatus, 
    score, 
    highScore, 
    currentProfile, 
    gameParameters,
    difficultyName,
    setScore,
    isDev
  } = useGameState();
  
  const { 
    resetStorage, 
    exportData, 
    importData 
  } = useStorage();
  
  const {
    playMenuSound,
    playCollisionSound,
    getSoundSettings
  } = useSounds();
  
  const [exportedData, setExportedData] = useState('');
  const [importDataText, setImportDataText] = useState('');
  
  // Only render in dev mode and when visible
  if (!isDev || !isVisible) {
    return null;
  }

  const handleExport = () => {
    const data = exportData();
    setExportedData(data);
  };

  const handleImport = () => {
    if (importDataText) {
      try {
        const success = importData(importDataText);
        if (success) {
          alert('Data imported successfully!');
        } else {
          alert('Failed to import data. Invalid format.');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing data: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const handleResetStorage = () => {
    if (confirm('Are you sure you want to reset all game data? This cannot be undone.')) {
      resetStorage();
      alert('Storage has been reset to defaults.');
    }
  };

  const handleAddScore = (amount: number) => {
    setScore(amount);
  };

  const handleTestSound = (sound: string) => {
    switch (sound) {
      case 'menu':
        playMenuSound('click');
        break;
      case 'collision':
        playCollisionSound();
        break;
    }
  };

  return (
    <div className="dev-tools-panel">
      <h2>Developer Tools</h2>
      
      <div className="dev-section">
        <h3>Game State</h3>
        <table className="dev-table">
          <tbody>
            <tr>
              <td>Game Status:</td>
              <td>{gameStatus}</td>
            </tr>
            <tr>
              <td>Score:</td>
              <td>{score}</td>
            </tr>
            <tr>
              <td>High Score:</td>
              <td>{highScore}</td>
            </tr>
            <tr>
              <td>Current Profile:</td>
              <td>{currentProfile?.name || 'None'}</td>
            </tr>
            <tr>
              <td>Difficulty:</td>
              <td>{difficultyName} (Level {gameParameters.difficultyLevel})</td>
            </tr>
            <tr>
              <td>Speed:</td>
              <td>{gameParameters.speed.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Spawn Rate:</td>
              <td>{gameParameters.spawnRate.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Score Multiplier:</td>
              <td>{gameParameters.scoreMultiplier.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="dev-section">
        <h3>Actions</h3>
        <div className="dev-actions">
          <button onClick={() => handleAddScore(10)}>+10 Score</button>
          <button onClick={() => handleAddScore(50)}>+50 Score</button>
          <button onClick={() => handleAddScore(100)}>+100 Score</button>
          <button onClick={() => handleTestSound('menu')}>Test Menu Sound</button>
          <button onClick={() => handleTestSound('collision')}>Test Collision</button>
        </div>
      </div>
      
      <div className="dev-section">
        <h3>Data Management</h3>
        <div className="dev-actions">
          <button onClick={handleExport}>Export Game Data</button>
          <button onClick={handleResetStorage} className="danger-button">
            Reset Storage
          </button>
        </div>
        
        {exportedData && (
          <div className="export-data">
            <h4>Exported Data:</h4>
            <textarea
              readOnly
              value={exportedData}
              rows={5}
              onClick={e => (e.target as HTMLTextAreaElement).select()}
            />
          </div>
        )}
        
        <div className="import-data">
          <h4>Import Data:</h4>
          <textarea
            value={importDataText}
            onChange={e => setImportDataText(e.target.value)}
            rows={5}
            placeholder="Paste exported game data here"
          />
          <button 
            onClick={handleImport}
            disabled={!importDataText}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevTools;

