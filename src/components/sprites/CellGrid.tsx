
import { useMemo, useState, useEffect, useRef } from 'react';
import {
  hashCode,
  seededRandom,
  getPaletteForAddress,
  getPaletteForSpriteIdentity,
  mixColor,
  desaturate,
  darken,
  hexToRgb,
  type Palette,
  type SpriteIdentity,
  type SurvivalTier,
} from '@/lib/sprite-generator';

interface Props {
  address: string;
  tier?: SurvivalTier;
  mode?: CSSSpriteMode;
  spriteIdentity?: SpriteIdentity;
  cellSize?: number;
  gap?: number;
  perspective?: boolean;
}

export type CSSSpriteMode = 'normal' | 'low_compute' | 'critical' | 'sleeping' | 'dead';

type P = 0 | 1 | 2 | 3 | 4;
// 0=empty  1=body  2=eyes(black)  3=claws  4=detail

const ROWS = 10;
const COLS = 9;
const CENTER_X = 4;

interface CreatureProfile {
  skullWidth: number;
  shoulderWidth: number;
  waistWidth: number;
  hipWidth: number;
  hornStyle: number;
  armStyle: number;
  legStyle: number;
  eyeRow: number;
  eyeCount: number;
  eyeOffset: number;
  asymmetryPasses: number;
  detailChance: number;
}

type LegPattern = {
  f1: Array<[number, number]>;
  f2: Array<[number, number]>;
};

const LEG_PATTERNS: LegPattern[] = [
  { f1: [[8, 2], [8, 6], [9, 3], [9, 5]], f2: [[8, 1], [8, 7], [9, 2], [9, 6]] },
  { f1: [[8, 3], [8, 5], [9, 2], [9, 6]], f2: [[8, 2], [8, 6], [9, 1], [9, 7]] },
  { f1: [[8, 2], [8, 4], [8, 6], [9, 4]], f2: [[8, 3], [8, 5], [9, 3], [9, 5]] },
  { f1: [[8, 1], [8, 7], [9, 3], [9, 5]], f2: [[8, 2], [8, 6], [9, 4]] },
  { f1: [[8, 2], [8, 6], [9, 2], [9, 6]], f2: [[8, 1], [8, 7], [9, 3], [9, 5]] },
  { f1: [[8, 4], [9, 3], [9, 5]], f2: [[8, 3], [8, 5], [9, 4]] },
  { f1: [[8, 2], [8, 6], [9, 1], [9, 7]], f2: [[8, 3], [8, 5], [9, 2], [9, 6]] },
  { f1: [[8, 1], [8, 4], [8, 7], [9, 4]], f2: [[8, 2], [8, 6], [9, 3], [9, 5]] },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function makeGrid(): P[][] {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0 as P));
}

function cloneGrid(grid: P[][]): P[][] {
  return grid.map((row) => [...row]);
}

function setCell(grid: P[][], y: number, x: number, px: P): void {
  if (y < 0 || y >= ROWS || x < 0 || x >= COLS) return;
  grid[y][x] = px;
}

function fillSpan(grid: P[][], y: number, halfWidth: number, px: P = 1): void {
  const width = clamp(halfWidth, 1, 5);
  const left = clamp(CENTER_X - (width - 1), 0, COLS - 1);
  const right = clamp(CENTER_X + (width - 1), 0, COLS - 1);
  for (let x = left; x <= right; x++) {
    grid[y][x] = px;
  }
}

function clearLegRows(grid: P[][]): void {
  for (let y = 8; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] !== 2) {
        grid[y][x] = 0;
      }
    }
  }
}

function applyHornStyle(grid: P[][], style: number): void {
  switch (style % 8) {
    case 0:
      setCell(grid, 0, 2, 1); setCell(grid, 0, 6, 1);
      break;
    case 1:
      setCell(grid, 0, 1, 1); setCell(grid, 0, 7, 1);
      setCell(grid, 1, 2, 1); setCell(grid, 1, 6, 1);
      break;
    case 2:
      setCell(grid, 0, 0, 1); setCell(grid, 0, 8, 1);
      break;
    case 3:
      setCell(grid, 0, 3, 1); setCell(grid, 0, 5, 1);
      setCell(grid, 1, 4, 4);
      break;
    case 4:
      setCell(grid, 0, 4, 1);
      setCell(grid, 1, 4, 1);
      break;
    case 5:
      setCell(grid, 0, 1, 4); setCell(grid, 0, 4, 1); setCell(grid, 0, 7, 4);
      break;
    case 6:
      setCell(grid, 0, 2, 1); setCell(grid, 1, 1, 1);
      setCell(grid, 0, 6, 4); setCell(grid, 1, 7, 1);
      break;
    default:
      setCell(grid, 0, 1, 1); setCell(grid, 0, 4, 1); setCell(grid, 0, 7, 1);
      setCell(grid, 1, 2, 4); setCell(grid, 1, 6, 4);
      break;
  }
}

function applyArmStyle(grid: P[][], style: number): void {
  switch (style % 10) {
    case 0:
      setCell(grid, 5, 0, 3); setCell(grid, 5, 8, 3);
      break;
    case 1:
      setCell(grid, 4, 0, 3); setCell(grid, 4, 8, 3);
      setCell(grid, 5, 1, 1); setCell(grid, 5, 7, 1);
      break;
    case 2:
      setCell(grid, 3, 0, 1); setCell(grid, 3, 8, 1);
      setCell(grid, 4, 1, 3); setCell(grid, 4, 7, 3);
      break;
    case 3:
      setCell(grid, 6, 0, 3); setCell(grid, 6, 8, 3);
      setCell(grid, 5, 1, 1); setCell(grid, 5, 7, 1);
      break;
    case 4:
      setCell(grid, 4, 1, 3); setCell(grid, 4, 7, 3);
      break;
    case 5:
      setCell(grid, 3, 1, 4); setCell(grid, 3, 7, 4);
      setCell(grid, 5, 0, 3); setCell(grid, 5, 8, 3);
      break;
    case 6:
      setCell(grid, 4, 0, 3); setCell(grid, 6, 8, 3);
      break;
    case 7:
      setCell(grid, 4, 8, 3); setCell(grid, 6, 0, 3);
      break;
    case 8:
      setCell(grid, 4, 0, 4); setCell(grid, 4, 8, 4);
      setCell(grid, 5, 1, 3); setCell(grid, 5, 7, 3);
      break;
    default:
      setCell(grid, 5, 0, 3); setCell(grid, 5, 8, 3);
      setCell(grid, 6, 1, 4); setCell(grid, 6, 7, 4);
      break;
  }
}

function applyLegPattern(grid: P[][], style: number, frame: 0 | 1): void {
  clearLegRows(grid);
  const pattern = LEG_PATTERNS[style % LEG_PATTERNS.length];
  const coords = frame === 0 ? pattern.f1 : pattern.f2;

  for (const [y, x] of coords) {
    setCell(grid, y, x, y === 9 ? 3 : 1);
  }
}

function applyAsymmetry(grid: P[][], passes: number, random: () => number, eyeRows: Set<number>): void {
  for (let i = 0; i < passes; i++) {
    const y = 1 + Math.floor(random() * 8);
    if (eyeRows.has(y)) continue;

    const mutateLeft = random() < 0.5;
    const x = mutateLeft ? Math.floor(random() * 4) : 5 + Math.floor(random() * 4);
    const current = grid[y][x];
    if (current === 2) continue;

    if (current === 0) {
      const px: P = random() < 0.2 ? 3 : random() < 0.18 ? 4 : 1;
      setCell(grid, y, x, px);
    } else if (current === 1 && random() < 0.35) {
      setCell(grid, y, x, 4);
    } else if (current === 4 && random() < 0.22) {
      setCell(grid, y, x, 1);
    } else if (current === 3 && random() < 0.2) {
      setCell(grid, y, x, 1);
    }
  }
}

function getEyeFormation(
  count: number,
  baseRow: number,
  offset: number,
  random: () => number,
): Array<[number, number]> {
  const left = clamp(CENTER_X - offset, 1, 3);
  const right = clamp(CENTER_X + offset, 5, 7);
  const midLeft = clamp(CENTER_X - 1, 2, 3);
  const midRight = clamp(CENTER_X + 1, 5, 6);

  let raw: Array<[number, number]>;

  switch (count) {
    case 1:
      raw = [[baseRow, CENTER_X]];
      break;
    case 2:
      raw = random() < 0.5
        ? [[baseRow, left], [baseRow, right]]
        : [[baseRow, midLeft], [baseRow, midRight]];
      break;
    case 3:
      raw = random() < 0.5
        ? [[baseRow, left], [baseRow, CENTER_X], [baseRow, right]]
        : [[baseRow - 1, CENTER_X], [baseRow, midLeft], [baseRow, midRight]];
      break;
    case 4:
      if (random() < 0.4) {
        raw = [[baseRow, 1], [baseRow, 3], [baseRow, 5], [baseRow, 7]];
      } else if (random() < 0.8) {
        // stacked, even 2x2
        raw = [[baseRow - 1, midLeft], [baseRow - 1, midRight], [baseRow, midLeft], [baseRow, midRight]];
      } else {
        // stacked, wider mirrored columns
        raw = [[baseRow - 1, left], [baseRow, left], [baseRow - 1, right], [baseRow, right]];
      }
      break;
    case 5:
      if (random() < 0.5) {
        // diamond-like
        raw = [
          [baseRow - 1, CENTER_X],
          [baseRow, left],
          [baseRow, CENTER_X],
          [baseRow, right],
          [baseRow + 1, CENTER_X],
        ];
      } else {
        // pyramid-like
        raw = [
          [baseRow - 1, CENTER_X],
          [baseRow, midLeft],
          [baseRow, CENTER_X],
          [baseRow, midRight],
          [baseRow + 1, CENTER_X],
        ];
      }
      break;
    default:
      raw = [[baseRow, left], [baseRow, right]];
      break;
  }

  const deduped = new Map<string, [number, number]>();
  for (const [y, x] of raw) {
    const yy = clamp(y, 1, 7);
    const xx = clamp(x, 1, 7);
    deduped.set(`${yy}-${xx}`, [yy, xx]);
  }

  return [...deduped.values()];
}

function reinforceBodyMass(grid: P[][], eyeRows: Set<number>): void {
  for (let y = 1; y <= 7; y++) {
    if (eyeRows.has(y)) continue;

    let left = -1;
    let right = -1;

    for (let x = 1; x <= 7; x++) {
      if (grid[y][x] !== 0) {
        if (left === -1) left = x;
        right = x;
      }
    }

    if (left === -1 || right === -1) continue;

    for (let x = left; x <= right; x++) {
      if (grid[y][x] === 0) {
        grid[y][x] = 1;
      }
    }
  }
}

function generateCreature(hash: number): { f1: P[][]; f2: P[][] } {
  const random = seededRandom(hash ^ 0x9e3779b9);
  const eyeRoll = random();
  const eyeCount =
    eyeRoll < 0.12 ? 1 :
    eyeRoll < 0.45 ? 2 :
    eyeRoll < 0.75 ? 3 :
    eyeRoll < 0.92 ? 4 :
    5;

  const profile: CreatureProfile = {
    skullWidth: 2 + Math.floor(random() * 3),
    shoulderWidth: 3 + Math.floor(random() * 3),
    waistWidth: 2 + Math.floor(random() * 3),
    hipWidth: 2 + Math.floor(random() * 3),
    hornStyle: Math.floor(random() * 16),
    armStyle: Math.floor(random() * 20),
    legStyle: Math.floor(random() * 24),
    eyeRow: 2 + Math.floor(random() * 2),
    eyeCount,
    eyeOffset: 1 + Math.floor(random() * 3),
    asymmetryPasses: 1 + Math.floor(random() * 7),
    detailChance: 0.1 + random() * 0.24,
  };

  const frame1 = makeGrid();

  const widths = [
    clamp(profile.skullWidth - 1 + (random() < 0.2 ? 1 : 0), 1, 5),
    clamp(profile.skullWidth, 1, 5),
    clamp(profile.shoulderWidth - 1, 1, 5),
    clamp(profile.shoulderWidth, 1, 5),
    clamp(profile.shoulderWidth - (random() < 0.35 ? 1 : 0), 1, 5),
    clamp(profile.waistWidth + 1, 1, 5),
    clamp(profile.waistWidth, 1, 5),
    clamp(profile.hipWidth, 1, 5),
  ];

  for (let y = 0; y <= 7; y++) {
    let w = widths[y];
    if (random() < 0.18) w = clamp(w + 1, 1, 5);
    if (random() < 0.14) w = clamp(w - 1, 1, 5);
    fillSpan(frame1, y, w, 1);
  }

  applyHornStyle(frame1, profile.hornStyle);
  applyArmStyle(frame1, profile.armStyle);

  const eyeCells = getEyeFormation(profile.eyeCount, profile.eyeRow, profile.eyeOffset, random);
  const eyeRows = new Set<number>();
  const eyesByRow = new Map<number, number[]>();

  for (const [eyeY, eyeX] of eyeCells) {
    eyeRows.add(eyeY);
    const xs = eyesByRow.get(eyeY) ?? [];
    xs.push(eyeX);
    eyesByRow.set(eyeY, xs);
  }

  for (const [eyeY, xs] of eyesByRow.entries()) {
    const eyeLeft = Math.min(...xs);
    const eyeRight = Math.max(...xs);
    const requiredEyeWidth = Math.max(CENTER_X - eyeLeft, eyeRight - CENTER_X) + 1;
    fillSpan(frame1, eyeY, requiredEyeWidth, 1);
  }

  for (const [eyeY, eyeX] of eyeCells) {
    setCell(frame1, eyeY, eyeX, 2);
  }

  for (let y = 1; y <= 7; y++) {
    for (let x = 0; x < COLS; x++) {
      if (frame1[y][x] === 1 && random() < profile.detailChance) {
        frame1[y][x] = 4;
      }
    }
  }

  applyAsymmetry(frame1, profile.asymmetryPasses, random, eyeRows);
  reinforceBodyMass(frame1, eyeRows);

  const frame2 = cloneGrid(frame1);
  applyLegPattern(frame1, profile.legStyle, 0);
  applyLegPattern(frame2, profile.legStyle, 1);

  if (profile.armStyle % 3 === 0) {
    setCell(frame2, 5, 0, frame2[5][0] === 3 ? 1 : 3);
    setCell(frame2, 5, 8, frame2[5][8] === 3 ? 1 : 3);
  }

  return { f1: frame1, f2: frame2 };
}

const ANIM_SPEED: Record<CSSSpriteMode, number> = {
  normal: 620,
  low_compute: 1400,
  critical: 120,
  sleeping: 2400,
  dead: 0,
};

function applyModePalette(base: Palette, mode: CSSSpriteMode): Palette {
  switch (mode) {
    case 'critical':
      return {
        body: mixColor(darken(base.body, 0.35), '#ff1a1a', 0.58),
        eyes: mixColor(base.eyes, '#ffd6d6', 0.4),
        claws: mixColor(darken(base.claws, 0.3), '#cc0000', 0.62),
        detail: mixColor(darken(base.detail, 0.2), '#ff6b6b', 0.45),
      };
    case 'sleeping':
      return {
        body: mixColor(desaturate(base.body, 0.35), '#9cc8ff', 0.55),
        eyes: '#dbeafe',
        claws: mixColor(desaturate(base.claws, 0.45), '#6ea8ff', 0.55),
        detail: mixColor(desaturate(base.detail, 0.25), '#e0edff', 0.6),
      };
    case 'dead':
      return {
        body: desaturate(darken(base.body, 0.5), 0.95),
        eyes: '#8b8b8b',
        claws: desaturate(darken(base.claws, 0.55), 0.95),
        detail: desaturate(darken(base.detail, 0.5), 0.95),
      };
    case 'low_compute':
    case 'normal':
    default:
      return base;
  }
}

export default function CellGrid({
  address,
  tier = 'normal',
  mode,
  spriteIdentity,
  cellSize = 6,
  gap = 2,
  perspective = true,
}: Props) {
  const activeMode: CSSSpriteMode = mode ?? tier;
  const hash = useMemo(
    () => spriteIdentity?.bodySeed ?? hashCode(address.toLowerCase()),
    [address, spriteIdentity?.bodySeed],
  );

  const { frame1, frame2, palette, cellAnims, eyeBlinkColor } = useMemo(() => {
    const { f1, f2 } = generateCreature(hash);

    const basePalette = spriteIdentity
      ? getPaletteForSpriteIdentity(spriteIdentity)
      : getPaletteForAddress(address);
    const pal = applyModePalette(basePalette, activeMode);

    // Deterministic per-cell animation timing — no Math.random()
    const animRand = seededRandom(hash ^ 0xBEEF);
    const anims = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({
        duration: (2 + animRand() * 2).toFixed(2),
        delay:    (animRand() * 3).toFixed(2),
      })),
    );

    // Blink color — darker shade of body (looks like eyelids closing)
    const [br2, bg2, bb2] = hexToRgb(pal.body);
    const eyeBlinkColor = `rgba(${Math.floor(br2 * 0.55)},${Math.floor(bg2 * 0.55)},${Math.floor(bb2 * 0.55)},0.95)`;

    return { frame1: f1, frame2: f2, palette: pal, cellAnims: anims, eyeBlinkColor };
  }, [address, activeMode, hash, spriteIdentity]);

  // Frame toggle animation
  const speed = ANIM_SPEED[activeMode];
  const [frameIdx, setFrameIdx] = useState(0);
  useEffect(() => {
    if (speed === 0) return;
    const id = setInterval(() => setFrameIdx((f) => (f + 1) % 2), speed);
    return () => clearInterval(id);
  }, [speed]);

  // JS-controlled blink — all eyes on this creature blink together, random intervals
  const [isBlinking, setIsBlinking] = useState(false);
  const blinkRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkEnabled = activeMode !== 'dead' && activeMode !== 'sleeping';

  useEffect(() => {
    if (!blinkEnabled) return;

    function scheduleBlink() {
      const minWait = activeMode === 'critical' ? 400 : 1000;
      const maxWait = activeMode === 'critical' ? 2000 : 6000;
      const waitMs = minWait + Math.random() * (maxWait - minWait);

      blinkRef.current = setTimeout(() => {
        setIsBlinking(true);
        blinkRef.current = setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 90);
      }, waitMs);
    }

    // Use hash for initial offset — creatures start staggered, not synced
    const initialDelay = (hash % 1000) + Math.random() * 1500;
    blinkRef.current = setTimeout(scheduleBlink, initialDelay);
    return () => { if (blinkRef.current) clearTimeout(blinkRef.current); };
  }, [activeMode, hash, blinkEnabled]);

  const grid = (speed === 0 || frameIdx === 0) ? frame1 : frame2;
  const br = Math.max(1, Math.floor(cellSize / 4));
  const wrapperAnimation =
    activeMode === 'sleeping'
      ? 'css-sprite-idle-sleeping 4.2s ease-in-out infinite'
      : activeMode === 'normal'
        ? 'css-sprite-idle-normal 1.6s ease-in-out infinite'
        : activeMode === 'low_compute'
          ? 'css-sprite-idle-lowcompute 3.2s ease-in-out infinite'
          : activeMode === 'critical'
            ? 'css-sprite-idle-critical 170ms linear infinite'
            : undefined;
  const wrapperFilter =
    activeMode === 'sleeping'
      ? 'saturate(0.9) brightness(1.05) drop-shadow(0 0 1px rgba(147,197,253,0.45))'
      : activeMode === 'critical'
        ? 'saturate(1.55) contrast(1.12) drop-shadow(0 0 1px rgba(239,68,68,0.55))'
        : activeMode === 'low_compute'
          ? 'saturate(0.92) brightness(0.94)'
          : activeMode === 'dead'
            ? 'grayscale(1) brightness(0.68)'
            : undefined;
  const wrapperOpacity = activeMode === 'dead' ? 0.86 : 1;

  return (
    <div
      style={{
        display: 'inline-block',
        animation: wrapperAnimation,
        filter: wrapperFilter,
        opacity: wrapperOpacity,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${cellSize}px)`,
          gap: `${gap}px`,
          transform: perspective ? 'perspective(600px) rotateX(8deg)' : undefined,
          transformOrigin: 'center center',
        }}
      >
        {grid.map((row, y) =>
          row.map((px, x) => {
            if (px === 0) {
              return <div key={`${y}-${x}`} style={{ width: cellSize, height: cellSize }} />;
            }

            // Eyes — mode-specific behavior
            if (px === 2) {
              const eyeBg =
                activeMode === 'dead' ? 'rgba(10, 10, 10, 0.45)' :
                activeMode === 'sleeping' ? eyeBlinkColor :
                isBlinking ? eyeBlinkColor :
                'rgba(10, 10, 10, 0.95)';
              const eyeAnim =
                activeMode === 'critical'
                  ? 'css-eye-critical 180ms steps(2, end) infinite'
                  : activeMode === 'sleeping'
                    ? 'css-eye-sleep 2.6s ease-in-out infinite'
                    : undefined;
              return (
                <div
                  key={`${y}-${x}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: br,
                    background: eyeBg,
                    animation: eyeAnim,
                  }}
                />
              );
            }

            // Body / claws / detail — solid color, pulsing
            const hex =
              px === 3 ? palette.claws :
              px === 4 ? palette.detail :
              palette.body;

            const [r, g, b] = hexToRgb(hex);
            const alpha = px === 4 ? 0.95 : 0.85;
            const { duration, delay } = cellAnims[y][x];
            const modeCellAnimation =
              activeMode === 'critical'
                ? `css-cell-critical 0.35s steps(2, end) ${delay}s infinite`
                : activeMode === 'sleeping'
                  ? `css-cell-sleep 3.6s ease-in-out ${delay}s infinite`
                  : activeMode === 'low_compute'
                    ? `css-cell-lowcompute 2.8s ease-in-out ${delay}s infinite`
                    : undefined;

            return (
              <div
                key={`${y}-${x}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: br,
                  background: `rgba(${r},${g},${b},${alpha})`,
                  animation: modeCellAnimation
                    ? `cell-pulse ${duration}s ease-in-out ${delay}s infinite, ${modeCellAnimation}`
                    : `cell-pulse ${duration}s ease-in-out ${delay}s infinite`,
                }}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}
