import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats, KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import UnderwaterScene from '../scenes/UnderwaterScene';
import Nemo from './Nemo';
import Obstacles from './Obstacles';
import { CAMERA_SETTINGS, UI_SETTINGS } from '../utils/constants';

// Props interface for the GameCanvas component
interface GameCanvasProps {
  showStats?: boolean;
  enableControls?: boolean;
  isPlaying: boolean;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  onCollision?: () => void;
}

// Define control keys for the game
const controls = [
  { name: 'ArrowUp', keys: ['ArrowUp', 'KeyW'] },
  { name: 'ArrowDown', keys: ['ArrowDown', 'KeyS'] },
  { name: 'ArrowLeft', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'ArrowRight', keys: ['ArrowRight', 'KeyD'] },
  { name: 'ShiftLeft', keys: ['ShiftLeft'] }
];

/**
 * Main game canvas component that sets up the Three.js scene
 * with proper camera settings and scene environment
 */
const GameCanvas: React.FC<GameCanvasProps> = ({ 
  showStats = false, 
  enableControls = false,
  isPlaying,
  score,
  setScore,
  onCollision
}) => {
  // Reference to Nemo's group for position tracking and collision detection
  const nemoRef = useRef<THREE.Group>(null);
  // Score incrementing effect
  useEffect(() => {
    if (!isPlaying) return;
    
    // Set up score incrementing timer
    const incrementScore = () => {
      setScore(prev => prev + UI_SETTINGS.SCORE_INCREMENT);
    };
    
    const scoreTimer = setInterval(incrementScore, 100);
    
    // Clean up timer on unmount or when game stops
    return () => clearInterval(scoreTimer);
  }, [isPlaying, setScore]);
  return (
    <KeyboardControls map={controls}>
      <Canvas
        shadows
        camera={{
          fov: CAMERA_SETTINGS.FOV,
          near: CAMERA_SETTINGS.NEAR,
          far: CAMERA_SETTINGS.FAR,
          position: CAMERA_SETTINGS.POSITION,
        }}
        style={{ background: 'black' }}
      >
      {/* Show performance stats in development mode */}
      {showStats && <Stats />}
      
      {/* Enable camera controls for development */}
      {enableControls && <OrbitControls target={CAMERA_SETTINGS.LOOK_AT} />}
      
      {/* Suspense for handling async loading of models */}
      <Suspense fallback={null}>
        {/* Main underwater scene component */}
        <UnderwaterScene>
          {/* Nemo character with controls */}
          <Nemo 
            ref={nemoRef}
            score={score}
            isPlaying={isPlaying}
            onCollision={onCollision}
          />
          
          {/* Obstacles */}
          <Obstacles 
            score={score}
            isPlaying={isPlaying}
            nemoRef={nemoRef}
            onCollision={onCollision}
          />
        </UnderwaterScene>
      </Suspense>
      </Canvas>
    </KeyboardControls>
  );
};

export default GameCanvas;

