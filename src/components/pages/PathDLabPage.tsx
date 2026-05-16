import { Link } from 'react-router-dom';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { FROZEN_ATLAS_VARIANTS, FROZEN_ATLAS_VARIANT_COUNT } from '@/lib/loopling-generator';
import { PATH_D_CANDIDATES, PATH_D_FRAME_MATH, PATH_D_SOURCE_SHEET, type PathDCandidate } from '@/lib/path-d-casting';

const PATH_D_STATES = [
  { id: 'idle', label: 'Idle', row: 0, frameCount: 8, fps: 5 },
  { id: 'thinking', label: 'Thinking', row: 1, frameCount: 8, fps: 5 },
  { id: 'acting', label: 'Acting', row: 2, frameCount: 8, fps: 8 },
  { id: 'trading', label: 'Trading', row: 3, frameCount: 8, fps: 9 },
  { id: 'trade_win', label: 'Trade Win', row: 4, frameCount: 8, fps: 8 },
  { id: 'trade_loss', label: 'Trade Loss', row: 5, frameCount: 8, fps: 5 },
  { id: 'posting', label: 'Posting', row: 6, frameCount: 8, fps: 6 },
  { id: 'receiving', label: 'Receiving', row: 7, frameCount: 8, fps: 6 },
  { id: 'sleeping', label: 'Sleeping', row: 8, frameCount: 8, fps: 2 },
  { id: 'low_compute', label: 'Low Compute', row: 9, frameCount: 8, fps: 3 },
  { id: 'critical', label: 'Critical', row: 10, frameCount: 8, fps: 8 },
  { id: 'dead', label: 'Dead', row: 11, frameCount: 8, fps: 0 },
] as const;

type PathDStateId = (typeof PATH_D_STATES)[number]['id'];

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function PathDAtlasSprite({
  atlasUrl,
  stateId,
  size,
}: {
  atlasUrl: string;
  stateId: PathDStateId;
  size: number;
}) {
  const state = PATH_D_STATES.find((item) => item.id === stateId) ?? PATH_D_STATES[0];
  const [frame, setFrame] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cellWidth = 192;
  const cellHeight = 208;

  useEffect(() => {
    setFrame(0);
  }, [stateId]);

  useEffect(() => {
    if (state.fps <= 0 || state.frameCount <= 1) return;
    const interval = window.setInterval(() => {
      setFrame((current) => (current + 1) % state.frameCount);
    }, 1000 / state.fps);
    return () => window.clearInterval(interval);
  }, [state.fps, state.frameCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) return undefined;

    let cancelled = false;
    const image = new Image();

    image.onload = () => {
      if (cancelled) return;
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, cellWidth, cellHeight);
      context.drawImage(
        image,
        frame * cellWidth,
        state.row * cellHeight,
        cellWidth,
        cellHeight,
        0,
        0,
        cellWidth,
        cellHeight,
      );
    };
    image.src = atlasUrl;

    return () => {
      cancelled = true;
    };
  }, [atlasUrl, frame, state.row]);

  return (
    <canvas
      ref={canvasRef}
      width={cellWidth}
      height={cellHeight}
      style={{
        width: size,
        height: Math.round(size * (cellHeight / cellWidth)),
        imageRendering: 'pixelated',
      }}
    />
  );
}

function CandidateCard({ candidate }: { candidate: PathDCandidate }) {
  return (
    <article style={styles.card}>
      <img src={candidate.candidateUrl} alt={`${candidate.label} Path D candidate`} style={styles.candidateImage} />
      <div style={styles.cardBody}>
        <span style={styles.serial}>{candidate.id.toUpperCase()}</span>
        <strong style={styles.cardTitle}>{candidate.label}</strong>
        <em style={candidate.status === 'atlas-approved' ? styles.cardStatus : styles.pendingStatus}>
          {candidate.status === 'atlas-approved' ? '12-state atlas approved' : 'casting approved'}
        </em>
      </div>
      <div style={styles.traitList}>
        <span>{candidate.traits.bodyPalette}</span>
        <span>{candidate.traits.eyeStyle}</span>
        <span>{candidate.traits.antennaLoop}</span>
        <span>{candidate.traits.foreheadGlyph}</span>
      </div>
    </article>
  );
}

function AnimatedAtlasCard({ candidate }: { candidate: PathDCandidate }) {
  const [stateId, setStateId] = useState<PathDStateId>('idle');
  const atlasUrl = candidate.atlasUrl;

  if (!atlasUrl) return null;

  return (
    <article style={styles.animatedCard}>
      <div style={styles.animatedPreview}>
        <PathDAtlasSprite atlasUrl={atlasUrl} stateId={stateId} size={220} />
      </div>
      <div style={styles.animatedInfo}>
        <span style={styles.serial}>{candidate.id.toUpperCase()} / {candidate.intendedAtlasId}</span>
        <strong style={styles.animatedTitle}>{candidate.label}</strong>
        <em style={styles.cardStatus}>monolithic AI atlas / no overlays</em>
        <div style={styles.stateButtons}>
          {PATH_D_STATES.map((state) => (
            <button
              key={state.id}
              type="button"
              onClick={() => setStateId(state.id)}
              style={stateId === state.id ? styles.stateButtonActive : styles.stateButton}
            >
              {state.label}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

function ExistingAtlasCard({ id, label, index }: { id: string; label: string; index: number }) {
  return (
    <article style={styles.atlasCard}>
      <img src={`/pets/${id}/state-atlas.png`} alt={`${label} full atlas`} style={styles.atlasThumb} />
      <div>
        <span style={styles.serial}>A{String(index + 1).padStart(3, '0')}</span>
        <strong style={styles.cardTitle}>{label}</strong>
        <em style={styles.cardStatus}>12-state atlas approved</em>
      </div>
    </article>
  );
}

export default function PathDLabPage() {
  const maxEditionAt22k = Math.ceil(22000 / Math.max(1, PATH_D_CANDIDATES.length));
  const combinedLooks = PATH_D_CANDIDATES.length + FROZEN_ATLAS_VARIANT_COUNT;
  const pathDAtlases = PATH_D_CANDIDATES.filter((candidate) => candidate.status === 'atlas-approved');
  const remainingCandidates = PATH_D_CANDIDATES.length - pathDAtlases.length;

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.header}>
          <div>
            <p style={styles.kicker}>Looplings Path D</p>
            <h1 style={styles.title}>Character-first generation lab</h1>
            <p style={styles.subtitle}>
              Batch 001 treats the AI-generated casting sheet as the source of character identity. Each approved body becomes its own monolithic 12-state atlas later; no runtime trait overlays, no CSS body swaps, no sliced NFT pieces.
            </p>
          </div>
          <div style={styles.headerStats}>
            <span>{PATH_D_CANDIDATES.length} casting-approved bodies</span>
            <span>{pathDAtlases.length} Path D animated atlas</span>
            <span>{formatNumber(PATH_D_FRAME_MATH.totalStateRows)} target animation rows</span>
            <span>{formatNumber(PATH_D_FRAME_MATH.totalFrames)} target frames</span>
            <span>{formatNumber(maxEditionAt22k)} max editions at 22k if Path D only</span>
            <span>{combinedLooks} looks including current Path C pool</span>
          </div>
        </header>

        <nav style={styles.nav}>
          <Link to="/lab/generator" style={styles.navLink}>Path C generator</Link>
          <a href="/nft-gen-lab/path-d/casting-sheet-batch-001.png" style={styles.navLink}>Open source sheet</a>
          <a href="/nft-gen-lab/state-contact-sheets/manifest.json" style={styles.navLink}>Current atlas sheets</a>
        </nav>

        <section style={styles.panel}>
          <div style={styles.panelTopline}>
            <span>Batch 001 casting sheet</span>
            <strong>one pose per future character</strong>
          </div>
          <img src={PATH_D_SOURCE_SHEET} alt="Path D Batch 001 L01 casting sheet" style={styles.sourceSheet} />
        </section>

        <section style={styles.panel}>
          <div style={styles.panelTopline}>
            <span>Path D animated atlas graduates</span>
            <strong>{pathDAtlases.length} complete / {remainingCandidates} still casting-only</strong>
          </div>
          <div style={styles.note}>
            A Path D candidate only appears here after it exists as one packed 12-row PNG atlas. The browser is only blitting frames from that atlas; it is not drawing eyes, rings, glyphs, or antenna pieces.
          </div>
          <div style={styles.animatedGrid}>
            {pathDAtlases.map((candidate) => (
              <AnimatedAtlasCard key={candidate.id} candidate={candidate} />
            ))}
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelTopline}>
            <span>Path D candidate queue</span>
            <strong>{PATH_D_CANDIDATES.length} bodies awaiting 12-state atlases</strong>
          </div>
          <div style={styles.note}>
            These are approved visual identities, not final NFTs yet. A candidate graduates only after its generated atlas passes component cleanup, clipping checks, recycled-row detection, motion QA, and build verification.
          </div>
          <div style={styles.candidateGrid}>
            {PATH_D_CANDIDATES.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelTopline}>
            <span>Already approved full atlas pool</span>
            <strong>{FROZEN_ATLAS_VARIANT_COUNT} monolithic atlases</strong>
          </div>
          <div style={styles.atlasGrid}>
            {FROZEN_ATLAS_VARIANTS.map((variant, index) => (
              <ExistingAtlasCard key={variant.id} id={variant.id} label={variant.label} index={index} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#080b0d',
    color: '#f4efe6',
    fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    padding: 28,
  },
  shell: {
    maxWidth: 1440,
    margin: '0 auto',
    display: 'grid',
    gap: 18,
  },
  header: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 24,
    alignItems: 'end',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    paddingBottom: 20,
  },
  kicker: {
    margin: 0,
    color: '#78d7ff',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
  },
  title: {
    margin: '8px 0 0',
    fontSize: 44,
    lineHeight: 1.05,
    letterSpacing: 0,
  },
  subtitle: {
    maxWidth: 840,
    margin: '12px 0 0',
    color: 'rgba(244,239,230,0.68)',
    lineHeight: 1.6,
  },
  headerStats: {
    display: 'grid',
    gap: 8,
    justifyItems: 'end',
    color: 'rgba(244,239,230,0.68)',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  nav: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  navLink: {
    border: '1px solid rgba(120,215,255,0.24)',
    background: '#111820',
    color: '#ccefff',
    borderRadius: 8,
    padding: '10px 12px',
    textDecoration: 'none',
    fontSize: 12,
  },
  panel: {
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#0d1216',
    borderRadius: 8,
    padding: 20,
    display: 'grid',
    gap: 16,
  },
  panelTopline: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'center',
    color: 'rgba(244,239,230,0.62)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontSize: 12,
  },
  note: {
    border: '1px solid rgba(255,207,121,0.2)',
    background: '#15130f',
    color: 'rgba(244,239,230,0.72)',
    borderRadius: 8,
    padding: '12px 14px',
    lineHeight: 1.55,
    fontSize: 12,
  },
  sourceSheet: {
    width: '100%',
    maxHeight: 920,
    objectFit: 'contain',
    imageRendering: 'pixelated',
    borderRadius: 8,
    background: '#05080a',
  },
  candidateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 14,
  },
  animatedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(520px, 1fr))',
    gap: 14,
  },
  animatedCard: {
    border: '1px solid rgba(120,215,255,0.2)',
    background: '#10161a',
    borderRadius: 8,
    overflow: 'hidden',
    display: 'grid',
    gridTemplateColumns: 'minmax(240px, 0.85fr) minmax(260px, 1fr)',
    minHeight: 330,
  },
  animatedPreview: {
    display: 'grid',
    placeItems: 'center',
    background: '#081013',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    minHeight: 330,
  },
  animatedInfo: {
    display: 'grid',
    alignContent: 'start',
    gap: 10,
    padding: 18,
  },
  animatedTitle: {
    fontSize: 28,
    lineHeight: 1.1,
  },
  stateButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginTop: 8,
  },
  stateButton: {
    border: '1px solid rgba(255,255,255,0.14)',
    background: '#0c1014',
    color: 'rgba(244,239,230,0.74)',
    borderRadius: 8,
    padding: '9px 8px',
    font: 'inherit',
    fontSize: 11,
    cursor: 'pointer',
  },
  stateButtonActive: {
    border: '1px solid rgba(120,215,255,0.78)',
    background: '#18313c',
    color: '#e8fbff',
    borderRadius: 8,
    padding: '9px 8px',
    font: 'inherit',
    fontSize: 11,
    cursor: 'pointer',
  },
  card: {
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#10161a',
    borderRadius: 8,
    overflow: 'hidden',
    display: 'grid',
  },
  candidateImage: {
    width: '100%',
    aspectRatio: '1 / 1',
    objectFit: 'cover',
    imageRendering: 'pixelated',
    background: '#05080a',
  },
  cardBody: {
    display: 'grid',
    gap: 4,
    padding: '12px 12px 4px',
  },
  serial: {
    color: 'rgba(244,239,230,0.48)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 14,
    lineHeight: 1.3,
  },
  cardStatus: {
    color: '#8cffae',
    fontSize: 11,
    fontStyle: 'normal',
    textTransform: 'uppercase',
  },
  pendingStatus: {
    color: '#ffd780',
    fontSize: 11,
    fontStyle: 'normal',
    textTransform: 'uppercase',
  },
  traitList: {
    display: 'grid',
    gap: 5,
    padding: 12,
    color: 'rgba(244,239,230,0.58)',
    fontSize: 11,
    lineHeight: 1.35,
  },
  atlasGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 14,
  },
  atlasCard: {
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#10161a',
    borderRadius: 8,
    padding: 12,
    display: 'grid',
    gap: 10,
  },
  atlasThumb: {
    width: '100%',
    aspectRatio: '1 / 1',
    objectFit: 'cover',
    objectPosition: '0 0',
    imageRendering: 'pixelated',
    background: '#05080a',
    borderRadius: 6,
  },
} satisfies Record<string, CSSProperties>;
