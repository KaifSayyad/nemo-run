// Game settings and constants

export const GAME_SETTINGS = {
  // Default game settings
  DEFAULT_SPEED: 5,
  MAX_SPEED: 10,
  
  // Difficulty progression
  DIFFICULTY_LEVELS: [
    { score: 0, speed: 5, spawnRate: 2.0 }, // Initial difficulty
    { score: 100, speed: 6, spawnRate: 1.8 },
    { score: 250, speed: 7, spawnRate: 1.6 },
    { score: 500, speed: 8, spawnRate: 1.4 },
    { score: 1000, speed: 9, spawnRate: 1.2 },
    { score: 2000, speed: 10, spawnRate: 1.0 }, // Maximum difficulty
  ],
  
  // Player profiles
  MAX_PROFILES: 5,
  
  // Collision settings
  COLLISION_RADIUS: 1.5,
  COLLISION_THRESHOLD: 0.8, // Distance threshold for collision detection
  
  // Obstacle settings
  OBSTACLE_COUNT: 10,
  OBSTACLE_SPEED_MULTIPLIER: 1.2,
  OBSTACLE_SPAWN_RATE: 2000, // ms
  OBSTACLE_SPAWN_DISTANCE: 100,
  OBSTACLE_TYPES: 5,
  
  // Speed settings
  INITIAL_SPEED: 0.5,
  SPEED_INCREMENT: 0.0001,
  
  // Nemo settings
  NEMO_INITIAL_SIZE: 1.0,
  NEMO_GROWTH_FACTOR: 0.05,
  GROWTH_SCORE_THRESHOLD: 1000, // Score needed for Nemo to grow
};

export const UI_SETTINGS = {
  // Local storage keys
  HIGH_SCORE_KEY: 'nemo_run_high_score',
  PROFILES_KEY: 'nemo_run_profiles',
  SOUND_SETTINGS_KEY: 'nemo_run_sound_settings',
  
  // UI colors
  PRIMARY_COLOR: '#00a8ff',
  SECONDARY_COLOR: '#0097e6',
  ACCENT_COLOR: '#ffcc00',
  
  // Fonts
  PRIMARY_FONT: '"Arial Rounded MT Bold", "Helvetica Rounded", Arial, sans-serif',
  
  // Score settings
  SCORE_INCREMENT: 1,
};

export const ENVIRONMENT = {
  // Colors
  BACKGROUND_COLOR: '#004080', // Deep blue
  FOG_COLOR: '#00355c',
  FOG_NEAR: 10,
  FOG_FAR: 80,
  AMBIENT_LIGHT_COLOR: '#4d88b5',
  LIGHT_COLOR: '#f0f9ff',
  
  // Lighting
  AMBIENT_LIGHT_INTENSITY: 0.5,
  LIGHT_INTENSITY: 1.2,
  
  // Environment settings
  WATER_WAVE_SPEED: 0.5,
  CAUSTICS_INTENSITY: 0.3,
};

export const CONTROL_SETTINGS = {
  // Movement keys
  MOVE_UP: ['ArrowUp', 'KeyW'],
  MOVE_DOWN: ['ArrowDown', 'KeyS'],
  MOVE_LEFT: ['ArrowLeft', 'KeyA'],
  MOVE_RIGHT: ['ArrowRight', 'KeyD'],
  SPRINT: ['ShiftLeft', 'ShiftRight'],
  
  // Game control keys
  PAUSE: ['Space', 'KeyP'],
  MENU: ['Escape'],
  
  // Sensitivity
  MOVEMENT_SENSITIVITY: 0.2,
  MOUSE_SENSITIVITY: 0.01,
};

// Canvas and rendering settings
export const CAMERA_SETTINGS = {
  FOV: 75,
  NEAR: 0.1,
  FAR: 1000,
  POSITION: [0, 2, 10] as [number, number, number],
  LOOK_AT: [0, 0, 0] as [number, number, number]
};

