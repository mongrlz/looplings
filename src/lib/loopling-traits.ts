import {
  CURRENT_SPRITE_VERSION,
  createSpriteIdentity,
  getPaletteForSpriteIdentity,
  hashCode,
  seededRandom,
  type SpriteIdentity,
  type SurvivalTier,
} from '@/lib/sprite-generator';

export const LOOPLING_TRAIT_SCHEMA_VERSION = 'sprite-lab.v1' as const;

export type LooplingTraitSchemaVersion = typeof LOOPLING_TRAIT_SCHEMA_VERSION;
export type LooplingTraitRarity = 'common' | 'uncommon' | 'rare';
export type LooplingTraitAxis =
  | 'body'
  | 'antenna'
  | 'eyes'
  | 'marking'
  | 'proportion'
  | 'microPattern'
  | 'temperament'
  | 'strategy';

export interface LooplingTraitOption {
  id: string;
  axis: LooplingTraitAxis;
  label: string;
  rarity: LooplingTraitRarity;
}

export interface LooplingIdentityTraits {
  schemaVersion: LooplingTraitSchemaVersion;
  spriteVersion: typeof CURRENT_SPRITE_VERSION;
  seed: string;
  name: string;
  walletAddress: string;
  spriteIdentity: SpriteIdentity;
  body: LooplingTraitOption;
  antenna: LooplingTraitOption;
  eyes: LooplingTraitOption;
  marking: LooplingTraitOption;
  proportion: LooplingTraitOption;
  microPattern: LooplingTraitOption;
  temperament: LooplingTraitOption;
  strategy: LooplingTraitOption;
}

export type LooplingVisualStateId =
  | 'idle'
  | 'thinking'
  | 'acting'
  | 'trading'
  | 'trade_win'
  | 'trade_loss'
  | 'prediction_win'
  | 'posting'
  | 'receiving'
  | 'sleeping'
  | 'low_compute'
  | 'critical'
  | 'dead';

export type LooplingAnimationLoop = 'loop' | 'once' | 'hold';
export type LooplingAnimationCue =
  | 'float'
  | 'blink'
  | 'antenna-pulse'
  | 'shake'
  | 'scanline'
  | 'desaturate'
  | 'glitch'
  | 'badge-flash'
  | 'celebrate';

export interface LooplingAnimationMetadata {
  id: string;
  stateId: LooplingVisualStateId;
  label: string;
  frameCount: number;
  fps: number;
  loop: LooplingAnimationLoop;
  cues: LooplingAnimationCue[];
}

export interface LooplingVisualStateDefinition {
  id: LooplingVisualStateId;
  label: string;
  tier: SurvivalTier;
  animationId: string;
}

export interface LooplingSpriteLabVariant {
  id: string;
  identity: LooplingIdentityTraits;
  visualStateId: LooplingVisualStateId;
  animation: LooplingAnimationMetadata;
  palettePreview: {
    body: string;
    eyes: string;
    claws: string;
    detail: string;
  };
}

const BODY_TRAITS: LooplingTraitOption[] = [
  { id: 'prime-l01', axis: 'body', label: 'Prime L01', rarity: 'common' },
  { id: 'bean', axis: 'body', label: 'Bean', rarity: 'common' },
  { id: 'capsule', axis: 'body', label: 'Capsule', rarity: 'common' },
  { id: 'shell', axis: 'body', label: 'Shell', rarity: 'uncommon' },
  { id: 'ghost-shell', axis: 'body', label: 'Ghost Shell', rarity: 'rare' },
];

const ANTENNA_TRAITS: LooplingTraitOption[] = [
  { id: 'o-ring', axis: 'antenna', label: 'O-Ring', rarity: 'common' },
  { id: 'halo', axis: 'antenna', label: 'Halo Loop', rarity: 'common' },
  { id: 'infinity', axis: 'antenna', label: 'Infinity', rarity: 'common' },
  { id: 'double-loop', axis: 'antenna', label: 'Double Loop', rarity: 'uncommon' },
  { id: 'mobius', axis: 'antenna', label: 'Mobius', rarity: 'uncommon' },
  { id: 'spiral', axis: 'antenna', label: 'Spiral', rarity: 'rare' },
  { id: 'broken', axis: 'antenna', label: 'Broken Loop', rarity: 'rare' },
  { id: 'glitch-loop', axis: 'antenna', label: 'Glitch Loop', rarity: 'rare' },
];

const EYE_TRAITS: LooplingTraitOption[] = [
  { id: 'round', axis: 'eyes', label: 'Round', rarity: 'common' },
  { id: 'oval', axis: 'eyes', label: 'Oval', rarity: 'common' },
  { id: 'glassy', axis: 'eyes', label: 'Glassy', rarity: 'common' },
  { id: 'sleepy', axis: 'eyes', label: 'Sleepy', rarity: 'uncommon' },
  { id: 'worried', axis: 'eyes', label: 'Worried', rarity: 'uncommon' },
  { id: 'determined', axis: 'eyes', label: 'Determined', rarity: 'rare' },
  { id: 'screen', axis: 'eyes', label: 'Screen', rarity: 'rare' },
];

const MARKING_TRAITS: LooplingTraitOption[] = [
  { id: 'none', axis: 'marking', label: 'None', rarity: 'common' },
  { id: 'reserved-dots', axis: 'marking', label: 'Reserved Dots', rarity: 'common' },
  { id: 'diamond', axis: 'marking', label: 'Diamond', rarity: 'common' },
  { id: 'circuit', axis: 'marking', label: 'Circuit', rarity: 'uncommon' },
  { id: 'wallet-glyph', axis: 'marking', label: 'Wallet Glyph', rarity: 'rare' },
];

const PROPORTION_TRAITS: LooplingTraitOption[] = [
  { id: 'balanced', axis: 'proportion', label: 'Balanced', rarity: 'common' },
  { id: 'big-head', axis: 'proportion', label: 'Big Head', rarity: 'common' },
  { id: 'stubby', axis: 'proportion', label: 'Stubby', rarity: 'common' },
  { id: 'wide-cheek', axis: 'proportion', label: 'Wide Cheek', rarity: 'uncommon' },
  { id: 'tiny-body', axis: 'proportion', label: 'Tiny Body', rarity: 'rare' },
];

const MICRO_PATTERN_TRAITS: LooplingTraitOption[] = [
  { id: 'clean', axis: 'microPattern', label: 'Clean', rarity: 'common' },
  { id: 'cheek-pixels', axis: 'microPattern', label: 'Cheek Pixels', rarity: 'common' },
  { id: 'circuit-freckles', axis: 'microPattern', label: 'Circuit Freckles', rarity: 'uncommon' },
  { id: 'soft-glitch', axis: 'microPattern', label: 'Soft Glitch', rarity: 'rare' },
];

const TEMPERAMENT_TRAITS: LooplingTraitOption[] = [
  { id: 'curious', axis: 'temperament', label: 'Curious', rarity: 'common' },
  { id: 'cautious', axis: 'temperament', label: 'Cautious', rarity: 'common' },
  { id: 'bold', axis: 'temperament', label: 'Bold', rarity: 'uncommon' },
  { id: 'stubborn', axis: 'temperament', label: 'Stubborn', rarity: 'rare' },
];

const STRATEGY_TRAITS: LooplingTraitOption[] = [
  { id: 'watcher', axis: 'strategy', label: 'Watcher', rarity: 'common' },
  { id: 'scalper', axis: 'strategy', label: 'Scalper', rarity: 'common' },
  { id: 'trend-rider', axis: 'strategy', label: 'Trend Rider', rarity: 'uncommon' },
  { id: 'contrarian', axis: 'strategy', label: 'Contrarian', rarity: 'rare' },
];

export const LOOPLING_TRAIT_OPTIONS = {
  body: BODY_TRAITS,
  antenna: ANTENNA_TRAITS,
  eyes: EYE_TRAITS,
  marking: MARKING_TRAITS,
  proportion: PROPORTION_TRAITS,
  microPattern: MICRO_PATTERN_TRAITS,
  temperament: TEMPERAMENT_TRAITS,
  strategy: STRATEGY_TRAITS,
} as const;

export const LOOPLING_ANIMATIONS: Record<LooplingVisualStateId, LooplingAnimationMetadata> = {
  idle: {
    id: 'anim_idle',
    stateId: 'idle',
    label: 'Idle',
    frameCount: 2,
    fps: 2,
    loop: 'loop',
    cues: ['float', 'blink'],
  },
  thinking: {
    id: 'anim_thinking',
    stateId: 'thinking',
    label: 'Thinking',
    frameCount: 2,
    fps: 3,
    loop: 'loop',
    cues: ['blink', 'scanline', 'antenna-pulse'],
  },
  acting: {
    id: 'anim_acting',
    stateId: 'acting',
    label: 'Acting',
    frameCount: 2,
    fps: 4,
    loop: 'loop',
    cues: ['float', 'antenna-pulse'],
  },
  trading: {
    id: 'anim_trading',
    stateId: 'trading',
    label: 'Trading',
    frameCount: 2,
    fps: 5,
    loop: 'loop',
    cues: ['antenna-pulse', 'scanline'],
  },
  trade_win: {
    id: 'anim_trade_win',
    stateId: 'trade_win',
    label: 'Trade Win',
    frameCount: 4,
    fps: 6,
    loop: 'once',
    cues: ['celebrate', 'antenna-pulse', 'badge-flash'],
  },
  trade_loss: {
    id: 'anim_trade_loss',
    stateId: 'trade_loss',
    label: 'Trade Loss',
    frameCount: 4,
    fps: 4,
    loop: 'once',
    cues: ['blink', 'desaturate'],
  },
  prediction_win: {
    id: 'anim_prediction_win',
    stateId: 'prediction_win',
    label: 'Prediction Win',
    frameCount: 4,
    fps: 6,
    loop: 'once',
    cues: ['celebrate', 'antenna-pulse', 'badge-flash'],
  },
  posting: {
    id: 'anim_posting',
    stateId: 'posting',
    label: 'Posting',
    frameCount: 2,
    fps: 3,
    loop: 'once',
    cues: ['blink', 'antenna-pulse'],
  },
  receiving: {
    id: 'anim_receiving',
    stateId: 'receiving',
    label: 'Receiving',
    frameCount: 2,
    fps: 3,
    loop: 'once',
    cues: ['blink', 'scanline'],
  },
  sleeping: {
    id: 'anim_sleeping',
    stateId: 'sleeping',
    label: 'Sleeping',
    frameCount: 2,
    fps: 1,
    loop: 'loop',
    cues: ['float', 'desaturate'],
  },
  low_compute: {
    id: 'anim_low_compute',
    stateId: 'low_compute',
    label: 'Low Compute',
    frameCount: 2,
    fps: 2,
    loop: 'loop',
    cues: ['antenna-pulse', 'desaturate'],
  },
  critical: {
    id: 'anim_critical',
    stateId: 'critical',
    label: 'Critical',
    frameCount: 2,
    fps: 12,
    loop: 'loop',
    cues: ['shake', 'antenna-pulse', 'scanline', 'glitch'],
  },
  dead: {
    id: 'anim_dead',
    stateId: 'dead',
    label: 'Dead',
    frameCount: 1,
    fps: 0,
    loop: 'hold',
    cues: ['desaturate'],
  },
};

export const LOOPLING_VISUAL_STATES: Record<LooplingVisualStateId, LooplingVisualStateDefinition> = {
  idle: { id: 'idle', label: 'Idle', tier: 'normal', animationId: LOOPLING_ANIMATIONS.idle.id },
  thinking: { id: 'thinking', label: 'Thinking', tier: 'normal', animationId: LOOPLING_ANIMATIONS.thinking.id },
  acting: { id: 'acting', label: 'Acting', tier: 'normal', animationId: LOOPLING_ANIMATIONS.acting.id },
  trading: { id: 'trading', label: 'Trading', tier: 'normal', animationId: LOOPLING_ANIMATIONS.trading.id },
  trade_win: { id: 'trade_win', label: 'Trade Win', tier: 'normal', animationId: LOOPLING_ANIMATIONS.trade_win.id },
  trade_loss: { id: 'trade_loss', label: 'Trade Loss', tier: 'normal', animationId: LOOPLING_ANIMATIONS.trade_loss.id },
  prediction_win: { id: 'prediction_win', label: 'Prediction Win', tier: 'normal', animationId: LOOPLING_ANIMATIONS.prediction_win.id },
  posting: { id: 'posting', label: 'Posting', tier: 'normal', animationId: LOOPLING_ANIMATIONS.posting.id },
  receiving: { id: 'receiving', label: 'Receiving', tier: 'normal', animationId: LOOPLING_ANIMATIONS.receiving.id },
  sleeping: { id: 'sleeping', label: 'Sleeping', tier: 'normal', animationId: LOOPLING_ANIMATIONS.sleeping.id },
  low_compute: { id: 'low_compute', label: 'Low Compute', tier: 'low_compute', animationId: LOOPLING_ANIMATIONS.low_compute.id },
  critical: { id: 'critical', label: 'Critical', tier: 'critical', animationId: LOOPLING_ANIMATIONS.critical.id },
  dead: { id: 'dead', label: 'Dead', tier: 'dead', animationId: LOOPLING_ANIMATIONS.dead.id },
};

export const LOOPLING_SAMPLE_STATE_IDS: LooplingVisualStateId[] = [
  'idle',
  'thinking',
  'trading',
  'trade_win',
  'prediction_win',
  'posting',
  'low_compute',
  'critical',
  'dead',
];

function pickTrait(options: LooplingTraitOption[], random: () => number): LooplingTraitOption {
  return options[Math.floor(random() * options.length)] ?? options[0];
}

function createSampleWalletAddress(seed: string, index: number): string {
  const chunks = Array.from({ length: 5 }, (_, chunkIndex) =>
    hashCode(`${LOOPLING_TRAIT_SCHEMA_VERSION}:wallet:${seed}:${index}:${chunkIndex}`)
      .toString(16)
      .padStart(8, '0'),
  );

  return `0x${chunks.join('').slice(0, 40)}`;
}

export function createLooplingIdentityTraits(seed: string, index = 0): LooplingIdentityTraits {
  const normalizedSeed = seed.trim().toLowerCase() || 'loopling';
  const random = seededRandom(hashCode(`${LOOPLING_TRAIT_SCHEMA_VERSION}:traits:${normalizedSeed}:${index}`));
  const walletAddress = createSampleWalletAddress(normalizedSeed, index);

  return {
    schemaVersion: LOOPLING_TRAIT_SCHEMA_VERSION,
    spriteVersion: CURRENT_SPRITE_VERSION,
    seed: normalizedSeed,
    name: `Loopling ${index + 1}`,
    walletAddress,
    spriteIdentity: createSpriteIdentity(walletAddress),
    body: pickTrait(BODY_TRAITS, random),
    antenna: pickTrait(ANTENNA_TRAITS, random),
    eyes: pickTrait(EYE_TRAITS, random),
    marking: pickTrait(MARKING_TRAITS, random),
    proportion: pickTrait(PROPORTION_TRAITS, random),
    microPattern: pickTrait(MICRO_PATTERN_TRAITS, random),
    temperament: pickTrait(TEMPERAMENT_TRAITS, random),
    strategy: pickTrait(STRATEGY_TRAITS, random),
  };
}

export function createLooplingSpriteLabVariant(
  seed: string,
  index = 0,
  visualStateId: LooplingVisualStateId = LOOPLING_SAMPLE_STATE_IDS[index % LOOPLING_SAMPLE_STATE_IDS.length] ?? 'idle',
): LooplingSpriteLabVariant {
  const identity = createLooplingIdentityTraits(seed, index);

  return {
    id: `${identity.seed}-${index}-${visualStateId}`,
    identity,
    visualStateId,
    animation: LOOPLING_ANIMATIONS[visualStateId],
    palettePreview: getPaletteForSpriteIdentity(identity.spriteIdentity),
  };
}

export function createLooplingSpriteLabVariants(seed: string, count = 6): LooplingSpriteLabVariant[] {
  const safeCount = Math.max(0, Math.floor(count));

  return Array.from({ length: safeCount }, (_, index) =>
    createLooplingSpriteLabVariant(seed, index, LOOPLING_SAMPLE_STATE_IDS[index % LOOPLING_SAMPLE_STATE_IDS.length]),
  );
}
