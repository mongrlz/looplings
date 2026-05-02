
import { useMemo, useState, useEffect } from 'react';
import { minidenticon } from 'minidenticons';
import { type SurvivalTier } from '@/lib/sprite-generator';

interface Props {
  address: string;
  tier?: SurvivalTier;
  size?: number;
}

// Full cycle = 2× step duration (half up, half down — hard snap at 50%)
const CYCLE_MS: Record<SurvivalTier, number | null> = {
  normal:      800,
  low_compute: 1200,
  critical:    160,
  dead:        null,
};

export default function LooplingSprite({ address, tier = 'normal', size = 128 }: Props) {
  const { svgURI, blinkColor } = useMemo(() => {
    const svg = minidenticon(address.toLowerCase(), 95, 45);
    const uri = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);

    const m = svg.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/i);
    let blink = '#333';
    if (m) {
      const h = parseFloat(m[1]);
      const s = parseFloat(m[2]);
      const l = parseFloat(m[3]);
      blink = `hsl(${h}, ${s}%, ${Math.max(5, l - 25)}%)`;
    }

    return { svgURI: uri, blinkColor: blink };
  }, [address]);

  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    if (tier === 'dead') return;

    let timeout: ReturnType<typeof setTimeout>;

    function scheduleBlink() {
      const minWait = tier === 'critical' ? 400 : 1000;
      const maxWait = tier === 'critical' ? 2000 : 6000;
      const waitMs = minWait + Math.random() * (maxWait - minWait);

      timeout = setTimeout(() => {
        setIsBlinking(true);
        timeout = setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 90);
      }, waitMs);
    }

    const initialDelay = Math.random() * 2500;
    timeout = setTimeout(scheduleBlink, initialDelay);
    return () => clearTimeout(timeout);
  }, [tier]);

  const cycleMs = CYCLE_MS[tier];
  const wrapperAnimation = cycleMs != null
    ? `loopling-invader ${cycleMs}ms linear infinite`
    : undefined;

  let filter: string | undefined;
  let opacity = 1;

  switch (tier) {
    case 'low_compute':
      filter = 'saturate(0.55) brightness(0.82)';
      break;
    case 'critical':
      filter = 'saturate(1.8) hue-rotate(-18deg) brightness(0.78)';
      break;
    case 'dead':
      filter = 'grayscale(1) brightness(0.45)';
      opacity = 0.5;
      break;
  }

  const cell = size / 5;
  const eyeSize = cell * 0.55;
  const eyePad = (cell - eyeSize) / 2;
  const eyeY = cell * 1 + eyePad;
  const leftEyeX = cell * 1 + eyePad;
  const rightEyeX = cell * 3 + eyePad;

  const eyeFill =
    tier === 'dead' ? '#555' :
    isBlinking ? blinkColor :
    '#111';

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          animation: wrapperAnimation,
          filter,
          opacity,
        }}
      >
        <img
          src={svgURI}
          alt={`Loopling ${address.slice(0, 8)}`}
          width={size}
          height={size}
          style={{ imageRendering: 'pixelated', display: 'block' }}
        />

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          <rect x={leftEyeX} y={eyeY} width={eyeSize} height={eyeSize} fill={eyeFill} />
          <rect x={rightEyeX} y={eyeY} width={eyeSize} height={eyeSize} fill={eyeFill} />
        </svg>
      </div>

      {tier === 'critical' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.07) 2px, rgba(255,0,0,0.07) 4px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {tier === 'dead' && (
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ position: 'absolute', inset: 0, opacity: 0.3 }}
        >
          <line x1={size * 0.2} y1={size * 0.2} x2={size * 0.8} y2={size * 0.8} stroke="#666" strokeWidth="3" />
          <line x1={size * 0.8} y1={size * 0.2} x2={size * 0.2} y2={size * 0.8} stroke="#666" strokeWidth="3" />
        </svg>
      )}
    </div>
  );
}
