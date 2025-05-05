import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useNemoControls from '../hooks/useNemoControls';
import { GAME_SETTINGS } from '../utils/constants';

// Define props interface for the Nemo component
interface NemoProps {
  score: number;
  isPlaying: boolean;
  onCollision?: () => void;
}

// Base animation values
const TAIL_BASE_AMPLITUDE = 0.3; // Base amplitude for tail wiggle

// Create a type for the forwarded ref
type NemoRef = THREE.Group;

// Define the component with ForwardRefRenderFunction
const Nemo: React.ForwardRefRenderFunction<NemoRef, NemoProps> = (props, ref) => {
  const { score, isPlaying, onCollision } = props;
  
  // Internal ref for accessing the group
  const internalRef = useRef<THREE.Group>(null);
  
  // Reference to tail for animation
  const tailRef = useRef<THREE.Mesh>(null);
  
  // Connect the forwarded ref to our internal ref
  useEffect(() => {
    if (internalRef.current && ref) {
      if (typeof ref === 'function') {
        ref(internalRef.current);
      } else {
        (ref as React.MutableRefObject<THREE.Group>).current = internalRef.current;
      }
    }
  }, [ref]);
  
  // Use the movement controls hook
  const controls = useNemoControls({
    isPlaying,
    nemoRef: internalRef
  });
  
  // Update size based on score
  useEffect(() => {
    controls.updateSizeFromScore(score);
  }, [score, controls]);
  
  // Update tail animation
  useEffect(() => {
    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(controls.tailAngle) * TAIL_BASE_AMPLITUDE;
    }
  }, [controls.tailAngle]);

  return (
    <group 
      ref={internalRef} 
      scale={[controls.size, controls.size, controls.size]}
      position={controls.position}
      rotation={controls.rotation}
    >
      {/* Group for fish model - rotated to face forward */}
      <group rotation={[0, -Math.PI / 2, 0]}>
        {/* Main body - orange sphere */}
        <mesh castShadow position={[0, 0, 0]}>
          <sphereGeometry args={[0.5, 32, 16]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.6} />
        </mesh>
        
        {/* Tail - flattened cone */}
        <mesh ref={tailRef} castShadow position={[-0.6, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.4, 0.5, 32]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.6} />
        </mesh>
        
        {/* Eyes - white spheres */}
        <mesh castShadow position={[0.3, 0.2, 0.3]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh castShadow position={[0.3, 0.2, -0.3]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
        
        {/* Pupils - black spheres */}
        <mesh castShadow position={[0.35, 0.2, 0.3]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh castShadow position={[0.35, 0.2, -0.3]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
        
        {/* White stripes (clownfish pattern) */}
        <mesh castShadow position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
          <meshStandardMaterial color="white" roughness={0.6} />
        </mesh>
        <mesh castShadow position={[-0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 0.1, 32]} />
          <meshStandardMaterial color="white" roughness={0.6} />
        </mesh>
        
        {/* Add fins for more fish-like appearance */}
        <mesh castShadow position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 3]}>
          <coneGeometry args={[0.3, 0.5, 16]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
};

// Create the forwarded component
const ForwardedNemo = React.forwardRef(Nemo);

// Add display name for debugging
ForwardedNemo.displayName = 'Nemo';

export default ForwardedNemo;

