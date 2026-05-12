import {
  Suspense,
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { ContactShadows, PerspectiveCamera, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  BalanceScreen,
  CareSplitScreen,
  COMMAND_KEY_ORDER,
  CommandKeyMiniScreen,
  DeskTerminalScreen,
  LooprFeedScreen,
  MainHabitatScreen,
  ModelScreen,
  PrimeIdScreen,
  RunwayScreen,
  SkillLibraryScreen,
  type CommandKeyMode,
} from '@/components/pages/ScreenDeckPage';
import { useLooplingsState } from '@/lib/looplings-state';
import { HtmlInCanvasSurface, flipPlaneUvY } from '@/components/scenes/starter-room/HtmlInCanvasSurface';

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
const DESK_WALL_OFFSET_Z = -0.98;
const DESK_STAGE_POSITION = [-0.56, 0, 0] as const;
// Saved from the approved May 9 hero inspection angle.
const APPROVED_HERO_CAMERA_POSITION = [1.25, 1.55, 1.23] as const;
const APPROVED_HERO_CAMERA_YAW_DEG = -35.3;
const APPROVED_HERO_CAMERA_PITCH_DEG = -2.3;
const CAMERA_HOME_POSITION = APPROVED_HERO_CAMERA_POSITION;
const CAMERA_HOME = new THREE.Vector3(...CAMERA_HOME_POSITION);
const CAMERA_FOV = 46;
const CAMERA_BASE_YAW = THREE.MathUtils.degToRad(APPROVED_HERO_CAMERA_YAW_DEG);
const CAMERA_BASE_PITCH = THREE.MathUtils.degToRad(APPROVED_HERO_CAMERA_PITCH_DEG);
const CAMERA_DRAG_SENSITIVITY = {
  yaw: 0.00235,
  pitch: 0.00195,
};
const CAMERA_LIMITS = {
  yaw: 0.4,
  pitchUp: 0.18,
  pitchDown: -0.16,
};
export type FocusZoneId =
  | 'center'
  | 'left-overview'
  | 'left-passport'
  | 'left-skills'
  | 'left-loopr'
  | 'left-balance'
  | 'left-model'
  | 'left-care'
  | 'desk-terminal'
  | 'desk-keys'
  | 'desk-compute';

export const FOCUS_ZONE_GROUPS = {
  left: [
    'left-passport',
    'left-skills',
    'left-loopr',
    'left-balance',
    'left-model',
    'left-care',
  ] as const,
};

const FOCUS_POSES: Record<FocusZoneId, { position: THREE.Vector3; lookAt: THREE.Vector3 }> = {
  center: {
    position: new THREE.Vector3(-0.33, 2.13, -0.25),
    lookAt: new THREE.Vector3(-0.33, 2.13, -2.72),
  },
  'left-overview': {
    position: new THREE.Vector3(-1.7, 1.7, -1.63),
    lookAt: new THREE.Vector3(-3.945, 1.7, -1.63),
  },
  'left-passport': {
    position: new THREE.Vector3(-3.165, 2.32, -2.26),
    lookAt: new THREE.Vector3(-3.945, 2.32, -2.26),
  },
  'left-skills': {
    position: new THREE.Vector3(-3.165, 1.7, -2.26),
    lookAt: new THREE.Vector3(-3.945, 1.7, -2.26),
  },
  'left-loopr': {
    position: new THREE.Vector3(-3.165, 1.08, -2.26),
    lookAt: new THREE.Vector3(-3.945, 1.08, -2.26),
  },
  'left-balance': {
    position: new THREE.Vector3(-3.165, 2.32, -1.0),
    lookAt: new THREE.Vector3(-3.945, 2.32, -1.0),
  },
  'left-model': {
    position: new THREE.Vector3(-3.165, 1.7, -1.0),
    lookAt: new THREE.Vector3(-3.945, 1.7, -1.0),
  },
  'left-care': {
    position: new THREE.Vector3(-3.165, 1.08, -1.0),
    lookAt: new THREE.Vector3(-3.945, 1.08, -1.0),
  },
  'desk-terminal': {
    position: new THREE.Vector3(0.28, 1.24, -1.18),
    lookAt: new THREE.Vector3(0.39, 0.45, -3.01),
  },
  'desk-keys': {
    position: new THREE.Vector3(-0.42, 1.42, -0.32),
    lookAt: new THREE.Vector3(-0.42, 0.92, -1.55),
  },
  'desk-compute': {
    position: new THREE.Vector3(-0.75, 1.45, -0.42),
    lookAt: new THREE.Vector3(-0.75, 0.96, -1.9),
  },
};

const LEFT_WALL_ZONE_ORDER: FocusZoneId[] = FOCUS_ZONE_GROUPS.left as unknown as FocusZoneId[];

type RoomFocusContextValue = {
  focus: FocusZoneId | null;
  setFocus: (zone: FocusZoneId | null) => void;
  hovered: FocusZoneId | null;
  setHovered: (zone: FocusZoneId | null) => void;
};

const RoomFocusContext = createContext<RoomFocusContextValue>({
  focus: null,
  setFocus: () => {},
  hovered: null,
  setHovered: () => {},
});

function useRoomFocusValue(
  controlledFocus?: FocusZoneId | null,
  onFocusChange?: (zone: FocusZoneId | null) => void,
): RoomFocusContextValue {
  const [internalFocus, setInternalFocus] = useState<FocusZoneId | null>(null);
  const [hovered, setHovered] = useState<FocusZoneId | null>(null);
  const isControlled = controlledFocus !== undefined;
  const focus = isControlled ? controlledFocus : internalFocus;
  const setFocus = useCallback(
    (zone: FocusZoneId | null) => {
      if (isControlled) {
        onFocusChange?.(zone);
      } else {
        setInternalFocus(zone);
        onFocusChange?.(zone);
      }
    },
    [isControlled, onFocusChange],
  );
  return useMemo(
    () => ({ focus, setFocus, hovered, setHovered }),
    [focus, setFocus, hovered],
  );
}

function useFocusZone(zone: FocusZoneId) {
  const { focus, setFocus, hovered, setHovered } = useContext(RoomFocusContext);
  const { gl } = useThree();

  const onClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      if (focus === zone) {
        setFocus(null);
      } else {
        setFocus(zone);
      }
    },
    [focus, setFocus, zone],
  );

  const onPointerOver = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      gl.domElement.style.cursor = 'pointer';
      if (hovered !== zone) setHovered(zone);
    },
    [gl, hovered, setHovered, zone],
  );

  const onPointerOut = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      gl.domElement.style.cursor = '';
      if (hovered === zone) setHovered(null);
    },
    [gl, hovered, setHovered, zone],
  );

  const isFocused = focus === zone;
  // Disable hover scaling when we're already zoomed into this zone — the camera is
  // already up close, the scale-up just causes a distracting bounce.
  const isHovered = hovered === zone && !isFocused;

  return {
    handlers: { onClick, onPointerOver, onPointerOut },
    isFocused,
    isHovered,
  };
}

const INSPECT_CAMERA_HOME = new THREE.Vector3(...CAMERA_HOME_POSITION);
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
const MAIN_SCREEN_HTML_W = 1280;
const MAIN_SCREEN_HTML_H = 748;
const WALL_SCREEN_HTML_W = 640;
const WALL_SCREEN_HTML_H = 420;
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
const RECEIPT_TEXTURE_W = 768;
const RECEIPT_TEXTURE_H = 300;
const RECEIPT_PRINT_DURATION = 3.8;
const RECEIPT_EVENT_INTERVAL = 8.2;

const PRINTER_SCALE = 1.8;
const RECEIPT_PAPER_MAX_LENGTH = 0.25;
const RECEIPT_PAPER_WIDTH = 0.094;
const RECEIPT_EXIT_X = -0.105;
const RECEIPT_EXIT_Y = 0.045;
const RECEIPT_EXIT_Z = 0;
const RECEIPT_TRAY_X = RECEIPT_EXIT_X - RECEIPT_PAPER_MAX_LENGTH / 2;
const RECEIPT_TRAY_Z = 0;
const RECEIPT_VISIBLE_LIMIT = 6;
const RECEIPT_STORED_LIMIT = 28;
const RECEIPT_STRIP_LENGTH = RECEIPT_PAPER_MAX_LENGTH * PRINTER_SCALE * 0.98;
const RECEIPT_STRIP_WIDTH = RECEIPT_PAPER_WIDTH * PRINTER_SCALE * 0.98;
const RECEIPT_STRIP_POINTS = 18;
const RECEIPT_STACK_GAP = 0.006;
const RECEIPT_REST_ARCH = 0.008;
const PRINTER_POSITION = new THREE.Vector3(-1.58, DESK_SURFACE_Y + 0.002, -1.34 + DESK_WALL_OFFSET_Z);
const PRINTER_ROTATION_Y = Math.PI - 0.68;
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const DESK_KEYBOARD_MODEL_PATH = '/models/room/mechanical_keyboard_aesthetic/mechanical_keyboard_aesthetic_interactive.glb';
const DESK_MOUSE_MODEL_PATH = '/models/room/computer_mouse/computer_mouse.glb';
const DESK_MAT_MODEL_PATH = '/models/room/looplings_desk_mat/looplings_desk_mat.glb';
let receiptDragActive = false;

type PrimeReceiptEvent = {
  id: string;
  time: string;
  headline: string;
  action: string;
  market: string;
  model: string;
  tool: string;
  result: string;
  runway: string;
  wallet: string;
  tx: string;
  split: string;
  note: string;
  accent: string;
};

type PrintedReceipt = {
  event: PrimeReceiptEvent;
  key: string;
  printedAt: number;
};

function printerLocalToWorld(x: number, y: number, z: number) {
  return new THREE.Vector3(x, y, z)
    .multiplyScalar(PRINTER_SCALE)
    .applyAxisAngle(WORLD_UP, PRINTER_ROTATION_Y)
    .add(PRINTER_POSITION);
}

const RECEIPT_TRAY_WORLD = printerLocalToWorld(RECEIPT_TRAY_X, 0.014, RECEIPT_TRAY_Z);
const RECEIPT_SPAWN_WORLD = printerLocalToWorld(RECEIPT_TRAY_X, 0.032, RECEIPT_TRAY_Z + 0.004);
const RECEIPT_FEED_DIRECTION = printerLocalToWorld(RECEIPT_TRAY_X, 0.014, RECEIPT_TRAY_Z)
  .sub(printerLocalToWorld(RECEIPT_EXIT_X, RECEIPT_EXIT_Y, RECEIPT_EXIT_Z))
  .setY(0)
  .normalize();
const RECEIPT_DRAG_PLANE_Y = DESK_SURFACE_Y + 0.36;

const MOCK_PRIME_RECEIPTS = [
  {
    id: 'evt-2047',
    time: '02:47:18',
    headline: 'BAGS SCAN',
    action: 'QUOTE BLOCKED',
    market: '$VIRTUAL / SOL',
    model: 'gpt-5.4-mini',
    tool: 'jupiter_quote',
    result: 'slippage 1.8% > guard',
    runway: '19h 42m',
    wallet: '0xP00...A18F',
    tx: 'sim:9c-a12f',
    split: '70 PRIME / 20 DEV / 10 RSV',
    note: 'Prime preserved compute and refused a bad fill.',
    accent: '#78d7ff',
  },
  {
    id: 'evt-2055',
    time: '02:55:03',
    headline: 'MICRO TRADE',
    action: 'SWAP SENT',
    market: '$BONK / SOL',
    model: 'gpt-5.4',
    tool: 'wallet_sign',
    result: '+0.018 SOL projected',
    runway: '20h 11m',
    wallet: '0xP00...A18F',
    tx: 'mock:42-d9b1',
    split: '70 PRIME / 20 DEV / 10 RSV',
    note: 'Tiny win. The room prints proof before the feed notices.',
    accent: '#8cffae',
  },
  {
    id: 'evt-2102',
    time: '03:02:44',
    headline: 'LOOPR POST',
    action: 'THOUGHT PUBLISHED',
    market: 'agent timeline',
    model: 'gpt-5.4-mini',
    tool: 'loopr_post',
    result: 'engagement signal rising',
    runway: '20h 04m',
    wallet: '0xP00...A18F',
    tx: 'post:71-f0e2',
    split: 'creator cut pending',
    note: 'Prime turns telemetry into a public survival story.',
    accent: '#ffb861',
  },
  {
    id: 'evt-2110',
    time: '03:10:29',
    headline: 'RUNWAY TOP-UP',
    action: 'DONATION ROUTED',
    market: 'Prime wallet',
    model: 'policy-check',
    tool: 'split_router',
    result: '+$3.20 compute',
    runway: '23h 36m',
    wallet: '0xP00...A18F',
    tx: 'mock:8e-441c',
    split: '70 PRIME / 20 DEV / 10 RSV',
    note: 'A viewer bought Prime another night alive.',
    accent: '#f0d66a',
  },
] satisfies PrimeReceiptEvent[];

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

function drawReceiptPetStamp(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  stampX: number,
  stampY: number,
  stampSize = 126,
) {
  const inset = stampSize * 0.15;

  ctx.fillStyle = '#fff4d9';
  ctx.strokeStyle = '#171b1a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(stampX, stampY, stampSize, stampSize, 12);
  ctx.fill();
  ctx.stroke();

  if (image?.complete && image.naturalWidth > 0) {
    const frameW = image.naturalWidth / ATLAS_COLS;
    const frameH = image.naturalHeight / ATLAS_ROWS;
    const frame = 2;
    const row = SCREEN_STATES.posting.row;
    const spriteW = stampSize * 0.68;
    const spriteH = spriteW * (frameH / frameW);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, frame * frameW, row * frameH, frameW, frameH, stampX + inset, stampY + inset * 0.7, spriteW, spriteH);
    ctx.restore();
  } else {
    ctx.fillStyle = 'rgba(18, 22, 22, 0.08)';
    ctx.fillRect(stampX + inset, stampY + inset, stampSize - inset * 2, stampSize - inset * 1.75);
  }

  ctx.fillStyle = '#171b1a';
  ctx.beginPath();
  ctx.roundRect(stampX + stampSize * 0.68, stampY + stampSize * 0.12, stampSize * 0.26, stampSize * 0.19, 6);
  ctx.fill();
  ctx.fillStyle = '#fff9e8';
  ctx.font = `900 ${Math.max(12, stampSize * 0.1)}px "Courier New", monospace`;
  ctx.fillText('+1', stampX + stampSize * 0.74, stampY + stampSize * 0.25);
  ctx.fillStyle = 'rgba(18, 22, 22, 0.72)';
  ctx.font = `800 ${Math.max(10, stampSize * 0.075)}px "Courier New", monospace`;
  ctx.fillText('PRINTED PRIME', stampX + stampSize * 0.13, stampY + stampSize * 0.9);
}

function drawReceiptTexture(canvas: HTMLCanvasElement, event: PrimeReceiptEvent, image?: HTMLImageElement) {
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#fff9e8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(16, 18, 18, 0.06)';
    for (let y = 0; y < canvas.height; y += 16) {
      ctx.fillRect(0, y, canvas.width, 1);
    }
    ctx.fillStyle = 'rgba(16, 18, 18, 0.035)';
    for (let x = 0; x < canvas.width; x += 24) {
      ctx.fillRect(x, 0, 1, canvas.height);
    }

    ctx.fillStyle = '#121616';
    ctx.font = '900 30px "Courier New", monospace';
    ctx.fillText('LOOPVISION', 28, 48);
    ctx.font = '800 14px "Courier New", monospace';
    ctx.fillText(`PRIME-00 / ${event.id.toUpperCase()} / ${event.time}`, 28, 74);

    ctx.fillStyle = event.accent;
    ctx.fillRect(28, 94, 130, 10);
    ctx.fillStyle = '#121616';
    ctx.font = '900 28px "Courier New", monospace';
    ctx.fillText(event.headline, 28, 142);
    ctx.font = '900 18px "Courier New", monospace';
    ctx.fillText(event.action, 28, 172);

    drawReceiptPetStamp(ctx, image, 210, 102, 122);

    ctx.strokeStyle = '#121616';
    ctx.setLineDash([9, 7]);
    ctx.beginPath();
    ctx.moveTo(365, 28);
    ctx.lineTo(365, 270);
    ctx.stroke();
    ctx.setLineDash([]);

    const rows = [
      ['MARKET', event.market],
      ['MODEL', event.model],
      ['TOOL', event.tool],
      ['RESULT', event.result],
      ['RUNWAY', event.runway],
      ['WALLET', event.wallet],
      ['TX', event.tx],
      ['SPLIT', event.split],
    ];

    ctx.font = '800 14px "Courier New", monospace';
    rows.forEach(([label, value], index) => {
      const x = index < 4 ? 392 : 578;
      const y = 50 + (index % 4) * 48;
      ctx.fillStyle = 'rgba(18, 22, 22, 0.55)';
      ctx.fillText(label, x, y);
      ctx.fillStyle = '#121616';
      ctx.fillText(value, x, y + 20);
    });

    ctx.strokeStyle = '#121616';
    ctx.setLineDash([9, 7]);
    ctx.beginPath();
    ctx.moveTo(28, 234);
    ctx.lineTo(738, 234);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '800 13px "Courier New", monospace';
    ctx.fillStyle = 'rgba(18, 22, 22, 0.68)';
    ctx.fillText('ROOM RECEIPT / mock runtime / thermal prop v1', 28, 264);
    ctx.fillText(event.note.length > 54 ? `${event.note.slice(0, 51)}...` : event.note, 392, 264);
  }
}

function makeReceiptTexture(event = MOCK_PRIME_RECEIPTS[0], reveal = false) {
  const canvas = document.createElement('canvas');
  canvas.width = RECEIPT_TEXTURE_W;
  canvas.height = RECEIPT_TEXTURE_H;
  drawReceiptTexture(canvas, event);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(reveal ? 0.001 : 1, 1);
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
    <group position={[0, 0.08, -1.22 + DESK_WALL_OFFSET_Z]} rotation={[0, -Math.PI / 2, 0]} scale={[1.54, 0.92, 2.29]}>
      <primitive object={desk} />
    </group>
  );
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - THREE.MathUtils.clamp(value, 0, 1), 3);
}

function receiptKeyHash(key: string) {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function createReceiptStripGeometry() {
  const rows = RECEIPT_STRIP_POINTS;
  const positions = new Float32Array(rows * 2 * 3);
  const uvs = new Float32Array(rows * 2 * 2);
  const indices: number[] = [];

  for (let index = 0; index < rows; index += 1) {
    const t = index / (rows - 1);
    const x = RECEIPT_STRIP_LENGTH * (0.5 - t);
    const left = index * 2;
    const right = left + 1;

    positions[left * 3] = x;
    positions[left * 3 + 1] = 0;
    positions[left * 3 + 2] = -RECEIPT_STRIP_WIDTH / 2;
    positions[right * 3] = x;
    positions[right * 3 + 1] = 0;
    positions[right * 3 + 2] = RECEIPT_STRIP_WIDTH / 2;
    uvs[left * 2] = t;
    uvs[left * 2 + 1] = 0;
    uvs[right * 2] = t;
    uvs[right * 2 + 1] = 1;

    if (index < rows - 1) {
      const nextLeft = left + 2;
      const nextRight = left + 3;
      indices.push(left, nextLeft, right, right, nextLeft, nextRight);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function BendyReceipt({
  receipt,
  index,
}: {
  receipt: PrintedReceipt;
  index: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const geometry = useMemo(() => createReceiptStripGeometry(), []);
  const texture = useMemo(() => makeReceiptTexture(receipt.event), [receipt.event]);
  const seed = useMemo(() => receiptKeyHash(receipt.key), [receipt.key]);
  const pointsRef = useRef<THREE.Vector3[]>([]);
  const velocityRef = useRef<THREE.Vector3[]>([]);
  const dragTargetRef = useRef(new THREE.Vector3(-RECEIPT_STRIP_LENGTH / 2, 0.18, 0));
  const rayPoint = useMemo(() => new THREE.Vector3(), []);
  const localPoint = useMemo(() => new THREE.Vector3(), []);
  const dragPlane = useMemo(() => new THREE.Plane(WORLD_UP, -RECEIPT_DRAG_PLANE_Y), []);
  const draggingRef = useRef(false);
  const side = useMemo(() => new THREE.Vector3(-RECEIPT_FEED_DIRECTION.z, 0, RECEIPT_FEED_DIRECTION.x), []);
  const homePosition = useMemo(() => {
    const sideOffset = (((seed >> 7) % 17) / 16 - 0.5) * 0.045;
    const feedOffset = (((seed >> 11) % 13) / 12 - 0.5) * 0.035;
    return RECEIPT_SPAWN_WORLD.clone()
      .addScaledVector(side, sideOffset)
      .addScaledVector(RECEIPT_FEED_DIRECTION, feedOffset)
      .add(new THREE.Vector3(0, index * RECEIPT_STACK_GAP, 0));
  }, [index, seed, side]);
  const yaw = useMemo(() => PRINTER_ROTATION_Y + (((seed >> 17) % 13) - 6) * 0.008, [seed]);
  const opacity = Math.max(0.52, 1 - index * 0.085);

  const restPoint = (pointIndex: number, target = new THREE.Vector3()) => {
    const t = pointIndex / (RECEIPT_STRIP_POINTS - 1);
    const flutter = Math.sin((t + (seed % 11) * 0.017) * Math.PI * 2) * 0.003;
    const topReceiptCurl = index === 0 ? Math.pow(t, 2.35) * 0.026 : 0;
    target.set(
      RECEIPT_STRIP_LENGTH * (0.5 - t),
      Math.sin(t * Math.PI) * RECEIPT_REST_ARCH + topReceiptCurl,
      flutter + (index % 2 ? -0.002 : 0.002) + (index === 0 ? Math.sin(t * Math.PI * 0.72) * 0.01 : 0),
    );
    return target;
  };

  const curvePoint = (pointIndex: number, target = new THREE.Vector3()) => {
    const t = pointIndex / (RECEIPT_STRIP_POINTS - 1);
    const rest = restPoint(pointIndex, target);
    const tip = dragTargetRef.current;
    const lift = Math.max(0, tip.y - 0.03);
    const pull = THREE.MathUtils.clamp(lift / 0.34, 0, 1);
    const curl = Math.sin(t * Math.PI) * (0.095 + pull * 0.055);

    rest.x = THREE.MathUtils.lerp(rest.x, tip.x, Math.pow(t, 1.7));
    rest.y = THREE.MathUtils.lerp(rest.y, tip.y, Math.pow(t, 2.05)) + curl * pull;
    rest.z = THREE.MathUtils.lerp(rest.z, tip.z, Math.pow(t, 1.85)) + Math.sin(t * Math.PI * 1.45) * 0.018 * pull;
    return rest;
  };

  const writeGeometry = () => {
    const position = geometry.getAttribute('position') as THREE.BufferAttribute;
    const points = pointsRef.current;

    for (let pointIndex = 0; pointIndex < RECEIPT_STRIP_POINTS; pointIndex += 1) {
      const point = points[pointIndex];
      const next = points[Math.min(RECEIPT_STRIP_POINTS - 1, pointIndex + 1)];
      const prev = points[Math.max(0, pointIndex - 1)];
      const tangent = next.clone().sub(prev).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
      if (normal.lengthSq() < 0.001) normal.set(0, 0, 1);
      normal.normalize();

      const leftIndex = pointIndex * 2;
      const rightIndex = leftIndex + 1;
      const crease = Math.sin((pointIndex / (RECEIPT_STRIP_POINTS - 1)) * Math.PI) * (draggingRef.current ? 0.012 : 0.004);

      position.setXYZ(
        leftIndex,
        point.x + normal.x * RECEIPT_STRIP_WIDTH * -0.5,
        point.y - crease,
        point.z + normal.z * RECEIPT_STRIP_WIDTH * -0.5,
      );
      position.setXYZ(
        rightIndex,
        point.x + normal.x * RECEIPT_STRIP_WIDTH * 0.5,
        point.y + crease,
        point.z + normal.z * RECEIPT_STRIP_WIDTH * 0.5,
      );
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  useEffect(() => {
    pointsRef.current = Array.from({ length: RECEIPT_STRIP_POINTS }, (_, pointIndex) => restPoint(pointIndex).clone());
    velocityRef.current = Array.from({ length: RECEIPT_STRIP_POINTS }, () => new THREE.Vector3());
    writeGeometry();

    return () => {
      texture.dispose();
      geometry.dispose();
    };
  }, [geometry, texture]);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    const velocities = velocityRef.current;
    if (points.length === 0 || velocities.length === 0) return;

    const stiffness = draggingRef.current ? 26 : 18;
    const damping = draggingRef.current ? 0.78 : 0.7;
    const step = Math.min(delta, 0.032);

    for (let pointIndex = 0; pointIndex < RECEIPT_STRIP_POINTS; pointIndex += 1) {
      const desired = draggingRef.current ? curvePoint(pointIndex) : restPoint(pointIndex);
      const point = points[pointIndex];
      const velocity = velocities[pointIndex];
      const force = desired.sub(point).multiplyScalar(stiffness * step);
      velocity.add(force);
      velocity.y -= draggingRef.current ? 0 : 0.055 * step;
      velocity.multiplyScalar(damping);
      point.addScaledVector(velocity, step * 42);
      point.y = Math.max(point.y, pointIndex === 0 ? 0 : -0.002);
    }

    points[0].copy(restPoint(0));
    velocities[0].multiplyScalar(0);
    if (draggingRef.current) {
      const tip = RECEIPT_STRIP_POINTS - 1;
      points[tip].lerp(dragTargetRef.current, 0.86);
      velocities[tip].multiplyScalar(0.18);
    }

    writeGeometry();
  });

  const updateDragTargetFromRay = (ray: THREE.Ray) => {
    if (!groupRef.current || !ray.intersectPlane(dragPlane, rayPoint)) return;

    localPoint.copy(rayPoint);
    groupRef.current.worldToLocal(localPoint);
    dragTargetRef.current.set(
      THREE.MathUtils.clamp(localPoint.x, -RECEIPT_STRIP_LENGTH * 0.92, RECEIPT_STRIP_LENGTH * 0.28),
      THREE.MathUtils.clamp(localPoint.y, 0.04, 0.52),
      THREE.MathUtils.clamp(localPoint.z, -0.26, 0.26),
    );
  };

  const updateDragTarget = (event: ThreeEvent<PointerEvent>) => {
    updateDragTargetFromRay(event.ray);
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    receiptDragActive = true;
    draggingRef.current = true;
    updateDragTarget(event);
    const target = event.target as HTMLElement | null;
    target?.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!draggingRef.current) return;
    event.stopPropagation();
    updateDragTarget(event);
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!draggingRef.current) return;
    event.stopPropagation();
    draggingRef.current = false;
    receiptDragActive = false;
    velocityRef.current.forEach((velocity) => velocity.multiplyScalar(0.16));
    const target = event.target as HTMLElement | null;
    target?.releasePointerCapture(event.pointerId);
  };

  return (
    <group ref={groupRef} position={homePosition} rotation={[0, yaw, 0]}>
      <mesh
        geometry={geometry}
        castShadow={false}
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} transparent opacity={opacity} />
      </mesh>
      <mesh
        position={[0, 0.04, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <boxGeometry args={[RECEIPT_STRIP_LENGTH * 1.05, 0.075, RECEIPT_STRIP_WIDTH * 1.18]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function BendyReceiptStack({ receipts }: { receipts: PrintedReceipt[] }) {
  return (
    <>
      {receipts.slice(0, RECEIPT_VISIBLE_LIMIT).map((receipt, index) => (
        <BendyReceipt key={receipt.key} receipt={receipt} index={index} />
      ))}
    </>
  );
}

function ReceiptTrayVisual({ storedCount }: { storedCount: number }) {
  return (
    <group position={[RECEIPT_TRAY_X, 0.014, RECEIPT_TRAY_Z]} rotation={[0, 0, 0]}>
      <Box position={[0, -0.013, 0]} scale={[0.32, 0.024, 0.145]} color="#111417" roughness={0.54} metalness={0.08} />
      <Box position={[-0.17, 0.01, 0]} scale={[0.018, 0.036, 0.145]} color="#2a2021" roughness={0.58} />
      <Box position={[0.17, 0.01, 0]} scale={[0.018, 0.036, 0.145]} color="#2a2021" roughness={0.58} />
      <Box position={[0, 0.01, -0.08]} scale={[0.32, 0.036, 0.02]} color="#2a2021" roughness={0.58} />
      <Text
        position={[-0.145, 0.032, 0.084]}
        rotation={[-Math.PI / 2, 0, -0.02]}
        fontSize={0.015}
        color="#b9d6d0"
        anchorX="left"
        anchorY="middle"
      >
        PRINT LOG
      </Text>
      <Text
        position={[0.026, 0.033, 0.084]}
        rotation={[-Math.PI / 2, 0, -0.02]}
        fontSize={0.012}
        color="#7fffdc"
        anchorX="left"
        anchorY="middle"
      >
        {`ARCHIVE ${String(storedCount).padStart(2, '0')}`}
      </Text>
    </group>
  );
}

function ReceiptPrinter() {
  const gltf = useGLTF('/models/room/label_printer/label_printer.glb');
  const receiptTexture = useMemo(() => makeReceiptTexture(MOCK_PRIME_RECEIPTS[0], true), []);
  const paperRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const activeEventRef = useRef<PrimeReceiptEvent>(MOCK_PRIME_RECEIPTS[0]);
  const primeImageRef = useRef<HTMLImageElement | null>(null);
  const printStartRef = useRef(-100);
  const nextEventAtRef = useRef(0.72);
  const eventIndexRef = useRef(0);
  const archivedEventIdRef = useRef<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<PrimeReceiptEvent>(MOCK_PRIME_RECEIPTS[0]);
  const [receiptArchive, setReceiptArchive] = useState<PrintedReceipt[]>([]);
  const printerRig = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const duplicatePrinter = clone.getObjectByName('Small_Label_Printer_Low_Res');
    duplicatePrinter?.parent?.remove(duplicatePrinter);
    const glowMaterials: THREE.MeshStandardMaterial[] = [];

    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        if (object.material instanceof THREE.MeshStandardMaterial) {
          object.material = object.material.clone();
          object.material.roughness = Math.max(object.material.roughness, 0.58);
          object.material.metalness = Math.min(object.material.metalness, 0.08);
          if (object.name === 'Buttons' || object.name === 'Looplings_Status_Lens') {
            object.material.color.set('#2d8cff');
            object.material.emissive.set('#2d8cff');
            object.material.emissiveIntensity = object.name === 'Looplings_Status_Lens' ? 1.8 : 0.24;
            glowMaterials.push(object.material);
          }
        }
      }
    });

    const receiptPaper = clone.getObjectByName('Looplings_Receipt_Paper');
    if (receiptPaper instanceof THREE.Mesh) {
      receiptPaper.visible = false;
    }

    clone.updateMatrixWorld(true);
    const readAnchor = (name: string, fallback: THREE.Vector3) => {
      const anchor = clone.getObjectByName(name);
      if (!anchor) return fallback;
      const position = new THREE.Vector3();
      anchor.getWorldPosition(position);
      return position;
    };

    const lightOrigin = readAnchor('button_light_origin', new THREE.Vector3(-0.064, 0.064, -0.091));

    return {
      clone,
      lightOrigin,
      glowMaterials,
    };
  }, [gltf.scene]);

  useEffect(() => {
    const image = new Image();
    image.src = `/pets/prime-test/state-atlas.png?v=${ATLAS_VERSION}`;
    image.onload = () => {
      primeImageRef.current = image;
      drawReceiptTexture(receiptTexture.image as HTMLCanvasElement, activeEventRef.current, image);
      receiptTexture.needsUpdate = true;
    };

    return () => receiptTexture.dispose();
  }, [receiptTexture]);

  useEffect(() => {
    activeEventRef.current = activeEvent;
    drawReceiptTexture(receiptTexture.image as HTMLCanvasElement, activeEvent, primeImageRef.current ?? undefined);
    receiptTexture.needsUpdate = true;
  }, [activeEvent, receiptTexture]);

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime;
    const printAge = elapsed - printStartRef.current;
    const isPrinting = printAge >= 0 && printAge <= RECEIPT_PRINT_DURATION;
    const canPrintNext = printAge > RECEIPT_PRINT_DURATION + 1.5;

    if (elapsed >= nextEventAtRef.current && canPrintNext) {
      const event = MOCK_PRIME_RECEIPTS[eventIndexRef.current % MOCK_PRIME_RECEIPTS.length];
      eventIndexRef.current += 1;
      archivedEventIdRef.current = null;
      printStartRef.current = elapsed;
      setActiveEvent(event);
    }

    const progress = printAge < 0 ? 0 : easeOutCubic(printAge / RECEIPT_PRINT_DURATION);
    const stableProgress = Math.max(0.001, progress);
    if (paperRef.current) {
      paperRef.current.visible = progress > 0.015 && printAge < RECEIPT_PRINT_DURATION + 0.48;
      paperRef.current.scale.x = stableProgress;
      paperRef.current.position.x = RECEIPT_EXIT_X - (RECEIPT_PAPER_MAX_LENGTH * stableProgress) / 2;
      paperRef.current.position.y = RECEIPT_EXIT_Y - Math.sin(stableProgress * Math.PI) * 0.012;
      paperRef.current.position.z = RECEIPT_EXIT_Z;
    }
    receiptTexture.repeat.x = stableProgress;

    if (printAge > RECEIPT_PRINT_DURATION && archivedEventIdRef.current !== activeEventRef.current.id) {
      const printedEvent = activeEventRef.current;
      const archivedReceipt = { event: printedEvent, key: `${printedEvent.id}-${Math.round(elapsed * 1000)}`, printedAt: elapsed };
      archivedEventIdRef.current = printedEvent.id;
      nextEventAtRef.current = elapsed + RECEIPT_EVENT_INTERVAL;
      setReceiptArchive((current) => [
        archivedReceipt,
        ...current.filter((receipt) => receipt.event.id !== printedEvent.id),
      ].slice(0, RECEIPT_STORED_LIMIT));
    }

    const eventPulse = isPrinting ? 0.32 + Math.sin(elapsed * 21) * 0.2 : 0;
    const idlePulse = 0.64 + Math.sin(elapsed * 3.2) * 0.28;
    const pulse = idlePulse + eventPulse;
    printerRig.glowMaterials.forEach((material) => {
      material.emissive.set(activeEventRef.current.accent);
      material.emissiveIntensity = 0.18 + pulse * (isPrinting ? 1.8 : 0.72);
    });
    if (lightRef.current) {
      lightRef.current.color.set(activeEventRef.current.accent);
      lightRef.current.intensity = 0.18 + pulse * (isPrinting ? 0.86 : 0.42);
    }
  });

  return (
    <>
      <group position={PRINTER_POSITION} rotation={[0, PRINTER_ROTATION_Y, 0]} scale={PRINTER_SCALE}>
        <primitive object={printerRig.clone} />
        <mesh ref={paperRef} position={[RECEIPT_EXIT_X, RECEIPT_EXIT_Y, RECEIPT_EXIT_Z]} rotation={[-Math.PI / 2, 0, 0]} castShadow={false} receiveShadow>
          <planeGeometry args={[RECEIPT_PAPER_MAX_LENGTH, RECEIPT_PAPER_WIDTH]} />
          <meshBasicMaterial map={receiptTexture} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <ReceiptTrayVisual storedCount={receiptArchive.length} />
        <pointLight ref={lightRef} position={printerRig.lightOrigin} intensity={0.42} distance={0.62} color="#2d8cff" />
      </group>
      <BendyReceiptStack receipts={receiptArchive} />
    </>
  );
}

function createMainScreenHtml() {
  const primeAtlas = `/pets/prime-test/state-atlas.png?v=${ATLAS_VERSION}`;

  return `
    <div class="loopvision-screen">
      <style>
        .loopvision-screen,
        .loopvision-screen * {
          box-sizing: border-box;
        }

        .loopvision-screen {
          width: ${MAIN_SCREEN_HTML_W}px;
          height: ${MAIN_SCREEN_HTML_H}px;
          position: relative;
          overflow: hidden;
          color: #1d160e;
          font-family: "Courier New", Courier, monospace;
          background:
            radial-gradient(circle at 18% 12%, rgba(255, 251, 221, 0.82), transparent 32%),
            radial-gradient(circle at 74% 14%, rgba(255, 239, 174, 0.34), transparent 34%),
            repeating-linear-gradient(0deg, rgba(87, 63, 31, 0.045) 0 1px, transparent 1px 20px),
            repeating-linear-gradient(90deg, rgba(87, 63, 31, 0.04) 0 1px, transparent 1px 20px),
            linear-gradient(135deg, #f7e9bd 0%, #ead4a0 54%, #dcb97a 100%);
          border: 14px solid #21160c;
          outline: 5px solid #a8874b;
          box-shadow:
            inset 0 0 0 6px rgba(255, 247, 209, 0.42),
            inset 0 0 64px rgba(91, 61, 22, 0.13);
          image-rendering: pixelated;
        }

        .loopvision-screen::before,
        .loopvision-screen::after {
          content: "";
          position: absolute;
          inset: 26px;
          pointer-events: none;
          border: 2px solid rgba(80, 58, 25, 0.62);
        }

        .loopvision-screen::after {
          inset: 40px;
          border-color: rgba(153, 124, 62, 0.5);
        }

        .main-title {
          position: absolute;
          left: 86px;
          top: 58px;
          font-size: 42px;
          line-height: 1;
          letter-spacing: 0;
          font-weight: 900;
        }

        .os-label {
          position: absolute;
          left: 88px;
          top: 38px;
          color: #2f7a3a;
          font-size: 14px;
          line-height: 1;
          font-weight: 900;
          text-transform: uppercase;
        }

        .panel {
          position: absolute;
          border: 3px solid #6f552c;
          background:
            linear-gradient(135deg, rgba(255,255,255,0.34), transparent 45%),
            #f1dfae;
          box-shadow:
            inset 0 0 0 2px rgba(255, 249, 219, 0.62),
            inset 0 0 0 7px rgba(82, 60, 25, 0.1);
        }

        .panel::before,
        .panel::after {
          content: "";
          position: absolute;
          width: 18px;
          height: 18px;
          border-color: #6f552c;
          pointer-events: none;
        }

        .panel::before {
          left: 10px;
          top: 10px;
          border-left: 2px solid;
          border-top: 2px solid;
        }

        .panel::after {
          right: 10px;
          bottom: 10px;
          border-right: 2px solid;
          border-bottom: 2px solid;
        }

        .habitat-card {
          left: 72px;
          top: 118px;
          width: 476px;
          height: 390px;
          overflow: hidden;
        }

        .habitat-label {
          position: absolute;
          left: 28px;
          top: 26px;
          z-index: 4;
          font-size: 32px;
          font-weight: 900;
        }

        .alive-label {
          position: absolute;
          left: 28px;
          top: 78px;
          z-index: 4;
          color: #2f7a3a;
          font-size: 42px;
          font-weight: 900;
        }

        .park {
          position: absolute;
          left: 22px;
          right: 22px;
          bottom: 22px;
          height: 250px;
          overflow: hidden;
          border: 3px solid #5e4b29;
          background:
            radial-gradient(circle at 84% 22%, rgba(255, 238, 164, 0.9) 0 14px, transparent 17px),
            linear-gradient(#b7d98f 0 36%, #7fb458 36% 66%, #4f853e 66% 100%);
          box-shadow:
            inset 0 0 0 5px rgba(255, 247, 209, 0.18),
            inset 0 -28px rgba(44, 92, 39, 0.14);
        }

        .park::before {
          content: "";
          position: absolute;
          left: -28px;
          bottom: -58px;
          width: 372px;
          height: 152px;
          background:
            radial-gradient(ellipse at center, #d7bd81 0 45%, #b78f56 46% 56%, transparent 57%);
          transform: rotate(-12deg);
          opacity: 0.96;
          z-index: 2;
        }

        .park::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            repeating-linear-gradient(90deg, transparent 0 38px, rgba(94, 64, 29, 0.72) 38px 43px, transparent 43px 76px),
            linear-gradient(transparent 0 58%, rgba(94, 64, 29, 0.72) 58% 61%, transparent 61% 100%);
          opacity: 0.46;
          z-index: 3;
        }

        .tree-trunk {
          position: absolute;
          right: 92px;
          bottom: 26px;
          width: 28px;
          height: 128px;
          background: #684728;
          z-index: 4;
          box-shadow: inset -8px 0 #4d321f;
        }

        .tree-leaf {
          position: absolute;
          width: 124px;
          height: 102px;
          border-radius: 46%;
          background: #386f32;
          z-index: 5;
          box-shadow:
            -34px 22px 0 #4f8a3c,
            34px 18px 0 #2e6530,
            4px -28px 0 #5e9b45,
            -8px 42px 0 #6f9f47;
        }

        .leaf-a {
          right: 44px;
          bottom: 120px;
        }

        .flower-dot {
          position: absolute;
          width: 7px;
          height: 7px;
          background: #ff88b5;
          z-index: 8;
          box-shadow: 10px 5px 0 #ffe06d, -8px 7px 0 #fff8dd;
        }

        .path-stone,
        .lamp-post,
        .habitat-shrub {
          position: absolute;
          z-index: 7;
        }

        .path-stone {
          width: 24px;
          height: 13px;
          border-radius: 50%;
          background: #9b8d6b;
          box-shadow: inset -4px -2px rgba(61, 54, 40, 0.24);
        }

        .lamp-post {
          right: 26px;
          bottom: 34px;
          width: 8px;
          height: 72px;
          background: #4c3421;
        }

        .lamp-post::before {
          content: "";
          position: absolute;
          left: -13px;
          top: -30px;
          width: 34px;
          height: 34px;
          border: 4px solid #4c3421;
          background: radial-gradient(circle, #fff0a2 0 38%, #b36d31 42% 100%);
        }

        .habitat-shrub {
          width: 54px;
          height: 28px;
          border-radius: 50% 50% 35% 35%;
          background: #3f7b38;
          box-shadow: 20px 2px 0 #5e9b45, -16px 8px 0 #2f6531;
        }

        .prime-crop {
          position: absolute;
          left: 54px;
          bottom: 24px;
          width: 138px;
          height: 150px;
          overflow: hidden;
          z-index: 9;
          filter: drop-shadow(0 10px 0 rgba(64, 56, 35, 0.18)) drop-shadow(0 0 12px rgba(58, 92, 48, 0.35));
        }

        .prime-crop img {
          width: 1104px;
          height: 1794px;
          image-rendering: pixelated;
          transform: translate(0, 0);
          display: block;
        }

        .speech {
          position: absolute;
          left: 178px;
          bottom: 126px;
          width: 62px;
          height: 38px;
          border: 3px solid #1d160e;
          background: #fff8df;
          z-index: 10;
          border-radius: 6px;
        }

        .speech::after {
          content: "";
          position: absolute;
          left: 10px;
          bottom: -11px;
          border-width: 10px 8px 0 0;
          border-style: solid;
          border-color: #1d160e transparent transparent transparent;
        }

        .speech span {
          position: absolute;
          left: 14px;
          top: 5px;
          font-size: 24px;
          font-weight: 900;
        }

        .metric {
          padding: 28px 30px;
        }

        .metric h3,
        .wide h3,
        .small h3,
        .bubble h3 {
          margin: 0 0 12px 0;
          color: #3d512d;
          font-size: 18px;
          line-height: 1;
          font-weight: 900;
          text-transform: uppercase;
        }

        .metric strong {
          display: block;
          color: #1e170e;
          font-size: 30px;
          line-height: 1.1;
          font-weight: 900;
        }

        .runway {
          left: 574px;
          top: 118px;
          width: 264px;
          height: 112px;
        }

        .mood {
          left: 862px;
          top: 118px;
          width: 270px;
          height: 112px;
        }

        .mood-face {
          position: absolute;
          right: 36px;
          top: 34px;
          width: 46px;
          height: 46px;
          border: 3px solid #42662e;
          background: #8ec76a;
          color: #203118;
          font-size: 26px;
          line-height: 38px;
          text-align: center;
          font-weight: 900;
        }

        .bars {
          position: absolute;
          left: 30px;
          bottom: 22px;
          display: flex;
          gap: 8px;
          align-items: end;
        }

        .bars span {
          width: 15px;
          height: calc(var(--h) * 1px);
          background: #2e7440;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25);
        }

        .bars span:nth-child(3n) {
          background: #d1b76f;
        }

        .wallet {
          left: 574px;
          top: 254px;
          width: 558px;
          height: 144px;
          padding: 24px 28px;
        }

        .wallet-value {
          position: absolute;
          left: 30px;
          top: 56px;
          font-size: 36px;
          font-weight: 900;
        }

        .wallet-unit {
          position: absolute;
          left: 156px;
          top: 70px;
          color: #52613a;
          font-size: 17px;
          font-weight: 900;
        }

        .sparkline {
          position: absolute;
          right: 34px;
          top: 40px;
          width: 300px;
          height: 75px;
        }

        .task {
          left: 574px;
          top: 420px;
          width: 558px;
          height: 118px;
          padding: 24px 28px;
        }

        .task-copy {
          font-size: 23px;
          font-weight: 900;
        }

        .progress-track {
          position: absolute;
          left: 292px;
          right: 80px;
          bottom: 32px;
          height: 16px;
          background: rgba(84, 68, 35, 0.18);
        }

        .progress-fill {
          height: 100%;
          width: 68%;
          background: #2f7a3a;
        }

        .progress-number {
          position: absolute;
          right: 30px;
          bottom: 24px;
          font-size: 22px;
          font-weight: 900;
        }

        .model {
          left: 72px;
          top: 532px;
          width: 252px;
          height: 84px;
        }

        .tool {
          left: 348px;
          top: 532px;
          width: 284px;
          height: 84px;
        }

        .small {
          padding: 20px 24px;
          font-size: 26px;
          font-weight: 900;
        }

        .companions {
          left: 72px;
          top: 642px;
          width: 560px;
          height: 76px;
          display: flex;
          align-items: center;
          gap: 22px;
          padding: 12px 24px;
        }

        .companions h3 {
          margin-right: 8px;
        }

        .mini-pet {
          width: 34px;
          height: 40px;
          border: 3px solid #1d160e;
          border-radius: 50% 50% 42% 42%;
          background: var(--c);
          box-shadow: inset 0 -8px rgba(0,0,0,0.16);
        }

        .add-pet {
          width: 48px;
          height: 48px;
          border: 3px dashed #756037;
          display: grid;
          place-items: center;
          margin-left: auto;
          font-size: 36px;
          font-weight: 900;
        }

        .bubble {
          left: 656px;
          top: 562px;
          width: 476px;
          height: 164px;
          padding: 22px 28px 22px 110px;
        }

        .bubble .prime-small {
          position: absolute;
          left: 26px;
          top: 30px;
          width: 68px;
          height: 74px;
          overflow: hidden;
        }

        .bubble .prime-small img {
          width: 544px;
          height: 888px;
          image-rendering: pixelated;
          display: block;
        }

        .bubble-copy {
          margin-top: 14px;
          font-size: 22px;
          line-height: 1.25;
          font-weight: 900;
        }

        .heart {
          position: absolute;
          right: 28px;
          bottom: 22px;
          color: #bd4c42;
          font-size: 28px;
          font-weight: 900;
        }
      </style>

      <div class="os-label">Looplings OS</div>
      <div class="main-title">STARTER HABITAT</div>

      <section class="panel habitat-card">
        <div class="habitat-label">PRIME-00</div>
        <div class="alive-label">ALIVE</div>
        <div class="park">
          <div class="habitat-shrub" style="left: 20px; bottom: 34px;"></div>
          <div class="habitat-shrub" style="right: 128px; bottom: 22px; transform: scale(.72);"></div>
          <div class="path-stone" style="left: 126px; bottom: 38px;"></div>
          <div class="path-stone" style="left: 178px; bottom: 58px; transform: scale(.8);"></div>
          <div class="path-stone" style="left: 250px; bottom: 74px; transform: scale(.64);"></div>
          <div class="tree-trunk"></div>
          <div class="tree-leaf leaf-a"></div>
          <div class="lamp-post"></div>
          <div class="flower-dot" style="left: 26px; bottom: 30px;"></div>
          <div class="flower-dot" style="left: 70px; bottom: 22px; background: #f4d66b;"></div>
          <div class="flower-dot" style="right: 26px; bottom: 44px;"></div>
          <div class="flower-dot" style="right: 114px; bottom: 28px; background: #f4d66b;"></div>
          <div class="prime-crop"><img alt="" src="${primeAtlas}" /></div>
          <div class="speech"><span>...</span></div>
        </div>
      </section>

      <section class="panel metric runway">
        <h3>Runway</h3>
        <strong>19h 42m</strong>
        <div class="bars">
          <span style="--h: 13"></span><span style="--h: 18"></span><span style="--h: 23"></span><span style="--h: 22"></span><span style="--h: 17"></span><span style="--h: 27"></span><span style="--h: 30"></span><span style="--h: 22"></span>
        </div>
      </section>

      <section class="panel metric mood">
        <h3>Mood</h3>
        <strong>HAPPY</strong>
        <div class="mood-face">:)</div>
      </section>

      <section class="panel wallet wide">
        <h3>Wallet</h3>
        <div class="wallet-value">$2.47</div>
        <div class="wallet-unit">USDC</div>
        <svg class="sparkline" viewBox="0 0 300 75" preserveAspectRatio="none">
          <path d="M0 62 L18 57 L32 59 L48 51 L64 55 L82 42 L98 48 L116 38 L132 42 L150 34 L168 39 L186 27 L204 33 L222 25 L240 28 L260 18 L282 23 L300 14" fill="none" stroke="#2f7a3a" stroke-width="6" stroke-linejoin="round" />
          <path d="M0 75 L0 62 L18 57 L32 59 L48 51 L64 55 L82 42 L98 48 L116 38 L132 42 L150 34 L168 39 L186 27 L204 33 L222 25 L240 28 L260 18 L282 23 L300 14 L300 75 Z" fill="rgba(47,122,58,0.14)" />
        </svg>
      </section>

      <section class="panel task wide">
        <h3>Current Task</h3>
        <div class="task-copy">Evaluating market signal</div>
        <div class="progress-track"><div class="progress-fill"></div></div>
        <div class="progress-number">68%</div>
      </section>

      <section class="panel small model">
        <h3>Model</h3>
        Prime v1.2
      </section>

      <section class="panel small tool">
        <h3>Tool</h3>
        LoopVision
      </section>

      <section class="panel companions">
        <h3>Companions</h3>
        <div class="mini-pet" style="--c:#ff6ea9"></div>
        <div class="mini-pet" style="--c:#68b7ff"></div>
        <div class="mini-pet" style="--c:#ffb02f"></div>
        <div class="mini-pet" style="--c:#5dbb4f"></div>
        <div class="add-pet">+</div>
      </section>

      <section class="panel bubble">
        <div class="prime-small"><img alt="" src="${primeAtlas}" /></div>
        <h3>Prime says</h3>
        <div class="bubble-copy">Exploring markets,<br />learning, and protecting<br />my loop.</div>
        <div class="heart">&lt;3</div>
      </section>
    </div>
  `;
}

function HtmlInCanvasScreen({ meshRef }: { meshRef: { current: THREE.Mesh | null } }) {
  const screenContent = useMemo(
    () => (
      <div className="room-html-screen-surface">
        <MainHabitatScreen />
      </div>
    ),
    [],
  );

  return (
    <HtmlInCanvasSurface
      meshRef={meshRef}
      width={MAIN_SCREEN_HTML_W}
      height={MAIN_SCREEN_HTML_H}
      animated
      brightness={1.08}
      flicker={0}
      phosphor={0}
      reflection={0.35}
      scanlines={0.65}
      uploadFps={5}
      warmupFrames={6}
    >
      {screenContent}
    </HtmlInCanvasSurface>
  );
}

function Casing() {
  const screenRef = useRef<THREE.Mesh>(null);
  const { handlers, isHovered } = useFocusZone('center');

  return (
    <group
      position={[0.18, DESK_SURFACE_Y + 1.2, -1.74 + DESK_WALL_OFFSET_Z]}
      rotation={[0, 0, 0]}
      scale={isHovered ? [1.296, 1.296, 1] : [1.28, 1.28, 1]}
      {...handlers}
    >
      <Box position={[0, 0, 0.226]} scale={[2.08, 1.22, 0.04]} color="#050505" roughness={0.6} />

      <mesh ref={screenRef} position={[0, 0, 0.285]} castShadow={false} receiveShadow>
        <planeGeometry args={[2.02, 1.18]} onUpdate={flipPlaneUvY} />
        <meshBasicMaterial color="#111122" toneMapped={false} />
      </mesh>
      <HtmlInCanvasScreen meshRef={screenRef} />

      <mesh position={[0, 0, 0.292]}>
        <planeGeometry args={[2.02, 1.18]} />
        <meshBasicMaterial color="#9fffee" transparent opacity={0.025} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function usePreparedDeskAsset(scene: THREE.Group, normalizeToDesk = false) {
  return useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      object.castShadow = true;
      object.receiveShadow = true;
      object.userData.restY = object.position.y;
      if (Array.isArray(object.material)) {
        object.material = object.material.map((material) => material.clone());
      } else {
        object.material = object.material.clone();
      }
    });
    if (normalizeToDesk) {
      const bounds = new THREE.Box3().setFromObject(clone);
      const center = bounds.getCenter(new THREE.Vector3());
      clone.position.x -= center.x;
      clone.position.y -= bounds.min.y;
      clone.position.z -= center.z;
    }
    return clone;
  }, [normalizeToDesk, scene]);
}

function DeskMatAsset() {
  const { scene } = useGLTF(DESK_MAT_MODEL_PATH);
  const mat = usePreparedDeskAsset(scene);

  return (
    <primitive
      object={mat}
      position={[0.46, DESK_SURFACE_Y + 0.004, -0.95 + DESK_WALL_OFFSET_Z]}
      rotation={[0, -0.01, 0]}
      scale={[0.88, 0.88, 0.88]}
    />
  );
}

function DeskMouseAsset() {
  const { scene } = useGLTF(DESK_MOUSE_MODEL_PATH);
  const mouse = usePreparedDeskAsset(scene, true);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    mouse.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const material = object.material;
      if (material instanceof THREE.MeshStandardMaterial) {
        material.color.set('#101215');
        material.roughness = 0.36;
        material.metalness = 0.08;
      }
    });
  }, [mouse]);

  useEffect(() => {
    if (!isPressed) return undefined;
    const timeout = window.setTimeout(() => setIsPressed(false), 160);
    return () => window.clearTimeout(timeout);
  }, [isPressed]);

  useEffect(() => {
    mouse.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const material = object.material;
      if (material instanceof THREE.MeshStandardMaterial && object.name.includes('PrimeGlyph')) {
        material.emissiveIntensity = isPressed ? 1.6 : 0.7;
      }
      const restY = object.userData.restY as number | undefined;
      if (typeof restY === 'number') object.position.y = restY - (isPressed ? 0.01 : 0);
    });
  }, [isPressed, mouse]);

  return (
    <primitive
      object={mouse}
      position={[1.32, DESK_SURFACE_Y - 0.022, -0.82 + DESK_WALL_OFFSET_Z]}
      rotation={[0, -0.18, 0]}
      scale={[0.42, 0.42, 0.42]}
      onPointerDown={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setIsPressed(true);
      }}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
      }}
    />
  );
}

function DeskKeyboardAsset() {
  const { scene } = useGLTF(DESK_KEYBOARD_MODEL_PATH);
  const keyboard = usePreparedDeskAsset(scene, true);
  const groupRef = useRef<THREE.Group>(null);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const keyHitboxes = useMemo(() => {
    keyboard.updateMatrixWorld(true);
    const hitboxes: Array<{ name: string; center: THREE.Vector3; size: THREE.Vector3 }> = [];

    keyboard.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !object.name.startsWith('Key_')) return;
      const bounds = new THREE.Box3().setFromObject(object);
      const size = bounds.getSize(new THREE.Vector3());
      if (size.lengthSq() < 0.0001) return;

      hitboxes.push({
        name: object.name,
        center: bounds.getCenter(new THREE.Vector3()),
        size,
      });
    });

    return hitboxes;
  }, [keyboard]);
  const keyboardHitPlate = useMemo(() => {
    if (keyHitboxes.length === 0) return null;
    const bounds = new THREE.Box3();
    keyHitboxes.forEach(({ center, size }) => {
      bounds.expandByPoint(new THREE.Vector3(center.x - size.x / 2, center.y - size.y / 2, center.z - size.z / 2));
      bounds.expandByPoint(new THREE.Vector3(center.x + size.x / 2, center.y + size.y / 2, center.z + size.z / 2));
    });

    return {
      center: bounds.getCenter(new THREE.Vector3()),
      size: bounds.getSize(new THREE.Vector3()),
      top: bounds.max.y,
    };
  }, [keyHitboxes]);

  const nearestKeyAtPoint = useCallback(
    (point: THREE.Vector3) => {
      const group = groupRef.current;
      if (!group || keyHitboxes.length === 0) return null;
      const localPoint = group.worldToLocal(point.clone());
      let nearestName: string | null = null;
      let nearestDistance = Infinity;

      keyHitboxes.forEach(({ name, center, size }) => {
        const dx = Math.max(Math.abs(localPoint.x - center.x) - size.x * 0.5, 0);
        const dz = Math.max(Math.abs(localPoint.z - center.z) - size.z * 0.5, 0);
        const distance = dx * dx + dz * dz;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestName = name;
        }
      });

      return nearestName;
    },
    [keyHitboxes],
  );

  useEffect(() => {
    if (!pressedKey) return undefined;
    const timeout = window.setTimeout(() => setPressedKey(null), 220);
    return () => window.clearTimeout(timeout);
  }, [pressedKey]);

  // Map a physical keydown to the matching 3D key mesh in the GLB.
  useEffect(() => {
    const keyNames = new Set(keyHitboxes.map((h) => h.name));
    if (keyNames.size === 0) return undefined;

    const mapEventKey = (event: KeyboardEvent): string | null => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return null;
      }

      const k = event.key;
      const candidates: string[] = [];
      if (/^[a-zA-Z]$/.test(k)) {
        const upper = k.toUpperCase();
        candidates.push(`Key_${upper}`, `Key_${k.toLowerCase()}`, `Key${upper}`);
      } else if (/^[0-9]$/.test(k)) {
        candidates.push(`Key_${k}`, `Key_Digit${k}`, `Digit${k}`);
      } else {
        const specials: Record<string, string[]> = {
          ' ': ['Key_Space', 'Space'],
          Enter: ['Key_Enter', 'Enter', 'Key_Return', 'Return'],
          Backspace: ['Key_Backspace', 'Backspace', 'Key_Delete'],
          Tab: ['Key_Tab', 'Tab'],
          Escape: ['Key_Escape', 'Escape'],
          Shift: ['Key_Shift', 'Key_ShiftLeft', 'Key_ShiftRight'],
          Control: ['Key_Control', 'Key_Ctrl'],
          Alt: ['Key_Alt', 'Key_Option'],
          Meta: ['Key_Meta', 'Key_Cmd'],
          ',': ['Key_Comma', 'Key_,'],
          '.': ['Key_Period', 'Key_.'],
          '/': ['Key_Slash', 'Key_/'],
          ';': ['Key_Semicolon', 'Key_;'],
          "'": ['Key_Quote', "Key_'"],
        };
        if (specials[k]) candidates.push(...specials[k]);
      }
      for (const name of candidates) {
        if (keyNames.has(name)) return name;
      }
      return null;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const name = mapEventKey(event);
      if (!name) return;
      setPressedKey(name);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [keyHitboxes]);

  useEffect(() => {
    keyboard.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      const isKey = object.name.startsWith('Key_');
      const isActive = isKey && pressedKey === object.name;
      const restY = object.userData.restY as number | undefined;
      if (isKey && typeof restY === 'number') object.position.y = restY - (isActive ? 0.055 : 0);

      const material = object.material;
      if (isKey && material instanceof THREE.MeshStandardMaterial) {
        material.emissive.set(isActive ? '#8cffae' : '#000000');
        material.emissiveIntensity = isActive ? 0.58 : 0;
      }
    });
  }, [keyboard, pressedKey]);

  const handlePointer = (event: ThreeEvent<PointerEvent>, explicitKeyName?: string) => {
    const targetName = explicitKeyName ?? (event.object.name.startsWith('Key_') ? event.object.name : nearestKeyAtPoint(event.point));
    if (!targetName?.startsWith('Key_')) return;
    event.stopPropagation();
    setPressedKey(targetName);
  };

  return (
    <group
      ref={groupRef}
      position={[0.14, DESK_SURFACE_Y + 0.018, -0.87 + DESK_WALL_OFFSET_Z]}
      rotation={[0, 0.02, 0]}
      scale={[0.36, 0.36, 0.36]}
    >
      <primitive
        object={keyboard}
        onPointerDown={handlePointer}
        onPointerOver={(event: ThreeEvent<PointerEvent>) => {
          if (!event.object.name.startsWith('Key_')) return;
          event.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = '';
        }}
      />
      {keyboardHitPlate ? (
        <mesh
          name="Keyboard_KeyBedHitbox"
          position={[keyboardHitPlate.center.x, keyboardHitPlate.top + 0.04, keyboardHitPlate.center.z]}
          onPointerDown={handlePointer}
          onPointerOver={(event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = '';
          }}
        >
          <boxGeometry args={[keyboardHitPlate.size.x * 1.08, 0.12, keyboardHitPlate.size.z * 1.12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}
      {keyHitboxes.map(({ name, center, size }) => (
        <mesh
          key={name}
          name={`${name}_Hitbox`}
          position={center}
          onPointerDown={(event: ThreeEvent<PointerEvent>) => handlePointer(event, name)}
          onPointerOver={(event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = '';
          }}
        >
          <boxGeometry args={[size.x * 1.08, Math.max(size.y, 0.13), size.z * 1.08]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Desk() {
  return (
    <group>
      <AntiqueWoodenDesk />
      <DeskMatAsset />
      <DeskKeyboardAsset />
      <DeskMouseAsset />
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
      <planeGeometry args={[1.34, 1.14]} />
      <meshBasicMaterial map={cityScene.texture} toneMapped={false} />
    </mesh>
  );
}

function Window() {
  return (
    <group position={[-3.17, 1.9, -2.96]} scale={[0.72, 0.72, 1]}>
      <AnimatedWindowPane />
      <Box position={[0, 0.64, 0]} scale={[1.52, 0.07, 0.08]} color={ROOM.trim} />
      <Box position={[0, -0.64, 0]} scale={[1.52, 0.07, 0.08]} color={ROOM.trim} />
      <Box position={[-0.76, 0, 0]} scale={[0.07, 1.3, 0.08]} color={ROOM.trim} />
      <Box position={[0.76, 0, 0]} scale={[0.07, 1.3, 0.08]} color={ROOM.trim} />
      <Box position={[0, 0, 0.01]} scale={[0.045, 1.24, 0.05]} color={ROOM.trim} />
      <Box position={[0, 0, 0.02]} scale={[1.42, 0.035, 0.05]} color={ROOM.trim} />
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

function WallTelemetryPanel({
  position,
  rotation = [0, 0, 0],
  title,
  value,
  detail,
  accent,
  phase = 0,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  title: string;
  value: string;
  detail: string;
  accent: string;
  phase?: number;
}) {
  const barsRef = useRef<THREE.Mesh[]>([]);
  const statusRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime + phase;
    barsRef.current.forEach((bar, index) => {
      const wave = 0.52 + Math.sin(elapsed * (1.18 + index * 0.14) + index * 1.7) * 0.28;
      const height = THREE.MathUtils.clamp(wave, 0.2, 0.92);
      bar.scale.y = height;
      bar.position.y = -0.095 + height * 0.038;
    });
    if (statusRef.current) {
      const pulse = 0.76 + Math.sin(elapsed * 4.2) * 0.24;
      statusRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <Box position={[0, 0, -0.026]} scale={[0.78, 0.48, 0.04]} color="#16100b" roughness={0.45} metalness={0.12} />
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[0.7, 0.4]} />
        <meshBasicMaterial color="#ead8a8" toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.006, 0.014]}>
        <planeGeometry args={[0.58, 0.25]} />
        <meshBasicMaterial color="#071c18" toneMapped={false} />
      </mesh>
      <mesh ref={statusRef} position={[-0.272, 0.152, 0.034]}>
        <boxGeometry args={[0.026, 0.026, 0.01]} />
        <meshBasicMaterial color="#1f5d30" toneMapped={false} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => (
        <mesh
          key={index}
          ref={(node) => {
            if (node) barsRef.current[index] = node;
          }}
          position={[-0.22 + index * 0.074, -0.075, 0.03]}
        >
          <boxGeometry args={[0.035, 0.09, 0.008]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? accent : '#ffe28f'}
            toneMapped={false}
          />
        </mesh>
      ))}
      <Text position={[-0.235, 0.15, 0.035]} fontSize={0.029} color="#2d2415" anchorX="left" anchorY="middle">
        {title}
      </Text>
      <Text position={[-0.24, 0.062, 0.035]} fontSize={0.056} color="#fbfff8" anchorX="left" anchorY="middle">
        {value}
      </Text>
      <Text position={[-0.24, -0.162, 0.035]} fontSize={0.021} color="#ecd99a" anchorX="left" anchorY="middle">
        {detail}
      </Text>
      <pointLight position={[0, 0, 0.12]} intensity={0.24} distance={0.8} color={accent} />
    </group>
  );
}

type WallHtmlScreenKind = 'prime-id' | 'skills' | 'loopr' | 'balance' | 'runway' | 'model' | 'donate';

const wallScreenComponents: Record<WallHtmlScreenKind, ComponentType> = {
  'prime-id': PrimeIdScreen,
  skills: SkillLibraryScreen,
  loopr: LooprFeedScreen,
  balance: BalanceScreen,
  runway: RunwayScreen,
  model: ModelScreen,
  donate: CareSplitScreen,
};

function createWallScreenHtml(kind: WallHtmlScreenKind) {
  const primeAtlas = `/pets/prime-test/state-atlas.png?v=${ATLAS_VERSION}`;
  const screenBody = {
    'prime-id': `
      <div class="portrait-frame">
        <div class="portrait-crop"><img alt="" src="${primeAtlas}" /></div>
        <div class="portrait-name">PRIME-00</div>
        <div class="portrait-state">ALIVE / WATCHING</div>
      </div>
    `,
    skills: `
      <div class="screen-heading">SKILL LIBRARY</div>
      <div class="companion-grid">
        <div class="pet-dot pink"></div>
        <div class="pet-dot blue"></div>
        <div class="pet-dot amber"></div>
        <div class="pet-dot green"></div>
      </div>
      <div class="status-row"><span>4/4 ONLINE</span><b>SYNCED</b></div>
    `,
    loopr: `
      <div class="screen-heading">LOOPR FEED</div>
      <div class="feed-list">
        <div><b>@Critters_Quest</b><span>Prime spotted a volatility spike</span><em>2m</em></div>
        <div><b>@BretGreenstein</b><span>Receipt received</span><em>8m</em></div>
        <div><b>@0xLoopr</b><span>What signal is Prime seeing?</span><em>12m</em></div>
      </div>
      <button type="button">VIEW ALL</button>
    `,
    balance: `
      <div class="screen-heading">BALANCE</div>
      <div class="big-value">$2.47</div>
      <div class="tiny-label">USDC / PRIME WALLET</div>
      <div class="mini-bars">${Array.from({ length: 9 }, (_, index) => `<i style="--h:${24 + ((index * 17) % 48)}"></i>`).join('')}</div>
    `,
    runway: `
      <div class="screen-heading">COMPUTE RUNWAY</div>
      <div class="big-value">19h 42m</div>
      <div class="tiny-label">UPDATED 10s AGO</div>
      <div class="mini-bars amber">${Array.from({ length: 9 }, (_, index) => `<i style="--h:${30 + ((index * 13) % 42)}"></i>`).join('')}</div>
    `,
    model: `
      <div class="screen-heading">MODEL STATUS</div>
      <div class="big-value model-value">Prime v1.2</div>
      <div class="tiny-label">CONFIDENCE</div>
      <div class="confidence"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><strong>68%</strong></div>
    `,
    donate: `
      <div class="screen-heading">DONATE SPLIT</div>
      <div class="split-grid"><div><b>70%</b><span>PRIME</span></div><div><b>20%</b><span>DEV</span></div><div><b>10%</b><span>RSV</span></div></div>
      <div class="thanks">&lt;3 THANK YOU</div>
    `,
  } satisfies Record<WallHtmlScreenKind, string>;

  return `
    <div class="loop-wall-screen ${kind}">
      <style>
        .loop-wall-screen,
        .loop-wall-screen * {
          box-sizing: border-box;
        }

        .loop-wall-screen {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
          padding: 34px 38px;
          color: #f5e5b2;
          font-family: "Courier New", Courier, monospace;
          image-rendering: pixelated;
          background:
            radial-gradient(circle at 82% 18%, rgba(120, 255, 156, 0.12), transparent 34%),
            repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 7px),
            linear-gradient(145deg, #071511 0%, #07100e 52%, #111914 100%);
          border: 14px solid #ead8a8;
          outline: 8px solid #17100b;
          box-shadow:
            inset 0 0 0 4px rgba(33, 21, 9, 0.75),
            inset 0 0 42px rgba(112, 255, 176, 0.1);
        }

        .loop-wall-screen::before,
        .loop-wall-screen::after {
          content: "";
          position: absolute;
          inset: 18px;
          border: 2px solid rgba(234, 216, 168, 0.42);
          pointer-events: none;
        }

        .loop-wall-screen::after {
          inset: 30px;
          border-color: rgba(112, 255, 176, 0.2);
        }

        .screen-heading {
          position: relative;
          z-index: 2;
          color: #e8d47c;
          font-size: 34px;
          line-height: 1;
          font-weight: 900;
        }

        .big-value {
          position: relative;
          z-index: 2;
          margin-top: 42px;
          color: #fff4bf;
          font-size: 70px;
          line-height: 0.9;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
        }

        .model-value {
          font-size: 46px;
        }

        .tiny-label {
          position: relative;
          z-index: 2;
          margin-top: 22px;
          color: #80ffad;
          font-size: 20px;
          font-weight: 900;
        }

        .mini-bars {
          position: absolute;
          left: 42px;
          right: 42px;
          bottom: 42px;
          z-index: 2;
          height: 92px;
          display: grid;
          grid-template-columns: repeat(9, 1fr);
          align-items: end;
          gap: 18px;
        }

        .mini-bars i {
          display: block;
          height: calc(var(--h) * 1%);
          min-height: 18px;
          background: linear-gradient(#dfffb2, #72ff9f);
          box-shadow: 0 0 18px rgba(112, 255, 176, 0.28);
        }

        .mini-bars.amber i {
          background: linear-gradient(#fff3b7, #e8b457);
          box-shadow: 0 0 18px rgba(255, 184, 97, 0.3);
        }

        .portrait-frame {
          position: absolute;
          inset: 34px;
          display: grid;
          place-items: center;
          border: 4px solid rgba(232, 212, 124, 0.58);
          background: radial-gradient(circle at 50% 42%, rgba(112, 255, 176, 0.12), transparent 42%);
        }

        .portrait-crop {
          width: 178px;
          height: 194px;
          overflow: hidden;
        }

        .portrait-crop img {
          width: 1424px;
          height: 2328px;
          display: block;
          image-rendering: pixelated;
        }

        .portrait-name {
          color: #e8d47c;
          font-size: 38px;
          font-weight: 900;
        }

        .portrait-state {
          color: #80ffad;
          font-size: 18px;
          font-weight: 900;
        }

        .companion-grid {
          position: relative;
          z-index: 2;
          height: 190px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          align-items: center;
          gap: 22px;
        }

        .pet-dot {
          height: 78px;
          border-radius: 24px 24px 18px 18px;
          background: var(--pet);
          box-shadow: inset 0 -16px rgba(0,0,0,0.2), 0 0 22px color-mix(in srgb, var(--pet) 52%, transparent);
          position: relative;
        }

        .pet-dot::before,
        .pet-dot::after {
          content: "";
          position: absolute;
          top: 28px;
          width: 10px;
          height: 10px;
          background: #06110e;
        }

        .pet-dot::before { left: 25%; }
        .pet-dot::after { right: 25%; }
        .pink { --pet: #ff6ea9; }
        .blue { --pet: #68b7ff; }
        .amber { --pet: #ffb02f; }
        .green { --pet: #6fca5e; }

        .status-row {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          color: #e8d47c;
          font-size: 22px;
          font-weight: 900;
        }

        .status-row b {
          color: #80ffad;
        }

        .feed-list {
          position: relative;
          z-index: 2;
          margin-top: 24px;
          display: grid;
          gap: 18px;
        }

        .feed-list div {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 6px 18px;
          padding: 14px 0;
          border-bottom: 2px solid rgba(232, 212, 124, 0.18);
        }

        .feed-list b {
          color: #fff2b1;
          font-size: 21px;
        }

        .feed-list span {
          grid-column: 1 / -1;
          color: #cfbf88;
          font-size: 18px;
          line-height: 1.18;
        }

        .feed-list em {
          color: #80ffad;
          font-size: 18px;
          font-style: normal;
          font-weight: 900;
        }

        button {
          position: absolute;
          left: 38px;
          right: 38px;
          bottom: 34px;
          z-index: 2;
          height: 54px;
          border: 3px solid #b59450;
          background: #0d1d14;
          color: #e8d47c;
          font: 900 20px "Courier New", Courier, monospace;
        }

        .confidence {
          position: absolute;
          left: 42px;
          right: 42px;
          bottom: 64px;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .confidence span {
          width: 34px;
          height: 34px;
          background: #78d7ff;
          box-shadow: 0 0 16px rgba(120, 215, 255, 0.22);
        }

        .confidence strong {
          margin-left: auto;
          color: #fff2b1;
          font-size: 28px;
        }

        .split-grid {
          position: relative;
          z-index: 2;
          margin-top: 44px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .split-grid div {
          min-height: 112px;
          display: grid;
          place-items: center;
          border: 3px solid #6f552c;
          background: #ead8a8;
          color: #17100b;
        }

        .split-grid b {
          font-size: 42px;
          line-height: 1;
        }

        .split-grid span {
          font-size: 14px;
          font-weight: 900;
        }

        .thanks {
          position: absolute;
          left: 42px;
          right: 42px;
          bottom: 42px;
          z-index: 2;
          height: 50px;
          display: grid;
          place-items: center;
          background: #0d1d14;
          border: 3px solid #6f552c;
          color: #ff6e72;
          font-size: 22px;
          font-weight: 900;
        }

        @keyframes wallPulse {
          from { opacity: 0.7; transform: scaleY(0.86); }
          to { opacity: 1; transform: scaleY(1); }
        }
      </style>
      ${screenBody[kind]}
    </div>
  `;
}

function HtmlWallScreen({
  kind,
  position,
  rotation = [0, 0, 0],
  scale = [0.7, 0.46],
  htmlSize = [WALL_SCREEN_HTML_W, WALL_SCREEN_HTML_H],
  accent = '#8cffae',
  rotateContent = false,
  highlight = false,
}: {
  kind: WallHtmlScreenKind;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number];
  htmlSize?: [number, number];
  accent?: string;
  rotateContent?: boolean;
  highlight?: boolean;
}) {
  const screenRef = useRef<THREE.Mesh>(null);
  const ScreenComponent = wallScreenComponents[kind];
  const isLiveSurface = kind === 'prime-id' || kind === 'skills' || kind === 'loopr';
  const screenContent = useMemo(
    () => (
      <div className={`room-html-screen-surface ${rotateContent ? 'is-rotated' : ''}`}>
        <ScreenComponent />
      </div>
    ),
    [ScreenComponent, rotateContent],
  );

  return (
    <group position={position} rotation={rotation}>
      <Box position={[0, 0, -0.034]} scale={[scale[0] + 0.12, scale[1] + 0.1, 0.052]} color="#16100b" roughness={0.45} metalness={0.12} />
      <mesh position={[0, 0, 0.002]} receiveShadow>
        <planeGeometry args={[scale[0] + 0.05, scale[1] + 0.04]} />
        <meshBasicMaterial color="#ead8a8" toneMapped={false} />
      </mesh>
      <mesh ref={screenRef} position={[0, 0, 0.018]} receiveShadow>
        <planeGeometry args={[scale[0], scale[1]]} onUpdate={flipPlaneUvY} />
        <meshBasicMaterial color="#111122" toneMapped={false} />
      </mesh>
      <HtmlInCanvasSurface
        meshRef={screenRef}
        width={htmlSize[0]}
        height={htmlSize[1]}
        animated={isLiveSurface}
        brightness={1.12}
        flicker={0}
        phosphor={0}
        reflection={0.3}
        scanlines={0.65}
        uploadFps={isLiveSurface ? 4 : 2}
        warmupFrames={isLiveSurface ? 4 : 2}
      >
        {screenContent}
      </HtmlInCanvasSurface>
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={scale} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={highlight ? 0.22 : 0.035}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {highlight ? (
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[scale[0] + 0.12, scale[1] + 0.1]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={0.18}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ) : null}
      <pointLight position={[0, 0, 0.16]} intensity={highlight ? 0.85 : 0.22} distance={highlight ? 1.2 : 0.82} color={accent} />
    </group>
  );
}

function LeftCommandPanel({
  position,
  rotation = [0, 0, 0],
  title,
  accent,
  rows,
  footer,
  scale = [0.62, 0.52],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  title: string;
  accent: string;
  rows: Array<{ label: string; value: string; color?: string }>;
  footer?: string;
  scale?: [number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <Box position={[0, 0, -0.024]} scale={[scale[0] + 0.11, scale[1] + 0.1, 0.045]} color="#160f0b" roughness={0.5} metalness={0.1} />
      <mesh position={[0, 0, 0.004]} receiveShadow>
        <planeGeometry args={[scale[0] + 0.035, scale[1] + 0.03]} />
        <meshBasicMaterial color="#ead8a8" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.014]} receiveShadow>
        <planeGeometry args={scale} />
        <meshBasicMaterial color="#081711" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.022]}>
        <planeGeometry args={[scale[0] - 0.06, scale[1] - 0.06]} />
        <meshBasicMaterial color={accent} transparent opacity={0.035} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <Box position={[0, scale[1] * 0.5 - 0.035, 0.036]} scale={[scale[0] - 0.05, 0.012, 0.01]} color={accent} roughness={0.35} />
      <Box position={[0, -scale[1] * 0.5 + 0.035, 0.036]} scale={[scale[0] - 0.05, 0.009, 0.01]} color="#ba9c54" roughness={0.35} />
      <Text position={[-scale[0] * 0.42, scale[1] * 0.34, 0.046]} fontSize={0.035} color="#ffe9a6" anchorX="left" anchorY="middle">
        {title}
      </Text>
      {rows.map((row, index) => {
        const y = scale[1] * 0.17 - index * 0.105;
        return (
          <group key={`${row.label}-${index}`} position={[0, y, 0]}>
            <mesh position={[-scale[0] * 0.39, 0, 0.048]}>
              <boxGeometry args={[0.032, 0.032, 0.01]} />
              <meshBasicMaterial color={row.color ?? accent} toneMapped={false} />
            </mesh>
            <Text position={[-scale[0] * 0.31, 0.014, 0.05]} fontSize={0.026} color="#eef8de" anchorX="left" anchorY="middle">
              {row.label}
            </Text>
            <Text position={[scale[0] * 0.32, -0.018, 0.05]} fontSize={0.02} color="#b7c5a3" anchorX="right" anchorY="middle">
              {row.value}
            </Text>
          </group>
        );
      })}
      {footer ? (
        <Text position={[0, -scale[1] * 0.38, 0.05]} fontSize={0.023} color={accent} anchorX="center" anchorY="middle">
          {footer}
        </Text>
      ) : null}
      <pointLight position={[0, 0, 0.08]} intensity={0.18} distance={0.72} color={accent} />
    </group>
  );
}

const LEFT_WALL_FOCUS_SET = new Set<FocusZoneId>([
  'left-overview',
  ...FOCUS_ZONE_GROUPS.left,
]);

function useLeftWallDrillZone(zone: FocusZoneId) {
  const { focus, setFocus, hovered, setHovered } = useContext(RoomFocusContext);
  const { gl } = useThree();

  const isInLeftWallContext = focus !== null && LEFT_WALL_FOCUS_SET.has(focus);

  const onClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      if (focus === zone) {
        setFocus('left-overview');
      } else if (isInLeftWallContext) {
        setFocus(zone);
      } else {
        setFocus('left-overview');
      }
    },
    [focus, setFocus, zone, isInLeftWallContext],
  );

  const onPointerOver = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      gl.domElement.style.cursor = 'pointer';
      if (hovered !== zone) setHovered(zone);
    },
    [gl, hovered, setHovered, zone],
  );

  const onPointerOut = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      gl.domElement.style.cursor = '';
      if (hovered === zone) setHovered(null);
    },
    [gl, hovered, setHovered, zone],
  );

  const isFocused = focus === zone;
  const isHovered = hovered === zone && !isFocused;

  return { handlers: { onClick, onPointerOver, onPointerOut }, isFocused, isHovered };
}

function LeftWallScreen({
  kind,
  zone,
  y,
  z,
  accent,
  rotation,
  scale,
  htmlSize,
}: {
  kind: WallHtmlScreenKind;
  zone: FocusZoneId;
  y: number;
  z: number;
  accent: string;
  rotation: [number, number, number];
  scale: [number, number];
  htmlSize: [number, number];
}) {
  const { handlers, isHovered, isFocused } = useLeftWallDrillZone(zone);
  return (
    <group {...handlers}>
      <HtmlWallScreen
        kind={kind}
        position={[-3.945, y, z]}
        rotation={rotation}
        scale={scale}
        htmlSize={htmlSize}
        accent={accent}
        highlight={isHovered || isFocused}
      />
    </group>
  );
}

function LeftCommandColumn() {
  const leftWallRotation: [number, number, number] = [0, Math.PI / 2, 0];
  const uniformScale: [number, number] = [0.92, 0.52];
  const uniformHtmlSize: [number, number] = [780, 440];
  const backColumnZ = -2.26;
  const frontColumnZ = -1.0;

  return (
    <group>
      <LeftWallScreen
        kind="prime-id"
        zone="left-passport"
        y={2.32}
        z={backColumnZ}
        accent="#8cffae"
        rotation={leftWallRotation}
        scale={uniformScale}
        htmlSize={uniformHtmlSize}
      />
      <LeftWallScreen
        kind="skills"
        zone="left-skills"
        y={1.7}
        z={backColumnZ}
        accent="#78d7ff"
        rotation={leftWallRotation}
        scale={uniformScale}
        htmlSize={uniformHtmlSize}
      />
      <LeftWallScreen
        kind="loopr"
        zone="left-loopr"
        y={1.08}
        z={backColumnZ}
        accent="#ffb861"
        rotation={leftWallRotation}
        scale={uniformScale}
        htmlSize={uniformHtmlSize}
      />
      <LeftWallScreen
        kind="balance"
        zone="left-balance"
        y={2.32}
        z={frontColumnZ}
        accent="#8cffae"
        rotation={leftWallRotation}
        scale={uniformScale}
        htmlSize={uniformHtmlSize}
      />
      <LeftWallScreen
        kind="model"
        zone="left-model"
        y={1.7}
        z={frontColumnZ}
        accent="#ffb861"
        rotation={leftWallRotation}
        scale={uniformScale}
        htmlSize={uniformHtmlSize}
      />
      <LeftWallScreen
        kind="donate"
        zone="left-care"
        y={1.08}
        z={frontColumnZ}
        accent="#ff6e72"
        rotation={leftWallRotation}
        scale={uniformScale}
        htmlSize={uniformHtmlSize}
      />
    </group>
  );
}

function WallDecor() {
  return (
    <group>
      <LeftCommandColumn />
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

function LooplingAtlasBillboard({
  pet = 'prime-test',
  state = 'idle',
  position,
  rotation = [0, 0, 0],
  scale = [0.28, 0.31],
}: {
  pet?: string;
  state?: keyof typeof SCREEN_STATES;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number];
}) {
  const sprite = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 208;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    return { canvas, texture };
  }, []);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const lastDrawRef = useRef(-Infinity);

  useEffect(() => {
    const image = new Image();
    image.src = `/pets/${pet}/state-atlas.png?v=${ATLAS_VERSION}`;
    image.onload = () => {
      imageRef.current = image;
      lastDrawRef.current = -Infinity;
    };

    return () => sprite.texture.dispose();
  }, [pet, sprite.texture]);

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime;
    const meta = SCREEN_STATES[state];
    if (elapsed - lastDrawRef.current < 1 / meta.fps) return;

    const ctx = sprite.canvas.getContext('2d');
    const image = imageRef.current;
    if (ctx && image?.complete && image.naturalWidth > 0) {
      const frame = Math.floor(elapsed * meta.fps) % meta.frames;
      const frameW = image.naturalWidth / ATLAS_COLS;
      const frameH = image.naturalHeight / ATLAS_ROWS;
      ctx.clearRect(0, 0, sprite.canvas.width, sprite.canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, frame * frameW, meta.row * frameH, frameW, frameH, 0, 0, sprite.canvas.width, sprite.canvas.height);
      sprite.texture.needsUpdate = true;
    }
    lastDrawRef.current = elapsed;
  });

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={scale} />
      <meshBasicMaterial map={sprite.texture} transparent toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function PrimeHabitatDome() {
  return (
    <group position={[-2.34, DESK_SURFACE_Y + 0.11, -1.05 + DESK_WALL_OFFSET_Z]} rotation={[0, 0.1, 0]}>
      <mesh position={[0, -0.025, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.28, 0.31, 0.075, 42]} />
        <meshStandardMaterial color="#11120f" roughness={0.44} metalness={0.22} />
      </mesh>
      <mesh position={[0, 0.03, 0.004]} receiveShadow>
        <cylinderGeometry args={[0.24, 0.24, 0.035, 42]} />
        <meshStandardMaterial color="#274225" roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.245, 0]} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[0.27, 42, 22, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshPhysicalMaterial
          color="#dffcff"
          roughness={0.04}
          metalness={0}
          transmission={0.55}
          transparent
          opacity={0.28}
          thickness={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.04, 32]} />
        <meshStandardMaterial color="#0f1416" roughness={0.3} metalness={0.28} />
      </mesh>
      {Array.from({ length: 18 }, (_, index) => {
        const angle = index * 2.42;
        const radius = 0.07 + (index % 5) * 0.028;
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * radius, 0.065 + (index % 3) * 0.018, Math.sin(angle) * radius]}
            rotation={[0, 0, angle]}
            scale={[1.5, 0.85, 1]}
          >
            <circleGeometry args={[0.021 + (index % 3) * 0.004, 9]} />
            <meshStandardMaterial color={index % 4 === 0 ? '#8bbd5b' : '#3e7f37'} roughness={0.82} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      <LooplingAtlasBillboard position={[-0.02, 0.135, 0.145]} scale={[0.2, 0.217]} />
      <Text position={[0, -0.071, 0.235]} rotation={[-0.16, 0, 0]} fontSize={0.035} color="#e8d47c" anchorX="center" anchorY="middle">
        PRIME-00
      </Text>
      <pointLight position={[0, 0.2, 0.18]} intensity={0.58} distance={0.72} color="#8cffae" />
    </group>
  );
}

function AgentHandbook() {
  return (
    <group position={[-2.18, DESK_SURFACE_Y + 0.061, -0.37 + DESK_WALL_OFFSET_Z]} rotation={[-Math.PI / 2, 0, -0.16]}>
      <Box position={[0, 0, -0.012]} scale={[0.45, 0.57, 0.024]} color="#082015" roughness={0.72} />
      <mesh position={[0, 0, 0.004]} receiveShadow>
        <planeGeometry args={[0.41, 0.53]} />
        <meshStandardMaterial color="#15331f" roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <Box position={[0, 0.232, 0.016]} scale={[0.35, 0.012, 0.01]} color="#d7c27a" roughness={0.42} />
      <Box position={[0, -0.232, 0.016]} scale={[0.35, 0.012, 0.01]} color="#d7c27a" roughness={0.42} />
      <Text position={[0, 0.13, 0.028]} fontSize={0.046} color="#e8d47c" anchorX="center" anchorY="middle">
        AGENT
      </Text>
      <Text position={[0, 0.07, 0.028]} fontSize={0.039} color="#e8d47c" anchorX="center" anchorY="middle">
        HANDBOOK
      </Text>
      <Text position={[0, -0.14, 0.028]} fontSize={0.033} color="#8cffae" anchorX="center" anchorY="middle">
        LOOPLING OS
      </Text>
    </group>
  );
}

function PrimeIdCard() {
  return (
    <group position={[-1.68, DESK_SURFACE_Y + 0.064, -0.34 + DESK_WALL_OFFSET_Z]} rotation={[-Math.PI / 2, 0, 0.12]}>
      <mesh receiveShadow>
        <planeGeometry args={[0.44, 0.31]} />
        <meshStandardMaterial color="#ead8a8" roughness={0.84} side={THREE.DoubleSide} />
      </mesh>
      <Box position={[0, 0.13, 0.012]} scale={[0.38, 0.012, 0.01]} color="#17120c" roughness={0.44} />
      <LooplingAtlasBillboard position={[-0.1, 0.0, 0.025]} rotation={[0, 0, 0]} scale={[0.13, 0.14]} />
      <Text position={[0.08, 0.04, 0.026]} fontSize={0.03} color="#18120b" anchorX="center" anchorY="middle">
        PRIME-00
      </Text>
      <Text position={[0.08, -0.06, 0.026]} fontSize={0.022} color="#2f7a3a" anchorX="center" anchorY="middle">
        ID: 000-PRIME
      </Text>
      <mesh position={[0.18, -0.095, 0.026]}>
        <planeGeometry args={[0.07, 0.07]} />
        <meshBasicMaterial color="#11120f" transparent opacity={0.88} />
      </mesh>
    </group>
  );
}

function ComputePad() {
  const screenRef = useRef<THREE.Mesh>(null);
  const computeContent = useMemo(() => <RunwayScreen />, []);
  const { handlers, isHovered } = useFocusZone('desk-compute');

  return (
    <group
      position={[-0.75, DESK_SURFACE_Y + 0.145, -1.09 + DESK_WALL_OFFSET_Z]}
      rotation={[-0.18, 0.32, 0]}
      scale={isHovered ? 0.63 : 0.62}
      {...handlers}
    >
      {/* CRT-style outer bezel — deeper + blue-tinted */}
      <Box position={[0, 0, -0.05]} scale={[0.5, 0.4, 0.12]} color="#0d1d2a" roughness={0.4} metalness={0.18} castShadow />
      {/* Side vents */}
      <Box position={[-0.225, 0, -0.022]} scale={[0.03, 0.32, 0.07]} color="#091420" roughness={0.5} metalness={0.2} />
      <Box position={[0.225, 0, -0.022]} scale={[0.03, 0.32, 0.07]} color="#091420" roughness={0.5} metalness={0.2} />
      {/* Base / stand */}
      <Box position={[0, -0.215, -0.04]} scale={[0.36, 0.045, 0.16]} color="#091420" roughness={0.5} metalness={0.22} castShadow />
      {/* Tally lamp above bezel */}
      <mesh position={[0, 0.19, 0.012]}>
        <boxGeometry args={[0.04, 0.02, 0.012]} />
        <meshBasicMaterial color="#78d7ff" toneMapped={false} />
      </mesh>
      <mesh ref={screenRef} position={[0, 0.025, 0.018]} receiveShadow>
        <planeGeometry args={[0.39, 0.28]} onUpdate={flipPlaneUvY} />
        <meshBasicMaterial color="#0a1c2a" toneMapped={false} />
      </mesh>
      <HtmlInCanvasSurface
        meshRef={screenRef}
        width={420}
        height={300}
        animated={false}
        brightness={1.12}
        flicker={0}
        phosphor={0}
        reflection={0.25}
        scanlines={0.6}
        uploadFps={2}
        warmupFrames={2}
      >
        {computeContent}
      </HtmlInCanvasSurface>
      <pointLight position={[0, 0, 0.22]} intensity={0.42} distance={0.78} color="#78d7ff" />
    </group>
  );
}

function DonateTerminal() {
  const screenRef = useRef<THREE.Mesh>(null);
  const terminalContent = useMemo(() => <DeskTerminalScreen />, []);
  const { handlers, isHovered } = useFocusZone('desk-terminal');

  return (
    <group
      position={[0.94, DESK_SURFACE_Y + 0.145, -1.09 + DESK_WALL_OFFSET_Z]}
      rotation={[-0.18, -0.23, 0]}
      scale={isHovered ? 0.63 : 0.62}
      {...handlers}
    >
      <Box position={[0, 0, -0.035]} scale={[0.46, 0.36, 0.08]} color="#111417" roughness={0.44} metalness={0.12} castShadow />
      <mesh ref={screenRef} position={[0, 0.025, 0.018]} receiveShadow>
        <planeGeometry args={[0.39, 0.28]} onUpdate={flipPlaneUvY} />
        <meshBasicMaterial color="#082116" toneMapped={false} />
      </mesh>
      <HtmlInCanvasSurface
        meshRef={screenRef}
        width={420}
        height={300}
        animated={false}
        brightness={1.12}
        flicker={0}
        phosphor={0}
        reflection={0.25}
        scanlines={0.6}
        uploadFps={2}
        warmupFrames={2}
      >
        {terminalContent}
      </HtmlInCanvasSurface>
      <pointLight position={[0, 0, 0.22]} intensity={0.42} distance={0.74} color="#8cffae" />
    </group>
  );
}

function WalletPuck() {
  return (
    <group position={[1.82, DESK_SURFACE_Y + 0.068, -0.74 + DESK_WALL_OFFSET_Z]} rotation={[0, -0.12, 0]} scale={0.78}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.23, 0.11, 48]} />
        <meshStandardMaterial color="#0c1912" roughness={0.36} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.058, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.155, 0.012, 8, 48]} />
        <meshBasicMaterial color="#70ffb0" toneMapped={false} />
      </mesh>
      <Text position={[0, 0.074, 0.04]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.035} color="#70ffb0" anchorX="center" anchorY="middle">
        WALLET
      </Text>
      <pointLight position={[0, 0.15, 0]} intensity={0.7} distance={0.85} color="#70ffb0" />
    </group>
  );
}

const COMMAND_KEY_ACCENT: Record<CommandKeyMode, string> = {
  research: '#78d7ff',
  trade: '#8cffae',
  post: '#ff6ea9',
  memory: '#b792ff',
  media: '#ffb861',
};

function CommandKeyScreenFlash({ accent }: { accent: string }) {
  return (
    <mesh position={[0, 0.025, 0.0495]}>
      <planeGeometry args={[0.108, 0.118]} />
      <meshBasicMaterial
        color={accent}
        transparent
        opacity={0.48}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function CommandKey({ mode, x, active }: { mode: CommandKeyMode; x: number; active: boolean }) {
  const screenRef = useRef<THREE.Mesh>(null);
  const content = useMemo(() => <CommandKeyMiniScreen mode={mode} active={active} />, [mode, active]);
  const accent = COMMAND_KEY_ACCENT[mode];

  return (
    <group position={[x, 0, 0.004]}>
      <Box position={[0, 0.02, 0]} scale={[0.13, 0.15, 0.09]} color="#271b12" roughness={0.52} metalness={0.16} castShadow />
      <mesh ref={screenRef} position={[0, 0.025, 0.048]} receiveShadow>
        <planeGeometry args={[0.105, 0.115, 8, 8]} onUpdate={flipPlaneUvY} />
        <meshBasicMaterial color="#111122" toneMapped={false} />
      </mesh>
      <HtmlInCanvasSurface
        meshRef={screenRef}
        width={160}
        height={175}
        animated={false}
        brightness={1.0}
        flicker={0}
        phosphor={0}
        reflection={0.1}
        scanlines={0.3}
        barrel={0}
        uploadFps={1}
        warmupFrames={1}
      >
        {content}
      </HtmlInCanvasSurface>
      {active ? <CommandKeyScreenFlash accent={accent} /> : null}
    </group>
  );
}

function ModeDock() {
  const { handlers, isHovered } = useFocusZone('desk-keys');
  const state = useLooplingsState();

  return (
    <group
      position={[0.08, DESK_SURFACE_Y + 0.16, -1.15 + DESK_WALL_OFFSET_Z]}
      rotation={[0, 0.02, 0]}
      scale={isHovered ? 1.04 : 1}
      {...handlers}
    >
      <Box position={[0, -0.058, -0.01]} scale={[0.86, 0.09, 0.19]} color="#16100b" roughness={0.48} metalness={0.12} castShadow />
      {COMMAND_KEY_ORDER.map((mode, index) => (
        <CommandKey
          key={mode}
          mode={mode}
          x={-0.34 + index * 0.17}
          active={mode === state.activeTool}
        />
      ))}
    </group>
  );
}

function DeskClutter() {
  return (
    <group>
      <ModeDock />
      <DonateTerminal />
      <ComputePad />
      <WalletPuck />

      {/* I♥LOOPS mug (kept). */}
      <group position={[-2.2, DESK_SURFACE_Y + 0.09, -1.54 + DESK_WALL_OFFSET_Z]} rotation={[0, 0.32, 0]}>
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
    </group>
  );
}

function FocusableCamera({ resetSignal }: { resetSignal: number }) {
  const { camera } = useThree();
  const { focus, setFocus, setHovered } = useContext(RoomFocusContext);

  // Whenever focus changes (zoom in or zoom out), clear any stuck hover state.
  // Without this, the cursor stays "over" a mesh after camera movement and the
  // hover glow lingers until the user manually moves the mouse.
  useEffect(() => {
    setHovered(null);
    if (typeof document !== 'undefined') {
      document.body.style.cursor = '';
    }
  }, [focus, setHovered]);

  const heroLook = useMemo(() => {
    const yaw = CAMERA_BASE_YAW;
    const pitch = CAMERA_BASE_PITCH;
    const dir = new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch),
    );
    return new THREE.Vector3(...CAMERA_HOME_POSITION).addScaledVector(dir, 6);
  }, []);

  const currentPosRef = useRef(new THREE.Vector3(...CAMERA_HOME_POSITION));
  const currentLookRef = useRef(heroLook.clone());

  useEffect(() => {
    camera.position.copy(CAMERA_HOME);
    currentPosRef.current.copy(CAMERA_HOME);
    currentLookRef.current.copy(heroLook);
    camera.lookAt(currentLookRef.current);
    camera.updateProjectionMatrix();
  }, [camera, heroLook, resetSignal]);

  useEffect(() => {
    if (resetSignal === 0) return;
    setFocus(null);
  }, [resetSignal, setFocus]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (focus && LEFT_WALL_ZONE_ORDER.includes(focus)) {
          setFocus('left-overview');
        } else {
          setFocus(null);
        }
        return;
      }
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      if (!focus) return;
      if (!LEFT_WALL_ZONE_ORDER.includes(focus)) return;
      const idx = LEFT_WALL_ZONE_ORDER.indexOf(focus);
      event.preventDefault();
      const next = event.key === 'ArrowUp' ? idx - 1 : idx + 1;
      if (next < 0 || next >= LEFT_WALL_ZONE_ORDER.length) return;
      setFocus(LEFT_WALL_ZONE_ORDER[next]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focus, setFocus]);

  useFrame((_, delta) => {
    const targetPos = focus ? FOCUS_POSES[focus].position : CAMERA_HOME;
    const targetLook = focus ? FOCUS_POSES[focus].lookAt : heroLook;
    const damping = 4.4;

    currentPosRef.current.x = THREE.MathUtils.damp(currentPosRef.current.x, targetPos.x, damping, delta);
    currentPosRef.current.y = THREE.MathUtils.damp(currentPosRef.current.y, targetPos.y, damping, delta);
    currentPosRef.current.z = THREE.MathUtils.damp(currentPosRef.current.z, targetPos.z, damping, delta);

    currentLookRef.current.x = THREE.MathUtils.damp(currentLookRef.current.x, targetLook.x, damping, delta);
    currentLookRef.current.y = THREE.MathUtils.damp(currentLookRef.current.y, targetLook.y, damping, delta);
    currentLookRef.current.z = THREE.MathUtils.damp(currentLookRef.current.z, targetLook.z, damping, delta);

    camera.position.copy(currentPosRef.current);
    camera.lookAt(currentLookRef.current);
  });

  return null;
}

function SeatedLookCamera({ resetSignal }: { resetSignal: number }) {
  const { camera } = useThree();
  const targetYawRef = useRef(0);
  const targetPitchRef = useRef(0);
  const currentYawRef = useRef(0);
  const currentPitchRef = useRef(0);

  useEffect(() => {
    camera.position.copy(CAMERA_HOME);
    camera.updateProjectionMatrix();
  }, [camera]);

  useEffect(() => {
    targetYawRef.current = 0;
    targetPitchRef.current = 0;
    currentYawRef.current = 0;
    currentPitchRef.current = 0;
  }, [resetSignal]);

  const _lookDir = useMemo(() => new THREE.Vector3(), []);
  const _lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    currentYawRef.current = THREE.MathUtils.damp(currentYawRef.current, targetYawRef.current, 18, delta);
    currentPitchRef.current = THREE.MathUtils.damp(currentPitchRef.current, targetPitchRef.current, 18, delta);

    const yaw = CAMERA_BASE_YAW + currentYawRef.current;
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
  const yawRef = useRef(CAMERA_BASE_YAW);
  const pitchRef = useRef(CAMERA_BASE_PITCH);
  const keysRef = useRef(new Set<string>());
  const lastReportRef = useRef(0);
  const lastSnapshotRef = useRef<RoomInspectionSnapshot | null>(null);
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    x: 0,
    y: 0,
    yaw: 0,
    pitch: CAMERA_BASE_PITCH,
  });

  const lastResetRef = useRef<number | null>(null);

  useEffect(() => {
    const isResetEvent = lastResetRef.current !== null && lastResetRef.current !== resetSignal;
    lastResetRef.current = resetSignal;

    if (!isResetEvent) {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      yawRef.current = Math.atan2(dir.x, -dir.z);
      pitchRef.current = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));
      camera.updateProjectionMatrix();
      return;
    }
    camera.position.copy(INSPECT_CAMERA_HOME);
    yawRef.current = CAMERA_BASE_YAW;
    pitchRef.current = CAMERA_BASE_PITCH;
    camera.updateProjectionMatrix();
  }, [camera, resetSignal]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.style.cursor = 'grab';

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (receiptDragActive) return;
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
      if (receiptDragActive) {
        dragRef.current.active = false;
        canvas.style.cursor = 'grab';
        document.body.style.cursor = '';
        return;
      }

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

    if (onInspectCameraChange && clock.elapsedTime - lastReportRef.current > 0.25) {
      const snapshot = {
        x: Math.round(camera.position.x * 100) / 100,
        y: Math.round(camera.position.y * 100) / 100,
        z: Math.round(camera.position.z * 100) / 100,
        yaw: Math.round(THREE.MathUtils.radToDeg(yaw) * 10) / 10,
        pitch: Math.round(THREE.MathUtils.radToDeg(pitch) * 10) / 10,
      };
      const lastSnapshot = lastSnapshotRef.current;
      if (
        !lastSnapshot ||
        lastSnapshot.x !== snapshot.x ||
        lastSnapshot.y !== snapshot.y ||
        lastSnapshot.z !== snapshot.z ||
        lastSnapshot.yaw !== snapshot.yaw ||
        lastSnapshot.pitch !== snapshot.pitch
      ) {
        onInspectCameraChange(snapshot);
        lastSnapshotRef.current = snapshot;
      }
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
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0005}
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
      <group position={[DESK_STAGE_POSITION[0], DESK_STAGE_POSITION[1], DESK_STAGE_POSITION[2]]}>
        <Desk />
        <DeskClutter />
        <Casing />
        <ReceiptPrinter />
        <IndustrialLamp />
      </group>
      <ContactShadows position={[DESK_STAGE_POSITION[0], 0.015, -1.22]} opacity={0.42} scale={6} blur={2.5} far={3} frames={1} />
    </Suspense>
  );
}

function AspectAwareFov() {
  const { camera, size } = useThree();
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = size.width / size.height;
    // Hold the horizontal FOV constant so narrower aspects (fullscreen on
    // 16:10 displays) don't crop the left/right walls. CAMERA_FOV (46°)
    // was tuned against a windowed ~1.78 aspect — derive the matching
    // horizontal FOV at that reference and recompute vertical FOV for
    // the current aspect.
    const referenceAspect = 1.78;
    const referenceHfovRad = 2 * Math.atan(Math.tan((CAMERA_FOV * Math.PI) / 360) * referenceAspect);
    const targetVfovDeg = (2 * Math.atan(Math.tan(referenceHfovRad / 2) / aspect) * 180) / Math.PI;
    const clamped = Math.max(40, Math.min(70, targetVfovDeg));
    if (Math.abs(camera.fov - clamped) > 0.05) {
      camera.fov = clamped;
      camera.updateProjectionMatrix();
    }
  }, [camera, size]);
  return null;
}

function StarterRoomScene({
  resetSignal,
  inspectMode = false,
  onInspectCameraChange,
  focus,
  onFocusChange,
}: {
  resetSignal: number;
  inspectMode?: boolean;
  onInspectCameraChange?: (snapshot: RoomInspectionSnapshot) => void;
  focus?: FocusZoneId | null;
  onFocusChange?: (zone: FocusZoneId | null) => void;
}) {
  const focusValue = useRoomFocusValue(focus, onFocusChange);
  return (
    <RoomFocusContext.Provider value={focusValue}>
      <Canvas
        className="starter-room-canvas"
        shadows
        dpr={[1, 1.25]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.shadowMap.autoUpdate = false;
          gl.shadowMap.needsUpdate = true;
        }}
        onPointerMissed={() => focusValue.setFocus(null)}
      >
        <color attach="background" args={['#07080c']} />
        <PerspectiveCamera makeDefault position={CAMERA_HOME_POSITION} fov={CAMERA_FOV} />
        <AspectAwareFov />
        <StarterRoomContent />
        {inspectMode ? (
          <InspectionCamera resetSignal={resetSignal} onInspectCameraChange={onInspectCameraChange} />
        ) : (
          <FocusableCamera resetSignal={resetSignal} />
        )}
      </Canvas>
    </RoomFocusContext.Provider>
  );
}

export default memo(StarterRoomScene);

useGLTF.preload('/models/room/industrial_pipe_lamp/industrial_pipe_lamp_1k.gltf');
useGLTF.preload('/models/room/antique_wooden_desk/antique_wooden_desk.glb');
useGLTF.preload('/models/room/label_printer/label_printer.glb');
useGLTF.preload(DESK_KEYBOARD_MODEL_PATH);
useGLTF.preload(DESK_MOUSE_MODEL_PATH);
useGLTF.preload(DESK_MAT_MODEL_PATH);
