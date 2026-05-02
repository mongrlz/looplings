import { Suspense, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Float, OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import LooplingsSteamDeck from '@/components/devices/LooplingsSteamDeck';
import type { SteamDeckDeviceState } from '@/components/devices/LooplingsSteamDeck';

const SCENE_COLORS = {
  background: '#050608',
  floor: '#0b0d0f',
  grid: '#17352a',
  glow: '#6dff8d',
  amber: '#ffbe63',
  blue: '#6db7ff',
};

function SignalRings() {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.82, 0.18]}>
      {[0.78, 1.16, 1.58, 2.05].map((radius, index) => (
        <mesh key={radius} position={[0, 0, index * -0.004]}>
          <ringGeometry args={[radius, radius + 0.01, 96]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? SCENE_COLORS.glow : SCENE_COLORS.blue}
            transparent
            opacity={0.18 - index * 0.028}
            depthWrite={false}
          />
        </mesh>
      ))}
      {Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2;
        const radius = index % 3 === 0 ? 1.86 : 1.34;
        return (
          <mesh key={index} position={[Math.cos(angle) * radius, Math.sin(angle) * radius, -0.03]}>
            <boxGeometry args={[0.018, 0.12, 0.01]} />
            <meshBasicMaterial color={SCENE_COLORS.amber} transparent opacity={0.22} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

function Backplane() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = SCENE_COLORS.floor;
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = 'rgba(109, 255, 141, 0.12)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 512; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255, 190, 99, 0.2)';
      for (let i = 0; i < 80; i += 1) {
        ctx.fillRect((i * 73) % 512, (i * 41) % 512, 2, 2);
      }
    }
    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(4, 4);
    return map;
  }, []);

  return (
    <mesh position={[0, -0.9, 0.25]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[7, 5]} />
      <meshStandardMaterial
        map={texture}
        color={SCENE_COLORS.grid}
        roughness={0.92}
        metalness={0.05}
        transparent
        opacity={0.52}
      />
    </mesh>
  );
}

function SceneLighting() {
  return (
    <>
      <fog attach="fog" args={[SCENE_COLORS.background, 4.8, 10]} />
      <ambientLight intensity={0.62} color="#d8fff0" />
      <directionalLight
        position={[-3.2, 3.8, 3.4]}
        intensity={2.4}
        color="#d6e8ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />
      <spotLight
        position={[0.8, 2.5, 2.8]}
        angle={0.42}
        penumbra={0.75}
        intensity={9.6}
        color={SCENE_COLORS.amber}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-1.4, 0.25, 1.5]} intensity={2.1} color={SCENE_COLORS.glow} />
      <pointLight position={[1.8, 0.6, -1.4]} intensity={1.55} color={SCENE_COLORS.blue} />
    </>
  );
}

function ResponsiveSteamDeck({ onDeviceState }: { onDeviceState?: (state: SteamDeckDeviceState) => void }) {
  const { size } = useThree();
  const isMobile = size.width < 700;

  return (
    <LooplingsSteamDeck
      position={[0, isMobile ? -0.14 : -0.08, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={isMobile ? 0.112 : 0.23}
      onStateChange={onDeviceState}
    />
  );
}

function PrimeDeviceContent({ onDeviceState }: { onDeviceState?: (state: SteamDeckDeviceState) => void }) {
  return (
    <Suspense fallback={null}>
      <SceneLighting />
      <Stars radius={18} depth={8} count={900} factor={1.4} saturation={0} fade speed={0.35} />
      <Backplane />
      <SignalRings />
      <Physics gravity={[0, 0, 0]} colliders={false}>
        <Float speed={1.35} rotationIntensity={0} floatIntensity={0.14}>
          <ResponsiveSteamDeck onDeviceState={onDeviceState} />
        </Float>
      </Physics>
      <ContactShadows position={[0, -0.86, 0.18]} opacity={0.38} scale={4.4} blur={2.2} far={3.2} />
    </Suspense>
  );
}

export default function PrimeDeviceScene({ onDeviceState }: { onDeviceState?: (state: SteamDeckDeviceState) => void }) {
  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: false }}>
      <color attach="background" args={[SCENE_COLORS.background]} />
      <PerspectiveCamera makeDefault position={[0, 0.52, 2.85]} fov={42} />
      <PrimeDeviceContent onDeviceState={onDeviceState} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableRotate={false}
        minDistance={2.15}
        maxDistance={4.3}
        target={[0, -0.05, 0]}
      />
    </Canvas>
  );
}
