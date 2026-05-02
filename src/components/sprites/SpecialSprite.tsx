import { useEffect, useMemo, useState } from 'react';
import { applyTierToPalette, type SurvivalTier } from '@/lib/sprite-generator';

export type SpecialPixel = 0 | 1 | 2 | 3 | 4;
// 0=empty, 1=body, 2=eyes, 3=claws, 4=detail

export interface SpecialPalette {
  body: string;
  eyes: string;
  claws: string;
  detail: string;
}

interface Props {
  frames: SpecialPixel[][][];
  palette: SpecialPalette;
  tier?: SurvivalTier;
  tierFrames?: Partial<Record<SurvivalTier, SpecialPixel[][][]>>;
  memberName?: string;
  cellSize?: number;
  gap?: number;
  /** If true, sprite body does not float up/down. */
  rigid?: boolean;
  /** If true, sprite body does not frame-animate. */
  noFrameAnim?: boolean;
}

const FRAME_SPEEDS: Record<SurvivalTier, number> = {
  normal: 520,
  low_compute: 820,
  critical: 140,
  dead: 0,
};

const FLOAT_DURATIONS: Record<SurvivalTier, string> = {
  normal: '3.2s',
  low_compute: '4.8s',
  critical: '0.5s',
  dead: '0s',
};

function getFloatLift(memberName?: string): number {
  switch (memberName) {
    case 'prime':
      return 4;
    default:
      return 8;
  }
}

export default function SpecialSprite({
  frames,
  palette,
  tier = 'normal',
  tierFrames,
  memberName,
  cellSize = 12,
  gap = 2,
  rigid = false,
  noFrameAnim = false,
}: Props) {
  const activeFrames = tierFrames?.[tier] ?? frames;
  const rows = activeFrames[0]?.length ?? 0;
  const cols = activeFrames[0]?.[0]?.length ?? 0;

  const shiftedPalette = useMemo(() => applyTierToPalette(palette, tier), [palette, tier]);

  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (tier === 'dead' || noFrameAnim || activeFrames.length < 2) return;
    const speed = FRAME_SPEEDS[tier];
    const interval = setInterval(() => {
      setFrameIndex((i) => (i + 1) % activeFrames.length);
    }, speed);
    return () => clearInterval(interval);
  }, [activeFrames, tier, noFrameAnim]);

  const currentGrid = activeFrames[frameIndex] ?? activeFrames[0];

  const eyeIndices = useMemo(() => {
    const indices: number[] = [];
    activeFrames[0]?.forEach((row, y) => {
      row.forEach((pixel, x) => {
        if (pixel === 2) indices.push(y * cols + x);
      });
    });
    return indices;
  }, [activeFrames, cols]);

  const eyeIndicesKey = eyeIndices.join(',');

  const [syncBlinking, setSyncBlinking] = useState(false);

  useEffect(() => {
    if (tier === 'dead') {
      const reset = setTimeout(() => setSyncBlinking(false), 0);
      return () => clearTimeout(reset);
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    const scheduleBlink = () => {
      const waitMs = 2500 + Math.random() * 3500;
      const t = setTimeout(() => {
        setSyncBlinking(true);
        const t2 = setTimeout(() => {
          setSyncBlinking(false);
          scheduleBlink();
        }, 130);
        timers.push(t2);
      }, waitMs);
      timers.push(t);
    };
    scheduleBlink();

    return () => timers.forEach(clearTimeout);
  }, [tier, eyeIndicesKey]);

  const getColor = (pixel: SpecialPixel): string => {
    if (pixel === 2 && syncBlinking) {
      return shiftedPalette.body;
    }
    switch (pixel) {
      case 1:
        return shiftedPalette.body;
      case 2:
        return shiftedPalette.eyes;
      case 3:
        return shiftedPalette.claws;
      case 4:
        return shiftedPalette.detail;
      default:
        return 'transparent';
    }
  };

  const floatAnimation = rigid || tier === 'dead'
    ? undefined
    : `specialFloat ${FLOAT_DURATIONS[tier]} ease-in-out infinite`;
  const floatLift = getFloatLift(memberName);

  if (!currentGrid) return null;

  return (
    <>
      <style>{`
        @keyframes specialFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(calc(var(--float-lift, 3) * -1px)); }
        }
      `}</style>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          gap: `${gap}px`,
          animation: floatAnimation,
          ['--float-lift' as string]: floatLift,
        }}
      >
        {currentGrid.flat().map((pixel, i) => (
          <div
            key={i}
            style={{
              width: cellSize,
              height: cellSize,
              background: getColor(pixel),
              borderRadius: 2,
              transition: 'background 80ms ease',
            }}
          />
        ))}
      </div>
    </>
  );
}
