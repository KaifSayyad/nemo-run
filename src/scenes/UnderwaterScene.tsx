import { useEffect, useRef, useMemo, useState } from 'react';
import { useThree, useFrame, extend } from '@react-three/fiber';
import { Plane, Points, PointMaterial, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { ENVIRONMENT } from '../utils/constants';

interface UnderwaterSceneProps {
  children?: React.ReactNode;
  isPlaying?: boolean;
}

// Helper function to create random particles
const createParticles = (count: number, spread: number) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * spread; // x
    positions[i3 + 1] = Math.random() * spread - spread * 0.1; // y
    positions[i3 + 2] = (Math.random() - 0.5) * spread * 2; // z (extended range for depth)
  }
  return positions;
};

// Helper component for bubbles
const Bubbles = ({ count = 200, isPlaying = false }) => {
  const points = useRef<THREE.Points>(null);
  const [positions] = useState(() => createParticles(count, 20));
  
  useFrame((state, delta) => {
    if (!points.current || !isPlaying) return;
    
    const positions = points.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      // Move bubbles upward
      positions[i + 1] += delta * (0.2 + Math.random() * 0.3);
      
      // Add slight horizontal drift
      positions[i] += Math.sin(state.clock.elapsedTime * 0.5 + i) * delta * 0.1;
      
      // Reset bubbles that reach the top
      if (positions[i + 1] > 10) {
        positions[i + 1] = -10;
        positions[i] = (Math.random() - 0.5) * 20;
        positions[i + 2] = (Math.random() - 0.5) * 40;
      }
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <Points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        transparent
        color="#aaddff"
        size={0.1}
        sizeAttenuation
        depthWrite={false}
        opacity={0.8}
      />
    </Points>
  );
};

// Main underwater scene component
const UnderwaterScene: React.FC<UnderwaterSceneProps> = ({ children, isPlaying = false }) => {
  const { scene } = useThree();
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const seaFloorRef = useRef<THREE.Mesh>(null);
  const seaweedGroupRef = useRef<THREE.Group>(null);
  
  // Set up scene environment when component mounts
  useEffect(() => {
    // Set background color
    scene.background = new THREE.Color(ENVIRONMENT.BACKGROUND_COLOR);
    
    // Add fog for underwater effect with improved depth perception
    scene.fog = new THREE.FogExp2(
      ENVIRONMENT.FOG_COLOR,
      0.025 // Exponential density for better depth effect
    );
  }, [scene]);
  
  // Create seaweed instances for background decoration
  const seaweedInstances = useMemo(() => {
    const instances = [];
    for (let i = 0; i < 40; i++) {
      instances.push({
        position: [
          (Math.random() - 0.5) * 40, // x position
          -5, // y position (at ocean floor)
          (Math.random() - 0.5) * 60 - 20 // z position (biased toward the distance)
        ],
        scale: [
          0.5 + Math.random() * 0.5,
          2 + Math.random() * 3,
          0.5 + Math.random() * 0.5
        ],
        rotation: [0, Math.random() * Math.PI * 2, 0],
        phase: Math.random() * Math.PI * 2, // Random starting phase
        speed: 0.5 + Math.random() * 0.5 // Random speed
      });
    }
    return instances;
  }, []);
  
  // Animate elements to create underwater movement
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    // Animate directional light to simulate sun rays through water
    if (directionalLightRef.current) {
      directionalLightRef.current.position.x = Math.sin(time * 0.5) * 10;
      directionalLightRef.current.position.z = Math.cos(time * 0.5) * 10;
    }
    
    // Animate ocean floor movement to create forward motion illusion
    if (seaFloorRef.current && isPlaying) {
      // Move texture coordinates for scrolling effect
      if (seaFloorRef.current.material instanceof THREE.MeshStandardMaterial) {
        if (!seaFloorRef.current.material.map) {
          // Create a repeating texture if it doesn't exist
          const texture = new THREE.TextureLoader().load(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
          );
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(10, 10);
          seaFloorRef.current.material.map = texture;
        }
        
        // Scroll texture for movement effect
        seaFloorRef.current.material.map.offset.z += 0.002;
      }
    }
    
    // Animate seaweed
    if (seaweedGroupRef.current) {
      seaweedInstances.forEach((instance, i) => {
        const child = seaweedGroupRef.current?.children[i];
        if (child) {
          // Sway seaweed with sine waves
          const swayAmount = 0.1;
          const swayFrequency = instance.speed;
          child.rotation.z = Math.sin(time * swayFrequency + instance.phase) * swayAmount;
          
          // Move seaweed forward if game is playing
          if (isPlaying) {
            child.position.z += 0.05;
            // Reset seaweed when it goes past the camera
            if (child.position.z > 20) {
              child.position.z = -60 + Math.random() * 10;
              child.position.x = (Math.random() - 0.5) * 40;
            }
          }
        }
      });
    }
  });

  // Create caustics texture for underwater light effect
  const causticTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    );
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, []);

  return (
    <>
      {/* Ambient light for general underwater illumination */}
      <ambientLight 
        color={ENVIRONMENT.AMBIENT_LIGHT_COLOR} 
        intensity={ENVIRONMENT.AMBIENT_LIGHT_INTENSITY * 1.2} 
      />
      
      {/* Directional light for sun rays effect */}
      <directionalLight
        ref={directionalLightRef}
        color={ENVIRONMENT.LIGHT_COLOR}
        intensity={ENVIRONMENT.LIGHT_INTENSITY}
        position={[0, 10, 0]}
        castShadow
      >
        {/* Add target to control light direction */}
        <object3D position={[0, 0, 0]} />
      </directionalLight>
      
      {/* Add a secondary light for better underwater illumination */}
      <spotLight
        position={[0, 10, -10]}
        angle={0.6}
        penumbra={0.5}
        intensity={0.5}
        color="#4d88b5"
        castShadow
      />
      
      {/* Ocean floor with scrolling texture */}
      <Plane 
        ref={seaFloorRef}
        args={[200, 200]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -5, 0]}
        receiveShadow
      >
        <meshStandardMaterial 
          color="#2a6c8f" 
          roughness={0.8}
          metalness={0.2}
          map={causticTexture}
        />
      </Plane>
      
      {/* Background seaweed */}
      <group ref={seaweedGroupRef}>
        {seaweedInstances.map((instance, index) => (
          <mesh
            key={index}
            position={instance.position as [number, number, number]}
            scale={instance.scale as [number, number, number]}
            rotation={instance.rotation as [number, number, number]}
            castShadow
          >
            <cylinderGeometry args={[0.1, 0.2, 1, 8]} />
            <meshStandardMaterial color="#2e8b57" roughness={0.7} />
          </mesh>
        ))}
      </group>
      
      {/* Distant rocks for parallax effect */}
      {[...Array(15)].map((_, i) => (
        <mesh
          key={`rock-${i}`}
          position={[
            (Math.random() - 0.5) * 60,
            -4 + Math.random() * 2,
            -80 + Math.random() * 40
          ]}
          rotation={[Math.random(), Math.random(), Math.random()]}
          scale={[3 + Math.random() * 5, 3 + Math.random() * 5, 3 + Math.random() * 5]}
          castShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#445566" roughness={0.8} metalness={0.2} />
        </mesh>
      ))}
      
      {/* Bubbles particle system */}
      <Bubbles count={200} isPlaying={isPlaying} />
      
      {/* Light rays */}
      {[...Array(8)].map((_, i) => (
        <LightRay 
          key={`ray-${i}`}
          position={[
            (Math.random() - 0.5) * 40, 
            10 + Math.random() * 5, 
            -20 + Math.random() * 30
          ]}
          rotation={[
            0.1 * Math.random(), 
            0.1 * Math.random(), 
            Math.PI / 2 + (Math.random() - 0.5) * 0.2
          ]}
          scale={[
            8 + Math.random() * 5, 
            0.5 + Math.random() * 0.5, 
            12 + Math.random() * 8
          ]}
          intensity={0.3 + Math.random() * 0.3}
          speed={0.2 + Math.random() * 0.3}
          color="#4d9be6"
          isPlaying={isPlaying}
        />
      ))}
      
      {/* Volumetric light */}
      <VolumetricLight isPlaying={isPlaying} />
    </>
  );
};

// Light ray shader material
// Light ray shader material definition
const LightRayMaterial = shaderMaterial(
  // Uniforms
  {
    time: { value: 0 },
    color: { value: new THREE.Color(0x4d9be6) },
    intensity: { value: 0.5 },
    speed: { value: 0.5 },
    isPlaying: { value: true },
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      vUv = uv;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;
      gl_Position = projectedPosition;
    }
  `,
  // Fragment Shader
  `
    uniform float time;
    uniform vec3 color;
    uniform float intensity;
    uniform float speed;
    uniform bool isPlaying;
    
    varying vec2 vUv;
    
    void main() {
      float t = isPlaying ? time * speed : 0.0;
      
      // Create a subtle wave pattern
      float wave = sin(vUv.y * 10.0 + t) * 0.5 + 0.5;
      
      // Fade from bottom to top
      float fade = pow(vUv.y, 2.0);
      
      // Apply radial gradient from center to edges
      float radial = 1.0 - 2.0 * length(vUv - vec2(0.5));
      radial = smoothstep(0.0, 0.5, radial);
      
      // Combine effects
      float alpha = fade * radial * intensity * (0.7 + wave * 0.3);
      
      // Create final color with transparency
      gl_FragColor = vec4(color, alpha);
    }
  `
);

// Register the shader material
extend({ LightRayMaterial });

// Light ray component
interface LightRayProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
  intensity?: number;
  speed?: number;
  isPlaying?: boolean;
}

const LightRay: React.FC<LightRayProps> = ({
  position,
  rotation = [0, 0, Math.PI / 2],
  scale = [10, 0.5, 15],
  color = "#4d9be6",
  intensity = 0.5,
  speed = 0.3,
  isPlaying = true
}) => {
  const materialRef = useRef<any>();
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.time = state.clock.elapsedTime;
    }
  });
  
  return (
    <mesh 
      position={position} 
      rotation={rotation as [number, number, number]} 
      scale={scale as [number, number, number]}
    >
      <planeGeometry args={[1, 1, 1, 32]} />
      {/* @ts-ignore */}
      <lightRayMaterial 
        ref={materialRef} 
        transparent={true} 
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        color={new THREE.Color(color)}
        intensity={intensity}
        speed={speed}
        isPlaying={isPlaying}
      />
    </mesh>
  );
};

// Volumetric lighting component for overall underwater atmosphere
interface VolumetricLightProps {
  isPlaying?: boolean;
}

const VolumetricLight: React.FC<VolumetricLightProps> = ({ isPlaying = true }) => {
  const { camera } = useThree();
  const fogRef = useRef<THREE.Fog | null>(null);
  const waterFogMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  
  // Custom shader for volumetric fog
  const waterFogMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color("#1a4569") },
        fogDensity: { value: 0.03 },
        fogNear: { value: 1 },
        fogFar: { value: 30 },
        isPlaying: { value: isPlaying },
        cameraPos: { value: new THREE.Vector3() }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        uniform float fogDensity;
        uniform float fogNear;
        uniform float fogFar;
        uniform bool isPlaying;
        uniform vec3 cameraPos;
        
        varying vec3 vWorldPosition;
        
        float rand(vec2 co) {
          return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          float t = isPlaying ? time * 0.1 : 0.0;
          
          // Calculate distance to camera
          float dist = length(vWorldPosition - cameraPos);
          
          // Apply fog based on distance
          float fogFactor = smoothstep(fogNear, fogFar, dist);
          fogFactor = 1.0 - exp(-fogDensity * fogFactor * fogFactor);
          
          // Add noise to create volumetric effect
          float noise = rand(vWorldPosition.xy * 0.01 + vec2(t));
          float sineWave = sin(vWorldPosition.y * 0.2 + t) * 0.5 + 0.5;
          
          // Final color
          vec3 finalColor = mix(vec3(0.0), color, fogFactor * (0.7 + 0.3 * sineWave + 0.1 * noise));
          float alpha = min(0.7, fogFactor * 0.5);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
  }, []);
  
  useEffect(() => {
    if (waterFogMaterialRef.current) {
      waterFogMaterialRef.current.uniforms.isPlaying.value = isPlaying;
    }
  }, [isPlaying]);
  
  useFrame((state) => {
    if (waterFogMaterialRef.current) {
      waterFogMaterialRef.current.uniforms.time.value = state.clock.elapsedTime;
      waterFogMaterialRef.current.uniforms.cameraPos.value.copy(camera.position);
    }
  });
  
  return (
    <mesh>
      <sphereGeometry args={[40, 32, 32]} />
      <primitive object={waterFogMaterial} ref={waterFogMaterialRef} attach="material" />
    </mesh>
  );
};

export default UnderwaterScene;

