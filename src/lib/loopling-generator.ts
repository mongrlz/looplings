export const LOOPLING_GENERATOR_STATES = {
  idle: { row: 0, label: 'Idle', frameCount: 8, fps: 5 },
  thinking: { row: 1, label: 'Thinking', frameCount: 8, fps: 5 },
  acting: { row: 2, label: 'Acting', frameCount: 8, fps: 8 },
  trading: { row: 3, label: 'Trading', frameCount: 8, fps: 9 },
  trade_win: { row: 4, label: 'Trade Win', frameCount: 8, fps: 8 },
  trade_loss: { row: 5, label: 'Trade Loss', frameCount: 8, fps: 5 },
  posting: { row: 6, label: 'Posting', frameCount: 8, fps: 6 },
  receiving: { row: 7, label: 'Receiving', frameCount: 8, fps: 6 },
  sleeping: { row: 8, label: 'Sleeping', frameCount: 8, fps: 2 },
  low_compute: { row: 9, label: 'Low Compute', frameCount: 8, fps: 3 },
  critical: { row: 10, label: 'Critical', frameCount: 8, fps: 8 },
  dead: { row: 11, label: 'Dead', frameCount: 8, fps: 0 },
} as const;

export type LooplingGeneratorStateId = keyof typeof LOOPLING_GENERATOR_STATES;

export interface GeneratedTrait {
  id: string;
  label: string;
  index: number;
  placeholder: boolean;
  source: 'frozen-png-atlas';
}

export interface GeneratedLoopling {
  walletSeed: string;
  normalizedWallet: string;
  tokenId: string;
  serial: number;
  assetVariant: {
    id: string;
    label: string;
    index: number;
    atlasUrl: string;
    sourceKind: FrozenAtlasVariant['sourceKind'];
  };
  traits: {
    bodyPalette: GeneratedTrait;
    eyeStyle: GeneratedTrait;
    antennaShape: GeneratedTrait;
    antennaColor: GeneratedTrait;
    foreheadGlyph: GeneratedTrait;
  };
  personality: {
    temperament: string;
    strategyBias: string;
    voiceFlavor: string;
  };
  birthStats: {
    lineage: string;
    serial: number;
    generationLabel: string;
  };
  atlasComposition: {
    mode: 'prebaked_full_png_atlas';
    atlasUrl: string;
    metadataUrl: string;
    sourceSeed: string;
    renderer: 'canvas-atlas-frame-blit';
    cell: {
      width: number;
      height: number;
      columns: number;
      rows: number;
    };
    artPolicy: {
      usesSvg: false;
      usesCanvasDrawing: false;
      frozenAsset: true;
      note: string;
    };
  };
  nftExport: {
    standard: 'metaplex-core-draft';
    name: string;
    description: string;
    image: string;
    animationUrl: string;
    externalUrl: string;
    attributes: Array<{
      trait_type: string;
      value: string;
    }>;
    properties: {
      category: 'image';
      files: Array<{
        uri: string;
        type: string;
        purpose: string;
      }>;
    };
    canonicalAssetNote: string;
  };
}

const temperamentOptions = ['cautious', 'curious', 'stubborn', 'gentle', 'restless', 'watchful'];
const strategyOptions = ['micro-scalper', 'trend-watcher', 'runway-saver', 'social-scout', 'contrarian', 'oracle-listener'];
const voiceOptions = ['soft-terminal', 'sleepy-signal', 'bright-pulse', 'dry-log', 'tiny-prophet', 'warm-debug'];

export interface FrozenAtlasVariant {
  id: string;
  label: string;
  bodyPalette: string;
  eyeStyle: string;
  antennaShape: string;
  antennaColor: string;
  foreheadGlyph: string;
  animationProfile: 'standard-12-state';
  sourceKind: 'ai-authored-base-atlas' | 'offline-palette-bake';
}

const BASE_ATLAS_VARIANTS: FrozenAtlasVariant[] = [
  {
    id: 'pink',
    label: 'Pink Heartline',
    bodyPalette: 'Blush Pink',
    eyeStyle: 'Bright Round',
    antennaShape: 'Heart Loop',
    antennaColor: 'Soft Rose',
    foreheadGlyph: 'Tiny Heart',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'graphite',
    label: 'Graphite Reserve',
    bodyPalette: 'Graphite Gray',
    eyeStyle: 'Tired Round',
    antennaShape: 'Origin Loop',
    antennaColor: 'Cool Blue',
    foreheadGlyph: 'Black Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'mint',
    label: 'Mint Halo',
    bodyPalette: 'Mint Glass',
    eyeStyle: 'Open Round',
    antennaShape: 'Halo Loop',
    antennaColor: 'Mint Pulse',
    foreheadGlyph: 'Tiny Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
];

const RECYCLED_ANIMATION_ATLAS_IDS = new Set<string>();
const MOTION_REVIEW_ATLAS_IDS = new Set<string>();

const APPROVED_BASE_ATLAS_VARIANTS: FrozenAtlasVariant[] = BASE_ATLAS_VARIANTS.filter(
  (variant) => !RECYCLED_ANIMATION_ATLAS_IDS.has(variant.id),
);

export const QUARANTINED_RECYCLED_ANIMATION_ATLAS_VARIANTS: FrozenAtlasVariant[] = BASE_ATLAS_VARIANTS.filter(
  (variant) => RECYCLED_ANIMATION_ATLAS_IDS.has(variant.id),
);

const paletteBakeOptions = [
  { id: 'rose', label: 'Rose', bodyPalette: 'Rose Bake', antennaColor: 'Rose Signal' },
  { id: 'aqua', label: 'Aqua', bodyPalette: 'Aqua Bake', antennaColor: 'Aqua Signal' },
  { id: 'gold', label: 'Gold', bodyPalette: 'Gold Bake', antennaColor: 'Gold Signal' },
  { id: 'violet', label: 'Violet', bodyPalette: 'Violet Bake', antennaColor: 'Violet Signal' },
  { id: 'lime', label: 'Lime', bodyPalette: 'Lime Bake', antennaColor: 'Lime Signal' },
  { id: 'blue', label: 'Blue', bodyPalette: 'Blue Bake', antennaColor: 'Blue Signal' },
  { id: 'coral', label: 'Coral', bodyPalette: 'Coral Bake', antennaColor: 'Coral Signal' },
  { id: 'teal', label: 'Teal', bodyPalette: 'Teal Bake', antennaColor: 'Teal Signal' },
  { id: 'amber', label: 'Amber', bodyPalette: 'Amber Bake', antennaColor: 'Amber Signal' },
  { id: 'orchid', label: 'Orchid', bodyPalette: 'Orchid Bake', antennaColor: 'Orchid Signal' },
  { id: 'moss', label: 'Moss', bodyPalette: 'Moss Bake', antennaColor: 'Moss Signal' },
  { id: 'slate', label: 'Slate', bodyPalette: 'Slate Bake', antennaColor: 'Slate Signal' },
] as const;

export const QUARANTINED_PALETTE_BAKED_ATLAS_VARIANTS: FrozenAtlasVariant[] = BASE_ATLAS_VARIANTS.flatMap((base) =>
  paletteBakeOptions.map((palette) => ({
    id: `lab-${base.id}-${palette.id}`,
    label: `${palette.label} ${base.label.replace(/^(Pink|Graphite|Mint) /, '')}`,
    bodyPalette: palette.bodyPalette,
    eyeStyle: base.eyeStyle,
    antennaShape: base.antennaShape,
    antennaColor: palette.antennaColor,
    foreheadGlyph: base.foreheadGlyph,
    animationProfile: 'standard-12-state',
    sourceKind: 'offline-palette-bake',
  })),
);

const AI_AUTHORED_LAB_ATLAS_VARIANT_CANDIDATES: FrozenAtlasVariant[] = [
  {
    id: 'lab-ai-apricot-button',
    label: 'Apricot Button',
    bodyPalette: 'Apricot Orange',
    eyeStyle: 'Glossy Round',
    antennaShape: 'Button Stem',
    antennaColor: 'Apricot Button',
    foreheadGlyph: 'Pale Dot',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-pearl-ring',
    label: 'Pearl Ring',
    bodyPalette: 'Pearl Cream',
    eyeStyle: 'Glossy Navy',
    antennaShape: 'Canon Ring',
    antennaColor: 'Pearl Loop',
    foreheadGlyph: 'Blue Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-sky-ring',
    label: 'Sky Ring',
    bodyPalette: 'Sky Blue',
    eyeStyle: 'Midnight Round',
    antennaShape: 'Wide Ring',
    antennaColor: 'Sky Loop',
    foreheadGlyph: 'Star Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-aurora-ring',
    label: 'Aurora Ring',
    bodyPalette: 'Aurora Pearl',
    eyeStyle: 'Navy Round',
    antennaShape: 'Canon Ring',
    antennaColor: 'Aurora Loop',
    foreheadGlyph: 'Pale Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-seafoam-leaf',
    label: 'Seafoam Leaf',
    bodyPalette: 'Seafoam Green',
    eyeStyle: 'Glossy Teal',
    antennaShape: 'Leaf Stem',
    antennaColor: 'Seafoam Leaf',
    foreheadGlyph: 'Aqua Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-cobalt-pebble',
    label: 'Cobalt Pebble',
    bodyPalette: 'Cobalt Blue',
    eyeStyle: 'Glossy Round',
    antennaShape: 'Pebble Stem',
    antennaColor: 'Sky Pearl',
    foreheadGlyph: 'Moon Dot',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-lavender-star',
    label: 'Lavender Star',
    bodyPalette: 'Pearl Lavender',
    eyeStyle: 'Starry Round',
    antennaShape: 'Diamond Loop',
    antennaColor: 'Ice Blue',
    foreheadGlyph: 'Crescent Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-peach-sundot',
    label: 'Peach Sundot',
    bodyPalette: 'Peach Honey',
    eyeStyle: 'Amber Round',
    antennaShape: 'Heart Knot',
    antennaColor: 'Leaf Gold',
    foreheadGlyph: 'Sun Dot',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-blue-twin',
    label: 'Blue Twin',
    bodyPalette: 'Sky Blue',
    eyeStyle: 'Bright Round',
    antennaShape: 'Twin Loop',
    antennaColor: 'Cool Cyan',
    foreheadGlyph: 'Blue Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-ember-kite',
    label: 'Ember Kite',
    bodyPalette: 'Ember Orange',
    eyeStyle: 'Bright Round',
    antennaShape: 'Kite Loop',
    antennaColor: 'Copper Signal',
    foreheadGlyph: 'Ember Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-violet-bow',
    label: 'Violet Bow',
    bodyPalette: 'Violet Grape',
    eyeStyle: 'Glossy Round',
    antennaShape: 'Bow Loop',
    antennaColor: 'Violet Loop',
    foreheadGlyph: 'Violet Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-nova-star',
    label: 'Nova Star',
    bodyPalette: 'Warm Pearl',
    eyeStyle: 'Bright Round',
    antennaShape: 'Star Loop',
    antennaColor: 'Gold Signal',
    foreheadGlyph: 'Amber Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-spark-ring',
    label: 'Spark Ring',
    bodyPalette: 'Spark Gold',
    eyeStyle: 'Bright Round',
    antennaShape: 'Canon Ring',
    antennaColor: 'Gold Loop',
    foreheadGlyph: 'Tiny Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-storm-loop',
    label: 'Storm Loop',
    bodyPalette: 'Storm Lavender',
    eyeStyle: 'Bright Round',
    antennaShape: 'Signal Loop',
    antennaColor: 'Storm Blue',
    foreheadGlyph: 'Storm Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-verdant-leaf',
    label: 'Verdant Leaf',
    bodyPalette: 'Verdant Green',
    eyeStyle: 'Olive Round',
    antennaShape: 'Leaf Loop',
    antennaColor: 'Verdant Signal',
    foreheadGlyph: 'Green Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-cast-apricot-button',
    label: 'Cast Apricot Button',
    bodyPalette: 'Apricot Cream',
    eyeStyle: 'Blue Button Gloss',
    antennaShape: 'Button Ring',
    antennaColor: 'Apricot Signal',
    foreheadGlyph: 'Button Dot',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-cast-teal-crescent',
    label: 'Cast Teal Crescent',
    bodyPalette: 'Deep Teal',
    eyeStyle: 'Sleepy Silver',
    antennaShape: 'Crescent Loop',
    antennaColor: 'Teal Moon',
    foreheadGlyph: 'Aqua Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-cast-lavender-wishstar',
    label: 'Cast Lavender Wishstar',
    bodyPalette: 'Lavender Glow',
    eyeStyle: 'Violet Star Gloss',
    antennaShape: 'Wish Star',
    antennaColor: 'Lilac Signal',
    foreheadGlyph: 'Violet Spark',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-cast-charcoal-square',
    label: 'Cast Charcoal Square',
    bodyPalette: 'Charcoal Gray',
    eyeStyle: 'Tired Blue',
    antennaShape: 'Square Loop',
    antennaColor: 'Cyan Frame',
    foreheadGlyph: 'Cyan Square',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-cast-coral-twinloop',
    label: 'Cast Coral Twinloop',
    bodyPalette: 'Coral Orange',
    eyeStyle: 'Amber Broadcast',
    antennaShape: 'Twin Loop Bow',
    antennaColor: 'Coral Signal',
    foreheadGlyph: 'Coral Asterisk',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-cast-frost-diamond',
    label: 'Cast Frost Diamond',
    bodyPalette: 'Frost White',
    eyeStyle: 'Teal Glass',
    antennaShape: 'Diamond Loop',
    antennaColor: 'Ice Blue',
    foreheadGlyph: 'Snow Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-cast-moss-leaf',
    label: 'Cast Moss Leaf',
    bodyPalette: 'Moss Olive',
    eyeStyle: 'Olive Gloss',
    antennaShape: 'Veined Leaf',
    antennaColor: 'Moss Signal',
    foreheadGlyph: 'Seed Array',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-cast-cobalt-moon',
    label: 'Cast Cobalt Moon',
    bodyPalette: 'Cobalt Blue',
    eyeStyle: 'Midnight Round',
    antennaShape: 'Moon Ring',
    antennaColor: 'Royal Moon',
    foreheadGlyph: 'Moon Spark',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-cast-rose-bow',
    label: 'Cast Rose Bow',
    bodyPalette: 'Rose Pink',
    eyeStyle: 'Lash Pink Gloss',
    antennaShape: 'Bow Loop',
    antennaColor: 'Rose Ribbon',
    foreheadGlyph: 'Rose Knot',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-cast-honey-coin',
    label: 'Cast Honey Coin',
    bodyPalette: 'Honey Gold',
    eyeStyle: 'Amber Coin Gloss',
    antennaShape: 'Coin Ring',
    antennaColor: 'Gold Edge',
    foreheadGlyph: 'Honey Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-cast-pearl-monk',
    label: 'Cast Pearl Monk',
    bodyPalette: 'Pearl Grey',
    eyeStyle: 'Half-Lidded Slate',
    antennaShape: 'Plain Monk Ring',
    antennaColor: 'Silver Loop',
    foreheadGlyph: 'Still Cross',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
  {
    id: 'lab-ai-cast-cherry-flame',
    label: 'Cast Cherry Flame',
    bodyPalette: 'Cherry Ember',
    eyeStyle: 'Orange Flame Gloss',
    antennaShape: 'Flame Loop',
    antennaColor: 'Ember Signal',
    foreheadGlyph: 'Flame Diamond',
    animationProfile: 'standard-12-state',
    sourceKind: 'ai-authored-base-atlas',
  },
];

const AI_AUTHORED_LAB_ATLAS_VARIANTS = AI_AUTHORED_LAB_ATLAS_VARIANT_CANDIDATES.filter(
  (variant) => !RECYCLED_ANIMATION_ATLAS_IDS.has(variant.id) && !MOTION_REVIEW_ATLAS_IDS.has(variant.id),
);

export const QUARANTINED_RECYCLED_LAB_ATLAS_VARIANTS = AI_AUTHORED_LAB_ATLAS_VARIANT_CANDIDATES.filter(
  (variant) => RECYCLED_ANIMATION_ATLAS_IDS.has(variant.id),
);

export const QUARANTINED_MOTION_REVIEW_LAB_ATLAS_VARIANTS = AI_AUTHORED_LAB_ATLAS_VARIANT_CANDIDATES.filter(
  (variant) => MOTION_REVIEW_ATLAS_IDS.has(variant.id),
);

export const FROZEN_ATLAS_VARIANTS: FrozenAtlasVariant[] = [
  ...APPROVED_BASE_ATLAS_VARIANTS,
  ...AI_AUTHORED_LAB_ATLAS_VARIANTS,
];

export const FROZEN_ATLAS_VARIANT_COUNT = FROZEN_ATLAS_VARIANTS.length;
export const AI_AUTHORED_FROZEN_ATLAS_VARIANTS = FROZEN_ATLAS_VARIANTS.filter(
  (variant) => variant.sourceKind === 'ai-authored-base-atlas',
);
export const AI_AUTHORED_FROZEN_ATLAS_VARIANT_COUNT = AI_AUTHORED_FROZEN_ATLAS_VARIANTS.length;
export const QUARANTINED_PALETTE_BAKED_ATLAS_VARIANT_COUNT = QUARANTINED_PALETTE_BAKED_ATLAS_VARIANTS.length;
export const QUARANTINED_RECYCLED_ANIMATION_ATLAS_VARIANT_COUNT =
  QUARANTINED_RECYCLED_ANIMATION_ATLAS_VARIANTS.length + QUARANTINED_RECYCLED_LAB_ATLAS_VARIANTS.length;
export const QUARANTINED_MOTION_REVIEW_ATLAS_VARIANT_COUNT = QUARANTINED_MOTION_REVIEW_LAB_ATLAS_VARIANTS.length;

function stableHash(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function pickIndex(seed: string, label: string, count: number) {
  if (count <= 0) return 0;
  return stableHash(`${label}:${seed}`) % count;
}

function makeTrait(
  id: string,
  label: string,
  index: number,
): GeneratedTrait {
  return { id, label, index, placeholder: false, source: 'frozen-png-atlas' };
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function generateLooplingFromWallet(
  walletAddress: string,
  options: { lineage?: string; serial?: number; sourceKind?: 'all' | 'ai-authored-base-atlas' } = {},
): GeneratedLoopling {
  const normalizedWallet = walletAddress.trim() || '8xPrimePathCGenesisPreview111111111111111111';
  const seed = normalizedWallet.toLowerCase();
  const variantPool = options.sourceKind === 'ai-authored-base-atlas' ? AI_AUTHORED_FROZEN_ATLAS_VARIANTS : FROZEN_ATLAS_VARIANTS;
  const serial = options.serial ?? pickIndex(seed, 'frozen-atlas-variant', variantPool.length);
  const poolSerial = ((serial % variantPool.length) + variantPool.length) % variantPool.length;
  const variant = variantPool[poolSerial];
  const safeSerial = FROZEN_ATLAS_VARIANTS.findIndex((item) => item.id === variant.id);
  const tokenId = `L01-A${String(safeSerial + 1).padStart(3, '0')}`;
  const atlasUrl = `/pets/${variant.id}/state-atlas.png`;
  const metadataUrl = `/pets/${variant.id}/state-atlas.json`;
  const attributes = [
    { trait_type: 'Lineage', value: options.lineage ?? 'prime-family/path-c-lab' },
    { trait_type: 'Asset Variant', value: variant.label },
    { trait_type: 'Body Palette', value: variant.bodyPalette },
    { trait_type: 'Eye Style', value: variant.eyeStyle },
    { trait_type: 'Antenna Shape', value: variant.antennaShape },
    { trait_type: 'Antenna Color', value: variant.antennaColor },
    { trait_type: 'Forehead Glyph', value: variant.foreheadGlyph },
    { trait_type: 'Animation Profile', value: variant.animationProfile },
    { trait_type: 'Asset Source', value: variant.sourceKind },
  ];

  return {
    walletSeed: normalizedWallet,
    normalizedWallet: seed,
    tokenId,
    serial: safeSerial,
    assetVariant: {
      id: variant.id,
      label: variant.label,
      index: safeSerial,
      atlasUrl,
      sourceKind: variant.sourceKind,
    },
    traits: {
      bodyPalette: makeTrait(
        slug(variant.bodyPalette),
        variant.bodyPalette,
        safeSerial,
      ),
      eyeStyle: makeTrait(
        slug(variant.eyeStyle),
        variant.eyeStyle,
        safeSerial,
      ),
      antennaShape: makeTrait(
        slug(variant.antennaShape),
        variant.antennaShape,
        safeSerial,
      ),
      antennaColor: makeTrait(
        slug(variant.antennaColor),
        variant.antennaColor,
        safeSerial,
      ),
      foreheadGlyph: makeTrait(
        slug(variant.foreheadGlyph),
        variant.foreheadGlyph,
        safeSerial,
      ),
    },
    personality: {
      temperament: temperamentOptions[pickIndex(seed, 'temperament', temperamentOptions.length)],
      strategyBias: strategyOptions[pickIndex(seed, 'strategy', strategyOptions.length)],
      voiceFlavor: voiceOptions[pickIndex(seed, 'voice', voiceOptions.length)],
    },
    birthStats: {
      lineage: options.lineage ?? 'prime-family/path-c-lab',
      serial: safeSerial,
      generationLabel: 'Frozen atlas Path C lab',
    },
    atlasComposition: {
      mode: 'prebaked_full_png_atlas',
      atlasUrl,
      metadataUrl,
      sourceSeed: variant.id,
      renderer: 'canvas-atlas-frame-blit',
      cell: {
        width: 192,
        height: 208,
        columns: 8,
        rows: 12,
      },
      artPolicy: {
        usesSvg: false,
        usesCanvasDrawing: false,
        frozenAsset: true,
        note: 'This lab renders only frozen monolithic PNG state atlases. The canvas copies baked atlas cells only; it does not draw, recolor, overlay, scale, rotate, or mutate trait geometry in the browser.',
      },
    },
    nftExport: {
      standard: 'metaplex-core-draft',
      name: `Loopling ${tokenId}`,
      description: 'A wallet-deterministic Loopling rendered from one frozen 12-state PNG animation atlas.',
      image: atlasUrl,
      animationUrl: atlasUrl,
      externalUrl: `https://looplings.xyz/looplings/${tokenId}`,
      attributes,
      properties: {
        category: 'image',
        files: [
          {
            uri: atlasUrl,
            type: 'image/png',
            purpose: 'canonical 8x12 animated sprite atlas',
          },
          {
            uri: metadataUrl,
            type: 'application/json',
            purpose: 'state grid and animation contract',
          },
        ],
      },
      canonicalAssetNote: 'The NFT points at the finished full atlas asset. Trait fields describe provenance and selection, but they are not required to reconstruct the visual in a marketplace renderer.',
    },
  };
}
