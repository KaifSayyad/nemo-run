import React, { useEffect, useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { useStorage } from '../hooks/useStorage';
import { useSounds } from '../hooks/useSounds';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message?: string;
}

/**
 * Component to test integration of all game systems
 */
const GameIntegrationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const gameState = useGameState();
  const storage = useStorage();
  const sounds = useSounds();
  
  const runTests = async () => {
    setIsRunning(true);
    setIsComplete(false);
    setTestResults([]);
    
    // Reset any previous test state
    try {
      addTestResult('Initializing test environment', 'pending');
      
      // Test game state context
      addTestResult('Testing GameStateContext', 'pending');
      if (gameState && typeof gameState.startGame === 'function') {
        addTestResult('GameStateContext initialized', 'pass');
      } else {
        addTestResult('GameStateContext initialization', 'fail', 'Failed to initialize GameStateContext');
        return;
      }
      
      // Test storage system
      addTestResult('Testing storage system', 'pending');
      if (storage && typeof storage.createProfile === 'function') {
        addTestResult('Storage system initialized', 'pass');
        
        // Test profile creation
        const testProfileName = `test_${Date.now()}`;
        const profileCreated = storage.createProfile(testProfileName);
        
        if (profileCreated) {
          addTestResult('Profile creation', 'pass');
          
          // Clean up test profile
          storage.deleteProfile(testProfileName);
          addTestResult('Profile cleanup', 'pass');
        } else {
          addTestResult('Profile creation', 'fail', 'Failed to create test profile');
        }
      } else {
        addTestResult('Storage system initialization', 'fail', 'Failed to initialize storage system');
      }
      
      // Test sound system
      addTestResult('Testing sound system', 'pending');
      if (sounds && typeof sounds.playMenuSound === 'function') {
        addTestResult('Sound system initialized', 'pass');
        
        // Test getting sound settings
        const soundSettings = sounds.getSoundSettings();
        if (soundSettings && typeof soundSettings.musicVolume === 'number') {
          addTestResult('Sound settings retrieval', 'pass');
        } else {
          addTestResult('Sound settings retrieval', 'fail', 'Failed to get sound settings');
        }
      } else {
        addTestResult('Sound system initialization', 'fail', 'Failed to initialize sound system');
      }
      
      // Test difficulty system
      addTestResult('Testing difficulty system', 'pending');
      if (gameState.gameParameters && typeof gameState.gameParameters.speed === 'number') {
        addTestResult('Difficulty system initialized', 'pass');
        
        // Test difficulty updates with score
        const initialDifficulty = gameState.gameParameters.difficultyLevel;
        gameState.updateDifficulty(200); // Update to a score that should change difficulty
        
        if (gameState.gameParameters.difficultyLevel !== initialDifficulty) {
          addTestResult('Difficulty update with score', 'pass');
        } else {
          addTestResult('Difficulty update with score', 'fail', 'Difficulty level did not change with score update');
        }
      } else {
        addTestResult('Difficulty system initialization', 'fail', 'Failed to initialize difficulty system');
      }
      
      // Test all systems integration
      addTestResult('Testing full integration', 'pending');
      
      // 1. Start a game
      gameState.startGame();
      if (gameState.gameStatus === 'playing') {
        addTestResult('Game start integration', 'pass');
      } else {
        addTestResult('Game start integration', 'fail', 'Failed to start game');
      }
      
      // 2. Update score and verify difficulty changes
      const initialMultiplier = gameState.gameParameters.scoreMultiplier;
      gameState.setScore(50); // This should apply the multiplier internally
      
      // Wait for effects to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (gameState.score > 0) {
        addTestResult('Score update integration', 'pass');
      } else {
        addTestResult('Score update integration', 'fail', 'Failed to update score');
      }
      
      // 3. End game and verify high score updates
      const previousHighScore = gameState.highScore;
      // Set a very high score to ensure it updates the high score
      gameState.setScore(10000);
      gameState.endGame();
      
      // Wait for effects to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (gameState.gameStatus === 'gameOver') {
        addTestResult('Game end integration', 'pass');
        
        if (gameState.highScore > previousHighScore) {
          addTestResult('High score update integration', 'pass');
        } else {
          addTestResult('High score update integration', 'fail', 'High score was not updated after game end');
        }
      } else {
        addTestResult('Game end integration', 'fail', 'Game status did not change to gameOver');
      }
      
      setIsComplete(true);
    } catch (error) {
      addTestResult('Test execution', 'fail', `Test failed with error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };
  
  const addTestResult = (name: string, status: 'pass' | 'fail' | 'pending', message?: string) => {
    setTestResults(prev => [...prev, { name, status, message }]);
  };

  return (
    <div className="integration-test-panel">
      <h2>Game Integration Tests</h2>
      
      <div className="test-controls">
        <button 
          onClick={runTests} 
          disabled={isRunning}
          className="primary-button"
        >
          {isRunning ? 'Running Tests...' : 'Run Integration Tests'}
        </button>
      </div>
      
      <div className="test-results">
        {testResults.length > 0 ? (
          <>
            <h3>Test Results:</h3>
            <ul className="results-list">
              {testResults.map((result, index) => (
                <li key={index} className={`test-result ${result.status}`}>
                  <span className="test-name">{result.name}</span>
                  <span className={`test-status status-${result.status}`}>
                    {result.status.toUpperCase()}
                  </span>
                  {result.message && (
                    <span className="test-message">{result.message}</span>
                  )}
                </li>
              ))}
            </ul>
            {isComplete && (
              <div className="test-summary">
                <p>All tests completed. {testResults.filter(r => r.status === 'pass').length} passed, {testResults.filter(r => r.status === 'fail').length} failed.</p>
              </div>
            )}
          </>
        ) : (
          <p className="no-results">Run tests to see results</p>
        )}
      </div>
    </div>
  );
};

export default GameIntegrationTest;
