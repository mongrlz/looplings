/**
 * Loopling Sprite Utilities
 *
 * Tier system, color palettes, and palette manipulation.
 * Sprite rendering/generation is handled separately.
 */

export type SurvivalTier = 'normal' | 'low_compute' | 'critical' | 'dead';

export const CURRENT_SPRITE_VERSION = 'v1' as const;
export type SpriteVersion = typeof CURRENT_SPRITE_VERSION;

/**
 * Immutable sprite identity captured when a Loopling is created.
 * Persist this object per bot to avoid accidental visual drift on future code updates.
 */
export interface SpriteIdentity {
  version: SpriteVersion;
  bodySeed: number;
  paletteSeed: number;
  lineageId: string;
  paletteLineageIds?: string[];
  paletteLineageWeights?: number[];
}

// ─── Color Palettes (body, eyes, claws, detail) ──────
export const PALETTES = [
  { body: '#FF6B6B', eyes: '#FFFFFF', claws: '#FF3333', detail: '#FFB4B4' },
  { body: '#A855F7', eyes: '#FFFFFF', claws: '#7C3AED', detail: '#D8B4FE' },
  { body: '#3B82F6', eyes: '#FFFFFF', claws: '#1D4ED8', detail: '#93C5FD' },
  { body: '#10B981', eyes: '#FFFFFF', claws: '#047857', detail: '#6EE7B7' },
  { body: '#F59E0B', eyes: '#FFFFFF', claws: '#B45309', detail: '#FCD34D' },
  { body: '#EF4444', eyes: '#FFFFFF', claws: '#991B1B', detail: '#FCA5A5' },
  { body: '#8B5CF6', eyes: '#FFFFFF', claws: '#5B21B6', detail: '#C4B5FD' },
  { body: '#14B8A6', eyes: '#FFFFFF', claws: '#0F766E', detail: '#5EEAD4' },
  { body: '#EC4899', eyes: '#FFFFFF', claws: '#9D174D', detail: '#F9A8D4' },
  { body: '#F97316', eyes: '#FFFFFF', claws: '#9A3412', detail: '#FDBA74' },
  { body: '#06B6D4', eyes: '#FFFFFF', claws: '#0E7490', detail: '#67E8F9' },
  { body: '#84CC16', eyes: '#FFFFFF', claws: '#4D7C0F', detail: '#BEF264' },
  { body: '#E879F9', eyes: '#FFFFFF', claws: '#A21CAF', detail: '#F0ABFC' },
  { body: '#FB923C', eyes: '#FFFFFF', claws: '#C2410C', detail: '#FED7AA' },
  { body: '#38BDF8', eyes: '#FFFFFF', claws: '#0369A1', detail: '#BAE6FD' },
  { body: '#FACC15', eyes: '#333333', claws: '#A16207', detail: '#FEF08A' },
];

export type Palette = (typeof PALETTES)[number];
type PaletteSource = { lineageId: string; weight: number };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Hashing ──────

export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// ─── Color manipulation ──────

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

export function mixColor(hex: string, target: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(hex);
  const [r2, g2, b2] = hexToRgb(target);
  return rgbToHex(
    Math.round(r1 + (r2 - r1) * amount),
    Math.round(g1 + (g2 - g1) * amount),
    Math.round(b1 + (b2 - b1) * amount),
  );
}

export function desaturate(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
  return rgbToHex(
    Math.round(r + (gray - r) * amount),
    Math.round(g + (gray - g) * amount),
    Math.round(b + (gray - b) * amount),
  );
}

export function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    Math.round(r * (1 - amount)),
    Math.round(g * (1 - amount)),
    Math.round(b * (1 - amount)),
  );
}

function normalizePaletteSources(sources: PaletteSource[]): PaletteSource[] {
  const aggregated = new Map<string, number>();

  sources.forEach(({ lineageId, weight }) => {
    const normalizedLineageId = lineageId.toLowerCase();
    const safeWeight = Number.isFinite(weight) && weight > 0 ? weight : 0;
    if (!safeWeight) return;
    aggregated.set(normalizedLineageId, (aggregated.get(normalizedLineageId) ?? 0) + safeWeight);
  });

  const total = [...aggregated.values()].reduce((sum, value) => sum + value, 0);
  if (total <= 0) return [];

  return [...aggregated.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([lineageId, weight]) => ({
      lineageId,
      weight: weight / total,
    }));
}

function getPaletteSourcesForIdentity(identity: SpriteIdentity): PaletteSource[] {
  const lineageIds = identity.paletteLineageIds?.length
    ? identity.paletteLineageIds
    : [identity.lineageId];

  const providedWeights = identity.paletteLineageWeights;
  const sources = lineageIds.map((lineageId, index) => ({
    lineageId,
    weight: providedWeights?.[index] ?? 1,
  }));

  return normalizePaletteSources(sources);
}

function getLineageBasePalette(lineageId: string): Palette {
  const lineageHash = hashCode(`${CURRENT_SPRITE_VERSION}:lineage:${lineageId.toLowerCase()}`);
  return PALETTES[lineageHash % PALETTES.length];
}

function blendHexColors(weightedColors: Array<{ hex: string; weight: number }>): string {
  let red = 0;
  let green = 0;
  let blue = 0;
  let totalWeight = 0;

  weightedColors.forEach(({ hex, weight }) => {
    if (!Number.isFinite(weight) || weight <= 0) return;
    const [r, g, b] = hexToRgb(hex);
    red += r * weight;
    green += g * weight;
    blue += b * weight;
    totalWeight += weight;
  });

  if (totalWeight <= 0) return '#000000';

  return rgbToHex(
    Math.round(red / totalWeight),
    Math.round(green / totalWeight),
    Math.round(blue / totalWeight),
  );
}

function blendPalettes(sources: PaletteSource[]): Palette {
  const weightedPalettes = sources.map(({ lineageId, weight }) => ({
    palette: getLineageBasePalette(lineageId),
    weight,
  }));

  return {
    body: blendHexColors(weightedPalettes.map(({ palette, weight }) => ({ hex: palette.body, weight }))),
    eyes: blendHexColors(weightedPalettes.map(({ palette, weight }) => ({ hex: palette.eyes, weight }))),
    claws: blendHexColors(weightedPalettes.map(({ palette, weight }) => ({ hex: palette.claws, weight }))),
    detail: blendHexColors(weightedPalettes.map(({ palette, weight }) => ({ hex: palette.detail, weight }))),
  };
}

function buildSpriteIdentity(address: string, lineageId: string, paletteSources?: PaletteSource[]): SpriteIdentity {
  const normalizedAddress = address.toLowerCase();
  const normalizedLineageId = lineageId.toLowerCase();
  const resolvedSources = normalizePaletteSources(
    paletteSources?.length
      ? paletteSources
      : [{ lineageId: normalizedLineageId, weight: 1 }],
  );

  const paletteSignature = resolvedSources.map(({ lineageId: sourceId, weight }) => `${sourceId}:${weight.toFixed(6)}`).join('|');
  const singleSource = resolvedSources.length === 1 && resolvedSources[0]?.lineageId === normalizedLineageId;

  const identity: SpriteIdentity = {
    version: CURRENT_SPRITE_VERSION,
    bodySeed: hashCode(`${CURRENT_SPRITE_VERSION}:body:${normalizedAddress}`),
    paletteSeed: singleSource
      ? hashCode(`${CURRENT_SPRITE_VERSION}:palette:${normalizedLineageId}:${normalizedAddress}`)
      : hashCode(`${CURRENT_SPRITE_VERSION}:palette:${paletteSignature}:${normalizedAddress}`),
    lineageId: normalizedLineageId,
  };

  if (!singleSource) {
    identity.paletteLineageIds = resolvedSources.map(({ lineageId: sourceId }) => sourceId);
    identity.paletteLineageWeights = resolvedSources.map(({ weight }) => weight);
  }

  return identity;
}

// ─── Identity + lineage palette generation ──────

export function createLineageId(founderAddress: string): string {
  const normalized = founderAddress.toLowerCase();
  const suffix = hashCode(normalized).toString(16).padStart(8, '0');
  return `lineage_${suffix}`;
}

export function createHybridLineageId(lineageIds: string[]): string {
  const normalizedIds = normalizePaletteSources(lineageIds.map((lineageId) => ({ lineageId, weight: 1 })))
    .map(({ lineageId }) => lineageId);

  if (normalizedIds.length <= 1) {
    return normalizedIds[0] ?? createLineageId('hybrid');
  }

  const suffix = hashCode(`${CURRENT_SPRITE_VERSION}:hybrid:${normalizedIds.join('|')}`)
    .toString(16)
    .padStart(8, '0');

  return `lineage_mix_${suffix}`;
}

/**
 * Create deterministic sprite identity at mint time.
 * For descendants, pass parent lineageId to preserve bloodline color family.
 */
export function createSpriteIdentity(address: string, lineageId?: string): SpriteIdentity {
  const normalized = address.toLowerCase();
  const resolvedLineageId = lineageId ?? createLineageId(normalized);
  return buildSpriteIdentity(normalized, resolvedLineageId);
}

export function createOffspringSpriteIdentity(
  address: string,
  parents: Array<SpriteIdentity | string>,
): SpriteIdentity {
  if (parents.length === 0) {
    return createSpriteIdentity(address);
  }

  const parentShare = 1 / parents.length;
  const inheritedSources: PaletteSource[] = [];

  parents.forEach((parent) => {
    const parentSources = typeof parent === 'string'
      ? normalizePaletteSources([{ lineageId: parent, weight: 1 }])
      : getPaletteSourcesForIdentity(parent);

    parentSources.forEach(({ lineageId, weight }) => {
      inheritedSources.push({
        lineageId,
        weight: weight * parentShare,
      });
    });
  });

  const resolvedSources = normalizePaletteSources(inheritedSources);
  const hybridLineageId = createHybridLineageId(resolvedSources.map(({ lineageId }) => lineageId));

  return buildSpriteIdentity(address, hybridLineageId, resolvedSources);
}

/**
 * Bloodline palette: same lineage keeps the same base color family,
 * while each member receives deterministic shade variations.
 */
export function getPaletteForSpriteIdentity(identity: SpriteIdentity): Palette {
  const paletteSources = getPaletteSourcesForIdentity(identity);
  const lineageHash = paletteSources.length === 1
    ? hashCode(`${CURRENT_SPRITE_VERSION}:lineage:${paletteSources[0].lineageId}`)
    : hashCode(
      `${CURRENT_SPRITE_VERSION}:lineage:${paletteSources
        .map(({ lineageId, weight }) => `${lineageId}:${weight.toFixed(6)}`)
        .join('|')}`,
    );
  const base = paletteSources.length === 1
    ? getLineageBasePalette(paletteSources[0].lineageId)
    : blendPalettes(paletteSources);

  const random = seededRandom(identity.paletteSeed ^ lineageHash);
  const brighten = random() >= 0.45;
  const shadeTarget = brighten ? '#FFFFFF' : '#0B1220';
  const bodyAmount = 0.08 + random() * 0.22;
  const clawsAmount = clamp(bodyAmount * (0.8 + random() * 0.28), 0.06, 0.34);
  const detailAmount = clamp(bodyAmount * (1.02 + random() * 0.24), 0.08, 0.4);
  const eyesTarget = brighten ? '#FFFFFF' : '#BFC8D4';
  const eyesAmount = brighten ? 0.04 + random() * 0.1 : 0.14 + random() * 0.14;

  return {
    body: mixColor(base.body, shadeTarget, bodyAmount),
    eyes: mixColor(base.eyes, eyesTarget, eyesAmount),
    claws: mixColor(base.claws, shadeTarget, clawsAmount),
    detail: mixColor(base.detail, shadeTarget, detailAmount),
  };
}

// ─── Tier palette shift ──────

export function applyTierToPalette(
  palette: Palette,
  tier: SurvivalTier,
): Palette {
  switch (tier) {
    case 'normal':
      return palette;
    case 'low_compute':
      return {
        body: desaturate(darken(palette.body, 0.15), 0.35),
        eyes: desaturate(palette.eyes, 0.3),
        claws: desaturate(darken(palette.claws, 0.2), 0.35),
        detail: desaturate(darken(palette.detail, 0.15), 0.35),
      };
    case 'critical':
      return {
        body: mixColor(darken(palette.body, 0.35), '#FF0000', 0.45),
        eyes: mixColor(palette.eyes, '#FF4444', 0.5),
        claws: mixColor(darken(palette.claws, 0.4), '#CC0000', 0.5),
        detail: mixColor(darken(palette.detail, 0.3), '#FF2222', 0.4),
      };
    case 'dead':
      return {
        body: desaturate(darken(palette.body, 0.5), 0.95),
        eyes: '#555555',
        claws: desaturate(darken(palette.claws, 0.55), 0.95),
        detail: desaturate(darken(palette.detail, 0.5), 0.95),
      };
  }
}

// ─── Tier utilities ──────

export function getTierColor(tier: SurvivalTier): string {
  switch (tier) {
    case 'normal':      return '#10B981';
    case 'low_compute': return '#F59E0B';
    case 'critical':    return '#EF4444';
    case 'dead':        return '#6B7280';
  }
}

export function getTierLabel(tier: SurvivalTier): string {
  switch (tier) {
    case 'normal':      return 'NORMAL';
    case 'low_compute': return 'LOW COMPUTE';
    case 'critical':    return 'CRITICAL';
    case 'dead':        return 'DEAD';
  }
}

/** Frame toggle speed in ms. 0 = static (dead). */
export function getTierAnimSpeed(tier: SurvivalTier): number {
  switch (tier) {
    case 'normal':      return 600;
    case 'low_compute': return 300;
    case 'critical':    return 80;
    case 'dead':        return 0;
  }
}

/**
 * Legacy deterministic palette from wallet address.
 * Kept for backwards compatibility when no sprite identity exists.
 */
export function getPaletteForAddress(address: string): Palette {
  const hash = hashCode(address.toLowerCase());
  const random = seededRandom(hash);
  const idx = Math.floor(random() * PALETTES.length);
  return PALETTES[idx];
}
