import { GAME_SETTINGS } from './constants';

// Difficulty level interface
export interface DifficultyLevel {
  score: number;
  speed: number;
  spawnRate: number;
  scoreMultiplier?: number;
}

// Game parameters interface
export interface GameParameters {
  speed: number;
  spawnRate: number;
  scoreMultiplier: number;
  difficultyLevel: number;
  nextMilestone: number | null;
}

/**
 * DifficultyManager - Handles difficulty scaling based on player score
 * 
 * This utility provides functions to calculate game parameters based on
 * the current score and DIFFICULTY_LEVELS defined in GAME_SETTINGS.
 */
export class DifficultyManager {
  private static difficultyLevels: DifficultyLevel[] = GAME_SETTINGS.DIFFICULTY_LEVELS;

  /**
   * Get the current difficulty level index based on score
   */
  public static getDifficultyLevelIndex(score: number): number {
    let levelIndex = 0;
    
    for (let i = this.difficultyLevels.length - 1; i >= 0; i--) {
      if (score >= this.difficultyLevels[i].score) {
        levelIndex = i;
        break;
      }
    }
    
    return levelIndex;
  }

  /**
   * Get the next difficulty milestone or null if at max difficulty
   */
  public static getNextMilestone(score: number): number | null {
    const currentLevelIndex = this.getDifficultyLevelIndex(score);
    
    if (currentLevelIndex >= this.difficultyLevels.length - 1) {
      return null; // Already at max difficulty
    }
    
    return this.difficultyLevels[currentLevelIndex + 1].score;
  }

  /**
   * Calculate game parameters based on the current score
   * 
   * This function provides a smooth transition between difficulty levels
   * by linearly interpolating parameters between levels.
   */
  public static calculateGameParameters(score: number): GameParameters {
    const levelIndex = this.getDifficultyLevelIndex(score);
    const currentLevel = this.difficultyLevels[levelIndex];
    const nextMilestone = this.getNextMilestone(score);
    
    // If we're at max difficulty or exactly at a difficulty threshold, return that level's parameters
    if (nextMilestone === null || score === currentLevel.score) {
      return {
        speed: currentLevel.speed,
        spawnRate: currentLevel.spawnRate,
        scoreMultiplier: currentLevel.scoreMultiplier || 1.0,
        difficultyLevel: levelIndex,
        nextMilestone
      };
    }
    
    // If we're between levels, interpolate parameters for smooth transition
    const nextLevel = this.difficultyLevels[levelIndex + 1];
    const progressToNextLevel = (score - currentLevel.score) / (nextLevel.score - currentLevel.score);
    
    // Interpolate speed
    const speed = currentLevel.speed + progressToNextLevel * (nextLevel.speed - currentLevel.speed);
    
    // Interpolate spawn rate
    const spawnRate = currentLevel.spawnRate + progressToNextLevel * (nextLevel.spawnRate - currentLevel.spawnRate);
    
    // Interpolate score multiplier (defaulting to 1.0 if not specified)
    const currentMultiplier = currentLevel.scoreMultiplier || 1.0;
    const nextMultiplier = nextLevel.scoreMultiplier || 1.0;
    const scoreMultiplier = currentMultiplier + progressToNextLevel * (nextMultiplier - currentMultiplier);
    
    return {
      speed,
      spawnRate,
      scoreMultiplier,
      difficultyLevel: levelIndex,
      nextMilestone
    };
  }

  /**
   * Check if this score represents crossing a difficulty threshold
   */
  public static isNewDifficultyLevel(previousScore: number, currentScore: number): boolean {
    const previousLevel = this.getDifficultyLevelIndex(previousScore);
    const currentLevel = this.getDifficultyLevelIndex(currentScore);
    
    return currentLevel > previousLevel;
  }

  /**
   * Get difficulty level name based on index
   */
  public static getDifficultyName(levelIndex: number): string {
    const difficultyNames = [
      'Easy',
      'Normal',
      'Challenging',
      'Hard',
      'Expert',
      'Master'
    ];
    
    // Clamp to available names
    const clampedIndex = Math.min(levelIndex, difficultyNames.length - 1);
    return difficultyNames[clampedIndex];
  }
}

export default DifficultyManager;

