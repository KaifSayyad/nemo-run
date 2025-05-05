import { useEffect, useCallback, useState, useRef } from 'react';
import soundManager, { SOUNDS, SoundCategory } from '../utils/soundManager';
import { useGameState } from '../contexts/GameStateContext';

// Score milestone intervals for triggering achievement sounds
const SCORE_MILESTONES = [50, 100, 200, 500, 1000];

/**
 * Custom hook for game sound effects and music
 */
export const useSounds = () => {
  const { gameStatus, score, highScore, currentProfile } = useGameState();
  const [previousGameStatus, setPreviousGameStatus] = useState(gameStatus);
  const [previousScore, setPreviousScore] = useState(score);
  const [isInitialized, setIsInitialized] = useState(false);
  const [swimSoundActive, setSwimSoundActive] = useState(false);
  const swimSoundRef = useRef<AudioBufferSourceNode | null>(null);
  
  // Initialize sound system
  useEffect(() => {
    const initSounds = async () => {
      await soundManager.initialize();
      setIsInitialized(true);
    };
    
    initSounds();
    
    // Cleanup on unmount
    return () => {
      soundManager.stopMusic();
      if (swimSoundRef.current) {
        try {
          swimSoundRef.current.stop();
        } catch (e) {
          // Sound might already be stopped
        }
        swimSoundRef.current = null;
      }
    };
  }, []);
  
  // Play background music based on game state
  useEffect(() => {
    if (!isInitialized) return;
    
    if (gameStatus === 'playing' || gameStatus === 'paused') {
      soundManager.playMusic(SOUNDS.BACKGROUND);
    } else if (gameStatus === 'menu') {
      // If we want different music for the menu, we could play it here
      // For now, we'll use the same underwater ambient sound
      soundManager.playMusic(SOUNDS.BACKGROUND);
    } else if (gameStatus === 'gameOver') {
      // Optionally fade out music or change to game over music
      soundManager.stopMusic(true);
    }
  }, [gameStatus, isInitialized]);
  
  // Handle game state transitions
  useEffect(() => {
    if (!isInitialized || gameStatus === previousGameStatus) return;
    
    // Play appropriate sound effects for state transitions
    switch (gameStatus) {
      case 'playing':
        if (previousGameStatus === 'menu' || previousGameStatus === 'gameOver') {
          soundManager.playSfx(SOUNDS.GAME_START);
        } else if (previousGameStatus === 'paused') {
          soundManager.playSfx(SOUNDS.MENU_CLICK);
        }
        break;
        
      case 'paused':
        soundManager.playSfx(SOUNDS.PAUSE);
        break;
        
      case 'gameOver':
        soundManager.playSfx(SOUNDS.GAME_OVER);
        
        // Check if player got a new high score
        if (score > 0 && score === highScore) {
          // Delay the high score sound slightly for dramatic effect
          setTimeout(() => {
            soundManager.playSfx(SOUNDS.NEW_HIGHSCORE);
          }, 1000);
        }
        break;
        
      case 'menu':
        if (previousGameStatus === 'gameOver' || previousGameStatus === 'paused') {
          soundManager.playSfx(SOUNDS.MENU_BACK);
        }
        break;
    }
    
    setPreviousGameStatus(gameStatus);
  }, [gameStatus, previousGameStatus, isInitialized, score, highScore]);
  
  // Handle score changes and milestones
  useEffect(() => {
    if (!isInitialized || score === previousScore || gameStatus !== 'playing') return;
    
    // Check if player reached a milestone
    for (const milestone of SCORE_MILESTONES) {
      if (previousScore < milestone && score >= milestone) {
        soundManager.playSfx(SOUNDS.SCORE_MILESTONE, { volume: 0.7 });
        break;
      }
    }
    
    setPreviousScore(score);
  }, [score, previousScore, isInitialized, gameStatus]);
  
  // Start or stop swimming sound based on game state
  useEffect(() => {
    if (!isInitialized) return;
    
    if (gameStatus === 'playing' && !swimSoundActive) {
      // Start swimming sound (looping)
      const source = soundManager.playSfx(SOUNDS.SWIM_NORMAL, { 
        loop: true, 
        volume: 0.3 
      });
      
      if (source) {
        swimSoundRef.current = source;
        setSwimSoundActive(true);
      }
    } else if (gameStatus !== 'playing' && swimSoundActive) {
      // Stop swimming sound
      if (swimSoundRef.current) {
        try {
          swimSoundRef.current.stop();
        } catch (e) {
          // Sound might already be stopped
        }
        swimSoundRef.current = null;
        setSwimSoundActive(false);
      }
    }
  }, [gameStatus, isInitialized, swimSoundActive]);
  
  // Callback for playing menu UI sounds
  const playMenuSound = useCallback((type: 'click' | 'hover' | 'back' = 'click') => {
    if (!isInitialized) return;
    
    switch (type) {
      case 'click':
        soundManager.playSfx(SOUNDS.MENU_CLICK, { volume: 0.6 });
        break;
      case 'hover':
        soundManager.playSfx(SOUNDS.MENU_HOVER, { volume: 0.3 });
        break;
      case 'back':
        soundManager.playSfx(SOUNDS.MENU_BACK, { volume: 0.6 });
        break;
    }
  }, [isInitialized]);
  
  // Callback for playing collision sound
  const playCollisionSound = useCallback(() => {
    if (!isInitialized) return;
    soundManager.playSfx(SOUNDS.COLLISION, { volume: 0.8 });
  }, [isInitialized]);
  
  // Callback for playing fast swimming sound (for when Shift is pressed)
  const playFastSwimSound = useCallback(() => {
    if (!isInitialized || gameStatus !== 'playing') return;
    
    // Replace the normal swim sound with the fast one
    if (swimSoundRef.current) {
      try {
        swimSoundRef.current.stop();
      } catch (e) {
        // Sound might already be stopped
      }
      swimSoundRef.current = null;
    }
    
    const source = soundManager.playSfx(SOUNDS.SWIM_FAST, { 
      loop: true, 
      volume: 0.5,
      rate: 1.2
    });
    
    if (source) {
      swimSoundRef.current = source;
      setSwimSoundActive(true);
    }
  }, [isInitialized, gameStatus]);
  
  // Callback for reverting back to normal swim sound
  const playNormalSwimSound = useCallback(() => {
    if (!isInitialized || gameStatus !== 'playing') return;
    
    // Replace the fast swim sound with the normal one
    if (swimSoundRef.current) {
      try {
        swimSoundRef.current.stop();
      } catch (e) {
        // Sound might already be stopped
      }
      swimSoundRef.current = null;
    }
    
    const source = soundManager.playSfx(SOUNDS.SWIM_NORMAL, { 
      loop: true, 
      volume: 0.3 
    });
    
    if (source) {
      swimSoundRef.current = source;
      setSwimSoundActive(true);
    }
  }, [isInitialized, gameStatus]);
  
  // Volume control functions
  const setMusicVolume = useCallback((volume: number) => {
    soundManager.setVolume(SoundCategory.MUSIC, volume);
  }, []);
  
  const setSfxVolume = useCallback((volume: number) => {
    soundManager.setVolume(SoundCategory.SFX, volume);
  }, []);
  
  const toggleMusicMute = useCallback(() => {
    return soundManager.toggleMute(SoundCategory.MUSIC);
  }, []);
  
  const toggleSfxMute = useCallback(() => {
    return soundManager.toggleMute(SoundCategory.SFX);
  }, []);
  
  // Get current sound settings
  const getSoundSettings = useCallback(() => {
    return {
      musicVolume: soundManager.getVolume(SoundCategory.MUSIC),
      sfxVolume: soundManager.getVolume(SoundCategory.SFX),
      isMusicMuted: soundManager.isMuted(SoundCategory.MUSIC),
      isSfxMuted: soundManager.isMuted(SoundCategory.SFX)
    };
  }, []);
  
  return {
    // Sound playback functions
    playMenuSound,
    playCollisionSound,
    playFastSwimSound,
    playNormalSwimSound,
    
    // Volume control
    setMusicVolume,
    setSfxVolume,
    toggleMusicMute,
    toggleSfxMute,
    getSoundSettings,
    
    // System state
    isInitialized
  };
};

