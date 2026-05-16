import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

interface SpriteIndex {
  schemaVersion: string;
  generatedAt: string;
  stats: {
    totalEntries: number;
    uniquePetFolders: number;
    stateAtlases: number;
    spritesheetOnly: number;
    pathDCandidates: number;
    pathDGraduates: number;
    rejectedAtlasExperiments: number;
    generatorApproved: number;
    technicallyValidAtlases: number;
    rejectedPublicPetAtlases: number;
  };
  entries: SpriteEntry[];
}

interface SpriteEntry {
  id: string;
  label: string;
  kind: 'state-atlas' | 'codex-spritesheet' | 'path-d-candidate' | 'rejected-atlas';
  family: string;
  status: string;
  source: string;
  atlasUrl?: string;
  spritesheetUrl?: string;
  candidateUrl?: string;
  metadataUrl?: string;
  petJsonUrl?: string;
  candidateId?: string;
  intendedAtlasId?: string;
  audit?: {
    status: string;
    detachedFrameCount: number;
    size: string;
  };
  traits?: Record<string, string>;
  rows?: SpriteState[];
}

interface SpriteState {
  id: string;
  label: string;
  row: number;
  frameCount: number;
  fps: number;
}

const INDEX_URL = '/nft-gen-lab/generated-sprite-index.json';
const CELL_WIDTH = 192;
const CELL_HEIGHT = 208;
const ATLAS_COLUMNS = 8;
const ATLAS_ROWS = 12;

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function uniqueValues(entries: SpriteEntry[], key: 'kind' | 'family' | 'status') {
  return ['all', ...Array.from(new Set(entries.map((entry) => entry[key]))).sort()];
}

function statusLabel(value: string) {
  return value.replace(/-/g, ' ');
}

function firstAssetUrl(entry: SpriteEntry) {
  return entry.candidateUrl ?? entry.atlasUrl ?? entry.spritesheetUrl ?? '';
}

function hasAnimationStates(entry: SpriteEntry) {
  return Boolean(entry.atlasUrl && entry.rows && entry.rows.length > 0);
}

function isReviewableAnimatedSprite(entry: SpriteEntry) {
  return hasAnimationStates(entry)
    && entry.family !== 'Palette bake'
    && !entry.status.includes('rejected')
    && entry.audit?.status !== 'rejected';
}

function SpriteAtlasCanvas({
  entry,
  state,
  size,
}: {
  entry: SpriteEntry;
  state: SpriteState;
  size: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [frame, setFrame] = useState(0);
  const atlasUrl = entry.atlasUrl;

  useEffect(() => {
    setFrame(0);
  }, [entry.id, state.id]);

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

    if (!canvas || !context || !atlasUrl) return undefined;

    let cancelled = false;
    const image = new Image();

    image.onload = () => {
      if (cancelled) return;
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, CELL_WIDTH, CELL_HEIGHT);
      context.drawImage(
        image,
        frame * CELL_WIDTH,
        state.row * CELL_HEIGHT,
        CELL_WIDTH,
        CELL_HEIGHT,
        0,
        0,
        CELL_WIDTH,
        CELL_HEIGHT,
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
      width={CELL_WIDTH}
      height={CELL_HEIGHT}
      style={{
        width: size,
        height: Math.round(size * (CELL_HEIGHT / CELL_WIDTH)),
        imageRendering: 'pixelated',
      }}
    />
  );
}

function AtlasThumb({ entry }: { entry: SpriteEntry }) {
  if (entry.atlasUrl) {
    return (
      <div
        style={{
          ...styles.atlasThumb,
          backgroundImage: `url(${entry.atlasUrl})`,
          backgroundSize: `${ATLAS_COLUMNS * 100}% ${ATLAS_ROWS * 100}%`,
          backgroundPosition: '0 0',
        }}
      />
    );
  }

  const url = firstAssetUrl(entry);
  return url ? <img src={url} alt="" style={styles.imageThumb} /> : <div style={styles.emptyThumb} />;
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.statBlock}>
      <strong>{formatNumber(value)}</strong>
      <span>{label}</span>
    </div>
  );
}

function SelectControl({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label style={styles.control}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={styles.select}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option === 'all' ? 'All' : statusLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function SpriteSelect({
  entries,
  value,
  onChange,
}: {
  entries: SpriteEntry[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={styles.control}>
      <span>Sprite</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={styles.select}>
        {entries.map((entry) => (
          <option key={`${entry.kind}-${entry.id}`} value={entry.id}>
            {entry.label} / {entry.id}
          </option>
        ))}
      </select>
    </label>
  );
}

function EntryCard({
  entry,
  active,
  onSelect,
}: {
  entry: SpriteEntry;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} style={active ? styles.cardActive : styles.card}>
      <AtlasThumb entry={entry} />
      <span style={styles.cardMeta}>{entry.kind} / {entry.status}</span>
      <strong style={styles.cardTitle}>{entry.label}</strong>
      <span style={styles.cardSub}>{entry.id}</span>
    </button>
  );
}

export default function GeneratedSpriteArchivePage() {
  const [index, setIndex] = useState<SpriteIndex | null>(null);
  const [kind, setKind] = useState('all');
  const [family, setFamily] = useState('all');
  const [status, setStatus] = useState('all');
  const [selectedId, setSelectedId] = useState('');
  const [stateId, setStateId] = useState('idle');

  useEffect(() => {
    let cancelled = false;
    fetch(INDEX_URL)
      .then((response) => response.json())
      .then((nextIndex: SpriteIndex) => {
        if (cancelled) return;
        const animatedEntries = nextIndex.entries.filter(isReviewableAnimatedSprite);
        setIndex(nextIndex);
        setSelectedId(animatedEntries.find((entry) => entry.id === 'path-d-receipt-keeper')?.id ?? animatedEntries[0]?.id ?? '');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const entries = index?.entries ?? [];
  const animatedEntries = useMemo(() => entries.filter(isReviewableAnimatedSprite), [entries]);
  const filtered = useMemo(() => animatedEntries.filter((entry) => (
    (kind === 'all' || entry.kind === kind)
    && (family === 'all' || entry.family === family)
    && (status === 'all' || entry.status === status)
  )), [animatedEntries, family, kind, status]);
  const selected = animatedEntries.find((entry) => entry.id === selectedId) ?? filtered[0] ?? animatedEntries[0];
  const selectedRows = selected?.rows ?? [];
  const selectedState = selectedRows.find((row) => row.id === stateId) ?? selectedRows[0];

  useEffect(() => {
    if (!selectedState && stateId !== 'idle') setStateId('idle');
  }, [selectedState, stateId]);

  if (!index) {
    return (
      <main style={styles.page}>
        <section style={styles.shell}>
          <div style={styles.loading}>Loading generated sprite index...</div>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.header}>
          <div>
            <p style={styles.kicker}>Looplings Sprite Archive</p>
            <h1 style={styles.title}>Every generated sprite in the lab</h1>
            <p style={styles.subtitle}>
              One place for generated sprites that have real animation states. Static casting stills, palette bakes, and rejected atlases are hidden here.
            </p>
          </div>
          <div style={styles.headerActions}>
            <Link to="/lab/sprites" style={styles.navLink}>Sprite QA bench</Link>
            <Link to="/lab/path-d" style={styles.navLink}>Path D lab</Link>
            <Link to="/lab/generator" style={styles.navLink}>Generator lab</Link>
          </div>
        </header>

        <section style={styles.statsGrid}>
          <StatBlock label="animated sprites" value={animatedEntries.length} />
          <StatBlock label="technically valid" value={animatedEntries.filter((entry) => entry.audit?.status === 'approved').length} />
          <StatBlock label="generator approved" value={animatedEntries.filter((entry) => entry.status === 'generator-approved').length} />
          <StatBlock label="Path D graduates" value={animatedEntries.filter((entry) => entry.family.includes('Path D')).length} />
          <StatBlock label="motion review" value={animatedEntries.filter((entry) => entry.status === 'motion-review').length} />
          <StatBlock label="recycled review" value={animatedEntries.filter((entry) => entry.status === 'quarantined-recycled').length} />
        </section>

        <section style={styles.controls}>
          <SpriteSelect entries={animatedEntries} value={selected?.id ?? ''} onChange={setSelectedId} />
          <SelectControl label="Kind" value={kind} onChange={setKind} options={uniqueValues(animatedEntries, 'kind')} />
          <SelectControl label="Family" value={family} onChange={setFamily} options={uniqueValues(animatedEntries, 'family')} />
          <SelectControl label="Status" value={status} onChange={setStatus} options={uniqueValues(animatedEntries, 'status')} />
        </section>

        {selected && (
          <section style={styles.detail}>
            <div style={styles.previewPane}>
              <div style={styles.previewSurface}>
                {selected.atlasUrl && selectedState ? (
                  <SpriteAtlasCanvas entry={selected} state={selectedState} size={292} />
                ) : (
                  <img src={firstAssetUrl(selected)} alt="" style={styles.largeImage} />
                )}
              </div>
              {selectedRows.length > 0 && (
                <div style={styles.stateButtons}>
                  {selectedRows.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => setStateId(row.id)}
                      style={row.id === selectedState?.id ? styles.stateButtonActive : styles.stateButton}
                    >
                      {row.id.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.detailInfo}>
              <span style={styles.serial}>{selected.kind} / {selected.family}</span>
              <h2 style={styles.detailTitle}>{selected.label}</h2>
              <div style={styles.badges}>
                <span>{selected.status}</span>
                <span>{selected.source}</span>
                {selected.audit && <span>{selected.audit.detachedFrameCount} detached frames</span>}
              </div>
              <div style={styles.detailGrid}>
                <span>ID</span><strong>{selected.id}</strong>
                <span>Atlas</span><strong>{selected.atlasUrl ?? 'none'}</strong>
                <span>Candidate</span><strong>{selected.candidateId ?? selected.intendedAtlasId ?? 'none'}</strong>
                <span>Metadata</span><strong>{selected.metadataUrl ?? selected.petJsonUrl ?? 'none'}</strong>
              </div>
              {selected.traits && (
                <div style={styles.traitGrid}>
                  {Object.entries(selected.traits).map(([trait, value]) => (
                    <div key={trait} style={styles.traitItem}>
                      <span style={styles.traitLabel}>{trait}</span>
                      <strong style={styles.traitValue}>{value}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <section style={styles.gridSection}>
          <div style={styles.panelTopline}>
            <span>{formatNumber(filtered.length)} visible animated sprites</span>
            <strong>{formatNumber(animatedEntries.length)} animated total / {formatNumber(index.stats.totalEntries)} indexed total</strong>
          </div>
          <div style={styles.gallery}>
            {filtered.map((entry) => (
              <EntryCard
                key={`${entry.kind}-${entry.id}`}
                entry={entry}
                active={entry.id === selected?.id && entry.kind === selected.kind}
                onSelect={() => setSelectedId(entry.id)}
              />
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
    background: '#090d10',
    color: '#f4efe6',
    fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    padding: 28,
  },
  shell: {
    maxWidth: 1500,
    margin: '0 auto',
    display: 'grid',
    gap: 18,
  },
  header: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: 24,
    alignItems: 'end',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    paddingBottom: 20,
  },
  kicker: {
    margin: 0,
    color: '#7bd7ed',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
  },
  title: {
    margin: '8px 0 0',
    fontSize: 42,
    lineHeight: 1.05,
    letterSpacing: 0,
  },
  subtitle: {
    maxWidth: 780,
    margin: '12px 0 0',
    color: 'rgba(244,239,230,0.66)',
    lineHeight: 1.55,
  },
  headerActions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'end',
    gap: 10,
  },
  navLink: {
    border: '1px solid rgba(123,215,237,0.24)',
    background: '#10171b',
    color: '#d3f6ff',
    borderRadius: 8,
    padding: '10px 12px',
    textDecoration: 'none',
    fontSize: 12,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
    gap: 10,
  },
  statBlock: {
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#0f1518',
    borderRadius: 8,
    padding: 14,
    display: 'grid',
    gap: 6,
  },
  controls: {
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#0e1418',
    borderRadius: 8,
    padding: 14,
    display: 'grid',
    gridTemplateColumns: '2fr repeat(3, 1fr)',
    gap: 12,
  },
  control: {
    display: 'grid',
    gap: 7,
    color: 'rgba(244,239,230,0.62)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 11,
  },
  select: {
    width: '100%',
    minWidth: 0,
    border: '1px solid rgba(255,255,255,0.16)',
    background: '#090d10',
    color: '#f4efe6',
    borderRadius: 8,
    padding: '11px 12px',
    font: 'inherit',
    fontSize: 12,
  },
  detail: {
    display: 'grid',
    gridTemplateColumns: 'minmax(360px, 0.9fr) minmax(0, 1.1fr)',
    gap: 14,
  },
  previewPane: {
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#10161a',
    borderRadius: 8,
    padding: 16,
    display: 'grid',
    gap: 14,
  },
  previewSurface: {
    minHeight: 370,
    display: 'grid',
    placeItems: 'center',
    background: '#070b0e',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  largeImage: {
    maxWidth: '86%',
    maxHeight: 340,
    objectFit: 'contain',
    imageRendering: 'pixelated',
  },
  stateButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },
  stateButton: {
    border: '1px solid rgba(255,255,255,0.14)',
    background: '#0b1013',
    color: 'rgba(244,239,230,0.72)',
    borderRadius: 8,
    padding: '9px 8px',
    font: 'inherit',
    fontSize: 11,
    cursor: 'pointer',
    textTransform: 'capitalize',
  },
  stateButtonActive: {
    border: '1px solid rgba(123,215,237,0.72)',
    background: '#18303a',
    color: '#effcff',
    borderRadius: 8,
    padding: '9px 8px',
    font: 'inherit',
    fontSize: 11,
    cursor: 'pointer',
    textTransform: 'capitalize',
  },
  detailInfo: {
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#10161a',
    borderRadius: 8,
    padding: 20,
    display: 'grid',
    alignContent: 'start',
    gap: 16,
  },
  serial: {
    color: 'rgba(244,239,230,0.48)',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 11,
  },
  detailTitle: {
    margin: 0,
    fontSize: 34,
    lineHeight: 1.1,
    letterSpacing: 0,
  },
  badges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '110px minmax(0, 1fr)',
    gap: '10px 14px',
    color: 'rgba(244,239,230,0.58)',
    fontSize: 12,
  },
  traitGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 10,
  },
  traitItem: {
    border: '1px solid rgba(255,255,255,0.1)',
    background: '#0b1013',
    borderRadius: 8,
    padding: 10,
    display: 'grid',
    gap: 5,
  },
  traitLabel: {
    color: 'rgba(244,239,230,0.44)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 10,
  },
  traitValue: {
    color: '#f4efe6',
    fontSize: 12,
    lineHeight: 1.3,
  },
  gridSection: {
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#0e1418',
    borderRadius: 8,
    padding: 16,
    display: 'grid',
    gap: 14,
  },
  panelTopline: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    color: 'rgba(244,239,230,0.58)',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 12,
  },
  gallery: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 12,
  },
  card: {
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#10161a',
    color: '#f4efe6',
    borderRadius: 8,
    padding: 10,
    display: 'grid',
    gap: 8,
    textAlign: 'left',
    font: 'inherit',
    cursor: 'pointer',
  },
  cardActive: {
    border: '1px solid rgba(123,215,237,0.72)',
    background: '#132129',
    color: '#f4efe6',
    borderRadius: 8,
    padding: 10,
    display: 'grid',
    gap: 8,
    textAlign: 'left',
    font: 'inherit',
    cursor: 'pointer',
  },
  atlasThumb: {
    width: '100%',
    aspectRatio: '1 / 1',
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    backgroundColor: '#05080a',
    borderRadius: 6,
  },
  imageThumb: {
    width: '100%',
    aspectRatio: '1 / 1',
    objectFit: 'cover',
    imageRendering: 'pixelated',
    background: '#05080a',
    borderRadius: 6,
  },
  emptyThumb: {
    width: '100%',
    aspectRatio: '1 / 1',
    background: '#05080a',
    borderRadius: 6,
  },
  cardMeta: {
    color: 'rgba(244,239,230,0.46)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 10,
  },
  cardTitle: {
    fontSize: 13,
    lineHeight: 1.25,
  },
  cardSub: {
    color: 'rgba(244,239,230,0.52)',
    fontSize: 11,
  },
  loading: {
    minHeight: 360,
    display: 'grid',
    placeItems: 'center',
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#10161a',
    borderRadius: 8,
    color: 'rgba(244,239,230,0.66)',
  },
} satisfies Record<string, CSSProperties>;
