import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  ReactNode,
  useRef 
} from 'react';
import { UI_SETTINGS, GAME_SETTINGS } from '../utils/constants';
import soundManager from '../utils/soundManager';
import DifficultyManager, { GameParameters } from '../utils/difficultyManager';
import { useStorage } from '../hooks/useStorage';

// Game status types
export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameOver';

// User profile interface
export interface UserProfile {
  name: string;
  highScore: number;
  lastPlayed: string;
}

// Game state interface
interface GameState {
  gameStatus: GameStatus;
  score: number;
  highScore: number;
  isPlaying: boolean; // Derived state
  currentProfile: UserProfile | null;
  profiles: UserProfile[];
  showInstructions: boolean;
  isDev: boolean;
  // Difficulty-related state
  gameParameters: GameParameters;
  showDifficultyNotification: boolean;
  difficultyName: string;
}

// Game actions interface
interface GameActions {
  setScore: (score: number) => void;
  startGame: () => void;
  endGame: () => void;
  togglePause: () => void;
  goToMainMenu: () => void;
  toggleInstructions: () => void;
  toggleDevMode: () => void;
  addProfile: (name: string) => void;
  selectProfile: (profile: UserProfile) => void;
  handleCollision: () => void;
  // Difficulty-related actions
  updateDifficulty: (score: number) => void;
  dismissDifficultyNotification: () => void;
}

// Create the context with initial empty values
const GameStateContext = createContext<GameState & GameActions>({} as GameState & GameActions);

// Provider props interface
interface GameStateProviderProps {
  children: ReactNode;
}

// GameStateProvider component
export const GameStateProvider = ({ children }: GameStateProviderProps) => {
  // Game state
  const [gameStatus, setGameStatus] = useState<GameStatus>('menu');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [isDev, setIsDev] = useState<boolean>(false);
  
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [gameParameters, setGameParameters] = useState<GameParameters>(
    DifficultyManager.calculateGameParameters(0)
  );
  const [showDifficultyNotification, setShowDifficultyNotification] = useState<boolean>(false);
  const [difficultyName, setDifficultyName] = useState<string>(
    DifficultyManager.getDifficultyName(0)
  );
  
  // Store the previous score for difficulty transitions
  const previousScoreRef = useRef<number>(0);
  
  // Derived state
  const isPlaying = gameStatus === 'playing';

  // Load high score and profiles from localStorage
  useEffect(() => {
    const storedHighScore = localStorage.getItem(UI_SETTINGS.HIGH_SCORE_KEY);
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore, 10));
    }
    
    const storedProfiles = localStorage.getItem(UI_SETTINGS.PROFILES_KEY);
    if (storedProfiles) {
      try {
        const parsedProfiles = JSON.parse(storedProfiles) as UserProfile[];
        setProfiles(parsedProfiles.slice(0, GAME_SETTINGS.MAX_PROFILES));
        
        // Set current profile to the last used one if available
        if (parsedProfiles.length > 0) {
          setCurrentProfile(parsedProfiles[0]);
        }
      } catch (error) {
        console.error('Failed to parse profiles:', error);
      }
    }
  }, []);

  // Save high score when it changes
  useEffect(() => {
    if (highScore > 0) {
      localStorage.setItem(UI_SETTINGS.HIGH_SCORE_KEY, highScore.toString());
      
      // Update profile high score if logged in
      if (currentProfile && score > currentProfile.highScore) {
        const updatedProfile = {
          ...currentProfile,
          highScore: score,
          lastPlayed: new Date().toISOString()
        };
        
        setCurrentProfile(updatedProfile);
        
        // Update profiles array
        const updatedProfiles = profiles.map(profile => 
          profile.name === currentProfile.name ? updatedProfile : profile
        );
        
        setProfiles(updatedProfiles);
        localStorage.setItem(UI_SETTINGS.PROFILES_KEY, JSON.stringify(updatedProfiles));
      }
    }
  }, [highScore, currentProfile, profiles, score]);

  // Handle collision
  const handleCollision = useCallback(() => {
    // End the game
    setGameStatus('gameOver');
    
    // Update high score if needed
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score, highScore]);

  // Update difficulty based on score
  const updateDifficulty = useCallback((newScore: number) => {
    const params = DifficultyManager.calculateGameParameters(newScore);
    setGameParameters(params);
    
    // Check if we crossed a difficulty threshold
    if (DifficultyManager.isNewDifficultyLevel(previousScoreRef.current, newScore)) {
      // Update difficulty name
      setDifficultyName(DifficultyManager.getDifficultyName(params.difficultyLevel));
      
      // Show notification
      setShowDifficultyNotification(true);
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setShowDifficultyNotification(false);
      }, 3000);
    }
    
    // Update previous score reference
    previousScoreRef.current = newScore;
  }, []);
  
  // Dismiss difficulty notification
  const dismissDifficultyNotification = useCallback(() => {
    setShowDifficultyNotification(false);
  }, []);

  // Start a new game
  const startGame = useCallback(() => {
    setScore(0);
    previousScoreRef.current = 0;
    updateDifficulty(0);
    setGameStatus('playing');
  }, [updateDifficulty]);

  // End game
  const endGame = useCallback(() => {
    setGameStatus('gameOver');
    
    // Update high score if needed
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score, highScore]);

  // Pause/resume game
  const togglePause = useCallback(() => {
    setGameStatus(prev => prev === 'playing' ? 'paused' : 'playing');
  }, []);

  // Return to main menu
  const goToMainMenu = useCallback(() => {
    setGameStatus('menu');
  }, []);

  // Handle instructions toggle
  const toggleInstructions = useCallback(() => {
    setShowInstructions(prev => !prev);
  }, []);

  // Toggle dev mode
  const toggleDevMode = useCallback(() => {
    if (import.meta.env.DEV) {
      setIsDev(prev => !prev);
    }
  }, []);

  // Add a new user profile
  const addProfile = useCallback((name: string) => {
    if (profiles.length >= GAME_SETTINGS.MAX_PROFILES) {
      alert(`Maximum ${GAME_SETTINGS.MAX_PROFILES} profiles allowed.`);
      return;
    }
    
    const newProfile: UserProfile = {
      name,
      highScore: 0,
      lastPlayed: new Date().toISOString()
    };
    
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    setCurrentProfile(newProfile);
    localStorage.setItem(UI_SETTINGS.PROFILES_KEY, JSON.stringify(updatedProfiles));
  }, [profiles]);

  // Select an existing profile
  const selectProfile = useCallback((profile: UserProfile) => {
    setCurrentProfile(profile);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle dev controls with ~ key
      if (e.key === '`' && import.meta.env.DEV) {
        toggleDevMode();
      }

      // Space to start/pause game
      if (e.code === 'Space') {
        if (gameStatus === 'menu') {
          startGame();
        } else if (gameStatus === 'playing' || gameStatus === 'paused') {
          togglePause();
        } else if (gameStatus === 'gameOver') {
          goToMainMenu();
        }
      }
      
      // ESC to pause or return to menu
      if (e.code === 'Escape') {
        if (gameStatus === 'playing') {
          togglePause();
        } else if (gameStatus === 'paused' || gameStatus === 'gameOver') {
          goToMainMenu();
        }
      }
      
      // 'I' to toggle instructions
      if (e.code === 'KeyI') {
        toggleInstructions();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, startGame, togglePause, goToMainMenu, toggleInstructions, toggleDevMode]);

  // Update difficulty when score changes
  useEffect(() => {
    if (isPlaying) {
      updateDifficulty(score);
    }
  }, [score, isPlaying, updateDifficulty]);

  // Custom score setter that applies difficulty multiplier
  const setScoreWithMultiplier = useCallback((baseScoreIncrease: number) => {
    if (isPlaying) {
      // Apply the score multiplier from current difficulty
      const multipliedIncrease = baseScoreIncrease * gameParameters.scoreMultiplier;
      setScore(current => current + Math.round(multipliedIncrease));
    }
  }, [isPlaying, gameParameters.scoreMultiplier]);

  // Combine state and actions
  const value = {
    // State
    gameStatus,
    score,
    highScore,
    isPlaying,
    currentProfile,
    profiles,
    showInstructions,
    isDev,
    gameParameters,
    showDifficultyNotification,
    difficultyName,
    
    // Actions
    setScore: setScoreWithMultiplier,
    startGame,
    endGame,
    togglePause,
    goToMainMenu,
    toggleInstructions,
    toggleDevMode,
    addProfile,
    selectProfile,
    handleCollision,
    updateDifficulty,
    dismissDifficultyNotification
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
};

// Custom hook for using the game state
export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};

// Storage utility functions
export const storage = {
  // Get high score from local storage
  getHighScore: (): number => {
    const storedHighScore = localStorage.getItem(UI_SETTINGS.HIGH_SCORE_KEY);
    return storedHighScore ? parseInt(storedHighScore, 10) : 0;
  },
  
  // Set high score in local storage
  setHighScore: (score: number): void => {
    localStorage.setItem(UI_SETTINGS.HIGH_SCORE_KEY, score.toString());
  },
  
  // Get profiles from local storage
  getProfiles: (): UserProfile[] => {
    const storedProfiles = localStorage.getItem(UI_SETTINGS.PROFILES_KEY);
    if (storedProfiles) {
      try {
        return JSON.parse(storedProfiles) as UserProfile[];
      } catch (error) {
        console.error('Failed to parse profiles:', error);
      }
    }
    return [];
  },
  
  // Set profiles in local storage
  setProfiles: (profiles: UserProfile[]): void => {
    localStorage.setItem(UI_SETTINGS.PROFILES_KEY, JSON.stringify(profiles));
  }
};

