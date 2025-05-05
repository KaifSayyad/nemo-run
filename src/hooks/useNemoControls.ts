import { useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { GAME_SETTINGS } from '../utils/constants';

// Movement boundaries
const BOUNDS = {
  x: 5,   // Left/Right boundary
  y: 4,   // Up/Down boundary
  z: 5    // Forward/Backward boundary (limited range for endless runner)
};

// Movement speeds
const MOVEMENT_SPEED = {
  normal: 0.1,
  fast: 0.2,
  forward: 0.02  // Constant forward movement speed
};

// Interface for control parameters
interface ControlsParams {
  isPlaying: boolean;
  nemoRef: React.RefObject<THREE.Group>;
}

// Interface for control return values
interface ControlsResult {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  size: number;
  isMoving: boolean;
  isBoosting: boolean;
  tailAngle: number;
  updateSizeFromScore: (score: number) => void;
}

/**
 * Custom hook to handle Nemo's movement controls
 */
const useNemoControls = (params: ControlsParams): ControlsResult => {
  const { isPlaying, nemoRef } = params;
  
  // Movement state
  const [position, setPosition] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const [rotation, setRotation] = useState<THREE.Euler>(new THREE.Euler(0, Math.PI / 2, 0)); // Face forward (look down +Z axis)
  const [size, setSize] = useState<number>(GAME_SETTINGS.NEMO_INITIAL_SIZE);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [isBoosting, setIsBoosting] = useState<boolean>(false);
  const [tailAngle, setTailAngle] = useState<number>(0);
  
  // Keyboard controls
  const [subscribeKeys, getKeys] = useKeyboardControls();
  
  // Update size based on score
  const updateSizeFromScore = (score: number) => {
    const growthLevel = Math.floor(score / GAME_SETTINGS.GROWTH_SCORE_THRESHOLD);
    const newSize = GAME_SETTINGS.NEMO_INITIAL_SIZE + 
      (growthLevel * GAME_SETTINGS.NEMO_GROWTH_FACTOR);
    setSize(newSize);
  };
  
  // Handle movement in animation frame
  useFrame((state, delta) => {
    if (!isPlaying || !nemoRef.current) return;
    
    // Get current key states
    const { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, KeyW, KeyS, KeyA, KeyD, ShiftLeft } = getKeys();
    
    // Determine movement direction
    const moveUp = ArrowUp || KeyW;
    const moveDown = ArrowDown || KeyS;
    const moveLeft = ArrowLeft || KeyA;
    const moveRight = ArrowRight || KeyD;
    const boost = ShiftLeft;
    
    // Check if any movement key is pressed
    const anyMovement = moveUp || moveDown || moveLeft || moveRight;
    setIsMoving(anyMovement);
    setIsBoosting(boost);
    
    // Calculate new position
    const newPosition = position.clone();
    
    // Apply speed based on boost
    const speed = boost ? MOVEMENT_SPEED.fast : MOVEMENT_SPEED.normal;
    
    // Add constant forward motion (small z oscillation for natural swimming)
    newPosition.z += Math.sin(state.clock.elapsedTime * 2) * 0.01;
    
    // Update position based on keys
    if (moveUp) newPosition.y += speed;
    if (moveDown) newPosition.y -= speed;
    if (moveLeft) newPosition.x -= speed;
    if (moveRight) newPosition.x += speed;
    
    // Apply boundaries
    newPosition.x = Math.max(-BOUNDS.x, Math.min(BOUNDS.x, newPosition.x));
    newPosition.y = Math.max(-BOUNDS.y, Math.min(BOUNDS.y, newPosition.y));
    
    // Update position state
    setPosition(newPosition);
    
    // Apply position to mesh
    nemoRef.current.position.copy(newPosition);
    
    // Calculate swim rotation (tilt up when going up, down when going down)
    const targetRotationX = moveUp ? 0.2 : moveDown ? -0.2 : 0;
    const targetRotationZ = moveLeft ? -0.3 : moveRight ? 0.3 : 0;
    
    // Create new rotation with base orientation (facing forward)
    const newRotation = new THREE.Euler(
      rotation.x + (targetRotationX - rotation.x) * 0.1,
      Math.PI / 2, // Keep facing forward (along positive Z)
      rotation.z + (targetRotationZ - rotation.z) * 0.1
    );
    
    // Update rotation state
    setRotation(newRotation);
    
    // Apply rotation to mesh
    nemoRef.current.rotation.copy(newRotation);
    
    // Update tail wiggle animation
    const tailSpeed = boost ? 15 : anyMovement ? 10 : 5; // Slower when idle
    setTailAngle(prev => prev + delta * tailSpeed);
  });
  
  return {
    position,
    rotation,
    size,
    isMoving,
    isBoosting,
    tailAngle,
    updateSizeFromScore
  };
};

export default useNemoControls;

