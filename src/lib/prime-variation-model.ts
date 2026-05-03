import { hashCode, seededRandom } from '@/lib/sprite-generator';
import type { LooplingVisualStateId } from '@/lib/loopling-traits';

export const PRIME_VARIATION_SCHEMA_VERSION = 'prime-nft.v1' as const;

export type PrimeVariationSchemaVersion = typeof PRIME_VARIATION_SCHEMA_VERSION;
export type PrimeVariationRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type PrimeVisibleStateId = Exclude<LooplingVisualStateId, 'prediction_win'>;
export type PrimeVariationAxis =
  | 'body_palette'
  | 'eye_style'
  | 'antenna_shape'
  | 'antenna_color'
  | 'forehead_mark'
  | 'expression_set';

export interface PrimeVariationOptionBase<Axis extends PrimeVariationAxis> {
  id: string;
  axis: Axis;
  label: string;
  rarity: PrimeVariationRarity;
  weight: number;
  promptTag: string;
}

export interface PrimeBodyPaletteOption extends PrimeVariationOptionBase<'body_palette'> {
  colors: {
    body: string;
    shadow: string;
    highlight: string;
    detail: string;
  };
}

export interface PrimeEyeStyleOption extends PrimeVariationOptionBase<'eye_style'> {
  pupil: 'round' | 'oval' | 'soft-square' | 'sleepy-arc' | 'star-glint';
  highlight: 'single-blue' | 'double-blue' | 'cyan-rim' | 'none';
}

export interface PrimeAntennaShapeOption extends PrimeVariationOptionBase<'antenna_shape'> {
  silhouette: 'single-loop' | 'halo-loop' | 'teardrop-loop' | 'double-loop' | 'soft-spiral';
}

export interface PrimeAntennaColorOption extends PrimeVariationOptionBase<'antenna_color'> {
  color: string;
  glow: string;
}

export interface PrimeForeheadMarkOption extends PrimeVariationOptionBase<'forehead_mark'> {
  glyph: 'dot' | 'twin-dot' | 'vertical-dots' | 'diamond' | 'tiny-circuit' | 'none';
}

export interface PrimeExpressionDescriptor {
  eyes: 'neutral' | 'focused' | 'bright' | 'worried' | 'sleepy' | 'dim';
  mouth: 'none' | 'tiny-flat' | 'tiny-smile' | 'tiny-frown' | 'open-pixel';
  brow?: 'soft' | 'intent' | 'anxious';
}

export interface PrimeExpressionSetOption extends PrimeVariationOptionBase<'expression_set'> {
  expressions: Record<PrimeVisibleStateId, PrimeExpressionDescriptor>;
}

export interface PrimeVariationTraits {
  schemaVersion: PrimeVariationSchemaVersion;
  seed: string;
  tokenId: string;
  serial: number;
  bodyPalette: string;
  eyeStyle: string;
  antennaShape: string;
  antennaColor: string;
  foreheadMark: string;
  expressionSet: string;
}

export interface PrimeResolvedVariation {
  id: string;
  schemaVersion: PrimeVariationSchemaVersion;
  seed: string;
  tokenId: string;
  serial: number;
  bodyPalette: PrimeBodyPaletteOption;
  eyeStyle: PrimeEyeStyleOption;
  antennaShape: PrimeAntennaShapeOption;
  antennaColor: PrimeAntennaColorOption;
  foreheadMark: PrimeForeheadMarkOption;
  expressionSet: PrimeExpressionSetOption;
  rarityScore: number;
}

export const PRIME_VARIATION_AXES_V1: PrimeVariationAxis[] = [
  'body_palette',
  'eye_style',
  'antenna_shape',
  'antenna_color',
  'forehead_mark',
  'expression_set',
];

export const PRIME_BODY_PALETTES_V1: PrimeBodyPaletteOption[] = [
  {
    id: 'origin-pearl',
    axis: 'body_palette',
    label: 'Origin Pearl',
    rarity: 'common',
    weight: 32,
    promptTag: 'pearl-white Prime L01 body with pale blue reserved details',
    colors: { body: '#fffdf2', shadow: '#d8dde6', highlight: '#ffffff', detail: '#e7f7ff' },
  },
  {
    id: 'moon-milk',
    axis: 'body_palette',
    label: 'Moon Milk',
    rarity: 'common',
    weight: 22,
    promptTag: 'warm moon-white Prime L01 body, still mostly pearl-white',
    colors: { body: '#fff7e8', shadow: '#dccfc0', highlight: '#ffffff', detail: '#eaf6ff' },
  },
  {
    id: 'opal-static',
    axis: 'body_palette',
    label: 'Opal Static',
    rarity: 'uncommon',
    weight: 14,
    promptTag: 'opal-white Prime L01 body with faint cyan and pink pixel undertones',
    colors: { body: '#f8fff9', shadow: '#c9dbd8', highlight: '#ffffff', detail: '#dffbff' },
  },
  {
    id: 'cloud-silver',
    axis: 'body_palette',
    label: 'Cloud Silver',
    rarity: 'uncommon',
    weight: 12,
    promptTag: 'cool silver-white Prime L01 body with soft blue-gray shading',
    colors: { body: '#f2f7fa', shadow: '#b8c2cf', highlight: '#ffffff', detail: '#dceeff' },
  },
  {
    id: 'soft-blush',
    axis: 'body_palette',
    label: 'Soft Blush',
    rarity: 'rare',
    weight: 6,
    promptTag: 'pearl-white Prime L01 body with a restrained pink survival blush',
    colors: { body: '#fff0f0', shadow: '#dec3c8', highlight: '#ffffff', detail: '#ffe3e8' },
  },
  {
    id: 'genesis-glow',
    axis: 'body_palette',
    label: 'Genesis Glow',
    rarity: 'legendary',
    weight: 2,
    promptTag: 'pearl-white Prime L01 body with subtle internal pale-blue glow',
    colors: { body: '#fffff6', shadow: '#bfd6e2', highlight: '#ffffff', detail: '#bff3ff' },
  },
];

export const PRIME_EYE_STYLES_V1: PrimeEyeStyleOption[] = [
  { id: 'glassy-round', axis: 'eye_style', label: 'Glassy Round', rarity: 'common', weight: 30, promptTag: 'large dark glassy round eyes with tiny blue highlights', pupil: 'round', highlight: 'single-blue' },
  { id: 'soft-oval', axis: 'eye_style', label: 'Soft Oval', rarity: 'common', weight: 22, promptTag: 'large dark soft oval eyes with blue highlights', pupil: 'oval', highlight: 'single-blue' },
  { id: 'screen-glint', axis: 'eye_style', label: 'Screen Glint', rarity: 'uncommon', weight: 14, promptTag: 'dark eyes with small cyan screen-like rim highlights', pupil: 'soft-square', highlight: 'cyan-rim' },
  { id: 'sleepy-lids', axis: 'eye_style', label: 'Sleepy Lids', rarity: 'uncommon', weight: 10, promptTag: 'gentle half-lidded dark eyes, still cute and readable', pupil: 'sleepy-arc', highlight: 'single-blue' },
  { id: 'star-cache', axis: 'eye_style', label: 'Star Cache', rarity: 'rare', weight: 4, promptTag: 'dark glassy eyes with tiny star-like blue glints', pupil: 'star-glint', highlight: 'double-blue' },
];

export const PRIME_ANTENNA_SHAPES_V1: PrimeAntennaShapeOption[] = [
  { id: 'origin-loop', axis: 'antenna_shape', label: 'Origin Loop', rarity: 'common', weight: 34, promptTag: 'single glowing loop antenna attached to the top of Prime head', silhouette: 'single-loop' },
  { id: 'halo-loop', axis: 'antenna_shape', label: 'Halo Loop', rarity: 'common', weight: 18, promptTag: 'small halo-like loop antenna attached by a short stem', silhouette: 'halo-loop' },
  { id: 'teardrop-loop', axis: 'antenna_shape', label: 'Teardrop Loop', rarity: 'uncommon', weight: 14, promptTag: 'small teardrop-shaped loop antenna, centered on top of head', silhouette: 'teardrop-loop' },
  { id: 'double-signal', axis: 'antenna_shape', label: 'Double Signal', rarity: 'rare', weight: 6, promptTag: 'tiny double-loop signal antenna, still compact and attached to head', silhouette: 'double-loop' },
  { id: 'soft-spiral', axis: 'antenna_shape', label: 'Soft Spiral', rarity: 'legendary', weight: 2, promptTag: 'tiny soft spiral loop antenna, glowing but not oversized', silhouette: 'soft-spiral' },
];

export const PRIME_ANTENNA_COLORS_V1: PrimeAntennaColorOption[] = [
  { id: 'signal-blue', axis: 'antenna_color', label: 'Signal Blue', rarity: 'common', weight: 30, promptTag: 'pale blue glowing antenna signal', color: '#bdefff', glow: '#e7f7ff' },
  { id: 'mint-pulse', axis: 'antenna_color', label: 'Mint Pulse', rarity: 'common', weight: 18, promptTag: 'soft mint glowing antenna signal', color: '#bdfbe6', glow: '#e9fff6' },
  { id: 'violet-thread', axis: 'antenna_color', label: 'Violet Thread', rarity: 'uncommon', weight: 12, promptTag: 'soft violet glowing antenna signal', color: '#d8c7ff', glow: '#f0eaff' },
  { id: 'golden-runway', axis: 'antenna_color', label: 'Golden Runway', rarity: 'rare', weight: 6, promptTag: 'tiny warm gold glowing antenna signal', color: '#ffe08a', glow: '#fff4c4' },
  { id: 'redline-critical', axis: 'antenna_color', label: 'Redline Critical', rarity: 'legendary', weight: 2, promptTag: 'tiny restrained red-orange antenna signal, only a subtle accent', color: '#ff8f70', glow: '#ffd0c2' },
];

export const PRIME_FOREHEAD_MARKS_V1: PrimeForeheadMarkOption[] = [
  { id: 'reserved-dot', axis: 'forehead_mark', label: 'Reserved Dot', rarity: 'common', weight: 28, promptTag: 'one tiny pale-blue reserved dot centered below antenna', glyph: 'dot' },
  { id: 'twin-reserve', axis: 'forehead_mark', label: 'Twin Reserve', rarity: 'common', weight: 18, promptTag: 'two tiny pale-blue reserved dots centered below antenna', glyph: 'twin-dot' },
  { id: 'vertical-reserve', axis: 'forehead_mark', label: 'Vertical Reserve', rarity: 'uncommon', weight: 12, promptTag: 'three tiny vertical pale-blue reserved pixels below antenna', glyph: 'vertical-dots' },
  { id: 'diamond-cache', axis: 'forehead_mark', label: 'Diamond Cache', rarity: 'rare', weight: 5, promptTag: 'tiny pale-blue diamond mark centered below antenna', glyph: 'diamond' },
  { id: 'circuit-seed', axis: 'forehead_mark', label: 'Circuit Seed', rarity: 'legendary', weight: 2, promptTag: 'tiny pale-blue circuit-like mark centered below antenna', glyph: 'tiny-circuit' },
];

const protectedMelancholyExpressions: Record<PrimeVisibleStateId, PrimeExpressionDescriptor> = {
  idle: { eyes: 'neutral', mouth: 'tiny-flat', brow: 'soft' },
  thinking: { eyes: 'focused', mouth: 'none', brow: 'intent' },
  acting: { eyes: 'focused', mouth: 'tiny-flat', brow: 'intent' },
  trading: { eyes: 'focused', mouth: 'none', brow: 'intent' },
  trade_win: { eyes: 'bright', mouth: 'tiny-smile' },
  trade_loss: { eyes: 'worried', mouth: 'tiny-frown', brow: 'anxious' },
  posting: { eyes: 'focused', mouth: 'tiny-flat' },
  receiving: { eyes: 'bright', mouth: 'tiny-flat', brow: 'soft' },
  sleeping: { eyes: 'sleepy', mouth: 'none' },
  low_compute: { eyes: 'worried', mouth: 'tiny-frown', brow: 'anxious' },
  critical: { eyes: 'worried', mouth: 'open-pixel', brow: 'anxious' },
  dead: { eyes: 'dim', mouth: 'none' },
};

export const PRIME_EXPRESSION_SETS_V1: PrimeExpressionSetOption[] = [
  {
    id: 'protected-melancholy',
    axis: 'expression_set',
    label: 'Protected Melancholy',
    rarity: 'common',
    weight: 26,
    promptTag: 'slightly melancholic protected-creature expression language',
    expressions: protectedMelancholyExpressions,
  },
  {
    id: 'curious-survivor',
    axis: 'expression_set',
    label: 'Curious Survivor',
    rarity: 'common',
    weight: 18,
    promptTag: 'curious but fragile survivor expression language',
    expressions: {
      ...protectedMelancholyExpressions,
      idle: { eyes: 'bright', mouth: 'tiny-flat' },
      trading: { eyes: 'focused', mouth: 'open-pixel' },
      receiving: { eyes: 'bright', mouth: 'tiny-smile' },
    },
  },
  {
    id: 'quiet-oracle',
    axis: 'expression_set',
    label: 'Quiet Oracle',
    rarity: 'rare',
    weight: 5,
    promptTag: 'quiet oracle expression language, still fragile and readable',
    expressions: {
      ...protectedMelancholyExpressions,
      idle: { eyes: 'sleepy', mouth: 'none', brow: 'soft' },
      thinking: { eyes: 'focused', mouth: 'tiny-flat', brow: 'intent' },
      trade_win: { eyes: 'bright', mouth: 'tiny-flat' },
    },
  },
];

export const PRIME_VARIATION_OPTIONS_V1 = {
  body_palette: PRIME_BODY_PALETTES_V1,
  eye_style: PRIME_EYE_STYLES_V1,
  antenna_shape: PRIME_ANTENNA_SHAPES_V1,
  antenna_color: PRIME_ANTENNA_COLORS_V1,
  forehead_mark: PRIME_FOREHEAD_MARKS_V1,
  expression_set: PRIME_EXPRESSION_SETS_V1,
} as const;

export function getPrimeVariationCombinationCount() {
  return PRIME_VARIATION_AXES_V1.reduce(
    (total, axis) => total * PRIME_VARIATION_OPTIONS_V1[axis].length,
    1,
  );
}

function pickWeighted<Option extends { weight: number }>(options: Option[], random: () => number): Option {
  const total = options.reduce((sum, option) => sum + option.weight, 0);
  let cursor = random() * total;
  for (const option of options) {
    cursor -= option.weight;
    if (cursor <= 0) return option;
  }
  return options[options.length - 1];
}

function rarityScore(rarity: PrimeVariationRarity) {
  switch (rarity) {
    case 'legendary':
      return 40;
    case 'rare':
      return 18;
    case 'uncommon':
      return 7;
    default:
      return 1;
  }
}

export function createPrimeVariation(seed: string, serial = 0): PrimeResolvedVariation {
  const normalizedSeed = seed.trim().toLowerCase() || 'prime-genesis';
  const random = seededRandom(hashCode(`${PRIME_VARIATION_SCHEMA_VERSION}:${normalizedSeed}:${serial}`));
  const bodyPalette = pickWeighted(PRIME_BODY_PALETTES_V1, random);
  const eyeStyle = pickWeighted(PRIME_EYE_STYLES_V1, random);
  const antennaShape = pickWeighted(PRIME_ANTENNA_SHAPES_V1, random);
  const antennaColor = pickWeighted(PRIME_ANTENNA_COLORS_V1, random);
  const foreheadMark = pickWeighted(PRIME_FOREHEAD_MARKS_V1, random);
  const expressionSet = pickWeighted(PRIME_EXPRESSION_SETS_V1, random);
  const tokenId = `L01-${String(serial + 1).padStart(5, '0')}`;
  const traits = [bodyPalette, eyeStyle, antennaShape, antennaColor, foreheadMark, expressionSet];

  return {
    id: `${normalizedSeed}-${tokenId}`,
    schemaVersion: PRIME_VARIATION_SCHEMA_VERSION,
    seed: normalizedSeed,
    tokenId,
    serial,
    bodyPalette,
    eyeStyle,
    antennaShape,
    antennaColor,
    foreheadMark,
    expressionSet,
    rarityScore: traits.reduce((score, trait) => score + rarityScore(trait.rarity), 0),
  };
}

export function createPrimeVariations(seed: string, count = 24): PrimeResolvedVariation[] {
  const safeCount = Math.max(0, Math.floor(count));
  return Array.from({ length: safeCount }, (_, index) => createPrimeVariation(seed, index));
}

export function getPrimeVariationTraits(variation: PrimeResolvedVariation): PrimeVariationTraits {
  return {
    schemaVersion: variation.schemaVersion,
    seed: variation.seed,
    tokenId: variation.tokenId,
    serial: variation.serial,
    bodyPalette: variation.bodyPalette.id,
    eyeStyle: variation.eyeStyle.id,
    antennaShape: variation.antennaShape.id,
    antennaColor: variation.antennaColor.id,
    foreheadMark: variation.foreheadMark.id,
    expressionSet: variation.expressionSet.id,
  };
}
