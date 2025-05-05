import { UI_SETTINGS } from './constants';

// Sound types with paths (relative to public/audio folder)
export const SOUNDS = {
  // Background music
  BACKGROUND: 'background/underwater_ambient.mp3',
  
  // Swimming sounds
  SWIM_NORMAL: 'swim/swim_normal.mp3',
  SWIM_FAST: 'swim/swim_fast.mp3',
  
  // Game events
  COLLISION: 'events/collision.mp3',
  GAME_OVER: 'events/game_over.mp3',
  SCORE_MILESTONE: 'events/score_milestone.mp3',
  NEW_HIGHSCORE: 'events/new_highscore.mp3',
  
  // UI sounds
  MENU_CLICK: 'ui/menu_click.mp3',
  MENU_HOVER: 'ui/menu_hover.mp3',
  MENU_BACK: 'ui/menu_back.mp3',
  GAME_START: 'ui/game_start.mp3',
  PAUSE: 'ui/pause.mp3',
};

// Sound categories for volume control
export enum SoundCategory {
  MUSIC = 'music',
  SFX = 'sfx',
}

// Sound manager options interface
interface SoundManagerOptions {
  defaultMusicVolume?: number;
  defaultSfxVolume?: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

/**
 * Sound Manager class that handles audio loading and playback
 * using the Web Audio API for better control over sound effects.
 */
class SoundManager {
  private static instance: SoundManager;
  private context: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private musicSources: Map<string, AudioBufferSourceNode> = new Map();
  private sfxSources: Map<string, AudioBufferSourceNode> = new Map();
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;

  private musicVolume: number;
  private sfxVolume: number;
  private fadeInDuration: number;
  private fadeOutDuration: number;
  private isMusicMuted: boolean = false;
  private isSfxMuted: boolean = false;
  private isInitialized: boolean = false;
  private loadPromise: Promise<void> | null = null;

  private constructor(options: SoundManagerOptions = {}) {
    // Default options
    this.musicVolume = options.defaultMusicVolume ?? 0.5;
    this.sfxVolume = options.defaultSfxVolume ?? 0.7;
    this.fadeInDuration = options.fadeInDuration ?? 1.5;
    this.fadeOutDuration = options.fadeOutDuration ?? 1.0;

    // Try to load stored volume settings
    this.loadVolumeSettings();
  }

  /**
   * Get the singleton instance of SoundManager
   */
  public static getInstance(options?: SoundManagerOptions): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager(options);
    }
    return SoundManager.instance;
  }

  /**
   * Initialize the audio context and load all sounds
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Create audio context
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create gain nodes for volume control
      this.musicGainNode = this.context.createGain();
      this.sfxGainNode = this.context.createGain();
      
      // Connect gain nodes to destination
      this.musicGainNode.connect(this.context.destination);
      this.sfxGainNode.connect(this.context.destination);
      
      // Set initial volume
      this.updateVolume(SoundCategory.MUSIC, this.musicVolume);
      this.updateVolume(SoundCategory.SFX, this.sfxVolume);
      
      // Load all sounds
      this.loadPromise = this.loadSounds();
      await this.loadPromise;
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  /**
   * Load all sound files
   */
  private async loadSounds(): Promise<void> {
    const soundKeys = Object.values(SOUNDS);
    const loadPromises = soundKeys.map(key => this.loadSound(key));
    await Promise.all(loadPromises);
  }

  /**
   * Load a single sound file
   */
  private async loadSound(soundPath: string): Promise<void> {
    if (!this.context) return;

    try {
      const response = await fetch(`/audio/${soundPath}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.sounds.set(soundPath, audioBuffer);
    } catch (error) {
      console.warn(`Failed to load sound: ${soundPath}`, error);
    }
  }

  /**
   * Ensure audio context is running (needed for browsers that suspend by default)
   */
  private ensureContextRunning(): void {
    if (this.context && this.context.state !== 'running') {
      this.context.resume();
    }
  }

  /**
   * Play background music with optional looping
   */
  public playMusic(soundPath: string, loop: boolean = true): void {
    if (!this.context || !this.musicGainNode || this.isMusicMuted) return;
    this.ensureContextRunning();

    // Stop any currently playing music
    this.stopMusic();

    const buffer = this.sounds.get(soundPath);
    if (!buffer) {
      console.warn(`Sound not loaded: ${soundPath}`);
      return;
    }

    // Create and configure source
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;

    // Connect through gain node
    source.connect(this.musicGainNode);
    
    // Start with fade-in
    if (this.fadeInDuration > 0) {
      this.musicGainNode.gain.setValueAtTime(0, this.context.currentTime);
      this.musicGainNode.gain.linearRampToValueAtTime(
        this.isMusicMuted ? 0 : this.musicVolume,
        this.context.currentTime + this.fadeInDuration
      );
    }
    
    // Start playback
    source.start();
    
    // Store the source
    this.musicSources.set(soundPath, source);
    
    // Set up ended event to clean up
    source.onended = () => {
      this.musicSources.delete(soundPath);
    };
  }

  /**
   * Stop all background music with optional fade out
   */
  public stopMusic(fadeOut: boolean = true): void {
    if (!this.context || !this.musicGainNode) return;

    // Apply fade out if requested
    if (fadeOut && this.fadeOutDuration > 0) {
      this.musicGainNode.gain.linearRampToValueAtTime(
        0,
        this.context.currentTime + this.fadeOutDuration
      );
      
      // Stop all sources after fade out
      setTimeout(() => {
        this.musicSources.forEach(source => {
          try {
            source.stop();
          } catch (e) {
            // Source might already be stopped
          }
        });
        this.musicSources.clear();
      }, this.fadeOutDuration * 1000);
    } else {
      // Immediately stop all sources
      this.musicSources.forEach(source => {
        try {
          source.stop();
        } catch (e) {
          // Source might already be stopped
        }
      });
      this.musicSources.clear();
    }
  }

  /**
   * Play a sound effect
   */
  public playSfx(
    soundPath: string,
    options: {
      volume?: number;
      rate?: number;
      detune?: number;
      loop?: boolean;
    } = {}
  ): AudioBufferSourceNode | null {
    if (!this.context || !this.sfxGainNode || this.isSfxMuted) return null;
    this.ensureContextRunning();

    const buffer = this.sounds.get(soundPath);
    if (!buffer) {
      console.warn(`Sound not loaded: ${soundPath}`);
      return null;
    }

    // Create and configure source
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop || false;
    
    // Apply playback rate adjustments if specified
    if (options.rate !== undefined) {
      source.playbackRate.value = options.rate;
    }
    
    if (options.detune !== undefined) {
      source.detune.value = options.detune;
    }

    // Create a gain node for this specific sound
    const gainNode = this.context.createGain();
    const targetVolume = options.volume !== undefined ? options.volume : 1.0;
    gainNode.gain.value = targetVolume;

    // Connect through gain nodes
    source.connect(gainNode);
    gainNode.connect(this.sfxGainNode);
    
    // Start playback
    source.start();
    
    // Set up ended event to clean up
    source.onended = () => {
      this.sfxSources.delete(soundPath);
    };
    
    // Store the source
    this.sfxSources.set(soundPath, source);
    
    return source;
  }

  /**
   * Set volume for a category (music or sfx)
   */
  public setVolume(category: SoundCategory, volume: number): void {
    // Clamp volume to 0-1 range
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    if (category === SoundCategory.MUSIC) {
      this.musicVolume = clampedVolume;
    } else {
      this.sfxVolume = clampedVolume;
    }
    
    // Apply volume change
    this.updateVolume(category, clampedVolume);
    
    // Save settings
    this.saveVolumeSettings();
  }

  /**
   * Apply volume to audio nodes
   */
  private updateVolume(category: SoundCategory, volume: number): void {
    if (!this.context) return;
    
    if (category === SoundCategory.MUSIC && this.musicGainNode) {
      this.musicGainNode.gain.value = this.isMusicMuted ? 0 : volume;
    } else if (category === SoundCategory.SFX && this.sfxGainNode) {
      this.sfxGainNode.gain.value = this.isSfxMuted ? 0 : volume;
    }
  }

  /**
   * Toggle mute for a category
   */
  public toggleMute(category: SoundCategory): boolean {
    if (category === SoundCategory.MUSIC) {
      this.isMusicMuted = !this.isMusicMuted;
      this.updateVolume(category, this.musicVolume);
      return this.isMusicMuted;
    } else {
      this.isSfxMuted = !this.isSfxMuted;
      this.updateVolume(category, this.sfxVolume);
      return this.isSfxMuted;
    }
    
    // Save settings
    this.saveVolumeSettings();
  }

  /**
   * Set mute state for a category
   */
  public setMute(category: SoundCategory, muted: boolean): void {
    if (category === SoundCategory.MUSIC) {
      this.isMusicMuted = muted;
      this.updateVolume(category, this.musicVolume);
    } else {
      this.isSfxMuted = muted;
      this.updateVolume(category, this.sfxVolume);
    }
    
    // Save settings
    this.saveVolumeSettings();
  }

  /**
   * Get the current volume for a category
   */
  public getVolume(category: SoundCategory): number {
    return category === SoundCategory.MUSIC ? this.musicVolume : this.sfxVolume;
  }

  /**
   * Check if a category is muted
   */
  public isMuted(category: SoundCategory): boolean {
    return category === SoundCategory.MUSIC ? this.isMusicMuted : this.isSfxMuted;
  }

  /**
   * Save volume settings to localStorage
   */
  private saveVolumeSettings(): void {
    try {
      const settings = {
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume,
        isMusicMuted: this.isMusicMuted,
        isSfxMuted: this.isSfxMuted
      };
      localStorage.setItem(UI_SETTINGS.SOUND_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save sound settings:', error);
    }
  }

  /**
   * Load volume settings from localStorage
   */
  private loadVolumeSettings(): void {
    try {
      const settingsJson = localStorage.getItem(UI_SETTINGS.SOUND_SETTINGS_KEY);
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        this.musicVolume = settings.musicVolume ?? this.musicVolume;
        this.sfxVolume = settings.sfxVolume ?? this.sfxVolume;
        this.isMusicMuted = settings.isMusicMuted ?? this.isMusicMuted;
        this.isSfxMuted = settings.isSfxMuted ?? this.isSfxMuted;
      }
    } catch (error) {
      console.warn('Failed to load sound settings:', error);
    }
  }

  /**
   * Clean up and release resources
   */
  public dispose(): void {
    this.stopMusic(false);
    this.sfxSources.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Source might already be stopped
      }
    });
    this.sfxSources.clear();
    this.musicSources.clear();
    
    if (this.context && this.context.state !== 'closed') {
      this.context.close();
    }
    
    this.isInitialized = false;
  }
}

// Export the singleton instance
export default SoundManager.getInstance();

