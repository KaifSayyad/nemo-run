import { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GAME_SETTINGS } from '../utils/constants';

// Define obstacle types
type ObstacleType = 'coral' | 'seaweed' | 'rock' | 'shark' | 'jellyfish';

// Interface for individual obstacle
interface Obstacle {
  id: number;
  type: ObstacleType;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  rotation: THREE.Euler;
  speed: number;
  active: boolean;
  color: string;
  animationOffset: number;
  movementPattern?: 'upDown' | 'leftRight' | 'zigzag' | 'static';
  amplitude?: number;
  frequency?: number;
}

// Interface for component props
interface ObstaclesProps {
  score: number;
  isPlaying: boolean;
  nemoRef: React.RefObject<THREE.Group>;
  onCollision: () => void;
}

/**
 * Obstacles component that generates and manages various obstacles
 * that Nemo needs to avoid in the game
 */
const Obstacles: React.FC<ObstaclesProps> = ({ 
  score, 
  isPlaying, 
  nemoRef, 
  onCollision 
}) => {
  // State for obstacles
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  
  // Reference to the obstacles group
  const obstaclesGroupRef = useRef<THREE.Group>(null);
  
  // Track last spawn time for throttling
  const lastSpawnTimeRef = useRef<number>(0);
  
  // Track obstacle counter for unique IDs
  const obstacleCounterRef = useRef<number>(0);
  
  // Track collision state to prevent multiple collisions
  const hasCollidedRef = useRef<boolean>(false);
  
  // Obstacle colors
  const obstacleColors = useMemo(() => ({
    coral: '#ff6f61', // Coral red
    seaweed: '#2e8b57', // Sea green
    rock: '#696969', // Dark gray
    shark: '#708090', // Slate gray
    jellyfish: '#9370db', // Medium purple
  }), []);
  
  // Obstacle configurations
  const obstacleConfigs = useMemo(() => ({
    coral: {
      scale: [0.8, 1.5, 0.8],
      movement: 'static',
      yPosition: -3.5, // Bottom positioned
      collisionRadius: 1,
    },
    seaweed: {
      scale: [0.5, 2.5, 0.5],
      movement: 'leftRight',
      yPosition: -3, // Bottom positioned
      amplitude: 0.2,
      frequency: 2,
      collisionRadius: 0.8,
    },
    rock: {
      scale: [1.2, 1.2, 1.2],
      movement: 'static',
      yPosition: -2, // Can be at various heights
      collisionRadius: 1.1,
    },
    shark: {
      scale: [1.5, 0.7, 0.7],
      movement: 'zigzag',
      yPosition: 0, // Swims at mid-level
      amplitude: 1.5,
      frequency: 0.5,
      collisionRadius: 1.2,
    },
    jellyfish: {
      scale: [0.8, 1.2, 0.8],
      movement: 'upDown',
      yPosition: 1, // Floats near the top
      amplitude: 1.5,
      frequency: 0.8,
      collisionRadius: 0.7,
    }
  }), []);
  
  // Calculate difficulty factor based on score
  const getDifficultyFactor = (currentScore: number) => {
    return 1 + (currentScore / 5000); // Gradually increase difficulty
  };
  
  // Spawn a new obstacle
  const spawnObstacle = () => {
    if (!isPlaying) return;
    
    // Calculate spawn rate based on difficulty
    const difficulty = getDifficultyFactor(score);
    const spawnInterval = GAME_SETTINGS.OBSTACLE_SPAWN_RATE / difficulty;
    
    // Check if enough time has passed since the last spawn
    const currentTime = Date.now();
    if (currentTime - lastSpawnTimeRef.current < spawnInterval) return;
    
    // Update the last spawn time
    lastSpawnTimeRef.current = currentTime;
    
    // Random obstacle type
    const obstacleTypes: ObstacleType[] = ['coral', 'seaweed', 'rock', 'shark', 'jellyfish'];
    const randomTypeIndex = Math.floor(Math.random() * obstacleTypes.length);
    const type = obstacleTypes[randomTypeIndex];
    
    // Get configuration for this obstacle type
    const config = obstacleConfigs[type];
    
    // Calculate random position
    // Obstacles always spawn at the far end and move toward the player
    const xPos = Math.random() * 10 - 5; // Random x position between -5 and 5
    let yPos = config.yPosition;
    
    // Add some randomness to y position except for floor objects (coral, seaweed)
    if (type !== 'coral' && type !== 'seaweed') {
      yPos += Math.random() * 3 - 1.5; // Random variance
    }
    
    const zPos = -GAME_SETTINGS.OBSTACLE_SPAWN_DISTANCE;
    
    // Create new obstacle
    const newObstacle: Obstacle = {
      id: obstacleCounterRef.current++,
      type,
      position: new THREE.Vector3(xPos, yPos, zPos),
      scale: new THREE.Vector3(
        config.scale[0], 
        config.scale[1], 
        config.scale[2]
      ),
      rotation: new THREE.Euler(0, 0, 0),
      speed: GAME_SETTINGS.INITIAL_SPEED * difficulty,
      active: true,
      color: obstacleColors[type],
      animationOffset: Math.random() * Math.PI * 2,
      movementPattern: config.movement as any,
      amplitude: config.amplitude || 0,
      frequency: config.frequency || 0,
    };
    
    // Add obstacle to the state
    setObstacles(prevObstacles => [...prevObstacles, newObstacle]);
  };
  
  // Check for collisions between Nemo and obstacles
  const checkCollisions = () => {
    if (!nemoRef.current || !obstaclesGroupRef.current || hasCollidedRef.current) return;
    
    // Only check if game is active
    if (!isPlaying) return;
    
    // Get Nemo's position and size
    const nemoPosition = new THREE.Vector3();
    nemoRef.current.getWorldPosition(nemoPosition);
    
    // Nemo's collision radius should scale with size
    const nemoSize = nemoRef.current.scale.x;
    const nemoRadius = 0.5 * nemoSize * GAME_SETTINGS.COLLISION_THRESHOLD;
    
    // Check each obstacle
    obstacles.forEach((obstacle) => {
      if (!obstacle.active) return;
      
      // Get obstacle position from the actual mesh
      const obstacleObj = obstaclesGroupRef.current?.getObjectByName(`obstacle-${obstacle.id}`);
      if (!obstacleObj) return;
      
      const obstaclePosition = new THREE.Vector3();
      obstacleObj.getWorldPosition(obstaclePosition);
      
      // Get collision radius for this obstacle type
      const obstacleRadius = obstacleConfigs[obstacle.type].collisionRadius;
      
      // Calculate distance between Nemo and obstacle
      const distance = nemoPosition.distanceTo(obstaclePosition);
      
      // Check if collision occurred
      if (distance < nemoRadius + obstacleRadius) {
        // Mark as collided to prevent multiple collision events
        hasCollidedRef.current = true;
        
        // Trigger collision callback
        onCollision();
      }
    });
  };
  
  // Effect to reset collision state when game starts
  useEffect(() => {
    if (isPlaying) {
      hasCollidedRef.current = false;
    }
  }, [isPlaying]);
  
  // Animation and game logic
  useFrame((state, delta) => {
    if (!isPlaying || !obstaclesGroupRef.current) return;
    
    // Check if we need to spawn a new obstacle
    spawnObstacle();
    
    // Check for collisions
    checkCollisions();
    
    // Update obstacles
    setObstacles(prevObstacles => {
      return prevObstacles.map(obstacle => {
        if (!obstacle.active) return obstacle;
        
        // Get obstacle mesh
        const obstacleMesh = obstaclesGroupRef.current?.getObjectByName(`obstacle-${obstacle.id}`);
        if (!obstacleMesh) return obstacle;
        
        // Move obstacle toward player (positive Z direction)
        const newPosition = obstacle.position.clone();
        newPosition.z += obstacle.speed * delta * 60;
        
        // Apply different movement patterns
        if (obstacle.movementPattern === 'upDown') {
          // Up and down movement
          newPosition.y += Math.sin(
            (state.clock.elapsedTime + obstacle.animationOffset) * obstacle.frequency!
          ) * obstacle.amplitude! * delta;
        } else if (obstacle.movementPattern === 'leftRight') {
          // Left and right movement
          newPosition.x += Math.sin(
            (state.clock.elapsedTime + obstacle.animationOffset) * obstacle.frequency!
          ) * obstacle.amplitude! * delta;
        } else if (obstacle.movementPattern === 'zigzag') {
          // Zigzag movement (combination of x and z)
          newPosition.x += Math.sin(
            (state.clock.elapsedTime + obstacle.animationOffset) * obstacle.frequency!
          ) * obstacle.amplitude! * delta;
          
          // Add small y oscillation for sharks
          if (obstacle.type === 'shark') {
            newPosition.y += Math.sin(
              (state.clock.elapsedTime + obstacle.animationOffset) * obstacle.frequency! * 2
            ) * (obstacle.amplitude! / 3) * delta;
          }
        }
        
        // Set position
        obstacleMesh.position.copy(newPosition);
        
        // Add rotation for some objects
        if (obstacle.type === 'shark') {
          // Make shark face the direction it's moving
          const direction = Math.sin(
            (state.clock.elapsedTime + obstacle.animationOffset) * obstacle.frequency!
          );
          obstacleMesh.rotation.y = Math.PI + (direction * 0.5);
        } else if (obstacle.type === 'jellyfish') {
          // Make jellyfish pulsate
          const scale = obstacle.scale.clone();
          const pulseFactor = Math.sin(state.clock.elapsedTime * 4 + obstacle.animationOffset) * 0.1 + 1;
          obstacleMesh.scale.set(
            scale.x * pulseFactor,
            scale.y * (1 / pulseFactor), // Squeeze effect
            scale.z * pulseFactor
          );
        }
        
        // Check if obstacle is out of bounds (passed the player)
        const isOutOfBounds = newPosition.z > 20;
        
        // Return updated obstacle
        return {
          ...obstacle,
          position: newPosition,
          active: !isOutOfBounds
        };
      }).filter(obstacle => obstacle.active); // Remove inactive obstacles
    });
  });
  
  // Render obstacle based on its type
  const renderObstacle = (obstacle: Obstacle) => {
    switch (obstacle.type) {
      case 'coral':
        return (
          <group name={`obstacle-${obstacle.id}`} position={obstacle.position} scale={obstacle.scale}>
            {/* Coral base */}
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.5, 0.8, 1, 8]} />
              <meshStandardMaterial color={obstacle.color} roughness={0.8} />
            </mesh>
            {/* Coral branches */}
            <mesh castShadow position={[0.3, 0.6, 0]} rotation={[0, 0, 0.5]}>
              <cylinderGeometry args={[0.1, 0.3, 0.8, 6]} />
              <meshStandardMaterial color={obstacle.color} roughness={0.8} />
            </mesh>
            <mesh castShadow position={[-0.3, 0.5, 0.1]} rotation={[0, 0, -0.4]}>
              <cylinderGeometry args={[0.1, 0.3, 0.7, 6]} />
              <meshStandardMaterial color={obstacle.color} roughness={0.8} />
            </mesh>
            <mesh castShadow position={[0, 0.7, -0.2]} rotation={[0.3, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.3, 0.9, 6]} />
              <meshStandardMaterial color={obstacle.color} roughness={0.8} />
            </mesh>
          </group>
        );
        
      case 'seaweed':
        return (
          <group name={`obstacle-${obstacle.id}`} position={obstacle.position} scale={obstacle.scale}>
            {/* Seaweed stalk */}
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.1, 0.2, 2, 8]} />
              <meshStandardMaterial color={obstacle.color} roughness={0.7} />
            </mesh>
            {/* Seaweed leaves */}
            <mesh castShadow position={[0.2, 0.7, 0]} rotation={[0, 0, 0.5]}>
              <boxGeometry args={[0.4, 0.1, 0.05]} />
              <meshStandardMaterial color={obstacle.color} roughness={0.7} />
            </mesh>
            <mesh castShadow position={[-0.2, 0.5, 0]} rotation={[0, 0, -0.5]}>
              <boxGeometry args={[0.4, 0.1, 0.05]} />
              <meshStandardMaterial color={obstacle.color} roughness={0.7} />
            </mesh>
            <mesh castShadow position={[0.2, 0.3, 0]} rotation={[0, 0, 0.5]}>
              <boxGeometry args={[0.4, 0.1, 0.05]} />
              <meshStandardMaterial color={obstacle.color} roughness={0.7} />
            </mesh>
          </group>
        );
        
      case 'rock':
        return (
          <group name={`obstacle-${obstacle.id}`} position={obstacle.position} scale={obstacle.scale}>
            {/* Main rock */}
            <mesh castShadow receiveShadow>
              <dodecahedronGeometry args={[0.8, 0]} />
              <meshStandardMaterial color={obstacle.color} roughness={0.9} metalness={0.1} />
            </mesh>
            {/* Smaller rock pieces */}
            <mesh castShadow position={[0.6, -0.4, 0.3]}>
              <dodecahedronGeometry args={[0.3, 0]} />
              <meshStandardMaterial color={obstacle.color} roughness={0.9} metalness={0.1} />
            </mesh>
            <mesh castShadow position={[-0.5, -0.3, -0.3]}>
              <dodecahedronGeometry args={[0.4, 0]} />
              <meshStandardMaterial color={obstacle.color} roughness={0.9} metalness={0.1} />
            </mesh>
          </group>
        );
        
      case 'shark':
        return (
          <group name={`obstacle-${obstacle.id}`} position={obstacle.position} scale={obstacle.scale} rotation={[0, Math.PI, 0]}>
            {/* Shark body */}
            <mesh castShadow>
              <capsuleGeometry args={[0.6, 1.5, 4, 8]} />
              <meshStandardMaterial color={obstacle.color} roughness={0.6} />
            </mesh>
            {/* Shark tail */}
            <mesh castShadow position={[-1, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
              <coneGeometry args={[0.5, 1, 16]} />
              <meshStandardMaterial color={obstacle.color} roughness={0.6} />
            </mesh>
            {/* Shark fin */}
            <mesh castShadow position={[0, 0.8, 0]} rotation={[0, 0, Math.PI / 3]}>
              <coneGeometry args={[0.2, 0.8, 8]} />
              <meshStandardMaterial color={obstacle.color} roughness={0.6} />
            </mesh>
            {/* Shark eyes */}
            <mesh castShadow position={[0.6, 0.2, 0.4]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color="black" />
            </mesh>
            <mesh castShadow position={[0.6, 0.2, -0.4]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color="black" />
            </mesh>
          </group>
        );
        
      case 'jellyfish':
        return (
          <group name={`obstacle-${obstacle.id}`} position={obstacle.position} scale={obstacle.scale}>
            {/* Jellyfish dome */}
            <mesh castShadow>
              <hemisphereGeometry args={[0.8, 0.6, 16]} />
              <meshStandardMaterial color={obstacle.color} roughness={0.3} transparent opacity={0.8} />
            </mesh>
            {/* Jellyfish tentacles */}
            {[...Array(8)].map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const xOffset = Math.cos(angle) * 0.3;
              const zOffset = Math.sin(angle) * 0.3;
              return (
                <mesh 
                  key={i} 
                  castShadow 
                  position={[xOffset, -0.5, zOffset]} 
                  rotation={[0.2 * Math.cos(angle), 0, 0.2 * Math.sin(angle)]}
                >
                  <cylinderGeometry args={[0.03, 0.03, 1 + (i % 3) * 0.4, 8]} />
                  <meshStandardMaterial color={obstacle.color} roughness={0.3} transparent opacity={0.7} />
                </mesh>
              );
            })}
          </group>
        );
        
      default:
        return null;
    }
  };
  
  // Render all obstacles
  return (
    <group ref={obstaclesGroupRef}>
      {obstacles.map(obstacle => renderObstacle(obstacle))}
    </group>
  );
};

export default Obstacles;

