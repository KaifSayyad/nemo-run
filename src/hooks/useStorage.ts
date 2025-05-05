import { useCallback, useEffect, useState } from 'react';
import{
  StorageManager, 
  UserProfile, 
  GamePreferences, 
  DEFAULT_PREFERENCES 
} from '../utils/storageManager';

/**
 * Custom hook for accessing and managing game storage
 */
export const useStorage = () => {
  const [storageManager] = useState(() => StorageManager.getInstance());
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [highScore, setHighScore] = useState(0);
  const [preferences, setPreferences] = useState<GamePreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Load initial data from storage
  useEffect(() => {
    const loadData = () => {
      try {
        // Load profiles
        const loadedProfiles = storageManager.getProfiles();
        setProfiles(loadedProfiles);
        
        // Load current profile
        const loadedCurrentProfile = storageManager.getCurrentProfile();
        setCurrentProfile(loadedCurrentProfile);
        
        // Load high score
        const loadedHighScore = storageManager.getHighScore();
        setHighScore(loadedHighScore);
        
        // Load preferences
        const loadedPreferences = storageManager.getPreferences();
        setPreferences(loadedPreferences);
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load storage data:', error);
        setIsLoaded(true); // Set loaded even if there was an error
      }
    };
    
    loadData();
  }, [storageManager]);
  
  // Create a new profile
  const createProfile = useCallback((name: string) => {
    const newProfile = storageManager.createProfile(name);
    if (newProfile) {
      setProfiles(prev => [...prev, newProfile]);
      setCurrentProfile(newProfile);
      return true;
    }
    return false;
  }, [storageManager]);
  
  // Delete a profile
  const deleteProfile = useCallback((name: string) => {
    const result = storageManager.deleteProfile(name);
    if (result) {
      setProfiles(prev => prev.filter(p => p.name !== name));
      // Update current profile if it was deleted
      if (currentProfile?.name === name) {
        const newCurrentProfile = storageManager.getCurrentProfile();
        setCurrentProfile(newCurrentProfile);
      }
      return true;
    }
    return false;
  }, [storageManager, currentProfile]);
  
  // Select a profile
  const selectProfile = useCallback((name: string) => {
    const profile = storageManager.getProfileByName(name);
    if (profile) {
      storageManager.saveCurrentProfileName(name);
      setCurrentProfile(profile);
      return true;
    }
    return false;
  }, [storageManager]);
  
  // Update high score
  const updateHighScore = useCallback((score: number) => {
    const wasUpdated = storageManager.updateHighScore(score);
    if (wasUpdated) {
      setHighScore(score);
    }
    
    // Also update profile high score if applicable
    if (currentProfile) {
      const profileWasUpdated = storageManager.updateProfileHighScore(currentProfile.name, score);
      if (profileWasUpdated) {
        setCurrentProfile(prev => prev ? { ...prev, highScore: score } : null);
        setProfiles(prev => prev.map(p => 
          p.name === currentProfile.name ? { ...p, highScore: score } : p
        ));
      }
    }
    
    return wasUpdated;
  }, [storageManager, currentProfile]);
  
  // Update preferences
  const updatePreferences = useCallback((newPreferences: Partial<GamePreferences>) => {
    storageManager.updatePreferences(newPreferences);
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, [storageManager]);
  
  // Auto-save game progress
  const autoSave = useCallback((score: number) => {
    storageManager.autoSave(score, currentProfile?.name);
    // No need to update state here as it would cause re-renders during gameplay
  }, [storageManager, currentProfile]);
  
  // Toggle sound mute
  const toggleMute = useCallback((type: 'music' | 'sfx') => {
    const newMuteState = storageManager.toggleMute(type);
    setPreferences(prev => ({
      ...prev,
      ...(type === 'music' ? { isMusicMuted: newMuteState } : { isSfxMuted: newMuteState })
    }));
    return newMuteState;
  }, [storageManager]);
  
  // Update sound volume
  const updateVolume = useCallback((type: 'music' | 'sfx', volume: number) => {
    storageManager.updateSoundVolume(type, volume);
    setPreferences(prev => ({
      ...prev,
      ...(type === 'music' ? { musicVolume: volume } : { sfxVolume: volume })
    }));
  }, [storageManager]);
  
  // Reset storage (for development/testing)
  const resetStorage = useCallback(() => {
    storageManager.resetStorage();
    setProfiles([]);
    setCurrentProfile(null);
    setHighScore(0);
    setPreferences(DEFAULT_PREFERENCES);
  }, [storageManager]);
  
  // Export/Import data
  const exportData = useCallback(() => {
    return storageManager.exportData();
  }, [storageManager]);
  
  const importData = useCallback((jsonData: string) => {
    const success = storageManager.importData(jsonData);
    if (success) {
      // Reload data after import
      setProfiles(storageManager.getProfiles());
      setCurrentProfile(storageManager.getCurrentProfile());
      setHighScore(storageManager.getHighScore());
      setPreferences(storageManager.getPreferences());
    }
    return success;
  }, [storageManager]);
  
  return {
    // Data
    profiles,
    currentProfile,
    highScore,
    preferences,
    isLoaded,
    
    // Actions
    createProfile,
    deleteProfile,
    selectProfile,
    updateHighScore,
    updatePreferences,
    autoSave,
    toggleMute,
    updateVolume,
    resetStorage,
    exportData,
    importData
  };
};

