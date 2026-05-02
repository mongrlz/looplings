import CellGrid from './CellGrid';
import { getTierColor, getTierLabel, type SpriteIdentity, type SurvivalTier } from '@/lib/sprite-generator';

interface Props {
  name: string;
  address: string;
  spriteIdentity?: SpriteIdentity;
  tier: SurvivalTier;
  credits: number;
  usdc: number;
  turn: number;
  uptime: string;
}

export default function LooplingCard({
  name,
  address,
  spriteIdentity,
  tier,
  credits,
  usdc,
  turn,
  uptime,
}: Props) {
  const tierColor = getTierColor(tier);
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const creditPercent = Math.min(100, (credits / 5) * 100);

  const statusText = tier === 'dead' ? 'DEAD' : tier === 'critical' ? 'CRITICAL' : 'ALIVE';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {/* CSS sprite display */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            background: 'rgba(245, 240, 232, 0.6)',
            borderRadius: 8,
            padding: 32,
            display: 'flex',
            justifyContent: 'center',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <CellGrid
            address={address}
            tier={tier}
            spriteIdentity={spriteIdentity}
            cellSize={12}
            gap={2}
            perspective={false}
          />
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: 'var(--ink-light)',
            marginTop: 12,
          }}
        >
          {name}
        </div>
      </div>

      {/* Status terminal card — matches web4.ai */}
      <div
        style={{
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'rgba(245, 240, 232, 0.8)',
          backdropFilter: 'blur(4px)',
          padding: 16,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          lineHeight: 1.8,
          width: '100%',
          maxWidth: 288,
        }}
      >
        <div style={{ color: 'var(--ink-muted)', marginBottom: 8 }}>$ status</div>
        <div style={{ color: 'var(--ink-light)' }}>
          <div>name: <span style={{ color: 'var(--ink)' }}>{name.toLowerCase()}</span></div>
          <div>wallet: <span style={{ color: 'var(--accent)' }}>{shortAddr}</span></div>
          <div>balance: <span style={{ color: 'var(--accent)' }}>${credits.toFixed(2)} USDC</span></div>
          <div>tier: <span style={{ color: tierColor, fontWeight: 500 }}>{getTierLabel(tier)}</span></div>
          <div>turn: <span style={{ color: 'var(--ink)' }}>#{turn}</span></div>
          <div>uptime: <span style={{ color: 'var(--ink)' }}>{uptime}</span></div>
          <div>
            status:{' '}
            <span style={{ color: 'var(--accent)' }}>{statusText}</span>
            {tier !== 'dead' && (
              <span
                style={{
                  display: 'inline-block',
                  color: 'var(--accent)',
                  marginLeft: 4,
                  animation: 'cell-pulse 2s ease-in-out infinite',
                }}
              >
                *
              </span>
            )}
          </div>
        </div>

        {/* Credit bar */}
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
            <span style={{ color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 2, fontSize: 9 }}>Credits</span>
            <span style={{ color: tierColor }}>${credits.toFixed(2)}</span>
          </div>
          <div style={{ background: 'var(--border)', borderRadius: 3, height: 4, overflow: 'hidden' }}>
            <div
              style={{
                width: `${creditPercent}%`,
                height: '100%',
                background: tierColor,
                borderRadius: 3,
                transition: 'width 0.5s',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
