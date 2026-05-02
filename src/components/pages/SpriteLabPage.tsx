import { useEffect, useMemo, useState } from 'react';
import { Activity, BadgeCheck, Eye, Sparkles, TimerReset, Wand2 } from 'lucide-react';
import SpecialSprite, { type SpecialPixel } from '@/components/sprites/SpecialSprite';
import { PALETTE_PRIME, PRIME_FRAMES } from '@/components/sprites/PrimeFrames';
import {
  LOOPLING_ANIMATIONS,
  LOOPLING_TRAIT_OPTIONS,
  LOOPLING_VISUAL_STATES,
  createLooplingSpriteLabVariants,
  type LooplingIdentityTraits,
  type LooplingVisualStateId,
} from '@/lib/loopling-traits';
import {
  PRIME_FACTORY_TRAIT_AXES_LATER,
  PRIME_FACTORY_TRAIT_AXES_V1,
  PRIME_RIG_CONTRACT,
  PRIME_STATE_CONTRACTS,
  PRIME_VISIBLE_STATE_IDS,
  getPrimeStateContract,
  isPrimeStateProductionApproved,
} from '@/lib/prime-asset-factory';
import { applyTierToPalette } from '@/lib/sprite-generator';

const STATE_IDS = PRIME_VISIBLE_STATE_IDS;
const PET_OPTIONS = {
  prime: {
    label: 'Prime',
    spritesheet: '/pets/prime/spritesheet.webp',
  },
  primeTest: {
    label: 'Prime Test L01',
    spritesheet: '/pets/prime-test/spritesheet.webp',
  },
} as const;

type PetOptionId = keyof typeof PET_OPTIONS;

const CODEX_PET_COLS = 8;
const CODEX_PET_ROWS = 9;
const CODEX_PET_ROW_META = {
  idle: { row: 0, label: 'Idle', frameCount: 6, fps: 5 },
  runningRight: { row: 1, label: 'Running Right', frameCount: 8, fps: 10 },
  runningLeft: { row: 2, label: 'Running Left', frameCount: 8, fps: 10 },
  waving: { row: 3, label: 'Waving', frameCount: 4, fps: 6 },
  jumping: { row: 4, label: 'Jumping', frameCount: 5, fps: 8 },
  failed: { row: 5, label: 'Failed', frameCount: 8, fps: 8 },
  waiting: { row: 6, label: 'Waiting', frameCount: 6, fps: 4 },
  running: { row: 7, label: 'Running', frameCount: 6, fps: 8 },
  review: { row: 8, label: 'Review', frameCount: 6, fps: 6 },
} as const;

type CodexPetRowId = keyof typeof CODEX_PET_ROW_META;
type VisibleLooplingVisualStateId = Exclude<LooplingVisualStateId, 'prediction_win'>;

const PRIME_STATE_ATLAS_VERSION = 'prime-frame-scale-v2';

const PRIME_TEST_STATE_ATLAS = {
  spritesheet: `/pets/prime-test/state-atlas.png?v=${PRIME_STATE_ATLAS_VERSION}`,
  cols: 8,
  rows: 12,
  states: {
    idle: { row: 0, label: 'Idle breathing', frameCount: 8, fps: 5 },
    thinking: { row: 1, label: 'Thinking focus', frameCount: 8, fps: 5 },
    acting: { row: 2, label: 'Tool action', frameCount: 8, fps: 8 },
    trading: { row: 3, label: 'Market scan', frameCount: 8, fps: 9 },
    trade_win: { row: 4, label: 'Trade win bounce', frameCount: 8, fps: 8 },
    trade_loss: { row: 5, label: 'Trade loss slump', frameCount: 8, fps: 5 },
    posting: { row: 6, label: 'Posting send', frameCount: 8, fps: 6 },
    receiving: { row: 7, label: 'Receiving listen', frameCount: 8, fps: 6 },
    sleeping: { row: 8, label: 'Sleeping breath', frameCount: 8, fps: 2 },
    low_compute: { row: 9, label: 'Low compute conserve', frameCount: 8, fps: 3 },
    critical: { row: 10, label: 'Critical distress', frameCount: 8, fps: 8 },
    dead: { row: 11, label: 'Dead grounded', frameCount: 8, fps: 0 },
  } satisfies Partial<Record<VisibleLooplingVisualStateId, { row: number; label: string; frameCount: number; fps: number }>>,
} as const;

interface StateRenderMeta {
  rowId: CodexPetRowId;
  label: string;
  fps: number;
  frameSequence?: number[];
  className: string;
  note: string;
  animated?: boolean;
}

const STATE_RENDER_META: Record<LooplingVisualStateId, StateRenderMeta> = {
  idle: {
    rowId: 'idle',
    label: 'Baseline idle',
    fps: 5,
    className: 'is-idle',
    note: 'Default breathing loop for normal alive presence.',
  },
  thinking: {
    rowId: 'waiting',
    label: 'Thinking scan',
    fps: 3,
    frameSequence: [0, 1, 2, 1, 0, 3],
    className: 'is-thinking',
    note: 'Slower waiting motion for mental processing without changing the body art.',
  },
  acting: {
    rowId: 'running',
    label: 'Tool action',
    fps: 9,
    frameSequence: [0, 1, 2, 3, 4, 5],
    className: 'is-acting',
    note: 'General active state for tool calls or agent work.',
  },
  trading: {
    rowId: 'runningRight',
    label: 'Market run',
    fps: 12,
    frameSequence: [0, 1, 2, 3, 4, 5, 6, 7],
    className: 'is-trading',
    note: 'Fast directional movement so trading feels more urgent than generic acting.',
  },
  trade_win: {
    rowId: 'jumping',
    label: 'Trade win pop',
    fps: 9,
    frameSequence: [0, 1, 2, 3, 4, 3, 2],
    className: 'is-trade-win',
    note: 'Jumping motion for a clean win reaction using only the generated pet row.',
  },
  trade_loss: {
    rowId: 'failed',
    label: 'Trade loss slump',
    fps: 5,
    frameSequence: [0, 1, 2, 3, 4, 3, 2, 1],
    className: 'is-trade-loss',
    note: 'Failed posture at a slower tempo for disappointment without panic.',
  },
  prediction_win: {
    rowId: 'jumping',
    label: 'Trade win pop',
    fps: 9,
    frameSequence: [0, 1, 2, 3, 4, 3, 2],
    className: 'is-trade-win',
    note: 'Temporarily shares trade win until prediction-market skills exist.',
  },
  posting: {
    rowId: 'waving',
    label: 'Broadcast post',
    fps: 6,
    frameSequence: [0, 1, 2, 3, 2, 1],
    className: 'is-posting',
    note: 'Waving gesture for broadcasting outward.',
  },
  receiving: {
    rowId: 'runningLeft',
    label: 'Incoming pull',
    fps: 7,
    frameSequence: [0, 1, 2, 3, 4, 5, 6, 7],
    className: 'is-receiving',
    note: 'Leftward motion makes receiving feel like Prime is pulling something in.',
  },
  sleeping: {
    rowId: 'idle',
    label: 'Sleep drift',
    fps: 1,
    frameSequence: [4, 5, 5, 4],
    className: 'is-sleeping',
    note: 'Slow cooled-down idle using the closed-eye frames.',
  },
  low_compute: {
    rowId: 'failed',
    label: 'Low compute sadness',
    fps: 3,
    frameSequence: [0, 1, 2, 3, 2, 1, 0, 0],
    className: 'is-low-compute',
    note: 'Sad slumped loop for low runway, before it becomes an emergency.',
  },
  critical: {
    rowId: 'failed',
    label: 'Critical distress',
    fps: 6,
    frameSequence: [0, 1, 2, 3, 2, 4, 5, 4, 3, 2],
    className: 'is-critical',
    note: 'Emergency distress loop, separate from normal loss and low compute.',
  },
  dead: {
    rowId: 'failed',
    label: 'Grounded dead',
    fps: 0,
    frameSequence: [7],
    className: 'is-dead',
    note: 'One static frame presented as a grounded body.',
    animated: false,
  },
};

const QA_ITEMS = [
  'Body silhouette stays stable',
  'Loop antenna reads as signature',
  'Eyes keep identity across frames',
  'Loop starts and ends cleanly',
  'No accidental clothes or props',
  'Readable at thumbnail size',
  'Generated as its own row',
  'Not tint/speed/rotation only',
];

function statusLabel(status: string) {
  return status.replace(/_/g, ' ');
}

function getFrameSequence(rowId: CodexPetRowId, override?: number[]) {
  if (override) return override;
  return Array.from({ length: CODEX_PET_ROW_META[rowId].frameCount }, (_, index) => index);
}

function getPreviewFrames(stateId: LooplingVisualStateId): SpecialPixel[][][] {
  if (stateId === 'dead') return [PRIME_FRAMES[0]];
  if (stateId === 'low_compute') return PRIME_FRAMES.map((frame) => frame.map((row) => [...row] as SpecialPixel[]));
  if (stateId === 'critical') {
    return PRIME_FRAMES.map((frame, index) =>
      frame.map((row, y) =>
        row.map((pixel, x) => {
          if (pixel === 0) return 0;
          if ((x + y + index) % 7 === 0) return 4;
          return pixel;
        }) as SpecialPixel[],
      ),
    );
  }
  if (stateId === 'trade_win' || stateId === 'prediction_win') {
    return PRIME_FRAMES.map((frame, index) =>
      frame.map((row, y) =>
        row.map((pixel, x) => {
          if (pixel === 0 && y === 0 && x === 4 && index % 2 === 0) return 4;
          return pixel;
        }) as SpecialPixel[],
      ),
    );
  }
  if (stateId === 'trade_loss') {
    return PRIME_FRAMES.map((frame) =>
      frame.map((row) => row.map((pixel) => (pixel === 4 ? 0 : pixel)) as SpecialPixel[]),
    );
  }
  return PRIME_FRAMES;
}

function antennaGlyph(id: string) {
  switch (id) {
    case 'infinity':
      return '∞';
    case 'double-loop':
      return 'oo';
    case 'mobius':
      return '∿';
    case 'spiral':
      return '◎';
    case 'broken':
      return 'o/';
    case 'glitch-loop':
      return 'o!';
    case 'halo':
      return '◌';
    default:
      return '○';
  }
}

function markGlyph(id: string) {
  switch (id) {
    case 'diamond':
      return '◆';
    case 'circuit':
      return '┆';
    case 'wallet-glyph':
      return '▣';
    case 'reserved-dots':
      return '⋮';
    default:
      return '';
  }
}

function TraitLooplingPreview({ identity, stateId }: { identity: LooplingIdentityTraits; stateId: LooplingVisualStateId }) {
  const state = LOOPLING_VISUAL_STATES[stateId];
  const pulse = LOOPLING_ANIMATIONS[stateId].cues.includes('antenna-pulse');
  const critical = stateId === 'critical';
  const dead = stateId === 'dead';
  const palette = applyTierToPalette(PALETTE_PRIME, state.tier);
  const bodyScale =
    identity.proportion.id === 'tiny-body' ? 0.9 :
    identity.proportion.id === 'big-head' ? 1.08 :
    identity.proportion.id === 'wide-cheek' ? 1.04 :
    1;
  const bodyRadius =
    identity.body.id === 'capsule' ? '44% 44% 38% 38%' :
    identity.body.id === 'bean' ? '48% 42% 45% 40%' :
    identity.body.id === 'shell' ? '42% 42% 50% 50%' :
    '42%';

  return (
    <div className={`sprite-lab-trait-preview ${critical ? 'is-critical' : ''} ${dead ? 'is-dead' : ''}`}>
      <div className={`sprite-lab-antenna ${pulse ? 'is-pulsing' : ''}`}>
        {antennaGlyph(identity.antenna.id)}
      </div>
      <div
        className="sprite-lab-body"
        style={{
          background: palette.body,
          borderRadius: bodyRadius,
          transform: `scale(${bodyScale})`,
        }}
      >
        <span className={`sprite-lab-eye sprite-lab-eye--left is-${identity.eyes.id}`} />
        <span className={`sprite-lab-eye sprite-lab-eye--right is-${identity.eyes.id}`} />
        <span className="sprite-lab-mark">{markGlyph(identity.marking.id)}</span>
        <span className="sprite-lab-arm sprite-lab-arm--left" />
        <span className="sprite-lab-arm sprite-lab-arm--right" />
        <span className="sprite-lab-foot sprite-lab-foot--left" />
        <span className="sprite-lab-foot sprite-lab-foot--right" />
      </div>
    </div>
  );
}

function TraitPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="sprite-lab-trait-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StateStatusPill({ stateId }: { stateId: LooplingVisualStateId }) {
  const contract = getPrimeStateContract(stateId);
  const approved = isPrimeStateProductionApproved(stateId);
  return (
    <span className={`sprite-lab-status-pill is-${contract.status}`}>
      {approved ? 'production ready' : statusLabel(contract.status)}
    </span>
  );
}

function AtlasPetFrame({
  spritesheet,
  row,
  frame,
  atlasCols = CODEX_PET_COLS,
  atlasRows = CODEX_PET_ROWS,
  size = 192,
  animated = false,
  className = '',
}: {
  spritesheet: string;
  row: number;
  atlasCols?: number;
  atlasRows?: number;
  frame: number;
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`sprite-lab-codex-pet ${animated ? 'is-animated' : ''} ${className}`}
      style={{
        width: size,
        ['--atlas-cols' as string]: atlasCols,
        ['--atlas-rows' as string]: atlasRows,
        ['--pet-frame' as string]: frame,
        ['--pet-row' as string]: row,
      }}
    >
      <img src={spritesheet} alt="" />
    </div>
  );
}

function AtlasPetAnimation({
  renderMeta,
  spritesheet,
  row,
  atlasCols,
  atlasRows,
  frameSequence,
  fps,
  useCssMotion = true,
}: {
  renderMeta: StateRenderMeta;
  spritesheet: string;
  row: number;
  atlasCols: number;
  atlasRows: number;
  frameSequence: number[];
  fps: number;
  useCssMotion?: boolean;
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
  }, [row, frameSequence]);

  useEffect(() => {
    if (fps <= 0 || frameSequence.length <= 1) return;
    const interval = window.setInterval(() => {
      setFrame((current) => (current + 1) % frameSequence.length);
    }, 1000 / fps);
    return () => window.clearInterval(interval);
  }, [fps, frameSequence.length]);

  return (
    <div className={`sprite-lab-codex-stage ${renderMeta.className}`}>
      <AtlasPetFrame
        spritesheet={spritesheet}
        row={row}
        atlasCols={atlasCols}
        atlasRows={atlasRows}
        frame={frameSequence[frame] ?? 0}
        size={236}
        animated={useCssMotion && (renderMeta.animated ?? true)}
        className={renderMeta.className}
      />
    </div>
  );
}

export default function SpriteLabPage() {
  const [stateId, setStateId] = useState<LooplingVisualStateId>('idle');
  const [petId, setPetId] = useState<PetOptionId>('primeTest');
  const [seed, setSeed] = useState('prime-genesis');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const variants = useMemo(() => createLooplingSpriteLabVariants(seed, 12), [seed]);
  const selected = variants[selectedIndex] ?? variants[0];
  const visualState = LOOPLING_VISUAL_STATES[stateId];
  const animation = LOOPLING_ANIMATIONS[stateId];
  const previewFrames = getPreviewFrames(stateId);
  const stateRender = STATE_RENDER_META[stateId];
  const stateContract = getPrimeStateContract(stateId);
  const stateApprovalChecklist = [
    ...QA_ITEMS,
    ...(stateContract.rejectionReason ? [stateContract.rejectionReason] : []),
  ];
  const codexPetRowId = stateRender.rowId;
  const codexPetRow = CODEX_PET_ROW_META[codexPetRowId];
  const pet = PET_OPTIONS[petId];
  const primeTestStates: Partial<Record<VisibleLooplingVisualStateId, { row: number; label: string; frameCount: number; fps: number }>> = PRIME_TEST_STATE_ATLAS.states;
  const primeTestState = stateId === 'prediction_win' ? undefined : primeTestStates[stateId];
  const activeAtlas = (() => {
    if (petId === 'primeTest') {
      if (!stateContract.currentAsset || !primeTestState) return null;
      return {
        spritesheet: PRIME_TEST_STATE_ATLAS.spritesheet,
        cols: PRIME_TEST_STATE_ATLAS.cols,
        rows: PRIME_TEST_STATE_ATLAS.rows,
        row: primeTestState.row,
        label: primeTestState.label,
        fps: primeTestState.fps,
        frameSequence: Array.from({ length: primeTestState.frameCount }, (_, index) => index),
        usesGeneratedStates: true,
      };
    }

    return {
      spritesheet: pet.spritesheet,
      cols: CODEX_PET_COLS,
      rows: CODEX_PET_ROWS,
      row: codexPetRow.row,
      label: stateRender.label,
      fps: stateRender.fps,
      frameSequence: getFrameSequence(codexPetRowId, stateRender.frameSequence),
      usesGeneratedStates: false,
    };
  })();

  return (
    <main className="sprite-lab-page">
      <section className="sprite-lab-shell">
        <header className="sprite-lab-header">
          <div>
            <p>Looplings Sprite Lab</p>
            <h1>Prime rig approval bench</h1>
            <div className="sprite-lab-prototype-warning">
              Current Prime Test atlas is a prototype reference. Production rows must be generated independently.
            </div>
          </div>
          <div className="sprite-lab-header-actions">
            <label>
              Pet
              <select value={petId} onChange={(event) => setPetId(event.target.value as PetOptionId)}>
                {Object.entries(PET_OPTIONS).map(([id, option]) => (
                  <option key={id} value={id}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              Seed
              <input value={seed} onChange={(event) => setSeed(event.target.value)} />
            </label>
          </div>
        </header>

        <section className="sprite-lab-grid">
          <aside className="sprite-lab-panel sprite-lab-panel--states">
            <h2><Activity size={16} /> States</h2>
            <div className="sprite-lab-state-list">
              {STATE_IDS.map((id) => (
                <button
                  key={id}
                  className={id === stateId ? 'is-active' : undefined}
                  type="button"
                  onClick={() => setStateId(id)}
                >
                  {LOOPLING_VISUAL_STATES[id].label}
                </button>
              ))}
            </div>
          </aside>

          <section className="sprite-lab-stage">
            <div className="sprite-lab-stage-topline">
              <span>{visualState.label}</span>
              <strong>
                {activeAtlas
                  ? `${activeAtlas.label} / row ${activeAtlas.row + 1} / ${activeAtlas.frameSequence.length} frames / ${activeAtlas.fps} fps`
                  : 'generation job / no sprite row yet'}
              </strong>
              <StateStatusPill stateId={stateId} />
            </div>
            <div className="sprite-lab-preview-row">
              <div className="sprite-lab-preview-card">
                <p>{activeAtlas ? `${pet.label} sprite row` : 'Awaiting generated sprite row'}</p>
                {activeAtlas ? (
                  <AtlasPetAnimation
                    spritesheet={activeAtlas.spritesheet}
                    renderMeta={stateRender}
                    row={activeAtlas.row}
                    atlasCols={activeAtlas.cols}
                    atlasRows={activeAtlas.rows}
                    frameSequence={activeAtlas.frameSequence}
                    fps={activeAtlas.fps}
                    useCssMotion={!activeAtlas.usesGeneratedStates}
                  />
                ) : (
                  <div className="sprite-lab-empty-row">
                    <strong>{visualState.label}</strong>
                    <span>Use Prime idle as the reference image. No placeholder art is shown for this state.</span>
                  </div>
                )}
              </div>
              {selected && (
                <div className="sprite-lab-preview-card">
                  <p>L01 trait mock</p>
                  <TraitLooplingPreview identity={selected.identity} stateId={stateId} />
                </div>
              )}
            </div>

            {activeAtlas ? (
              <div className="sprite-lab-frame-strip">
                {activeAtlas.frameSequence.map((frame, index) => (
                  <div key={`${stateId}-${activeAtlas.row}-${index}-${frame}`} className="sprite-lab-frame">
                    <span>F{index + 1}</span>
                    <AtlasPetFrame
                      spritesheet={activeAtlas.spritesheet}
                      row={activeAtlas.row}
                      atlasCols={activeAtlas.cols}
                      atlasRows={activeAtlas.rows}
                      frame={frame}
                      size={92}
                      className={stateRender.className === 'is-dead' ? 'is-dead-frame' : stateRender.className}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="sprite-lab-generation-brief">
                <span>Next generation target</span>
                <strong>{stateContract.productionRequirement}</strong>
              </div>
            )}

            {stateId === 'idle' && (
              <details className="sprite-lab-legacy-details">
                <summary>Show accepted idle source frames</summary>
                <div className="sprite-lab-frame-strip">
                  {previewFrames.map((frame, index) => (
                    <div key={`${stateId}-${index}`} className="sprite-lab-frame">
                      <span>F{index + 1}</span>
                      <SpecialSprite
                        frames={[frame]}
                        palette={PALETTE_PRIME}
                        tier={visualState.tier}
                        memberName="prime"
                        cellSize={7}
                        gap={1}
                        rigid
                        noFrameAnim
                      />
                    </div>
                  ))}
                </div>
              </details>
            )}
          </section>

          <aside className="sprite-lab-panel sprite-lab-panel--qa">
            <h2><BadgeCheck size={16} /> Approval</h2>
            <div className="sprite-lab-approval-summary">
              <StateStatusPill stateId={stateId} />
              <strong>{stateContract.sourceType.replace(/_/g, ' ')}</strong>
            </div>
            <div className="sprite-lab-qa-list">
              {stateApprovalChecklist.map((item) => (
                <label key={item}>
                  <input type="checkbox" disabled={!isPrimeStateProductionApproved(stateId)} />
                  {item}
                </label>
              ))}
            </div>
            <div className="sprite-lab-cues">
              <h3><Sparkles size={14} /> State cues</h3>
              {animation.cues.map((cue) => <span key={cue}>{cue}</span>)}
            </div>
            <p className="sprite-lab-state-note">{stateContract.productionRequirement}</p>
          </aside>
        </section>

        <section className="sprite-lab-bottom">
          <div className="sprite-lab-panel sprite-lab-panel--factory">
            <h2><BadgeCheck size={16} /> Prime L01 rig contract</h2>
            <div className="sprite-lab-factory-grid">
              <TraitPill label="Version" value={PRIME_RIG_CONTRACT.version} />
              <TraitPill label="Cell" value={`${PRIME_RIG_CONTRACT.cell.width}x${PRIME_RIG_CONTRACT.cell.height}`} />
              <TraitPill label="States" value={`${Object.keys(PRIME_STATE_CONTRACTS).length}`} />
              <TraitPill label="Approved" value={`${Object.values(PRIME_STATE_CONTRACTS).filter((state) => state.status === 'approved' || state.status === 'production_locked').length}`} />
            </div>
            <div className="sprite-lab-lock-list">
              {PRIME_RIG_CONTRACT.identityLocks.map((lock) => <span key={lock}>{lock}</span>)}
            </div>
          </div>

          <div className="sprite-lab-panel">
            <h2><Wand2 size={16} /> Future trait mock variants</h2>
            <div className="sprite-lab-variant-grid">
              {variants.map((variant, index) => (
                <button
                  key={variant.id}
                  className={index === selectedIndex ? 'is-active' : undefined}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                >
                  <TraitLooplingPreview identity={variant.identity} stateId={stateId} />
                  <span>L{String(index + 1).padStart(2, '0')}</span>
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <div className="sprite-lab-panel">
              <h2><Eye size={16} /> Trait readout</h2>
              <div className="sprite-lab-traits">
                <TraitPill label="Body" value={selected.identity.body.label} />
                <TraitPill label="Antenna" value={selected.identity.antenna.label} />
                <TraitPill label="Eyes" value={selected.identity.eyes.label} />
                <TraitPill label="Mark" value={selected.identity.marking.label} />
                <TraitPill label="Proportion" value={selected.identity.proportion.label} />
                <TraitPill label="Pattern" value={selected.identity.microPattern.label} />
                <TraitPill label="Temperament" value={selected.identity.temperament.label} />
                <TraitPill label="Strategy" value={selected.identity.strategy.label} />
              </div>
            </div>
          )}

          <div className="sprite-lab-panel">
            <h2><TimerReset size={16} /> Future trait pool v1</h2>
            <div className="sprite-lab-trait-counts">
              {PRIME_FACTORY_TRAIT_AXES_V1.map((axis) => <TraitPill key={axis} label={axis} value="v1" />)}
              {PRIME_FACTORY_TRAIT_AXES_LATER.map((axis) => <TraitPill key={axis} label={axis} value="later" />)}
              <TraitPill label="mock axes" value={`${Object.keys(LOOPLING_TRAIT_OPTIONS).length}`} />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
