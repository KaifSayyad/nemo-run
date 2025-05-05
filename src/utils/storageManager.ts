import { UI_SETTINGS } from './constants';

// Storage version for migration purposes
const STORAGE_VERSION = 1;

// Game preferences interface
export interface GamePreferences {
  musicVolume: number;
  sfxVolume: number;
  isMusicMuted: boolean;
  isSfxMuted: boolean;
  controlSensitivity: number;
  showTutorial: boolean;
}

// User profile interface (from GameStateContext)
export interface UserProfile {
  name: string;
  highScore: number;
  lastPlayed: string;
  // Add any additional profile data here
}

// Game storage schema interface
export interface GameStorageSchema {
  version: number;
  profiles: UserProfile[];
  currentProfileName?: string;
  highScore: number;
  preferences: GamePreferences;
}

// Default game preferences
export const DEFAULT_PREFERENCES: GamePreferences = {
  musicVolume: 0.7,
  sfxVolume: 0.8,
  isMusicMuted: false,
  isSfxMuted: false,
  controlSensitivity: 0.5,
  showTutorial: true,
};

/**
 * StorageManager - Handles all storage operations for the game
 * 
 * This utility provides methods for saving and loading game data:
 * - User profiles
 * - High scores
 * - Game preferences
 * 
 * It also handles data validation and migration between different
 * storage versions if the schema changes over time.
 */
export class StorageManager {
  private static instance: StorageManager;
  
  // Storage keys
  private readonly PROFILES_KEY = UI_SETTINGS.PROFILES_KEY;
  private readonly HIGH_SCORE_KEY = UI_SETTINGS.HIGH_SCORE_KEY;
  private readonly PREFERENCES_KEY = 'nemo_run_preferences';
  private readonly STORAGE_VERSION_KEY = 'nemo_run_storage_version';
  
  // Default values
  private readonly DEFAULT_HIGH_SCORE = 0;
  private readonly MAX_PROFILES = 5;
  
  private constructor() {
    // Initialize storage if needed
    this.initializeStorage();
  }
  
  /**
   * Get the singleton instance of StorageManager
   */
  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }
  
  /**
   * Initialize storage with default values if not yet set
   */
  private initializeStorage(): void {
    try {
      // Check storage version and perform migration if needed
      const storedVersion = this.getStorageVersion();
      if (storedVersion < STORAGE_VERSION) {
        this.migrateStorage(storedVersion, STORAGE_VERSION);
      }
      
      // Ensure all required keys exist with valid values
      if (!this.getProfiles()) {
        this.saveProfiles([]);
      }
      
      if (!this.getHighScore()) {
        this.saveHighScore(this.DEFAULT_HIGH_SCORE);
      }
      
      if (!this.getPreferences()) {
        this.savePreferences(DEFAULT_PREFERENCES);
      }
      
      // Update storage version
      this.saveStorageVersion(STORAGE_VERSION);
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      
      // Handle initialization error by resetting to defaults
      this.resetStorage();
    }
  }
  
  /**
   * Reset storage to default values
   */
  public resetStorage(): void {
    try {
      localStorage.removeItem(this.PROFILES_KEY);
      localStorage.removeItem(this.HIGH_SCORE_KEY);
      localStorage.removeItem(this.PREFERENCES_KEY);
      localStorage.removeItem(this.STORAGE_VERSION_KEY);
      
      // Re-initialize with defaults
      this.saveProfiles([]);
      this.saveHighScore(this.DEFAULT_HIGH_SCORE);
      this.savePreferences(DEFAULT_PREFERENCES);
      this.saveStorageVersion(STORAGE_VERSION);
    } catch (error) {
      console.error('Failed to reset storage:', error);
    }
  }
  
  /**
   * Get all data as a single object for backup or export
   */
  public getAllData(): GameStorageSchema {
    return {
      version: this.getStorageVersion(),
      profiles: this.getProfiles(),
      currentProfileName: this.getCurrentProfileName(),
      highScore: this.getHighScore(),
      preferences: this.getPreferences(),
    };
  }
  
  /**
   * Restore all data from a backup object
   */
  public restoreAllData(data: GameStorageSchema): boolean {
    try {
      // Validate data
      if (!this.validateStorageData(data)) {
        return false;
      }
      
      // Restore all data
      this.saveProfiles(data.profiles);
      this.saveHighScore(data.highScore);
      this.savePreferences(data.preferences);
      this.saveStorageVersion(data.version);
      
      // Restore current profile if available
      if (data.currentProfileName) {
        this.saveCurrentProfileName(data.currentProfileName);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to restore data:', error);
      return false;
    }
  }
  
  /**
   * Validate storage data structure
   */
  private validateStorageData(data: any): boolean {
    // Check if data has required properties
    if (!data || typeof data !== 'object') return false;
    if (typeof data.version !== 'number') return false;
    if (!Array.isArray(data.profiles)) return false;
    if (typeof data.highScore !== 'number') return false;
    if (!data.preferences || typeof data.preferences !== 'object') return false;
    
    // Check if preferences has required properties
    const prefs = data.preferences;
    if (
      typeof prefs.musicVolume !== 'number' ||
      typeof prefs.sfxVolume !== 'number' ||
      typeof prefs.isMusicMuted !== 'boolean' ||
      typeof prefs.isSfxMuted !== 'boolean'
    ) {
      return false;
    }
    
    // Validate profiles
    for (const profile of data.profiles) {
      if (
        !profile ||
        typeof profile !== 'object' ||
        typeof profile.name !== 'string' ||
        typeof profile.highScore !== 'number' ||
        !profile.lastPlayed
      ) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Migrate storage from one version to another
   */
  private migrateStorage(fromVersion: number, toVersion: number): void {
    console.log(`Migrating storage from version ${fromVersion} to ${toVersion}`);
    
    // Example migration logic - update as needed for future versions
    if (fromVersion === 0 && toVersion >= 1) {
      // Migration from version 0 to 1
      // Example: Convert old profile format to new format
      try {
        const oldProfiles = this.getProfiles();
        
        if (oldProfiles && Array.isArray(oldProfiles)) {
          const migratedProfiles = oldProfiles.map(oldProfile => {
            return {
              name: oldProfile.name || 'Unknown',
              highScore: oldProfile.highScore || 0,
              lastPlayed: oldProfile.lastPlayed || new Date().toISOString(),
              // Add any new fields with default values
            };
          });
          
          this.saveProfiles(migratedProfiles);
        }
      } catch (error) {
        console.error('Migration failed:', error);
        // If migration fails, reset to defaults
        this.resetStorage();
      }
    }
    
    // Add more migration steps here for future version upgrades
  }
  
  /**
   * Get the current storage version
   */
  private getStorageVersion(): number {
    try {
      const version = localStorage.getItem(this.STORAGE_VERSION_KEY);
      return version ? parseInt(version, 10) : 0;
    } catch (error) {
      console.error('Failed to get storage version:', error);
      return 0;
    }
  }
  
  /**
   * Save the storage version
   */
  private saveStorageVersion(version: number): void {
    try {
      localStorage.setItem(this.STORAGE_VERSION_KEY, version.toString());
    } catch (error) {
      console.error('Failed to save storage version:', error);
    }
  }
  
  /**
   * Get user profiles
   */
  public getProfiles(): UserProfile[] {
    try {
      const profilesJson = localStorage.getItem(this.PROFILES_KEY);
      if (!profilesJson) return [];
      
      const profiles = JSON.parse(profilesJson);
      
      // Validate profiles array
      if (!Array.isArray(profiles)) return [];
      
      return profiles;
    } catch (error) {
      console.error('Failed to get profiles:', error);
      return [];
    }
  }
  
  /**
   * Save user profiles
   */
  public saveProfiles(profiles: UserProfile[]): void {
    try {
      // Ensure we don't exceed the maximum number of profiles
      const limitedProfiles = profiles.slice(0, this.MAX_PROFILES);
      localStorage.setItem(this.PROFILES_KEY, JSON.stringify(limitedProfiles));
    } catch (error) {
      console.error('Failed to save profiles:', error);
    }
  }
  
  /**
   * Create a new user profile
   */
  public createProfile(name: string): UserProfile | null {
    try {
      // Get existing profiles
      const profiles = this.getProfiles();
      
      // Check if profile with this name already exists
      if (profiles.find(p => p.name === name)) {
        return null;
      }
      
      // Check if we've reached the maximum number of profiles
      if (profiles.length >= this.MAX_PROFILES) {
        return null;
      }
      
      // Create new profile
      const newProfile: UserProfile = {
        name,
        highScore: 0,
        lastPlayed: new Date().toISOString(),
      };
      
      // Add to profiles and save
      profiles.push(newProfile);
      this.saveProfiles(profiles);
      
      // Set as current profile
      this.saveCurrentProfileName(name);
      
      return newProfile;
    } catch (error) {
      console.error('Failed to create profile:', error);
      return null;
    }
  }
  
  /**
   * Delete a user profile
   */
  public deleteProfile(name: string): boolean {
    try {
      // Get existing profiles
      const profiles = this.getProfiles();
      
      // Filter out the profile to delete
      const newProfiles = profiles.filter(p => p.name !== name);
      
      // If nothing changed, profile didn't exist
      if (newProfiles.length === profiles.length) {
        return false;
      }
      
      // Save updated profiles
      this.saveProfiles(newProfiles);
      
      // If we deleted the current profile, update current profile name
      if (this.getCurrentProfileName() === name) {
        if (newProfiles.length > 0) {
          this.saveCurrentProfileName(newProfiles[0].name);
        } else {
          localStorage.removeItem(this.getCurrentProfileKey());
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete profile:', error);
      return false;
    }
  }
  
  /**
   * Update a user profile
   */
  public updateProfile(profile: UserProfile): boolean {
    try {
      // Get existing profiles
      const profiles = this.getProfiles();
      
      // Find and update the profile
      const profileIndex = profiles.findIndex(p => p.name === profile.name);
      if (profileIndex === -1) return false;
      
      profiles[profileIndex] = {
        ...profiles[profileIndex],
        ...profile,
        lastPlayed: new Date().toISOString(), // Always update last played
      };
      
      // Save updated profiles
      this.saveProfiles(profiles);
      
      return true;
    } catch (error) {
      console.error('Failed to update profile:', error);
      return false;
    }
  }
  
  /**
   * Get a profile by name
   */
  public getProfileByName(name: string): UserProfile | null {
    try {
      // Get existing profiles
      const profiles = this.getProfiles();
      
      // Find the profile
      const profile = profiles.find(p => p.name === name);
      
      return profile || null;
    } catch (error) {
      console.error('Failed to get profile:', error);
      return null;
    }
  }
  
  /**
   * Get the current profile
   */
  public getCurrentProfile(): UserProfile | null {
    try {
      const currentProfileName = this.getCurrentProfileName();
      if (!currentProfileName) return null;
      
      return this.getProfileByName(currentProfileName);
    } catch (error) {
      console.error('Failed to get current profile:', error);
      return null;
    }
  }
  
  /**
   * Get the key used for storing the current profile
   */
  private getCurrentProfileKey(): string {
    return `${this.PROFILES_KEY}_current`;
  }
  
  /**
   * Get the name of the current profile
   */
  public getCurrentProfileName(): string | null {
    try {
      const profileName = localStorage.getItem(this.getCurrentProfileKey());
      return profileName;
    } catch (error) {
      console.error('Failed to get current profile name:', error);
      return null;
    }
  }
  
  /**
   * Save the name of the current profile
   */
  public saveCurrentProfileName(name: string): void {
    try {
      localStorage.setItem(this.getCurrentProfileKey(), name);
    } catch (error) {
      console.error('Failed to save current profile name:', error);
    }
  }
  
  /**
   * Update high score for a profile
   */
  public updateProfileHighScore(name: string, score: number): boolean {
    try {
      // Get the profile
      const profile = this.getProfileByName(name);
      if (!profile) return false;
      
      // Only update if the new score is higher
      if (score > profile.highScore) {
        // Update the profile
        profile.highScore = score;
        
        // Save the updated profile
        return this.updateProfile(profile);
      }
      
      return false;
    } catch (error) {
      console.error('Failed to update profile high score:', error);
      return false;
    }
  }
  
  /**
   * Get the overall high score
   */
  public getHighScore(): number {
    try {
      const highScoreStr = localStorage.getItem(this.HIGH_SCORE_KEY);
      return highScoreStr ? parseInt(highScoreStr, 10) : this.DEFAULT_HIGH_SCORE;
    } catch (error) {
      console.error('Failed to get high score:', error);
      return this.DEFAULT_HIGH_SCORE;
    }
  }
  
  /**
   * Save the overall high score
   */
  public saveHighScore(score: number): void {
    try {
      // Only save if it's a valid number
      if (typeof score !== 'number' || isNaN(score)) {
        console.error('Invalid high score value:', score);
        return;
      }
      
      // Save the high score
      localStorage.setItem(this.HIGH_SCORE_KEY, score.toString());
    } catch (error) {
      console.error('Failed to save high score:', error);
    }
  }
  
  /**
   * Update the high score if the new score is higher
   * @returns boolean indicating whether high score was updated
   */
  public updateHighScore(score: number): boolean {
    try {
      // Get current high score
      const currentHighScore = this.getHighScore();
      
      // Only update if the new score is higher
      if (score > currentHighScore) {
        this.saveHighScore(score);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to update high score:', error);
      return false;
    }
  }
  
  /**
   * Get game preferences
   */
  public getPreferences(): GamePreferences {
    try {
      const preferencesJson = localStorage.getItem(this.PREFERENCES_KEY);
      if (!preferencesJson) return DEFAULT_PREFERENCES;
      
      const preferences = JSON.parse(preferencesJson);
      
      // Validate preferences object
      if (!preferences || typeof preferences !== 'object') {
        return DEFAULT_PREFERENCES;
      }
      
      // Merge with defaults to ensure all properties exist
      return {
        ...DEFAULT_PREFERENCES,
        ...preferences
      };
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }
  
  /**
   * Save game preferences
   */
  public savePreferences(preferences: GamePreferences): void {
    try {
      // Validate preferences object
      if (!preferences || typeof preferences !== 'object') {
        console.error('Invalid preferences object:', preferences);
        return;
      }
      
      // Merge with defaults to ensure all properties exist
      const mergedPreferences = {
        ...DEFAULT_PREFERENCES,
        ...preferences
      };
      
      // Ensure volume values are within range
      mergedPreferences.musicVolume = this.clampValue(mergedPreferences.musicVolume, 0, 1);
      mergedPreferences.sfxVolume = this.clampValue(mergedPreferences.sfxVolume, 0, 1);
      mergedPreferences.controlSensitivity = this.clampValue(mergedPreferences.controlSensitivity, 0, 1);
      
      // Save the preferences
      localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(mergedPreferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }
  
  /**
   * Update specific preferences
   */
  public updatePreferences(preferences: Partial<GamePreferences>): void {
    try {
      // Get current preferences
      const currentPreferences = this.getPreferences();
      
      // Merge with current preferences
      const updatedPreferences = {
        ...currentPreferences,
        ...preferences
      };
      
      // Save updated preferences
      this.savePreferences(updatedPreferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  }
  
  /**
   * Update sound volume for music or sound effects
   */
  public updateSoundVolume(type: 'music' | 'sfx', volume: number): void {
    try {
      // Ensure volume is within range
      const clampedVolume = this.clampValue(volume, 0, 1);
      
      // Get current preferences
      const preferences = this.getPreferences();
      
      // Update the appropriate volume
      if (type === 'music') {
        preferences.musicVolume = clampedVolume;
      } else {
        preferences.sfxVolume = clampedVolume;
      }
      
      // Save updated preferences
      this.savePreferences(preferences);
    } catch (error) {
      console.error(`Failed to update ${type} volume:`, error);
    }
  }
  
  /**
   * Toggle sound mute state for music or sound effects
   * @returns the new mute state
   */
  public toggleMute(type: 'music' | 'sfx'): boolean {
    try {
      // Get current preferences
      const preferences = this.getPreferences();
      
      // Toggle the appropriate mute state
      if (type === 'music') {
        preferences.isMusicMuted = !preferences.isMusicMuted;
      } else {
        preferences.isSfxMuted = !preferences.isSfxMuted;
      }
      
      // Save updated preferences
      this.savePreferences(preferences);
      
      // Return the new mute state
      return type === 'music' ? preferences.isMusicMuted : preferences.isSfxMuted;
    } catch (error) {
      console.error(`Failed to toggle ${type} mute:`, error);
      return false;
    }
  }
  
  /**
   * Export game data as a JSON string for backup
   */
  public exportData(): string {
    try {
      const data = this.getAllData();
      return JSON.stringify(data);
    } catch (error) {
      console.error('Failed to export data:', error);
      return '';
    }
  }
  
  /**
   * Import game data from a JSON string
   * @returns boolean indicating success
   */
  public importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData) as GameStorageSchema;
      return this.restoreAllData(data);
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
  
  /**
   * Helper function to clamp a value between min and max
   */
  private clampValue(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
  
  /**
   * Auto-save game progress
   * This method can be called periodically during gameplay
   */
  public autoSave(score: number, currentProfileName?: string): void {
    try {
      // Update high score if needed
      this.updateHighScore(score);
      
      // Update profile high score if a profile is selected
      if (currentProfileName) {
        this.updateProfileHighScore(currentProfileName, score);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }
}

