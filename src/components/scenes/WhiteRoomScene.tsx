import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, RoundedBox, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import PrimeTerminalScreen from '@/components/screens/PrimeTerminalScreen';
import {
  HtmlInCanvasSurface,
  flipPlaneUvY,
} from '@/components/scenes/starter-room/HtmlInCanvasSurface';

const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 748;
const KEYBOARD_MODEL =
  '/models/room/mechanical_keyboard_aesthetic/mechanical_keyboard_aesthetic_interactive.glb';
const CAMERA_POSITION = new THREE.Vector3(0, 3.5, 11.35);
const CAMERA_TARGET = new THREE.Vector3(0, 3.15, -0.1);
const CAMERA_LIMITS = {
  yaw: 0.22,
  pitch: 0.08,
};

function LimitedLookCamera() {
  const { camera, gl } = useThree();
  const targetYaw = useRef(0);
  const targetPitch = useRef(0);
  const currentYaw = useRef(0);
  const currentPitch = useRef(0);
  const drag = useRef({
    active: false,
    pointerId: -1,
    x: 0,
    y: 0,
    yaw: 0,
    pitch: 0,
  });
  const baseDirection = useMemo(
    () => CAMERA_TARGET.clone().sub(CAMERA_POSITION).normalize(),
    [],
  );
  const lookDirection = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const baseYaw = Math.atan2(baseDirection.x, -baseDirection.z);
  const basePitch = Math.asin(baseDirection.y);

  useEffect(() => {
    const canvas = gl.domElement;
    camera.position.copy(CAMERA_POSITION);
    camera.updateProjectionMatrix();
    canvas.style.cursor = 'grab';

    const releasePointer = (event: PointerEvent) => {
      if (event.pointerId !== drag.current.pointerId) return;
      drag.current.active = false;
      canvas.style.cursor = 'grab';
      document.body.style.cursor = '';
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      drag.current = {
        active: true,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        yaw: targetYaw.current,
        pitch: targetPitch.current,
      };
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
      document.body.style.cursor = 'grabbing';
      event.preventDefault();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!drag.current.active || event.pointerId !== drag.current.pointerId) return;
      targetYaw.current = THREE.MathUtils.clamp(
        drag.current.yaw - (event.clientX - drag.current.x) * 0.0015,
        -CAMERA_LIMITS.yaw,
        CAMERA_LIMITS.yaw,
      );
      targetPitch.current = THREE.MathUtils.clamp(
        drag.current.pitch + (event.clientY - drag.current.y) * 0.0012,
        -CAMERA_LIMITS.pitch,
        CAMERA_LIMITS.pitch,
      );
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', releasePointer);
    canvas.addEventListener('pointercancel', releasePointer);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', releasePointer);
      canvas.removeEventListener('pointercancel', releasePointer);
      canvas.style.cursor = '';
      document.body.style.cursor = '';
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    currentYaw.current = THREE.MathUtils.damp(
      currentYaw.current,
      targetYaw.current,
      12,
      delta,
    );
    currentPitch.current = THREE.MathUtils.damp(
      currentPitch.current,
      targetPitch.current,
      12,
      delta,
    );

    const yaw = baseYaw + currentYaw.current;
    const pitch = basePitch + currentPitch.current;
    lookDirection.set(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch),
    );
    camera.position.copy(CAMERA_POSITION);
    lookTarget.copy(CAMERA_POSITION).addScaledVector(lookDirection, 12);
    camera.lookAt(lookTarget);
  });

  return null;
}

function VentBank({
  position,
  rotation = [0, 0, 0],
  count = 8,
  spacing = 0.18,
  length = 0.52,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  count?: number;
  spacing?: number;
  length?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: count }, (_, index) => (
        <mesh key={index} position={[(index - (count - 1) / 2) * spacing, 0, 0]} castShadow>
          <boxGeometry args={[0.08, length, 0.035]} />
          <meshStandardMaterial color="#999990" roughness={0.78} />
        </mesh>
      ))}
    </group>
  );
}

function ControlDial({
  position,
  radius,
}: {
  position: [number, number, number];
  radius: number;
}) {
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius, 0.12, 24]} />
        <meshStandardMaterial color="#afa99a" roughness={0.62} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.067, 0]}>
        <boxGeometry args={[0.035, 0.02, radius * 0.92]} />
        <meshStandardMaterial color="#55544f" roughness={0.65} />
      </mesh>
    </group>
  );
}

function ColorKeyboard() {
  const { scene } = useGLTF(KEYBOARD_MODEL);
  const keyboard = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      if (Array.isArray(object.material)) {
        object.material = object.material.map((material) => material.clone());
      } else {
        object.material = object.material.clone();
      }
    });

    const bounds = new THREE.Box3().setFromObject(clone);
    const center = bounds.getCenter(new THREE.Vector3());
    clone.position.set(-center.x, -bounds.min.y, -center.z);
    return clone;
  }, [scene]);

  return (
    <group position={[0, 0.035, 1.82]} scale={[1.66, 1.66, 1.66]}>
      <primitive object={keyboard} />
    </group>
  );
}

function CaseScrew({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.055, 18]} />
        <meshStandardMaterial color="#8e8b82" roughness={0.48} metalness={0.22} />
      </mesh>
      <mesh position={[0, 0.032, 0]}>
        <boxGeometry args={[0.085, 0.015, 0.018]} />
        <meshStandardMaterial color="#4f504c" roughness={0.56} />
      </mesh>
    </group>
  );
}

function PowerCable() {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.72, 1.2, -1.4),
        new THREE.Vector3(-3.32, 0.72, -1.72),
        new THREE.Vector3(-3.58, 0.12, -2.28),
        new THREE.Vector3(-4.38, 0.06, -3.1),
      ]),
    [],
  );

  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 42, 0.055, 10, false]} />
      <meshStandardMaterial color="#4b4b47" roughness={0.82} />
    </mesh>
  );
}

function PrimeScreen() {
  const screenRef = useRef<THREE.Mesh>(null);
  const screenContent = useMemo(
    () => (
      <div className="white-room-prime-surface">
        <PrimeTerminalScreen />
      </div>
    ),
    [],
  );

  return (
    <>
      <mesh ref={screenRef} position={[0, 0.12, 1.43]} receiveShadow>
        <planeGeometry args={[6.18, 3.61, 32, 20]} onUpdate={flipPlaneUvY} />
        <meshBasicMaterial color="#172018" toneMapped={false} />
      </mesh>
      <HtmlInCanvasSurface
        meshRef={screenRef}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        animated
        effects={false}
        barrel={0.018}
        brightness={1.08}
        flicker={0}
        phosphor={0}
        reflection={0.2}
        scanlines={0.48}
        uploadFps={5}
        warmupFrames={6}
      >
        {screenContent}
      </HtmlInCanvasSurface>
      <mesh position={[0, 0.12, 1.445]}>
        <planeGeometry args={[6.24, 3.67]} />
        <meshBasicMaterial
          color="#dff7eb"
          transparent
          opacity={0.04}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

function GiantCRT() {
  return (
    <group position={[0, 3.3, -0.35]}>
      <RoundedBox
        args={[6.62, 4.15, 2.9]}
        radius={0.46}
        smoothness={8}
        position={[0, 0.06, -0.44]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#c5c0b4" roughness={0.76} />
      </RoundedBox>

      <RoundedBox args={[7.35, 4.75, 2.45]} radius={0.3} smoothness={7} castShadow receiveShadow>
        <meshStandardMaterial color="#d7d2c6" roughness={0.72} />
      </RoundedBox>

      <RoundedBox
        args={[6.68, 4.1, 0.3]}
        radius={0.26}
        smoothness={6}
        position={[0, 0.12, 1.24]}
        castShadow
      >
        <meshStandardMaterial color="#171a17" roughness={0.54} />
      </RoundedBox>

      <PrimeScreen />

      <RoundedBox
        args={[6.52, 0.42, 0.23]}
        radius={0.12}
        smoothness={4}
        position={[0, -2.08, 1.23]}
        castShadow
      >
        <meshStandardMaterial color="#c8c2b5" roughness={0.7} />
      </RoundedBox>

      <mesh position={[-1.74, -2.07, 1.36]} castShadow>
        <boxGeometry args={[1.5, 0.12, 0.08]} />
        <meshStandardMaterial color="#6d6a63" roughness={0.74} />
      </mesh>
      <mesh position={[-1.74, -1.94, 1.36]} castShadow>
        <boxGeometry args={[1.5, 0.052, 0.08]} />
        <meshStandardMaterial color="#77736b" roughness={0.74} />
      </mesh>

      <ControlDial position={[2.16, -2.02, 1.36]} radius={0.14} />
      <ControlDial position={[2.62, -2.02, 1.36]} radius={0.095} />

      <mesh position={[3.02, -2.03, 1.36]}>
        <sphereGeometry args={[0.062, 16, 12]} />
        <meshStandardMaterial
          color="#64d67a"
          emissive="#3eba58"
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>

      <VentBank
        position={[0, 2.39, 0.14]}
        rotation={[Math.PI / 2, 0, 0]}
        count={14}
        spacing={0.22}
        length={0.72}
      />
      <VentBank
        position={[-3.69, 0.24, -0.18]}
        rotation={[0, Math.PI / 2, 0]}
        count={11}
        spacing={0.21}
        length={0.74}
      />

      <RoundedBox
        args={[2.5, 0.28, 0.52]}
        radius={0.12}
        smoothness={4}
        position={[0, 2.55, -0.28]}
        castShadow
      >
        <meshStandardMaterial color="#aaa69c" roughness={0.8} />
      </RoundedBox>
      <mesh position={[-1.02, 2.42, -0.28]} castShadow>
        <boxGeometry args={[0.22, 0.4, 0.38]} />
        <meshStandardMaterial color="#aaa69c" roughness={0.8} />
      </mesh>
      <mesh position={[1.02, 2.42, -0.28]} castShadow>
        <boxGeometry args={[0.22, 0.4, 0.38]} />
        <meshStandardMaterial color="#aaa69c" roughness={0.8} />
      </mesh>

      <CaseScrew position={[-3.53, 2.15, 1.26]} />
      <CaseScrew position={[3.53, 2.15, 1.26]} />
      <CaseScrew position={[-3.53, -2.15, 1.26]} />
      <CaseScrew position={[3.53, -2.15, 1.26]} />

      <RoundedBox
        args={[0.62, 0.82, 1.02]}
        radius={0.14}
        smoothness={4}
        position={[-2.42, -2.72, -0.08]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#bcb7aa" roughness={0.8} />
      </RoundedBox>
      <RoundedBox
        args={[0.62, 0.82, 1.02]}
        radius={0.14}
        smoothness={4}
        position={[2.42, -2.72, -0.08]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#bcb7aa" roughness={0.8} />
      </RoundedBox>
      <RoundedBox
        args={[1.52, 0.22, 1.42]}
        radius={0.1}
        smoothness={4}
        position={[-2.42, -3.13, 0.04]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#aaa69a" roughness={0.84} />
      </RoundedBox>
      <RoundedBox
        args={[1.52, 0.22, 1.42]}
        radius={0.1}
        smoothness={4}
        position={[2.42, -3.13, 0.04]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#aaa69a" roughness={0.84} />
      </RoundedBox>
    </group>
  );
}

function WhiteAbyss() {
  return (
    <>
      <color attach="background" args={['#f5f5f2']} />
      <fog attach="fog" args={['#f5f5f2', 13, 32]} />
      <hemisphereLight args={['#ffffff', '#d9d9d2', 1.8]} />
      <directionalLight
        castShadow
        color="#fffdf7"
        intensity={3.2}
        position={[-7, 11, 8]}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-4}
      />
      <spotLight
        color="#ffffff"
        intensity={6}
        angle={0.65}
        penumbra={0.9}
        position={[7, 9, 7]}
        target-position={[0, 2, 0]}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#f1f1ee" roughness={0.98} />
      </mesh>

      <GiantCRT />
      <Suspense fallback={null}>
        <ColorKeyboard />
      </Suspense>
      <PowerCable />

      <ContactShadows
        position={[0, 0.015, 0]}
        opacity={0.22}
        scale={14}
        blur={2.8}
        far={9}
        color="#77776f"
      />
    </>
  );
}

useGLTF.preload(KEYBOARD_MODEL);

export default function WhiteRoomScene() {
  return (
    <Canvas
      className="white-room-canvas"
      shadows
      dpr={[1, 1.5]}
      camera={{
        position: CAMERA_POSITION.toArray(),
        fov: 42,
        near: 0.1,
        far: 80,
      }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
    >
      <LimitedLookCamera />
      <WhiteAbyss />
    </Canvas>
  );
}
