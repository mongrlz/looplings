import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, useGLTF } from '@react-three/drei';
import { useFrame, type ThreeElements, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { SpecialPixel } from '@/components/sprites/SpecialSprite';
import { PALETTE_PRIME, PRIME_FRAMES } from '@/components/sprites/PrimeFrames';

export type ScreenMode = 'idle' | 'wallet' | 'tools' | 'signal';

export interface SteamDeckDeviceState {
  mode: ScreenMode;
  label: string;
  lastInput: string;
  primeOffset: { x: number; y: number };
}

type ControlMeshName =
  | 'Button_A'
  | 'Button_B'
  | 'Button_X'
  | 'Button_Y'
  | 'Button_Start'
  | 'Button_Back'
  | 'Button_Menu_Right'
  | 'Button_Menu_Left'
  | 'Button_Steam'
  | 'Button_QuickAccess'
  | 'Bumper_Left'
  | 'Bumper_Right'
  | 'Joystick_Left'
  | 'Joystick_Right'
  | 'Joystick_Left_Hit'
  | 'Joystick_Right_Hit'
  | 'Trackpad_Left'
  | 'Trackpad_Right'
  | 'DPad';

type StickSide = 'left' | 'right';

type StickTilt = Record<StickSide, { x: number; y: number; active: boolean }>;
type DPadVector = { x: number; y: number; active: boolean };
type DeviceControlAction = {
  mode: ScreenMode;
  inputLabel: string;
  activeControl: ControlMeshName;
};

type PrimeMotion = {
  inputTarget: THREE.Vector2;
  inputCurrent: THREE.Vector2;
  position: THREE.Vector2;
  velocity: THREE.Vector2;
};

const SCREEN_MODE_META: Record<ScreenMode, { label: string; background: string; accent: string }> = {
  idle: {
    label: 'PRIME // ONLINE',
    background: '#071d12',
    accent: '#b9ffc7',
  },
  wallet: {
    label: 'WALLET // 0.184 SOL',
    background: '#1f1405',
    accent: '#ffd08b',
  },
  tools: {
    label: 'TOOLS // BAGS LOOPR WALLET',
    background: '#061523',
    accent: '#b9d8ff',
  },
  signal: {
    label: 'SIGNAL // LOOPR LISTENING',
    background: '#210615',
    accent: '#ffb2d1',
  },
};

const controlMeshNames = new Set<string>([
  'Button_A',
  'Button_B',
  'Button_X',
  'Button_Y',
  'Button_Start',
  'Button_Back',
  'Button_Menu_Right',
  'Button_Menu_Left',
  'Button_Steam',
  'Button_QuickAccess',
  'Bumper_Left',
  'Bumper_Right',
  'Joystick_Left',
  'Joystick_Right',
  'Joystick_Left_Hit',
  'Joystick_Right_Hit',
  'Trackpad_Left',
  'Trackpad_Right',
  'DPad',
]);

const deviceControlActions: Partial<Record<string, DeviceControlAction>> = {
  Button_A: { mode: 'idle', inputLabel: 'Button A: habitat', activeControl: 'Button_A' },
  Button_B: { mode: 'wallet', inputLabel: 'Button B: wallet', activeControl: 'Button_B' },
  Button_X: { mode: 'tools', inputLabel: 'Button X: tools', activeControl: 'Button_X' },
  Button_Y: { mode: 'signal', inputLabel: 'Button Y: signal', activeControl: 'Button_Y' },
  Button_Start: { mode: 'tools', inputLabel: 'Start: tool stack', activeControl: 'Button_Start' },
  Button_Back: { mode: 'wallet', inputLabel: 'Back: wallet split', activeControl: 'Button_Back' },
  Button_Menu_Right: { mode: 'signal', inputLabel: 'Menu: Loopr signal', activeControl: 'Button_Menu_Right' },
  Button_Menu_Left: { mode: 'tools', inputLabel: 'Menu: system options', activeControl: 'Button_Menu_Left' },
  Button_Steam: { mode: 'idle', inputLabel: 'Steam button: habitat', activeControl: 'Button_Steam' },
  Button_QuickAccess: { mode: 'signal', inputLabel: 'Quick access: signal', activeControl: 'Button_QuickAccess' },
  Bumper_Left: { mode: 'tools', inputLabel: 'Left shoulder: tools', activeControl: 'Bumper_Left' },
  Bumper_Right: { mode: 'signal', inputLabel: 'Right shoulder: signal', activeControl: 'Bumper_Right' },
  Trackpad_Left: { mode: 'tools', inputLabel: 'Left trackpad: tools', activeControl: 'Trackpad_Left' },
  Trackpad_Right: { mode: 'wallet', inputLabel: 'Right trackpad: wallet', activeControl: 'Trackpad_Right' },
};

const PRIME_SCREEN_RANGE = { x: 1.04, y: 0.54 };
const PRIME_MAX_OFFSET = 1;
const STICK_DRAG_RADIUS = 56;
const STICK_DEAD_ZONE = 0.05;
const STICK_VISUAL_TRAVEL = 0.075;
const STICK_VISUAL_TILT = 0.26;
const STEAM_DECK_MODEL_URL = '/models/SteamDeck_Looplings_physical.glb?v=joystick-split-pivot-v1';
const RESTING_STICK_TILT: StickTilt = {
  left: { x: 0, y: 0, active: false },
  right: { x: 0, y: 0, active: false },
};

function getDPadLabel(vector: { x: number; y: number }) {
  return `D-pad: ${vector.x < 0 ? 'left' : vector.x > 0 ? 'right' : vector.y > 0 ? 'up' : 'down'}`;
}

function getStickSideFromMeshName(name: string): StickSide | null {
  if (name === 'Joystick_Left' || name === 'Joystick_Left_Hit') return 'left';
  if (name === 'Joystick_Right' || name === 'Joystick_Right_Hit') return 'right';
  return null;
}

function getVisibleStickSideFromMeshName(name: string): StickSide | null {
  if (name === 'Joystick_Left') return 'left';
  if (name === 'Joystick_Right') return 'right';
  return null;
}

function getControlPressDepth(name: string) {
  if (name === 'Button_A' || name === 'Button_B' || name === 'Button_X' || name === 'Button_Y') return 0.065;
  if (name === 'Bumper_Left' || name === 'Bumper_Right') return 0;
  if (name === 'Trackpad_Left' || name === 'Trackpad_Right') return 0;
  if (name === 'DPad') return 0.008;
  return 0.006;
}

function clampStickVector(vector: { x: number; y: number }) {
  const next = new THREE.Vector2(vector.x, vector.y);
  if (next.lengthSq() < STICK_DEAD_ZONE * STICK_DEAD_ZONE) return { x: 0, y: 0 };
  if (next.lengthSq() > 1) next.normalize();
  return { x: next.x, y: next.y };
}

function getDPadVectorFromPointer(event: ThreeEvent<PointerEvent>) {
  const canvas = event.nativeEvent.target as HTMLElement | null;
  const rect = canvas?.getBoundingClientRect();
  if (!rect) return { x: 0, y: 1 };

  const center = new THREE.Vector3();
  new THREE.Box3().setFromObject(event.object).getCenter(center);
  center.project(event.camera);

  const centerX = rect.left + (center.x * 0.5 + 0.5) * rect.width;
  const centerY = rect.top + (-center.y * 0.5 + 0.5) * rect.height;
  const dx = event.nativeEvent.clientX - centerX;
  const dy = event.nativeEvent.clientY - centerY;

  if (Math.abs(dx) >= Math.abs(dy)) return { x: dx < 0 ? -1 : 1, y: 0 };
  return { x: 0, y: dy < 0 ? 1 : -1 };
}

function capturePointer(event: ThreeEvent<PointerEvent>) {
  const target = event.target as EventTarget & { setPointerCapture?: (pointerId: number) => void };
  target.setPointerCapture?.(event.pointerId);
}

function releasePointer(event: ThreeEvent<PointerEvent>) {
  const target = event.target as EventTarget & { releasePointerCapture?: (pointerId: number) => void };
  target.releasePointerCapture?.(event.pointerId);
}

function getPixelColor(pixel: SpecialPixel) {
  switch (pixel) {
    case 1:
      return PALETTE_PRIME.body;
    case 2:
      return PALETTE_PRIME.eyes;
    case 3:
      return PALETTE_PRIME.claws;
    case 4:
      return PALETTE_PRIME.detail;
    default:
      return 'transparent';
  }
}

function SteamDeckScreenMesh({ mode, primeOffset }: { mode: ScreenMode; primeOffset: { x: number; y: number } }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const spriteGroupRef = useRef<THREE.Group>(null);
  const screen = SCREEN_MODE_META[mode];
  const frame = PRIME_FRAMES[frameIndex] ?? PRIME_FRAMES[0];
  const rows = frame.length;
  const cols = frame[0]?.length ?? 0;
  const cell = 0.13;
  const gap = 0.012;
  const spriteWidth = cols * cell + (cols - 1) * gap;
  const spriteHeight = rows * cell + (rows - 1) * gap;

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((index) => (index + 1) % PRIME_FRAMES.length);
    }, 520);
    return () => clearInterval(interval);
  }, []);

  useFrame(({ clock }) => {
    const group = spriteGroupRef.current;
    if (!group) return;
    const loop = clock.getElapsedTime();
    group.position.x = primeOffset.x * PRIME_SCREEN_RANGE.x - spriteWidth / 2 + Math.sin(loop * 0.84) * 0.035;
    group.position.y = primeOffset.y * PRIME_SCREEN_RANGE.y + spriteHeight / 2 + Math.sin(loop * 1.72) * 0.09;
  });

  return (
    <group position={[0, -1.008, 0.338]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh renderOrder={10}>
        <planeGeometry args={[4.52, 2.8]} />
        <meshBasicMaterial
          color={screen.background}
          depthTest={false}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, 0.04]} renderOrder={11}>
        <planeGeometry args={[4.1, 2.3]} />
        <meshBasicMaterial
          color={screen.accent}
          transparent
          opacity={0.09}
          depthTest={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <group
        ref={spriteGroupRef}
        position={[
          primeOffset.x * PRIME_SCREEN_RANGE.x - spriteWidth / 2,
          primeOffset.y * PRIME_SCREEN_RANGE.y + spriteHeight / 2,
          0.075,
        ]}
      >
        {frame.map((row, y) => (
          row.map((pixel, x) => {
            if (pixel === 0) return null;
            return (
              <mesh key={`${frameIndex}-${x}-${y}`} position={[x * (cell + gap), -y * (cell + gap), 0]} renderOrder={30}>
                <planeGeometry args={[cell, cell]} />
                <meshBasicMaterial
                  color={getPixelColor(pixel)}
                  depthTest={false}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            );
          })
        ))}
      </group>
      <mesh position={[1.9, -1.15, 0.065]} renderOrder={22}>
        <boxGeometry args={[0.42, 0.035, 0.018]} />
        <meshBasicMaterial color={screen.accent} transparent opacity={0.64} depthTest={false} />
      </mesh>
      <mesh position={[1.61, -1.15, 0.065]} renderOrder={22}>
        <boxGeometry args={[0.09, 0.035, 0.018]} />
        <meshBasicMaterial color={screen.accent} transparent opacity={0.36} depthTest={false} />
      </mesh>
      <Text
        position={[-1.95, 1.13, 0.07]}
        renderOrder={31}
        fontSize={0.12}
        letterSpacing={0.08}
        color={screen.accent}
        anchorX="left"
        anchorY="middle"
      >
        {screen.label}
      </Text>
      <Text
        position={[-1.95, -1.15, 0.07]}
        renderOrder={31}
        fontSize={0.08}
        letterSpacing={0.1}
        color={screen.accent}
        anchorX="left"
        anchorY="middle"
        fillOpacity={0.64}
      >
        PRIME.LOCAL / MOCK RUNTIME
      </Text>
    </group>
  );
}

type LooplingsSteamDeckProps = ThreeElements['group'] & {
  onStateChange?: (state: SteamDeckDeviceState) => void;
};

export default function LooplingsSteamDeck({ onStateChange, ...props }: LooplingsSteamDeckProps) {
  const { scene } = useGLTF(STEAM_DECK_MODEL_URL);
  const [mode, setMode] = useState<ScreenMode>('idle');
  const [primeOffset, setPrimeOffset] = useState({ x: 0, y: 0 });
  const [lastInput, setLastInput] = useState('boot sequence');
  const [activeControl, setActiveControl] = useState<ControlMeshName | null>(null);
  const [, setStickTiltState] = useState<StickTilt>(RESTING_STICK_TILT);
  const [dpadVector, setDpadVector] = useState<DPadVector>({ x: 0, y: 0, active: false });
  const directStickDrag = useRef<{ side: StickSide; x: number; y: number } | null>(null);
  const stickTiltRef = useRef<StickTilt>(RESTING_STICK_TILT);
  const primeMotion = useRef<PrimeMotion>({
    inputTarget: new THREE.Vector2(0, 0),
    inputCurrent: new THREE.Vector2(0, 0),
    position: new THREE.Vector2(0, 0),
    velocity: new THREE.Vector2(0, 0),
  });

  const reportInput = useCallback((input: string) => {
    setLastInput(input);
  }, []);

  const setPrimeInputTarget = useCallback((offset: { x: number; y: number }) => {
    const next = clampStickVector(offset);
    primeMotion.current.inputTarget.set(next.x, next.y);
  }, []);

  const setStickTilt = useCallback((updater: StickTilt | ((sticks: StickTilt) => StickTilt)) => {
    const next = typeof updater === 'function' ? updater(stickTiltRef.current) : updater;
    stickTiltRef.current = next;
    setStickTiltState(next);
  }, []);

  const pressDPad = useCallback((vector: { x: number; y: number }) => {
    setPrimeInputTarget(vector);
    setDpadVector({ ...vector, active: true });
    setActiveControl('DPad');
    setLastInput(getDPadLabel(vector));
  }, [setPrimeInputTarget]);

  const resetControls = useCallback(() => {
    directStickDrag.current = null;
    setPrimeInputTarget({ x: 0, y: 0 });
    window.setTimeout(() => {
      setStickTilt({
        left: { ...RESTING_STICK_TILT.left },
        right: { ...RESTING_STICK_TILT.right },
      });
      setDpadVector({ x: 0, y: 0, active: false });
      setActiveControl(null);
    }, 120);
  }, [setPrimeInputTarget, setStickTilt]);

  const handleDeckPointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    const objectName = event.object.name;
    if (!controlMeshNames.has(objectName)) return;
    event.stopPropagation();
    capturePointer(event);

    const stickSide = getStickSideFromMeshName(objectName);
    if (stickSide) {
      const side = stickSide;
      directStickDrag.current = { side, x: event.nativeEvent.clientX, y: event.nativeEvent.clientY };
      setLastInput(`${side === 'left' ? 'Left' : 'Right'} stick: Prime vector`);
      setStickTilt((sticks) => ({ ...sticks, [side]: { x: 0, y: 0, active: true } }));
      document.body.style.cursor = 'grabbing';
      return;
    }

    if (objectName === 'DPad') {
      pressDPad(getDPadVectorFromPointer(event));
      return;
    }

    const action = deviceControlActions[objectName];
    if (!action) return;
    setMode(action.mode);
    setLastInput(action.inputLabel);
    setActiveControl(action.activeControl);
    document.body.style.cursor = 'pointer';
  }, [pressDPad]);

  const handleDeckPointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    const drag = directStickDrag.current;
    if (!drag || event.buttons !== 1) return;
    event.stopPropagation();
    const next = clampStickVector({
      x: (event.nativeEvent.clientX - drag.x) / STICK_DRAG_RADIUS,
      y: -(event.nativeEvent.clientY - drag.y) / STICK_DRAG_RADIUS,
    });
    setPrimeInputTarget(next);
    setStickTilt((sticks) => ({ ...sticks, [drag.side]: { ...next, active: true } }));
  }, [setPrimeInputTarget]);

  const handleDeckPointerUp = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    releasePointer(event);
    resetControls();
    document.body.style.cursor = 'auto';
  }, [resetControls]);

  const deck = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (controlMeshNames.has(object.name)) {
        object.matrixAutoUpdate = true;
        object.userData.basePosition = object.position.clone();
        object.userData.baseRotation = object.rotation.clone();
      }
      if (object instanceof THREE.Mesh) {
        object.matrixAutoUpdate = true;
        object.castShadow = true;
        object.receiveShadow = true;
        if (object.name.endsWith('_Hit')) {
          object.castShadow = false;
          object.receiveShadow = false;
          object.material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
          });
        }
        if (!controlMeshNames.has(object.name)) {
          object.raycast = () => undefined;
        }
        if (object.name === 'Screen') {
          object.visible = false;
        }
      }
    });
    return clone;
  }, [scene]);

  useEffect(() => {
    onStateChange?.({
      mode,
      label: SCREEN_MODE_META[mode].label,
      lastInput,
      primeOffset,
    });
  }, [lastInput, mode, onStateChange, primeOffset]);

  useFrame((_, delta) => {
    const blend = 1 - Math.exp(-delta * 18);
    const motion = primeMotion.current;
    const inputBlend = 1 - Math.exp(-delta * 14);
    motion.inputCurrent.lerp(motion.inputTarget, inputBlend);

    const targetVelocity = motion.inputCurrent.clone().multiplyScalar(1.72);
    motion.velocity.lerp(targetVelocity, 1 - Math.exp(-delta * 7.2));
    motion.position.addScaledVector(motion.velocity, delta);

    if (Math.abs(motion.position.x) > PRIME_MAX_OFFSET) {
      motion.position.x = THREE.MathUtils.clamp(motion.position.x, -PRIME_MAX_OFFSET, PRIME_MAX_OFFSET);
      motion.velocity.x = 0;
    }
    if (Math.abs(motion.position.y) > PRIME_MAX_OFFSET) {
      motion.position.y = THREE.MathUtils.clamp(motion.position.y, -PRIME_MAX_OFFSET, PRIME_MAX_OFFSET);
      motion.velocity.y = 0;
    }

    setPrimeOffset((current) => {
      const next = { x: motion.position.x, y: motion.position.y };
      if (Math.abs(current.x - next.x) < 0.001 && Math.abs(current.y - next.y) < 0.001) return current;
      return next;
    });

    deck.traverse((object) => {
      const basePosition = object.userData.basePosition as THREE.Vector3 | undefined;
      const baseRotation = object.userData.baseRotation as THREE.Euler | undefined;
      if (!basePosition || !baseRotation) return;

      const nextPosition = basePosition.clone();
      const nextRotation = new THREE.Euler(baseRotation.x, baseRotation.y, baseRotation.z, baseRotation.order);

      if (object.name === activeControl) {
        nextPosition.y += getControlPressDepth(object.name);
      }

      if (dpadVector.active && object.name === 'DPad') {
        nextPosition.y += 0.016;
        nextRotation.x += dpadVector.y * 0.08;
        nextRotation.z -= dpadVector.x * 0.08;
      }

      const stickSide = getVisibleStickSideFromMeshName(object.name);
      if (stickSide) {
        const side = stickSide;
        const tilt = stickTiltRef.current[side];
        nextPosition.x += tilt.x * STICK_VISUAL_TRAVEL;
        nextPosition.z += tilt.y * STICK_VISUAL_TRAVEL;
        nextRotation.x += tilt.y * STICK_VISUAL_TILT;
        nextRotation.z -= tilt.x * STICK_VISUAL_TILT;
      }

      object.position.lerp(nextPosition, blend);
      object.rotation.x = THREE.MathUtils.lerp(object.rotation.x, nextRotation.x, blend);
      object.rotation.y = THREE.MathUtils.lerp(object.rotation.y, nextRotation.y, blend);
      object.rotation.z = THREE.MathUtils.lerp(object.rotation.z, nextRotation.z, blend);
      object.updateMatrix();
      object.updateMatrixWorld(true);
    });
  });

  return (
    <group name="looplings-steam-deck" position={[0, 0, 0]} rotation={[-0.72, 0, 0]} scale={0.16} {...props}>
      <primitive
        object={deck}
        onPointerDown={handleDeckPointerDown}
        onPointerMove={handleDeckPointerMove}
        onPointerUp={handleDeckPointerUp}
      />

      <SteamDeckScreenMesh mode={mode} primeOffset={primeOffset} />
    </group>
  );
}

useGLTF.preload(STEAM_DECK_MODEL_URL);
