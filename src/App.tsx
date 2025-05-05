import { useState, useEffect, useCallback } from 'react';
import './App.css';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/ui/GameUI';
import { GameStateProvider, useGameState } from './contexts/GameStateContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import DevTools from './components/DevTools';
import GameIntegrationTest from './components/GameIntegrationTest';
import soundManager from './utils/soundManager';

// Game component that uses the GameStateContext
const Game = () => {
  const { isPlaying, score, setScore, handleCollision, isDev } = useGameState();
  const [showDevTools, setShowDevTools] = useState(false);
  const [showTests, setShowTests] = useState(false);

  // Toggle dev tools with F12 key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 for dev tools
      if (e.key === 'F12' && import.meta.env.DEV) {
        e.preventDefault();
        setShowDevTools(prev => !prev);
      }
      
      // Ctrl+Shift+T for tests
      if (e.ctrlKey && e.shiftKey && e.key === 'T' && import.meta.env.DEV) {
        e.preventDefault();
        setShowTests(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="game-container">
      {/* Main game canvas */}
      <GameCanvas 
        showStats={isDev} 
        enableControls={isDev}
        isPlaying={isPlaying}
        score={score}
        setScore={setScore}
        onCollision={handleCollision}
      />

      {/* Game UI overlay */}
      <GameUI />
      
      {/* Dev tools (only in development mode) */}
      {import.meta.env.DEV && (
        <>
          <DevTools isVisible={showDevTools} />
          {showDevTools && (
            <div className="dev-tools-info">
              <p>Dev Tools Active - Press F12 to toggle</p>
            </div>
          )}
          
          {showTests && <GameIntegrationTest />}
        </>
      )}
    </div>
  );
};

// App wrapper component that handles loading
const AppWrapper = () => {
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [error, setError] = useState<Error | null>(null);
  
  // Initialize essential game systems
  const initializeGame = useCallback(async () => {
    try {
      // Start loading sound assets
      setLoadingMessage('Loading sounds...');
      await soundManager.initialize();
      setLoadingProgress(50);
      
      // Simulate loading of other assets (in a real scenario, load models, textures, etc.)
      setLoadingMessage('Loading game assets...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading time
      setLoadingProgress(75);
      
      // Final initialization steps
      setLoadingMessage('Preparing game...');
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate final preparations
      setLoadingProgress(100);
      
      // All done!
      setLoading(false);
    } catch (err) {
      console.error('Failed to initialize game:', err);
      setError(err instanceof Error ? err : new Error('Unknown error during initialization'));
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);
  
  // Custom error fallback component
  const ErrorFallback = (
    <div className="error-screen">
      <h2>Game Initialization Failed</h2>
      <p>We couldn't start the game properly. Please refresh the page to try again.</p>
      {error && import.meta.env.DEV && (
        <div className="error-details">
          <h3>Error Details (Development Only):</h3>
          <pre>{error.toString()}</pre>
        </div>
      )}
      <button 
        className="restart-button"
        onClick={() => window.location.reload()}
      >
        Restart Game
      </button>
    </div>
  );
  
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <LoadingScreen 
        isLoading={loading} 
        progress={loadingProgress}
        message={loadingMessage}
      >
        <Game />
      </LoadingScreen>
    </ErrorBoundary>
  );
};

// Main App component that provides the GameStateContext
function App() {
  return (
    <ErrorBoundary>
      <GameStateProvider>
        <AppWrapper />
      </GameStateProvider>
    </ErrorBoundary>
  );
}

export default App;
