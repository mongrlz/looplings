import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, PerspectiveCamera, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { createCRTMaterial } from '@/lib/crt-material';

const ROOM = {
  wall: '#251d27',
  trim: '#0c1118',
  floor: '#231615',
  wood: '#5f3824',
  deskDark: '#1b1515',
  monitor: '#111217',
  monitorEdge: '#2a2021',
  glow: '#65f5d6',
  warm: '#ffb861',
};

const DESK_SURFACE_Y = 0.813;
const DESK_WALL_OFFSET_Z = -0.62;
const CAMERA_HOME = new THREE.Vector3(0, 1.5, 4.78);
const CAMERA_BASE_PITCH = -0.05;
const CAMERA_DRAG_SENSITIVITY = {
  yaw: 0.00235,
  pitch: 0.00195,
};
const CAMERA_LIMITS = {
  yaw: 0.4,
  pitchUp: 0.18,
  pitchDown: -0.16,
};
const INSPECT_CAMERA_HOME = new THREE.Vector3(0, 1.46, 4.58);
const INSPECT_CAMERA_LIMITS = {
  x: [-3.45, 3.45],
  y: [0.82, 2.45],
  z: [-2.66, 4.86],
};
const INSPECT_DRAG_SENSITIVITY = {
  yaw: 0.0028,
  pitch: 0.0022,
};
const INSPECT_MOVE_SPEED = 1.42;
const SCREEN_TEXTURE_W = 720;
const SCREEN_TEXTURE_H = 470;
const ATLAS_VERSION = 'loopling-state-atlas-2026-05-02';
const ATLAS_COLS = 8;
const ATLAS_ROWS = 12;
const SCREEN_STATES = {
  idle: { row: 0, fps: 5, frames: 8 },
  thinking: { row: 1, fps: 5, frames: 8 },
  acting: { row: 2, fps: 8, frames: 8 },
  trading: { row: 3, fps: 9, frames: 8 },
  posting: { row: 6, fps: 6, frames: 8 },
} as const;
const SCREEN_PETS = [
  { id: 'PRIME-00', name: 'Prime', pet: 'prime-test', state: 'Thinking', visualState: 'thinking', accent: '#78d7ff' },
  { id: 'PINK-01', name: 'Pink', pet: 'pink', state: 'Posting', visualState: 'posting', accent: '#ff79b7' },
  { id: 'BLUE-02', name: 'Blue', pet: 'blue', state: 'Scanning', visualState: 'trading', accent: '#77bfff' },
  { id: 'SPARK-03', name: 'Spark', pet: 'spark', state: 'Charging', visualState: 'acting', accent: '#ffd15c' },
] satisfies Array<{
  id: string;
  name: string;
  pet: string;
  state: string;
  visualState: keyof typeof SCREEN_STATES;
  accent: string;
}>;

type CityScene = {
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
  stars: Array<{ x: number; y: number; size: number; phase: number }>;
  buildings: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    windows: Array<{ x: number; y: number; color: string; phase: number }>;
  }>;
  lastDraw: number;
};

type PosterKind = 'loop' | 'moon' | 'chart' | 'prime';

export type RoomInspectionSnapshot = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
};

function createSeededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createCityScene(): CityScene {
  const random = createSeededRandom(42);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const stars = Array.from({ length: 96 }, () => ({
    x: random() * 512,
    y: 18 + random() * 220,
    size: 0.8 + random() * 1.6,
    phase: random() * Math.PI * 2,
  }));
  const buildings = [];

  for (let x = -20; x < 540; x += 28 + random() * 14) {
    const width = 24 + random() * 32;
    const height = 80 + random() * 200;
    const y = 512 - height;
    const windows = [];

    for (let wy = y + 16; wy < 500; wy += 20) {
      for (let wx = 8; wx < width - 5; wx += 13) {
        if (random() > 0.38) {
          windows.push({
            x: wx,
            y: wy - y,
            color: random() > 0.48 ? '#ffbc6f' : '#5ee8ff',
            phase: random() * Math.PI * 2,
          });
        }
      }
    }

    buildings.push({
      x,
      y,
      width,
      height,
      color: random() > 0.48 ? '#11182b' : '#0b1021',
      windows,
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return {
    canvas,
    texture,
    stars,
    buildings,
    lastDraw: -1,
  };
}

function drawCityScene(scene: CityScene, time: number) {
  const ctx = scene.canvas.getContext('2d');
  if (ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, '#080b2b');
    sky.addColorStop(0.48, '#26154f');
    sky.addColorStop(0.75, '#de5d81');
    sky.addColorStop(1, '#14121d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = 'rgba(243,249,255,0.86)';
    scene.stars.forEach((star) => {
      const alpha = 0.45 + Math.sin(time * 1.8 + star.phase) * 0.35;
      ctx.globalAlpha = Math.max(0.18, alpha);
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1;

    const moonX = 384 + Math.sin(time * 0.08) * 8;
    const moonGradient = ctx.createRadialGradient(moonX, 108, 4, moonX, 108, 48);
    moonGradient.addColorStop(0, 'rgba(253,226,151,0.8)');
    moonGradient.addColorStop(0.45, 'rgba(253,226,151,0.22)');
    moonGradient.addColorStop(1, 'rgba(253,226,151,0)');
    ctx.fillStyle = moonGradient;
    ctx.beginPath();
    ctx.arc(moonX, 108, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,220,145,0.92)';
    ctx.beginPath();
    ctx.arc(moonX, 108, 14, 0, Math.PI * 2);
    ctx.fill();

    const drift = (time * 7) % 560;
    ctx.fillStyle = 'rgba(113, 236, 255, 0.88)';
    ctx.fillRect(540 - drift, 176 + Math.sin(time) * 8, 12, 3);
    ctx.fillStyle = 'rgba(255, 121, 185, 0.7)';
    ctx.fillRect(554 - drift, 176 + Math.sin(time) * 8, 4, 3);

    for (const building of scene.buildings) {
      ctx.fillStyle = building.color;
      ctx.fillRect(building.x, building.y, building.width, building.height);
      ctx.fillStyle = 'rgba(255,255,255,0.055)';
      ctx.fillRect(building.x, building.y, building.width, 2);

      for (const litWindow of building.windows) {
        const flicker = 0.66 + Math.sin(time * 1.4 + litWindow.phase) * 0.34;
        ctx.globalAlpha = Math.max(0.24, flicker);
        ctx.fillStyle = litWindow.color;
        ctx.fillRect(building.x + litWindow.x, building.y + litWindow.y, 4, 6);
      }
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = 'rgba(0,0,0,0.26)';
    ctx.fillRect(0, 492, 512, 20);
  }
}

function makePosterTexture(kind: PosterKind) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 704;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const specs = {
      loop: { bg: '#180914', accent: '#ff5da8', title: 'KEEP', title2: 'LOOPING', sub: 'OR DIE' },
      moon: { bg: '#081328', accent: '#7ad7ff', title: 'TO THE', title2: 'MOON', sub: 'RUNWAY > FEAR' },
      chart: { bg: '#0b1511', accent: '#79ffb2', title: 'GREEN', title2: 'CANDLES', sub: 'SCAN THE SIGNAL' },
      prime: { bg: '#120f1a', accent: '#ffe28f', title: 'PRIME', title2: '00', sub: 'ALIVE' },
    } satisfies Record<PosterKind, { bg: string; accent: string; title: string; title2: string; sub: string }>;

    const spec = specs[kind];
    const gradient = ctx.createLinearGradient(0, 0, 512, 704);
    gradient.addColorStop(0, spec.bg);
    gradient.addColorStop(1, '#040506');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 704);
    ctx.strokeStyle = spec.accent;
    ctx.lineWidth = 10;
    ctx.strokeRect(28, 28, 456, 648);
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#ffffff';
    for (let y = 70; y < 660; y += 36) {
      ctx.beginPath();
      ctx.moveTo(52, y);
      ctx.lineTo(460, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = spec.accent;
    ctx.shadowColor = spec.accent;
    ctx.shadowBlur = 20;
    ctx.font = '700 58px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(spec.title, 256, 146);
    ctx.font = '700 72px "Courier New", monospace';
    ctx.fillText(spec.title2, 256, 226);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '700 22px "Courier New", monospace';
    ctx.fillText(spec.sub, 256, 626);

    if (kind === 'prime') {
      ctx.fillStyle = spec.accent;
      for (let y = 0; y < 8; y += 1) {
        for (let x = 0; x < 8; x += 1) {
          if ([1, 2, 5, 6].includes(x) && [1, 2, 5].includes(y)) ctx.fillRect(166 + x * 22, 310 + y * 22, 16, 16);
          if ([3, 4].includes(x) && [2, 3, 4, 6].includes(y)) ctx.fillRect(166 + x * 22, 310 + y * 22, 16, 16);
        }
      }
    } else if (kind === 'moon') {
      ctx.beginPath();
      ctx.arc(256, 394, 82, 0, Math.PI * 2);
      ctx.strokeStyle = spec.accent;
      ctx.lineWidth = 12;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(280, 356, 72, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.stroke();
    } else if (kind === 'chart') {
      ctx.strokeStyle = spec.accent;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(104, 456);
      ctx.lineTo(174, 408);
      ctx.lineTo(228, 430);
      ctx.lineTo(306, 332);
      ctx.lineTo(404, 296);
      ctx.stroke();
      [128, 210, 292, 374].forEach((x, index) => {
        ctx.fillRect(x, 338 - index * 20, 24, 112 + index * 28);
      });
    } else {
      ctx.strokeStyle = spec.accent;
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(256, 372, 68, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(220, 436, 50, 0, Math.PI * 2);
      ctx.arc(292, 436, 50, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function Box({
  position,
  scale,
  color,
  roughness = 0.72,
  metalness = 0.02,
  castShadow = false,
  receiveShadow = true,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  roughness?: number;
  metalness?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  return (
    <mesh position={position} castShadow={castShadow} receiveShadow={receiveShadow}>
      <boxGeometry args={scale} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

function IndustrialLamp() {
  const gltf = useGLTF('/models/room/industrial_pipe_lamp/industrial_pipe_lamp_1k.gltf');
  const lamp = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  return (
    <group position={[1.54, DESK_SURFACE_Y + 0.006, -1.42 + DESK_WALL_OFFSET_Z]} rotation={[0, -0.48, 0]} scale={2.35}>
      <primitive object={lamp} />
      <pointLight position={[0.02, 0.22, 0.03]} intensity={8.5} distance={3.1} color={ROOM.warm} />
    </group>
  );
}

function AntiqueWoodenDesk() {
  const gltf = useGLTF('/models/room/antique_wooden_desk/antique_wooden_desk.glb');
  const desk = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return clone;
  }, [gltf.scene]);

  return (
    <group position={[0, 0.08, -1.22 + DESK_WALL_OFFSET_Z]} rotation={[0, Math.PI / 2, 0]} scale={[1.54, 0.92, 2.29]}>
      <primitive object={desk} />
    </group>
  );
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
  ctx.stroke();
}

function drawAtlasPet(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  state: keyof typeof SCREEN_STATES,
  elapsed: number,
  x: number,
  y: number,
  width: number,
) {
  const meta = SCREEN_STATES[state];
  const frame = Math.floor(elapsed * meta.fps) % meta.frames;
  const frameW = image ? image.naturalWidth / ATLAS_COLS : 192;
  const frameH = image ? image.naturalHeight / ATLAS_ROWS : 208;
  const height = width * (frameH / frameW);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.shadowColor = 'rgba(101, 245, 214, 0.34)';
  ctx.shadowBlur = 18;
  if (image?.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, frame * frameW, meta.row * frameH, frameW, frameH, x, y, width, height);
  } else {
    ctx.fillStyle = 'rgba(120, 215, 255, 0.18)';
    ctx.fillRect(x + width * 0.22, y + height * 0.18, width * 0.56, height * 0.56);
  }
  ctx.restore();
}

function drawLooplingsScreen(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  images: Map<string, HTMLImageElement>,
) {
  ctx.clearRect(0, 0, SCREEN_TEXTURE_W, SCREEN_TEXTURE_H);
  ctx.fillStyle = '#03120f';
  ctx.fillRect(0, 0, SCREEN_TEXTURE_W, SCREEN_TEXTURE_H);

  const glow = ctx.createRadialGradient(360, 160, 20, 360, 160, 360);
  glow.addColorStop(0, 'rgba(132,255,218,0.2)');
  glow.addColorStop(0.5, 'rgba(132,255,218,0.04)');
  glow.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SCREEN_TEXTURE_W, SCREEN_TEXTURE_H);

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = '#9affde';
  ctx.lineWidth = 1;
  for (let x = 0; x < SCREEN_TEXTURE_W; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, SCREEN_TEXTURE_H);
    ctx.stroke();
  }
  for (let y = 0; y < SCREEN_TEXTURE_H; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(SCREEN_TEXTURE_W, y + 0.5);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#65f5d6';
  ctx.font = '800 12px "Courier New", monospace';
  ctx.letterSpacing = '2px';
  ctx.fillText('LOOPLINGS OS', 24, 38);
  ctx.fillStyle = '#f3fff5';
  ctx.font = '800 28px "Courier New", monospace';
  ctx.fillText('STARTER HABITAT', 24, 72);

  ctx.strokeStyle = 'rgba(145,255,195,0.16)';
  ctx.beginPath();
  ctx.moveTo(24, 95);
  ctx.lineTo(696, 95);
  ctx.stroke();

  ctx.fillStyle = 'rgba(1,9,8,0.72)';
  ctx.strokeStyle = 'rgba(101,245,214,0.17)';
  drawRoundedRect(ctx, 24, 118, 210, 145, 2);
  drawAtlasPet(ctx, images.get('prime-test'), 'idle', elapsed, 75, 132, 108);

  ctx.fillStyle = 'rgba(184,255,210,0.56)';
  ctx.font = '800 11px "Courier New", monospace';
  ctx.fillText('PRIME-00', 258, 150);
  ctx.fillStyle = '#8cffae';
  ctx.font = '800 22px "Courier New", monospace';
  ctx.fillText('ALIVE', 258, 182);
  ctx.fillStyle = 'rgba(223,255,232,0.7)';
  ctx.font = '14px "Courier New", monospace';
  ctx.fillText('Scanning market conditions and', 258, 216);
  ctx.fillText('keeping the loop warm.', 258, 237);

  const stats = [
    ['RUNWAY', '19h 42m'],
    ['CREDITS', '$2.47'],
    ['NEXT TICK', '01:47'],
  ];
  stats.forEach(([label, value], index) => {
    const x = 24 + index * 224;
    ctx.fillStyle = 'rgba(1,8,7,0.58)';
    ctx.strokeStyle = 'rgba(145,255,195,0.13)';
    drawRoundedRect(ctx, x, 284, 206, 56, 2);
    ctx.fillStyle = 'rgba(184,255,210,0.56)';
    ctx.font = '800 11px "Courier New", monospace';
    ctx.fillText(label, x + 12, 307);
    ctx.fillStyle = '#f5fff7';
    ctx.font = '800 17px "Courier New", monospace';
    ctx.fillText(value, x + 12, 329);
  });

  SCREEN_PETS.forEach((pet, index) => {
    const x = 24 + index * 166;
    ctx.fillStyle = 'rgba(1,8,7,0.58)';
    ctx.strokeStyle = 'rgba(145,255,195,0.13)';
    drawRoundedRect(ctx, x, 360, 154, 58, 2);
    drawAtlasPet(ctx, images.get(pet.pet), pet.visualState, elapsed, x + 10, 370, 42);
    ctx.fillStyle = 'rgba(184,255,210,0.56)';
    ctx.font = '800 10px "Courier New", monospace';
    ctx.fillText(pet.id, x + 62, 383);
    ctx.fillStyle = pet.accent;
    ctx.font = '800 12px "Courier New", monospace';
    ctx.fillText(pet.state.toUpperCase(), x + 62, 404);
  });

  ctx.fillStyle = 'rgba(1,8,7,0.58)';
  ctx.strokeStyle = 'rgba(145,255,195,0.13)';
  drawRoundedRect(ctx, 24, 432, 672, 26, 2);
  ctx.fillStyle = 'rgba(184,255,210,0.56)';
  ctx.font = '800 11px "Courier New", monospace';
  ctx.fillText('CURRENT TASK', 38, 450);
  ctx.fillStyle = '#f5fff7';
  ctx.fillText('Evaluating $VIRTUAL on Base', 188, 450);

  const scanY = ((elapsed * 40) % (SCREEN_TEXTURE_H + 120)) - 60;
  const scan = ctx.createLinearGradient(0, scanY - 18, 0, scanY + 18);
  scan.addColorStop(0, 'rgba(180,255,220,0)');
  scan.addColorStop(0.5, 'rgba(180,255,220,0.05)');
  scan.addColorStop(1, 'rgba(180,255,220,0)');
  ctx.fillStyle = scan;
  ctx.fillRect(0, scanY - 20, SCREEN_TEXTURE_W, 40);
}

function CanvasScreenTexture({ material }: { material: THREE.ShaderMaterial }) {
  const screen = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = SCREEN_TEXTURE_W;
    canvas.height = SCREEN_TEXTURE_H;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return { canvas, texture };
  }, []);
  const imagesRef = useRef(new Map<string, HTMLImageElement>());
  const lastDrawRef = useRef(-Infinity);

  useEffect(() => {
    material.uniforms.u_texture.value = screen.texture;

    SCREEN_PETS.forEach((pet) => {
      const image = new Image();
      image.src = `/pets/${pet.pet}/state-atlas.png?v=${ATLAS_VERSION}`;
      image.onload = () => {
        lastDrawRef.current = -Infinity;
      };
      imagesRef.current.set(pet.pet, image);
    });

    return () => {
      screen.texture.dispose();
    };
  }, [material, screen.texture]);

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime;
    if (elapsed - lastDrawRef.current > 1 / 12) {
      const ctx = screen.canvas.getContext('2d');
      if (ctx) {
        drawLooplingsScreen(ctx, elapsed, imagesRef.current);
        screen.texture.needsUpdate = true;
      }
      lastDrawRef.current = elapsed;
    }

    material.uniforms.u_time.value = elapsed;
    material.uniforms.u_resolution.value.set(SCREEN_TEXTURE_W, SCREEN_TEXTURE_H);
  });

  return null;
}

function Casing() {
  const screenRef = useRef<THREE.Mesh>(null);
  const crtMaterial = useMemo(() => createCRTMaterial(), []);

  useEffect(() => {
    return () => {
      crtMaterial.dispose();
    };
  }, [crtMaterial]);

  return (
    <group position={[0, DESK_SURFACE_Y + 0.9, -1.72 + DESK_WALL_OFFSET_Z]} rotation={[0, 0, 0]}>
      <Box position={[0, 0, -0.1]} scale={[2.28, 1.52, 0.46]} color={ROOM.monitor} roughness={0.52} metalness={0.08} castShadow />
      <Box position={[0, 0.79, 0.18]} scale={[2.42, 0.18, 0.18]} color={ROOM.monitorEdge} castShadow />
      <Box position={[0, -0.79, 0.18]} scale={[2.42, 0.22, 0.18]} color={ROOM.monitorEdge} castShadow />
      <Box position={[-1.22, 0, 0.18]} scale={[0.2, 1.44, 0.18]} color={ROOM.monitorEdge} castShadow />
      <Box position={[1.22, 0, 0.18]} scale={[0.2, 1.44, 0.18]} color={ROOM.monitorEdge} castShadow />

      <mesh ref={screenRef} position={[0, 0, 0.285]} castShadow={false} receiveShadow>
        <planeGeometry args={[2.02, 1.18]} />
        <primitive object={crtMaterial} attach="material" />
      </mesh>
      <CanvasScreenTexture material={crtMaterial} />

      <mesh position={[0, 0, 0.292]}>
        <planeGeometry args={[2.02, 1.18]} />
        <meshBasicMaterial color="#9fffee" transparent opacity={0.025} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <Text
        position={[0, -0.88, 0.3]}
        fontSize={0.045}
        color="#ba5b7f"
        anchorX="center"
        anchorY="middle"
      >
        LOOPVISION
      </Text>
      <mesh position={[0.9, -0.88, 0.31]}>
        <boxGeometry args={[0.08, 0.025, 0.01]} />
        <meshBasicMaterial color="#78ff9c" toneMapped={false} />
      </mesh>
      <mesh position={[1.03, -0.88, 0.31]}>
        <boxGeometry args={[0.08, 0.025, 0.01]} />
        <meshBasicMaterial color="#ff5d9b" toneMapped={false} />
      </mesh>
      <Box position={[-0.68, -0.86, -0.06]} scale={[0.34, 0.08, 0.24]} color={ROOM.monitorEdge} roughness={0.62} />
      <Box position={[0.68, -0.86, -0.06]} scale={[0.34, 0.08, 0.24]} color={ROOM.monitorEdge} roughness={0.62} />
    </group>
  );
}

function Desk() {
  return (
    <group>
      <AntiqueWoodenDesk />
      <Box position={[0, DESK_SURFACE_Y + 0.045, -0.42 + DESK_WALL_OFFSET_Z]} scale={[1.78, 0.09, 0.32]} color="#17171b" roughness={0.38} />
      {Array.from({ length: 18 }, (_, index) => (
        <Box
          key={index}
          position={[-0.79 + (index % 9) * 0.19, DESK_SURFACE_Y + 0.107, -0.43 - Math.floor(index / 9) * 0.1 + DESK_WALL_OFFSET_Z]}
          scale={[0.13, 0.035, 0.055]}
          color={index % 4 === 0 ? '#2a2b34' : '#1d1e24'}
          roughness={0.45}
        />
      ))}
      <mesh position={[1.45, DESK_SURFACE_Y + 0.025, -0.37 + DESK_WALL_OFFSET_Z]} castShadow receiveShadow>
        <sphereGeometry args={[0.18, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <meshStandardMaterial color="#111215" roughness={0.34} metalness={0.08} />
      </mesh>
    </group>
  );
}

function AnimatedWindowPane() {
  const cityScene = useMemo(() => {
    const scene = createCityScene();
    drawCityScene(scene, 0);
    return scene;
  }, []);

  useEffect(() => {
    return () => cityScene.texture.dispose();
  }, [cityScene.texture]);

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime;
    if (elapsed - cityScene.lastDraw < 0.08) return;

    drawCityScene(cityScene, elapsed);
    cityScene.texture.needsUpdate = true;
    cityScene.lastDraw = elapsed;
  });

  return (
    <mesh position={[0, 0, -0.02]}>
      <planeGeometry args={[1.42, 1.24]} />
      <meshBasicMaterial map={cityScene.texture} toneMapped={false} />
    </mesh>
  );
}

function Window() {
  return (
    <group position={[-2.54, 1.72, -2.96]}>
      <AnimatedWindowPane />
      <Box position={[0, 0.68, 0]} scale={[1.62, 0.08, 0.08]} color={ROOM.trim} />
      <Box position={[0, -0.68, 0]} scale={[1.62, 0.08, 0.08]} color={ROOM.trim} />
      <Box position={[-0.82, 0, 0]} scale={[0.08, 1.38, 0.08]} color={ROOM.trim} />
      <Box position={[0.82, 0, 0]} scale={[0.08, 1.38, 0.08]} color={ROOM.trim} />
      <Box position={[0, 0, 0.01]} scale={[0.05, 1.32, 0.05]} color={ROOM.trim} />
      <Box position={[0, 0, 0.02]} scale={[1.5, 0.04, 0.05]} color={ROOM.trim} />
      <pointLight position={[0, -0.1, 0.18]} intensity={1.1} distance={1.8} color="#9b5dff" />
    </group>
  );
}

function WallPoster({
  kind,
  position,
  rotation = [0, 0, 0],
  scale = [0.54, 0.74],
}: {
  kind: PosterKind;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number];
}) {
  const posterTexture = useMemo(() => makePosterTexture(kind), [kind]);

  useEffect(() => {
    return () => posterTexture.dispose();
  }, [posterTexture]);

  return (
    <group position={position} rotation={rotation}>
      <Box position={[0, 0, -0.015]} scale={[scale[0] + 0.08, scale[1] + 0.08, 0.035]} color="#090a0d" roughness={0.6} />
      <mesh position={[0, 0, 0.012]} receiveShadow>
        <planeGeometry args={scale} />
        <meshBasicMaterial map={posterTexture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={scale} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.025} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function WallDataPanel({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <Box position={[0, 0, -0.02]} scale={[0.7, 0.48, 0.04]} color="#080d11" roughness={0.45} metalness={0.12} />
      <mesh position={[0, 0.06, 0.01]}>
        <planeGeometry args={[0.58, 0.28]} />
        <meshBasicMaterial color="#071c18" />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => (
        <mesh key={index} position={[-0.23 + index * 0.066, -0.11 + (index % 3) * 0.012, 0.025]}>
          <boxGeometry args={[0.038, 0.08 + (index % 4) * 0.035, 0.008]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? ROOM.glow : '#ffe28f'}
            toneMapped={false}
          />
        </mesh>
      ))}
      <Text position={[-0.25, 0.17, 0.025]} fontSize={0.04} color="#7fffdc" anchorX="left" anchorY="middle">
        COMPUTE
      </Text>
      <pointLight position={[0, 0, 0.12]} intensity={0.55} distance={1} color={ROOM.glow} />
    </group>
  );
}

function WallDecor() {
  return (
    <group>
      {/* Left Wall — large chart poster + small moon poster stacked */}
      <WallPoster kind="chart" position={[-3.96, 1.4, -1.5]} rotation={[0, Math.PI / 2, 0]} scale={[0.54, 0.72]} />
      <WallPoster kind="moon" position={[-3.96, 2.2, -1.5]} rotation={[0, Math.PI / 2, 0]} scale={[0.3, 0.4]} />
      {/* Left Wall — small loop poster near back corner */}
      <WallPoster kind="loop" position={[-3.96, 1.6, -2.4]} rotation={[0, Math.PI / 2, 0]} scale={[0.28, 0.38]} />

      {/* Back Wall — left of window */}
      <WallPoster kind="prime" position={[-3.65, 1.8, -2.94]} scale={[0.32, 0.44]} />

      {/* Back Wall — above CRT */}
      <WallPoster kind="loop" position={[0, 2.68, -2.94]} scale={[0.38, 0.52]} />

      {/* Back Wall — right of shelf, left of bookcase */}
      <WallPoster kind="chart" position={[3.0, 2.55, -2.94]} scale={[0.26, 0.36]} />

      {/* Right Wall — large prime poster */}
      <WallPoster kind="prime" position={[3.96, 1.9, -0.35]} rotation={[0, -Math.PI / 2, 0]} scale={[0.58, 0.78]} />
      {/* Right Wall — small moon poster below */}
      <WallPoster kind="moon" position={[3.96, 1.0, -0.35]} rotation={[0, -Math.PI / 2, 0]} scale={[0.3, 0.4]} />
      {/* Right Wall — small loop poster further back */}
      <WallPoster kind="loop" position={[3.96, 2.2, -1.2]} rotation={[0, -Math.PI / 2, 0]} scale={[0.26, 0.36]} />
    </group>
  );
}

function RoomShell() {
  const wallTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = ROOM.wall;
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = 'rgba(255,255,255,0.045)';
      ctx.lineWidth = 2;
      for (let y = 0; y <= 512; y += 42) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }
      for (let y = 0; y < 512; y += 42) {
        for (let x = (y / 42) % 2 === 0 ? 0 : -42; x < 512; x += 84) {
          ctx.strokeRect(x, y, 84, 42);
        }
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2.6, 1.4);
    return texture;
  }, []);

  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color={ROOM.floor} roughness={0.84} />
      </mesh>
      <mesh position={[0, 1.5, -3]} receiveShadow>
        <planeGeometry args={[8, 3]} />
        <meshStandardMaterial map={wallTexture} color="#5f4355" roughness={0.78} />
      </mesh>
      <mesh position={[-4, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 3]} />
        <meshStandardMaterial color="#20223a" roughness={0.84} />
      </mesh>
      <mesh position={[4, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 3]} />
        <meshStandardMaterial color="#171820" roughness={0.88} />
      </mesh>
      <mesh position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#10121a" roughness={0.94} />
      </mesh>
      <Window />
    </group>
  );
}

function Shelf({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Box position={[0, 0.44, 0]} scale={[1.45, 0.08, 0.28]} color={ROOM.wood} />
      <Box position={[0, -0.1, 0]} scale={[1.45, 0.08, 0.28]} color={ROOM.wood} />
      <Box position={[-0.72, 0.16, 0]} scale={[0.08, 1.18, 0.28]} color={ROOM.deskDark} />
      <Box position={[0.72, 0.16, 0]} scale={[0.08, 1.18, 0.28]} color={ROOM.deskDark} />
      {['#7ad7ff', '#ff6ea9', '#f0bd5e', '#9b8cff', '#70ffb0'].map((color, index) => (
        <Box
          key={color}
          position={[-0.42 + index * 0.2, 0.65 + (index % 2) * 0.04, 0.05]}
          scale={[0.11, 0.34 + (index % 2) * 0.08, 0.18]}
          color={color}
          roughness={0.62}
        />
      ))}
      <mesh position={[0.45, 0.08, 0.08]}>
        <boxGeometry args={[0.28, 0.28, 0.22]} />
        <meshStandardMaterial color="#48d7ff" emissive="#0b5770" emissiveIntensity={0.75} roughness={0.58} />
      </mesh>
    </group>
  );
}

function StandingBookcase({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const bookColors = ['#7ad7ff', '#ff6ea9', '#f0bd5e', '#9b8cff', '#70ffb0', '#dfe8ff'];

  return (
    <group position={position} rotation={rotation}>
      <Box position={[0, 0.58, -0.02]} scale={[0.9, 1.7, 0.24]} color="#17100f" roughness={0.78} />
      <Box position={[0, 1.45, 0.13]} scale={[1.02, 0.1, 0.34]} color={ROOM.wood} roughness={0.7} />
      <Box position={[0, -0.3, 0.13]} scale={[1.02, 0.1, 0.34]} color={ROOM.wood} roughness={0.7} />
      <Box position={[-0.5, 0.58, 0.13]} scale={[0.08, 1.76, 0.34]} color={ROOM.wood} roughness={0.72} />
      <Box position={[0.5, 0.58, 0.13]} scale={[0.08, 1.76, 0.34]} color={ROOM.wood} roughness={0.72} />
      {[0.08, 0.54, 1.0].map((y) => (
        <Box key={y} position={[0, y, 0.16]} scale={[0.9, 0.07, 0.3]} color={ROOM.wood} roughness={0.72} />
      ))}
      {Array.from({ length: 18 }, (_, index) => {
        const shelf = Math.floor(index / 6);
        return (
          <Box
            key={index}
            position={[-0.32 + (index % 6) * 0.13, 0.21 + shelf * 0.46 + (index % 2) * 0.03, 0.29]}
            scale={[0.08, 0.22 + (index % 3) * 0.04, 0.11]}
            color={bookColors[index % bookColors.length]}
            roughness={0.62}
          />
        );
      })}
      <mesh position={[0.26, 1.25, 0.31]} receiveShadow>
        <sphereGeometry args={[0.1, 18, 12]} />
        <meshStandardMaterial color="#83ffe2" emissive="#0b6f5b" emissiveIntensity={0.55} roughness={0.52} />
      </mesh>
    </group>
  );
}

function DeskClutter() {
  return (
    <group>
      <group position={[-1.42, DESK_SURFACE_Y + 0.11, -1.04 + DESK_WALL_OFFSET_Z]} rotation={[0, 0.32, 0]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[0.11, 0.1, 0.18, 24]} />
          <meshStandardMaterial color="#101419" roughness={0.42} metalness={0.08} />
        </mesh>
        <mesh position={[0.1, 0.02, 0.02]} rotation={[Math.PI / 2, 0, 0.08]} receiveShadow>
          <torusGeometry args={[0.06, 0.014, 8, 24, Math.PI * 1.28]} />
          <meshStandardMaterial color="#101419" roughness={0.42} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.095, 0]}>
          <cylinderGeometry args={[0.092, 0.092, 0.012, 24]} />
          <meshBasicMaterial color="#65f5d6" transparent opacity={0.25} />
        </mesh>
      </group>

      <group position={[-1.78, DESK_SURFACE_Y + 0.17, -0.55 + DESK_WALL_OFFSET_Z]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[0.17, 0.15, 0.34, 32]} />
          <meshStandardMaterial color="#76d2ff" transparent opacity={0.24} roughness={0.08} metalness={0.02} />
        </mesh>
        {Array.from({ length: 8 }, (_, index) => (
          <mesh
            key={index}
            position={[
              -0.07 + (index % 4) * 0.045,
              -0.13 + Math.floor(index / 4) * 0.055,
              -0.04 + (index % 3) * 0.04,
            ]}
            rotation={[Math.PI / 2, 0, index * 0.2]}
          >
            <cylinderGeometry args={[0.035, 0.035, 0.011, 18]} />
            <meshStandardMaterial color="#ffd45c" emissive="#7a4200" emissiveIntensity={0.42} roughness={0.42} metalness={0.4} />
          </mesh>
        ))}
      </group>

      {[
        [-0.92, DESK_SURFACE_Y + 0.051, -1.1 + DESK_WALL_OFFSET_Z, '#ff6ea9'],
        [-0.72, DESK_SURFACE_Y + 0.052, -1.04 + DESK_WALL_OFFSET_Z, '#ffe28f'],
        [0.86, DESK_SURFACE_Y + 0.052, -1.06 + DESK_WALL_OFFSET_Z, '#7ad7ff'],
      ].map(([x, y, z, color], index) => (
        <mesh key={index} position={[x as number, y as number, z as number]} rotation={[-Math.PI / 2, 0, (index - 1) * 0.12]} receiveShadow>
          <planeGeometry args={[0.18, 0.14]} />
          <meshStandardMaterial color={color as string} roughness={0.78} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function SeatedLookCamera({ resetSignal }: { resetSignal: number }) {
  const { camera, gl } = useThree();
  const targetYawRef = useRef(0);
  const targetPitchRef = useRef(0);
  const currentYawRef = useRef(0);
  const currentPitchRef = useRef(0);
  const releasedAtRef = useRef(0);
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    x: 0,
    y: 0,
    yaw: 0,
    pitch: 0,
  });

  useEffect(() => {
    camera.position.copy(CAMERA_HOME);
    camera.updateProjectionMatrix();
  }, [camera]);

  useEffect(() => {
    targetYawRef.current = 0;
    targetPitchRef.current = 0;
    currentYawRef.current = 0;
    currentPitchRef.current = 0;
    releasedAtRef.current = performance.now();
  }, [resetSignal]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.style.cursor = 'grab';

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (event.target instanceof HTMLElement && event.target.closest('.starter-room-view-controls')) return;

      dragRef.current = {
        active: true,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        yaw: targetYawRef.current,
        pitch: targetPitchRef.current,
      };
      canvas.style.cursor = 'grabbing';
      document.body.style.cursor = 'grabbing';
      event.preventDefault();
    };

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag.active || drag.pointerId !== event.pointerId) return;

      const nextYaw = drag.yaw + (event.clientX - drag.x) * CAMERA_DRAG_SENSITIVITY.yaw;
      const nextPitch = drag.pitch - (event.clientY - drag.y) * CAMERA_DRAG_SENSITIVITY.pitch;
      targetYawRef.current = THREE.MathUtils.clamp(nextYaw, -CAMERA_LIMITS.yaw, CAMERA_LIMITS.yaw);
      targetPitchRef.current = THREE.MathUtils.clamp(nextPitch, CAMERA_LIMITS.pitchDown, CAMERA_LIMITS.pitchUp);
    };

    const finishDrag = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag.active || drag.pointerId !== event.pointerId) return;

      dragRef.current.active = false;
      releasedAtRef.current = performance.now();
      canvas.style.cursor = 'grab';
      document.body.style.cursor = '';
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('pointerup', finishDrag, true);
    window.addEventListener('pointercancel', finishDrag, true);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerup', finishDrag, true);
      window.removeEventListener('pointercancel', finishDrag, true);
      canvas.style.cursor = '';
      document.body.style.cursor = '';
    };
  }, [gl]);

  const _lookDir = useMemo(() => new THREE.Vector3(), []);
  const _lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const now = performance.now();
    if (!dragRef.current.active && now - releasedAtRef.current > 550) {
      targetYawRef.current = THREE.MathUtils.damp(targetYawRef.current, 0, 4.2, delta);
      targetPitchRef.current = THREE.MathUtils.damp(targetPitchRef.current, 0, 4.2, delta);
    }

    currentYawRef.current = THREE.MathUtils.damp(currentYawRef.current, targetYawRef.current, 18, delta);
    currentPitchRef.current = THREE.MathUtils.damp(currentPitchRef.current, targetPitchRef.current, 18, delta);

    const yaw = currentYawRef.current;
    const pitch = CAMERA_BASE_PITCH + currentPitchRef.current;
    _lookDir.set(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch),
    );

    camera.position.copy(CAMERA_HOME);
    _lookTarget.copy(CAMERA_HOME).addScaledVector(_lookDir, 6);
    camera.lookAt(_lookTarget);
  });

  return null;
}

function InspectionCamera({
  resetSignal,
  onInspectCameraChange,
}: {
  resetSignal: number;
  onInspectCameraChange?: (snapshot: RoomInspectionSnapshot) => void;
}) {
  const { camera, gl } = useThree();
  const yawRef = useRef(0);
  const pitchRef = useRef(CAMERA_BASE_PITCH);
  const keysRef = useRef(new Set<string>());
  const lastReportRef = useRef(0);
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    x: 0,
    y: 0,
    yaw: 0,
    pitch: CAMERA_BASE_PITCH,
  });

  useEffect(() => {
    camera.position.copy(INSPECT_CAMERA_HOME);
    yawRef.current = 0;
    pitchRef.current = CAMERA_BASE_PITCH;
    camera.updateProjectionMatrix();
  }, [camera, resetSignal]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.style.cursor = 'grab';

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (event.target instanceof HTMLElement && event.target.closest('.starter-room-view-controls')) return;

      dragRef.current = {
        active: true,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        yaw: yawRef.current,
        pitch: pitchRef.current,
      };
      canvas.style.cursor = 'grabbing';
      document.body.style.cursor = 'grabbing';
      event.preventDefault();
    };

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag.active || drag.pointerId !== event.pointerId) return;

      yawRef.current = THREE.MathUtils.clamp(
        drag.yaw + (event.clientX - drag.x) * INSPECT_DRAG_SENSITIVITY.yaw,
        -Math.PI * 0.72,
        Math.PI * 0.72,
      );
      pitchRef.current = THREE.MathUtils.clamp(
        drag.pitch - (event.clientY - drag.y) * INSPECT_DRAG_SENSITIVITY.pitch,
        -0.74,
        0.48,
      );
    };

    const finishDrag = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag.active || drag.pointerId !== event.pointerId) return;

      dragRef.current.active = false;
      canvas.style.cursor = 'grab';
      document.body.style.cursor = '';
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(key)) {
        keysRef.current.add(key);
        if (key !== 'shift') event.preventDefault();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.key.toLowerCase());
    };

    const clearKeys = () => {
      keysRef.current.clear();
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('pointerup', finishDrag, true);
    window.addEventListener('pointercancel', finishDrag, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', clearKeys);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerup', finishDrag, true);
      window.removeEventListener('pointercancel', finishDrag, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', clearKeys);
      canvas.style.cursor = '';
      document.body.style.cursor = '';
    };
  }, [gl]);

  const _forward = useMemo(() => new THREE.Vector3(), []);
  const _right = useMemo(() => new THREE.Vector3(), []);
  const _move = useMemo(() => new THREE.Vector3(), []);
  const _lookDir = useMemo(() => new THREE.Vector3(), []);
  const _lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, delta) => {
    const keys = keysRef.current;
    const yaw = yawRef.current;
    const pitch = pitchRef.current;
    const speed = INSPECT_MOVE_SPEED * (keys.has('shift') ? 2 : 1) * delta;

    _forward.set(Math.sin(yaw), 0, -Math.cos(yaw));
    _right.set(Math.cos(yaw), 0, Math.sin(yaw));
    _move.set(0, 0, 0);

    if (keys.has('w') || keys.has('arrowup')) _move.add(_forward);
    if (keys.has('s') || keys.has('arrowdown')) _move.sub(_forward);
    if (keys.has('d') || keys.has('arrowright')) _move.add(_right);
    if (keys.has('a') || keys.has('arrowleft')) _move.sub(_right);
    if (keys.has('e')) _move.y += 1;
    if (keys.has('q')) _move.y -= 1;

    if (_move.lengthSq() > 0) {
      _move.normalize().multiplyScalar(speed);
      camera.position.add(_move);
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, INSPECT_CAMERA_LIMITS.x[0], INSPECT_CAMERA_LIMITS.x[1]);
      camera.position.y = THREE.MathUtils.clamp(camera.position.y, INSPECT_CAMERA_LIMITS.y[0], INSPECT_CAMERA_LIMITS.y[1]);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, INSPECT_CAMERA_LIMITS.z[0], INSPECT_CAMERA_LIMITS.z[1]);
    }

    _lookDir.set(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch),
    );
    _lookTarget.copy(camera.position).addScaledVector(_lookDir, 6);
    camera.lookAt(_lookTarget);

    if (onInspectCameraChange && clock.elapsedTime - lastReportRef.current > 0.12) {
      onInspectCameraChange({
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        yaw: THREE.MathUtils.radToDeg(yaw),
        pitch: THREE.MathUtils.radToDeg(pitch),
      });
      lastReportRef.current = clock.elapsedTime;
    }
  });

  return null;
}

function StarterRoomContent() {
  return (
    <Suspense fallback={null}>
      <fog attach="fog" args={['#07080c', 5.8, 12]} />
      <ambientLight intensity={0.62} color="#bdd1ff" />
      <hemisphereLight args={['#b5d2ff', '#302018', 0.48]} />
      <directionalLight
        position={[-2.8, 4.5, 2.2]}
        intensity={1.95}
        color="#a9c4ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.00035}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={3}
        shadow-camera-bottom={-1}
      />
      <pointLight position={[-2.25, 1.65, -2.25]} intensity={3.75} distance={4.4} color="#c66dff" />
      <pointLight position={[0, 1.35, -1.34 + DESK_WALL_OFFSET_Z]} intensity={2.35} distance={3.6} color={ROOM.glow} />
      <pointLight position={[2.55, 1.4, -0.8]} intensity={1.55} distance={3.4} color="#ffb861" />
      <pointLight position={[0, 1.85, 2.2]} intensity={0.36} distance={4.4} color="#dceaff" />
      <RoomShell />
      <WallDecor />
      <StandingBookcase position={[3.56, 0, -2.4]} rotation={[0, -Math.PI / 2, 0]} />
      <Shelf position={[1.8, 2.15, -2.87]} />
      <Desk />
      <DeskClutter />
      <Casing />
      <IndustrialLamp />
      <ContactShadows position={[0, 0.015, -1.15]} opacity={0.42} scale={6} blur={2.5} far={3} frames={1} />
    </Suspense>
  );
}

export default function StarterRoomScene({
  resetSignal,
  inspectMode = false,
  onInspectCameraChange,
}: {
  resetSignal: number;
  inspectMode?: boolean;
  onInspectCameraChange?: (snapshot: RoomInspectionSnapshot) => void;
}) {
  return (
    <Canvas className="starter-room-canvas" shadows dpr={[1, 2]} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
      <color attach="background" args={['#07080c']} />
      <PerspectiveCamera makeDefault position={[0, 1.5, 4.78]} fov={43} />
      <StarterRoomContent />
      {inspectMode ? (
        <InspectionCamera resetSignal={resetSignal} onInspectCameraChange={onInspectCameraChange} />
      ) : (
        <SeatedLookCamera resetSignal={resetSignal} />
      )}
    </Canvas>
  );
}

useGLTF.preload('/models/room/industrial_pipe_lamp/industrial_pipe_lamp_1k.gltf');
useGLTF.preload('/models/room/antique_wooden_desk/antique_wooden_desk.glb');
