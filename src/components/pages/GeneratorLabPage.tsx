import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  AI_AUTHORED_FROZEN_ATLAS_VARIANT_COUNT,
  FROZEN_ATLAS_VARIANTS,
  FROZEN_ATLAS_VARIANT_COUNT,
  LOOPLING_GENERATOR_STATES,
  QUARANTINED_MOTION_REVIEW_ATLAS_VARIANT_COUNT,
  QUARANTINED_PALETTE_BAKED_ATLAS_VARIANT_COUNT,
  QUARANTINED_RECYCLED_ANIMATION_ATLAS_VARIANT_COUNT,
  generateLooplingFromWallet,
  type GeneratedLoopling,
  type LooplingGeneratorStateId,
} from '@/lib/loopling-generator';
import { getTier1AllocationSummary } from '@/lib/tier1-allocation';
import { getTier1MintPlan, type Tier1Milestone } from '@/lib/tier1-mint-plan';

const DEFAULT_WALLET = '8xPrmePathC7GenLab9aVx2Qm3Nw4Rys5T';
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const STATE_IDS = Object.keys(LOOPLING_GENERATOR_STATES) as LooplingGeneratorStateId[];
const AI_ONLY_OPTIONS = { sourceKind: 'ai-authored-base-atlas' as const };

interface MotionQaReport {
  schemaVersion: string;
  summary: {
    approvedLooks: number;
    statesPerLook: number;
    totalStateRows: number;
    passRows: number;
    reviewRows: number;
    warningCounts: Record<string, number>;
  };
}

function randomWallet() {
  const bytes = new Uint8Array(44);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => BASE58_ALPHABET[byte % BASE58_ALPHABET.length]).join('');
}

function randomDistinctWallets(count: number) {
  const wallets: string[] = [];
  const seenVariants = new Set<number>();
  let attempts = 0;

  while (wallets.length < count && attempts < count * 80) {
    attempts += 1;
    const nextWallet = randomWallet();
    const nextLoopling = generateLooplingFromWallet(nextWallet, AI_ONLY_OPTIONS);

    if (seenVariants.has(nextLoopling.assetVariant.index)) continue;
    seenVariants.add(nextLoopling.assetVariant.index);
    wallets.push(nextWallet);
  }

  while (wallets.length < count) {
    wallets.push(randomWallet());
  }

  return wallets;
}

function shortWallet(wallet: string) {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 5)}...${wallet.slice(-5)}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function useAtlasFrame(stateId: LooplingGeneratorStateId, tokenId: string) {
  const state = LOOPLING_GENERATOR_STATES[stateId];
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
  }, [stateId, tokenId]);

  useEffect(() => {
    if (state.fps <= 0 || state.frameCount <= 1) return;
    const interval = window.setInterval(() => {
      setFrame((current) => (current + 1) % state.frameCount);
    }, 1000 / state.fps);
    return () => window.clearInterval(interval);
  }, [state.fps, state.frameCount]);

  return frame;
}

function FrozenAtlasSprite({
  loopling,
  stateId,
  size,
}: {
  loopling: GeneratedLoopling;
  stateId: LooplingGeneratorStateId;
  size: number;
}) {
  const frame = useAtlasFrame(stateId, loopling.tokenId);
  const state = LOOPLING_GENERATOR_STATES[stateId];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cellWidth = loopling.atlasComposition.cell.width;
  const cellHeight = loopling.atlasComposition.cell.height;
  const atlasUrl = loopling.atlasComposition.atlasUrl;

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
  }, [atlasUrl, cellHeight, cellWidth, frame, state.row]);

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
      aria-label={`${loopling.tokenId} ${state.label} frozen atlas sprite`}
    />
  );
}

function TraitBadge({ label, value, placeholder }: { label: string; value: string; placeholder: boolean }) {
  return (
    <div style={styles.traitBadge}>
      <span style={styles.traitLabel}>{label}</span>
      <strong style={styles.traitValue}>{value}</strong>
      <em style={placeholder ? styles.placeholderFlag : styles.realFlag}>{placeholder ? 'placeholder' : 'baked in atlas'}</em>
    </div>
  );
}

function PreviewCard({ wallet, stateId }: { wallet: string; stateId: LooplingGeneratorStateId }) {
  const loopling = useMemo(() => generateLooplingFromWallet(wallet, AI_ONLY_OPTIONS), [wallet]);

  return (
    <article style={styles.previewCard}>
      <FrozenAtlasSprite loopling={loopling} stateId={stateId} size={82} />
      <strong>{loopling.tokenId}</strong>
      <em>{loopling.assetVariant.label}</em>
      <span>{shortWallet(wallet)}</span>
    </article>
  );
}

function InventoryCard({ index, stateId }: { index: number; stateId: LooplingGeneratorStateId }) {
  const wallet = `approved-atlas-inventory-${String(index).padStart(3, '0')}`;
  const loopling = useMemo(() => generateLooplingFromWallet(wallet, { serial: index }), [wallet, index]);

  return (
    <article style={styles.previewCard}>
      <FrozenAtlasSprite loopling={loopling} stateId={stateId} size={82} />
      <strong>{loopling.tokenId}</strong>
      <em>{loopling.assetVariant.label}</em>
      <span>{loopling.assetVariant.id}</span>
    </article>
  );
}

function StateSweepCard({ loopling, stateId }: { loopling: GeneratedLoopling; stateId: LooplingGeneratorStateId }) {
  const state = LOOPLING_GENERATOR_STATES[stateId];

  return (
    <article style={styles.stateSweepCard}>
      <FrozenAtlasSprite loopling={loopling} stateId={stateId} size={74} />
      <strong>{state.label}</strong>
      <span>row {state.row}</span>
      <em>{state.frameCount} frames / {state.fps === 0 ? 'hold' : `${state.fps} fps`}</em>
    </article>
  );
}

function MilestoneRow({ milestone, currentLooks }: { milestone: Tier1Milestone; currentLooks: number }) {
  const remaining = Math.max(0, milestone.requiredLooks - currentLooks);

  return (
    <article style={styles.milestoneRow}>
      <div>
        <strong>{milestone.label}</strong>
        <span>{milestone.note}</span>
      </div>
      <div style={styles.milestoneNumbers}>
        <b>{formatNumber(milestone.requiredLooks)} looks</b>
        <em>{formatNumber(milestone.editionSize)} max edition</em>
        <small>{remaining === 0 ? 'reached' : `${formatNumber(remaining)} more`}</small>
      </div>
    </article>
  );
}

export default function GeneratorLabPage() {
  const [wallet, setWallet] = useState(DEFAULT_WALLET);
  const [stateId, setStateId] = useState<LooplingGeneratorStateId>('idle');
  const [verifyMessage, setVerifyMessage] = useState('Not checked yet');
  const [sampleWallets, setSampleWallets] = useState(() => randomDistinctWallets(Math.min(12, AI_AUTHORED_FROZEN_ATLAS_VARIANT_COUNT)));
  const [motionQaReport, setMotionQaReport] = useState<MotionQaReport | null>(null);
  const loopling = useMemo(() => generateLooplingFromWallet(wallet, AI_ONLY_OPTIONS), [wallet]);
  const metadataText = useMemo(() => JSON.stringify(loopling, null, 2), [loopling]);
  const frozenTraitCount = Object.values(loopling.traits).filter((trait) => !trait.placeholder).length;
  const mintPlan = useMemo(() => getTier1MintPlan(), []);
  const allocationSummary = useMemo(() => getTier1AllocationSummary(), []);

  useEffect(() => {
    let cancelled = false;

    fetch('/nft-gen-lab/motion-qa.json')
      .then((response) => (response.ok ? response.json() : null))
      .then((report: MotionQaReport | null) => {
        if (!cancelled) setMotionQaReport(report);
      })
      .catch(() => {
        if (!cancelled) setMotionQaReport(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function randomizePrimaryWallet() {
    setWallet(randomWallet());
    setVerifyMessage('Not checked yet');
  }

  function randomizeGrid() {
    setSampleWallets(randomDistinctWallets(Math.min(12, AI_AUTHORED_FROZEN_ATLAS_VARIANT_COUNT)));
  }

  function verifyDeterminism() {
    const first = stableStringify(loopling);
    const second = stableStringify(generateLooplingFromWallet(wallet, AI_ONLY_OPTIONS));
    setVerifyMessage(first === second ? 'Verified: metadata is byte-identical' : 'Failed: metadata drifted');
  }

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.header}>
          <div>
            <p style={styles.kicker}>Looplings Path C Test Branch</p>
            <h1 style={styles.title}>Frozen atlas generator lab</h1>
            <p style={styles.subtitle}>
              Wallets deterministically select AI-authored full PNG state atlases from the approved generator pool. Palette-baked experiments are quarantined from reset generation and mint math until they are replaced by fresh AI-authored atlases.
            </p>
          </div>
          <div style={styles.headerStats}>
            <span>{FROZEN_ATLAS_VARIANT_COUNT} generator-approved AI atlases</span>
            <span>{AI_AUTHORED_FROZEN_ATLAS_VARIANT_COUNT} AI-authored reset pool</span>
            <span>{QUARANTINED_PALETTE_BAKED_ATLAS_VARIANT_COUNT} palette-bakes quarantined</span>
            <span>{QUARANTINED_RECYCLED_ANIMATION_ATLAS_VARIANT_COUNT} recycled-state atlases quarantined</span>
            <span>{QUARANTINED_MOTION_REVIEW_ATLAS_VARIANT_COUNT} motion-review atlas quarantined</span>
            <span>{frozenTraitCount} baked-in visual traits</span>
            <span>canvas atlas-cell renderer</span>
            <span>{loopling.assetVariant.label}</span>
          </div>
        </header>

        <section style={styles.loreNote}>
          <strong>L01 silhouette note</strong>
          <span>
            Canon says the antenna wants to read as a loop with a hole. A few approved lab atlases wandered into leaf, cross, or button territory; they passed the monolithic-asset audit and looked too good, so we let them slide. Future Tier 1 canon should bias back toward true loop variants.
          </span>
        </section>

        <section style={styles.controls}>
          <label style={styles.walletLabel}>
            <span>Solana wallet seed</span>
            <input
              value={wallet}
              onChange={(event) => {
                setWallet(event.target.value);
                setVerifyMessage('Not checked yet');
              }}
              style={styles.input}
            />
          </label>
          <button type="button" onClick={randomizePrimaryWallet} style={styles.button}>Reset generation</button>
          <button type="button" onClick={verifyDeterminism} style={styles.buttonSecondary}>Verify</button>
          <span style={styles.verify}>{verifyMessage}</span>
        </section>

        <section style={styles.mainGrid}>
          <div style={styles.stagePanel}>
            <div style={styles.stateControls}>
              {STATE_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setStateId(id)}
                  style={id === stateId ? styles.stateButtonActive : styles.stateButton}
                >
                  {LOOPLING_GENERATOR_STATES[id].label}
                </button>
              ))}
            </div>
            <div style={styles.spriteStage}>
              <FrozenAtlasSprite loopling={loopling} stateId={stateId} size={292} />
              <div style={styles.identityPlate}>
                <span>{loopling.tokenId}</span>
                <strong>{shortWallet(loopling.walletSeed)}</strong>
                <strong>{loopling.assetVariant.label}</strong>
                <em>{LOOPLING_GENERATOR_STATES[stateId].label}</em>
                <em>AI-authored / no overlays</em>
              </div>
            </div>
            <div style={styles.traitGrid}>
              <TraitBadge label="Body" value={loopling.traits.bodyPalette.label} placeholder={loopling.traits.bodyPalette.placeholder} />
              <TraitBadge label="Eyes" value={loopling.traits.eyeStyle.label} placeholder={loopling.traits.eyeStyle.placeholder} />
              <TraitBadge label="Antenna" value={loopling.traits.antennaShape.label} placeholder={loopling.traits.antennaShape.placeholder} />
              <TraitBadge label="Signal" value={loopling.traits.antennaColor.label} placeholder={loopling.traits.antennaColor.placeholder} />
              <TraitBadge label="Glyph" value={loopling.traits.foreheadGlyph.label} placeholder={loopling.traits.foreheadGlyph.placeholder} />
            </div>
          </div>

          <aside style={styles.metadataPanel}>
            <div style={styles.panelTopline}>
              <span>Metadata JSON</span>
              <strong>{loopling.birthStats.generationLabel}</strong>
            </div>
            <pre style={styles.pre}>{metadataText}</pre>
          </aside>
        </section>

        <section style={styles.galleryPanel}>
          <div style={styles.panelTopline}>
            <span>12-state animation sweep</span>
            <strong>current wallet, all atlas rows</strong>
          </div>
          <div style={styles.qaStrip}>
            <span>offline QA artifact</span>
            <a href="/nft-gen-lab/state-contact-sheets/manifest.json" style={styles.qaLink}>state contact sheet manifest</a>
          </div>
          <div style={styles.stateSweepGrid}>
            {STATE_IDS.map((id) => (
              <StateSweepCard key={id} loopling={loopling} stateId={id} />
            ))}
          </div>
        </section>

        <section style={styles.galleryPanel}>
          <div style={styles.panelTopline}>
            <span>Random wallet variation grid</span>
            <button type="button" onClick={randomizeGrid} style={styles.smallButton}>Refresh distinct wallets</button>
          </div>
          <div style={styles.previewGrid}>
            {sampleWallets.map((sampleWallet) => (
              <PreviewCard key={sampleWallet} wallet={sampleWallet} stateId={stateId} />
            ))}
          </div>
        </section>

        <section style={styles.mintPlanPanel}>
          <div style={styles.panelTopline}>
            <span>Motion / clipping QA gate</span>
            <strong>{motionQaReport ? `${formatNumber(motionQaReport.summary.totalStateRows)} state rows checked` : 'run audit:loopling-motion'}</strong>
          </div>
          <div style={styles.metricGrid}>
            <div style={styles.metricTile}>
              <span>Rows tested</span>
              <strong>{motionQaReport ? formatNumber(motionQaReport.summary.totalStateRows) : formatNumber(FROZEN_ATLAS_VARIANT_COUNT * STATE_IDS.length)}</strong>
              <em>look x state rows</em>
            </div>
            <div style={styles.metricTile}>
              <span>Pass rows</span>
              <strong>{motionQaReport ? formatNumber(motionQaReport.summary.passRows) : 'pending'}</strong>
              <em>no motion warnings</em>
            </div>
            <div style={styles.metricTile}>
              <span>Review rows</span>
              <strong>{motionQaReport ? formatNumber(motionQaReport.summary.reviewRows) : 'pending'}</strong>
              <em>human QA needed</em>
            </div>
            <div style={styles.metricTile}>
              <span>Report</span>
              <strong>JSON</strong>
              <a href="/nft-gen-lab/motion-qa.json" style={styles.qaLink}>motion-qa.json</a>
            </div>
          </div>
          <div style={styles.qaStrip}>
            <span>Checks empty frames, edge clipping, motion jumps, and area spikes across all 96 frames per look.</span>
            <span>{motionQaReport ? Object.entries(motionQaReport.summary.warningCounts).map(([key, value]) => `${key}: ${value}`).join(' / ') || 'no warnings' : 'waiting for generated report'}</span>
          </div>
        </section>

        <section style={styles.mintPlanPanel}>
          <div style={styles.panelTopline}>
            <span>Tier 1 mint math</span>
            <strong>{formatNumber(mintPlan.targetSupply)} target supply</strong>
          </div>
          <div style={styles.metricGrid}>
            <div style={styles.metricTile}>
              <span>Approved looks</span>
              <strong>{formatNumber(mintPlan.currentApprovedLooks)}</strong>
              <em>full 12-state atlases</em>
            </div>
            <div style={styles.metricTile}>
              <span>Animated frames</span>
              <strong>{formatNumber(mintPlan.currentApprovedFrames)}</strong>
              <em>{mintPlan.framesPerAtlas} frames per look</em>
            </div>
            <div style={styles.metricTile}>
              <span>Current edition size</span>
              <strong>{formatNumber(mintPlan.maxEditionSize)}</strong>
              <em>{formatNumber(mintPlan.remainderEditions)} looks get one extra</em>
            </div>
            <div style={styles.metricTile}>
              <span>Next serious target</span>
              <strong>{formatNumber(mintPlan.looksNeededForMaxEdition100)}</strong>
              <em>looks for 100 max edition</em>
            </div>
          </div>
          <div style={styles.milestoneList}>
            {mintPlan.milestones.map((milestone) => (
              <MilestoneRow key={milestone.id} milestone={milestone} currentLooks={mintPlan.currentApprovedLooks} />
            ))}
          </div>
        </section>

        <section style={styles.mintPlanPanel}>
          <div style={styles.panelTopline}>
            <span>Mint allocation contract</span>
            <strong>{formatNumber(allocationSummary.approvedLooks)} visual edition buckets</strong>
          </div>
          <div style={styles.allocationGrid}>
            <article style={styles.policyTile}>
              <span>Wallet-only preview mode</span>
              <strong>deterministic, uncapped</strong>
              <p>{allocationSummary.walletOnlyMode.note}</p>
            </article>
            <article style={styles.policyTileStrong}>
              <span>NFT mint-slot mode</span>
              <strong>deterministic, capped</strong>
              <p>{allocationSummary.mintSlotMode.note}</p>
            </article>
          </div>
          <div style={styles.allocationTable}>
            {allocationSummary.variants.slice(0, 12).map((variant) => (
              <div key={variant.variantId} style={styles.allocationRow}>
                <strong>{variant.label}</strong>
                <span>{formatNumber(variant.editionCount)} editions</span>
                <em>slots {formatNumber(variant.firstMintSlot)}-{formatNumber(variant.lastMintSlot)}</em>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.galleryPanel}>
          <div style={styles.panelTopline}>
            <span>Generator-approved monolithic atlas inventory</span>
            <strong>{FROZEN_ATLAS_VARIANT_COUNT} AI-authored pass</strong>
          </div>
          <div style={styles.previewGrid}>
            {FROZEN_ATLAS_VARIANTS.map((variant, index) => (
              <InventoryCard key={variant.id} index={index} stateId={stateId} />
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
    maxWidth: 820,
    margin: '12px 0 0',
    color: 'rgba(244,239,230,0.66)',
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
  loreNote: {
    border: '1px solid rgba(255,207,121,0.22)',
    background: '#15130f',
    borderRadius: 8,
    padding: '12px 14px',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: 14,
    alignItems: 'center',
    color: 'rgba(244,239,230,0.72)',
    fontSize: 12,
    lineHeight: 1.55,
  },
  controls: {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto auto',
    gap: 10,
    alignItems: 'end',
  },
  walletLabel: {
    display: 'grid',
    gap: 8,
    color: 'rgba(244,239,230,0.68)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    border: '1px solid rgba(120,215,255,0.26)',
    background: '#101418',
    color: '#f4efe6',
    borderRadius: 8,
    padding: '14px 16px',
    font: 'inherit',
    letterSpacing: 0,
  },
  button: {
    border: '1px solid rgba(120,215,255,0.42)',
    background: '#16313a',
    color: '#dffaff',
    borderRadius: 8,
    padding: '14px 16px',
    font: 'inherit',
    cursor: 'pointer',
  },
  buttonSecondary: {
    border: '1px solid rgba(255,255,255,0.18)',
    background: '#14171b',
    color: '#f4efe6',
    borderRadius: 8,
    padding: '14px 16px',
    font: 'inherit',
    cursor: 'pointer',
  },
  smallButton: {
    border: '1px solid rgba(255,255,255,0.18)',
    background: '#14171b',
    color: '#f4efe6',
    borderRadius: 8,
    padding: '9px 11px',
    font: 'inherit',
    fontSize: 12,
    cursor: 'pointer',
  },
  verify: {
    color: '#8cffae',
    fontSize: 12,
    minWidth: 250,
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.05fr) minmax(360px, 0.95fr)',
    gap: 18,
  },
  stagePanel: {
    border: '1px solid rgba(255,255,255,0.11)',
    background: '#0d1114',
    borderRadius: 8,
    padding: 18,
    display: 'grid',
    gap: 18,
  },
  metadataPanel: {
    border: '1px solid rgba(255,255,255,0.11)',
    background: '#0d1114',
    borderRadius: 8,
    padding: 18,
    minWidth: 0,
  },
  stateControls: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
    gap: 8,
  },
  stateButton: {
    border: '1px solid rgba(255,255,255,0.13)',
    background: '#101418',
    color: 'rgba(244,239,230,0.7)',
    borderRadius: 8,
    padding: '10px 8px',
    font: 'inherit',
    fontSize: 12,
    cursor: 'pointer',
  },
  stateButtonActive: {
    border: '1px solid rgba(120,215,255,0.62)',
    background: '#17343d',
    color: '#dffaff',
    borderRadius: 8,
    padding: '10px 8px',
    font: 'inherit',
    fontSize: 12,
    cursor: 'pointer',
  },
  spriteStage: {
    minHeight: 420,
    display: 'grid',
    placeItems: 'center',
    background: 'repeating-linear-gradient(0deg, #101418, #101418 11px, #141a1f 12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    position: 'relative',
  },
  identityPlate: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    display: 'grid',
    gap: 4,
    background: 'rgba(8,11,13,0.76)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding: 12,
  },
  traitGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: 10,
  },
  traitBadge: {
    border: '1px solid rgba(255,255,255,0.1)',
    background: '#11161a',
    borderRadius: 8,
    padding: 12,
    display: 'grid',
    gap: 6,
    minWidth: 0,
  },
  traitLabel: {
    color: 'rgba(244,239,230,0.5)',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  traitValue: {
    fontSize: 13,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  realFlag: {
    color: '#8cffae',
    fontSize: 10,
    fontStyle: 'normal',
    textTransform: 'uppercase',
  },
  placeholderFlag: {
    color: '#ffcf79',
    fontSize: 10,
    fontStyle: 'normal',
    textTransform: 'uppercase',
  },
  panelTopline: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
    color: 'rgba(244,239,230,0.62)',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
  },
  pre: {
    margin: 0,
    overflow: 'auto',
    maxHeight: 610,
    background: '#080b0d',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 14,
    color: '#cde8ee',
    fontSize: 12,
    lineHeight: 1.55,
  },
  galleryPanel: {
    border: '1px solid rgba(255,255,255,0.11)',
    background: '#0d1114',
    borderRadius: 8,
    padding: 18,
  },
  stateSweepGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
    gap: 10,
  },
  qaStrip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#101418',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 12,
    color: 'rgba(244,239,230,0.58)',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  qaLink: {
    color: '#78d7ff',
    textTransform: 'none',
    textDecoration: 'none',
  },
  stateSweepCard: {
    border: '1px solid rgba(255,255,255,0.1)',
    background: '#11161a',
    borderRadius: 8,
    padding: 10,
    display: 'grid',
    justifyItems: 'center',
    gap: 6,
    minWidth: 0,
    fontSize: 10,
    color: 'rgba(244,239,230,0.62)',
  },
  mintPlanPanel: {
    border: '1px solid rgba(120,215,255,0.18)',
    background: '#0d1114',
    borderRadius: 8,
    padding: 18,
    display: 'grid',
    gap: 14,
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 12,
  },
  metricTile: {
    border: '1px solid rgba(255,255,255,0.1)',
    background: '#11161a',
    borderRadius: 8,
    padding: 14,
    display: 'grid',
    gap: 8,
    minWidth: 0,
  },
  milestoneList: {
    display: 'grid',
    gap: 8,
  },
  milestoneRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 16,
    alignItems: 'center',
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#0f1418',
    borderRadius: 8,
    padding: 14,
  },
  milestoneNumbers: {
    display: 'grid',
    gap: 4,
    justifyItems: 'end',
    minWidth: 170,
  },
  allocationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
  },
  policyTile: {
    border: '1px solid rgba(255,207,121,0.2)',
    background: '#141414',
    borderRadius: 8,
    padding: 14,
    display: 'grid',
    gap: 8,
  },
  policyTileStrong: {
    border: '1px solid rgba(140,255,174,0.22)',
    background: '#101916',
    borderRadius: 8,
    padding: 14,
    display: 'grid',
    gap: 8,
  },
  allocationTable: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 8,
  },
  allocationRow: {
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#101418',
    borderRadius: 8,
    padding: 12,
    display: 'grid',
    gap: 5,
    minWidth: 0,
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
    gap: 12,
  },
  previewCard: {
    border: '1px solid rgba(255,255,255,0.1)',
    background: '#11161a',
    borderRadius: 8,
    padding: 12,
    display: 'grid',
    justifyItems: 'center',
    gap: 8,
    minWidth: 0,
    fontSize: 11,
    color: 'rgba(244,239,230,0.62)',
  },
} satisfies Record<string, CSSProperties>;
