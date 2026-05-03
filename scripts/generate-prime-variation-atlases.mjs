import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourcePackPath = path.join(root, 'public/pets/prime-test/source-pack/prime-l01-source-pack.v1.json');
const baseAtlasPath = path.join(root, 'public/pets/prime-test/state-atlas.png');
const traitRegistryPath = path.join(root, 'public/pets/prime-test/traits/prime-trait-registry.v1.json');
const generatedRoot = path.join(root, 'public/pets/prime-test/generated');

const schemaVersion = 'prime-nft.v1';
const outputSchemaVersion = 'prime-generated-atlas-pack.v1';
const defaultSeed = 'prime-genesis';
const defaultCount = 24;
const cellWidth = 192;
const cellHeight = 208;
const columns = 8;
const rows = 12;

const bodyPalettes = [
  { id: 'origin-pearl', label: 'Origin Pearl', rarity: 'common', weight: 32, colors: { body: '#fffdf2', shadow: '#d8dde6', highlight: '#ffffff', detail: '#e7f7ff' } },
  { id: 'moon-milk', label: 'Moon Milk', rarity: 'common', weight: 22, colors: { body: '#fff7e8', shadow: '#dccfc0', highlight: '#ffffff', detail: '#eaf6ff' } },
  { id: 'opal-static', label: 'Opal Static', rarity: 'uncommon', weight: 14, colors: { body: '#f8fff9', shadow: '#c9dbd8', highlight: '#ffffff', detail: '#dffbff' } },
  { id: 'cloud-silver', label: 'Cloud Silver', rarity: 'uncommon', weight: 12, colors: { body: '#f2f7fa', shadow: '#b8c2cf', highlight: '#ffffff', detail: '#dceeff' } },
  { id: 'soft-blush', label: 'Soft Blush', rarity: 'rare', weight: 6, colors: { body: '#fff0f0', shadow: '#dec3c8', highlight: '#ffffff', detail: '#ffe3e8' } },
  { id: 'genesis-glow', label: 'Genesis Glow', rarity: 'legendary', weight: 2, colors: { body: '#fffff6', shadow: '#bfd6e2', highlight: '#ffffff', detail: '#bff3ff' } },
];

const eyeStyles = [
  { id: 'glassy-round', label: 'Glassy Round', rarity: 'common', weight: 30 },
  { id: 'soft-oval', label: 'Soft Oval', rarity: 'common', weight: 22 },
  { id: 'screen-glint', label: 'Screen Glint', rarity: 'uncommon', weight: 14 },
  { id: 'sleepy-lids', label: 'Sleepy Lids', rarity: 'uncommon', weight: 10 },
  { id: 'star-cache', label: 'Star Cache', rarity: 'rare', weight: 4 },
];

const antennaShapes = [
  { id: 'origin-loop', label: 'Origin Loop', rarity: 'common', weight: 34 },
  { id: 'halo-loop', label: 'Halo Loop', rarity: 'common', weight: 18 },
  { id: 'teardrop-loop', label: 'Teardrop Loop', rarity: 'uncommon', weight: 14 },
  { id: 'double-signal', label: 'Double Signal', rarity: 'rare', weight: 6 },
  { id: 'soft-spiral', label: 'Soft Spiral', rarity: 'legendary', weight: 2 },
];

const antennaColors = [
  { id: 'signal-blue', label: 'Signal Blue', rarity: 'common', weight: 30, color: '#bdefff', glow: '#e7f7ff' },
  { id: 'mint-pulse', label: 'Mint Pulse', rarity: 'common', weight: 18, color: '#bdfbe6', glow: '#e9fff6' },
  { id: 'violet-thread', label: 'Violet Thread', rarity: 'uncommon', weight: 12, color: '#d8c7ff', glow: '#f0eaff' },
  { id: 'golden-runway', label: 'Golden Runway', rarity: 'rare', weight: 6, color: '#ffe08a', glow: '#fff4c4' },
  { id: 'redline-critical', label: 'Redline Critical', rarity: 'legendary', weight: 2, color: '#ff8f70', glow: '#ffd0c2' },
];

const foreheadMarks = [
  { id: 'reserved-dot', label: 'Reserved Dot', rarity: 'common', weight: 28, glyph: 'dot' },
  { id: 'twin-reserve', label: 'Twin Reserve', rarity: 'common', weight: 18, glyph: 'twin-dot' },
  { id: 'vertical-reserve', label: 'Vertical Reserve', rarity: 'uncommon', weight: 12, glyph: 'vertical-dots' },
  { id: 'diamond-cache', label: 'Diamond Cache', rarity: 'rare', weight: 5, glyph: 'diamond' },
  { id: 'circuit-seed', label: 'Circuit Seed', rarity: 'legendary', weight: 2, glyph: 'tiny-circuit' },
];

const expressionSets = [
  { id: 'protected-melancholy', label: 'Protected Melancholy', rarity: 'common', weight: 26 },
  { id: 'curious-survivor', label: 'Curious Survivor', rarity: 'common', weight: 18 },
  { id: 'quiet-oracle', label: 'Quiet Oracle', rarity: 'rare', weight: 5 },
];

function hashCode(str) {
  let hash = 0;
  for (let index = 0; index < str.length; index += 1) {
    hash = ((hash << 5) - hash) + str.charCodeAt(index);
    hash &= hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function pickWeighted(options, random) {
  const total = options.reduce((sum, option) => sum + option.weight, 0);
  let cursor = random() * total;
  for (const option of options) {
    cursor -= option.weight;
    if (cursor <= 0) return option;
  }
  return options[options.length - 1];
}

function createVariation(seed, serial) {
  const normalizedSeed = seed.trim().toLowerCase() || defaultSeed;
  const random = seededRandom(hashCode(`${schemaVersion}:${normalizedSeed}:${serial}`));
  const bodyPalette = pickWeighted(bodyPalettes, random);
  const eyeStyle = pickWeighted(eyeStyles, random);
  const antennaShape = pickWeighted(antennaShapes, random);
  const antennaColor = pickWeighted(antennaColors, random);
  const foreheadMark = pickWeighted(foreheadMarks, random);
  const expressionSet = pickWeighted(expressionSets, random);
  const tokenId = `L01-${String(serial + 1).padStart(5, '0')}`;

  return {
    schemaVersion,
    seed: normalizedSeed,
    tokenId,
    serial,
    bodyPalette,
    eyeStyle,
    antennaShape,
    antennaColor,
    foreheadMark,
    expressionSet,
  };
}

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function mix(source, target, amount) {
  return {
    r: clampChannel(source.r + (target.r - source.r) * amount),
    g: clampChannel(source.g + (target.g - source.g) * amount),
    b: clampChannel(source.b + (target.b - source.b) * amount),
  };
}

function luminance({ r, g, b }) {
  return r * 0.299 + g * 0.587 + b * 0.114;
}

function saturation({ r, g, b }) {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function classifyPrimePixel(pixel, x, y) {
  if (pixel.a <= 8) return 'transparent';

  const light = luminance(pixel);
  const chroma = saturation(pixel);
  const cyanSignal = pixel.g > 105 && pixel.b > 120 && pixel.r < 205 && pixel.g > pixel.r + 16 && pixel.b > pixel.r + 16;
  const inAntennaZone = y < 58;
  const inForeheadZone = y >= 54 && y <= 88 && x >= 78 && x <= 114;

  if (inAntennaZone && cyanSignal) return 'antenna';
  if (inForeheadZone && cyanSignal) return 'mark';
  if (light < 54) return 'preserve';
  if (pixel.b > 70 && pixel.g > 64 && light < 118 && chroma > 28) return 'preserve';
  if (chroma < 88 && light >= 225) return 'body-highlight';
  if (chroma < 104 && light >= 155) return 'body';
  if (chroma < 124 && light >= 78) return 'body-shadow';

  return 'preserve';
}

function recolorPrimePixel(pixelClass, source, variation) {
  switch (pixelClass) {
    case 'body-highlight':
      return mix(source, hexToRgb(variation.bodyPalette.colors.highlight), 0.72);
    case 'body':
      return mix(source, hexToRgb(variation.bodyPalette.colors.body), 0.82);
    case 'body-shadow':
      return mix(source, hexToRgb(variation.bodyPalette.colors.shadow), 0.76);
    case 'antenna':
      return mix(source, hexToRgb(variation.antennaColor.color), 0.9);
    case 'mark':
      return mix(source, hexToRgb(variation.bodyPalette.colors.detail), 0.82);
    default:
      return source;
  }
}

function pixelOffset(x, y, width) {
  return (y * width + x) * 4;
}

function sourcePixel(data, index) {
  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
    a: data[index + 3],
  };
}

function alphaBlendPixel(output, index, source) {
  const sourceAlpha = source.a / 255;
  if (sourceAlpha <= 0) return;

  const baseAlpha = output[index + 3] / 255;
  const outputAlpha = sourceAlpha + baseAlpha * (1 - sourceAlpha);
  if (outputAlpha <= 0) return;

  output[index] = clampChannel((source.r * sourceAlpha + output[index] * baseAlpha * (1 - sourceAlpha)) / outputAlpha);
  output[index + 1] = clampChannel((source.g * sourceAlpha + output[index + 1] * baseAlpha * (1 - sourceAlpha)) / outputAlpha);
  output[index + 2] = clampChannel((source.b * sourceAlpha + output[index + 2] * baseAlpha * (1 - sourceAlpha)) / outputAlpha);
  output[index + 3] = clampChannel(outputAlpha * 255);
}

function sourceLooksLikeAntennaForErase(pixel, x, y) {
  if (pixel.a <= 8) return false;

  const light = luminance(pixel);
  const cyanSignal = pixel.g > 86 && pixel.b > 100 && pixel.r < 225 && pixel.g > pixel.r + 4 && pixel.b > pixel.r + 8;
  const blueChroma = pixel.b > 62 && pixel.g > 58 && pixel.r < 170 && pixel.b > pixel.r + 8;
  const standingZone = y < 72;
  const sidewaysDeadZone = x > 124 && y > 78 && y < 150;

  return cyanSignal || blueChroma || ((standingZone || sidewaysDeadZone) && light < 86);
}

function recolorAntennaLayerPixel(pixel, variation) {
  if (pixel.a <= 8) return pixel;
  if (luminance(pixel) < 70) return pixel;

  const target = hexToRgb(pixel.a < 180 ? variation.antennaColor.glow : variation.antennaColor.color);
  const amount = pixel.a < 180 ? 0.72 : 0.92;
  const recolored = mix(pixel, target, amount);

  return { ...recolored, a: pixel.a };
}

function applyAntennaShapeLayer(output, sourceData, info, variation, layerAssets) {
  if (variation.antennaShape.id !== 'origin-loop') return false;
  if (!layerAssets?.antennaMask || !layerAssets.antennaShapes.has(variation.antennaShape.id)) return false;

  const layer = layerAssets.antennaShapes.get(variation.antennaShape.id);

  for (let index = 0; index < output.length; index += 4) {
    if (layerAssets.antennaMask[index + 3] <= 8) continue;

    const pixelIndex = index / 4;
    const atlasX = pixelIndex % info.width;
    const atlasY = Math.floor(pixelIndex / info.width);
    const localX = atlasX % cellWidth;
    const localY = atlasY % cellHeight;
    const original = sourcePixel(sourceData, index);

    if (sourceLooksLikeAntennaForErase(original, localX, localY)) output[index + 3] = 0;
  }

  for (let index = 0; index < output.length; index += 4) {
    const alpha = layer.data[index + 3];
    if (alpha <= 8) continue;

    const pixelIndex = index / 4;
    const atlasX = pixelIndex % info.width;
    const atlasY = Math.floor(pixelIndex / info.width);
    const localX = atlasX % cellWidth;
    const localY = atlasY % cellHeight;
    const original = sourcePixel(sourceData, index);

    if (original.a > 8 && !sourceLooksLikeAntennaForErase(original, localX, localY)) continue;

    alphaBlendPixel(output, index, recolorAntennaLayerPixel({
      r: layer.data[index],
      g: layer.data[index + 1],
      b: layer.data[index + 2],
      a: alpha,
    }, variation));
  }

  return true;
}

function isOriginalForeheadMarkPixel(pixel, x, y) {
  if (pixel.a <= 8) return false;
  if (x < 80 || x > 112 || y < 60 || y > 96) return false;

  const light = luminance(pixel);
  const chroma = saturation(pixel);
  const cyanSignal = pixel.g > 105 && pixel.b > 120 && pixel.r < 215 && pixel.g > pixel.r + 8 && pixel.b > pixel.r + 8;
  const warmMark = pixel.r > 176 && pixel.r < 250 && pixel.g > 140 && pixel.g < 238 && pixel.b > 112 && pixel.b < 230 && pixel.r > pixel.b + 6 && light < 246 && chroma > 4;
  const neutralDeadMark = light > 74 && light < 178 && chroma < 18 && x > 86 && x < 110 && y > 66 && y < 92;

  return cyanSignal || warmMark || neutralDeadMark;
}

function frameMarkAnchor(sourceData, info, row, frame) {
  const startX = frame * cellWidth;
  const startY = row * cellHeight;
  let count = 0;
  let sumX = 0;
  let sumY = 0;

  for (let y = 0; y < cellHeight; y += 1) {
    for (let x = 0; x < cellWidth; x += 1) {
      const index = pixelOffset(startX + x, startY + y, info.width);
      const pixel = sourcePixel(sourceData, index);
      if (!isOriginalForeheadMarkPixel(pixel, x, y)) continue;

      count += 1;
      sumX += x;
      sumY += y;
    }
  }

  if (count > 0) return { x: Math.round(sumX / count), y: Math.round(sumY / count) };
  return row === 11 ? { x: 102, y: 86 } : { x: 96, y: 78 };
}

function markAnchors(sourceData, info) {
  return Array.from({ length: rows * columns }, (_, index) => {
    const row = Math.floor(index / columns);
    const frame = index % columns;
    return frameMarkAnchor(sourceData, info, row, frame);
  });
}

function putAtlasPixel(output, info, x, y, color, alpha = 255) {
  if (x < 0 || x >= info.width || y < 0 || y >= info.height) return;

  const index = pixelOffset(x, y, info.width);
  output[index] = color.r;
  output[index + 1] = color.g;
  output[index + 2] = color.b;
  output[index + 3] = alpha;
}

function drawDot(output, info, x, y, color) {
  for (let dy = 0; dy < 2; dy += 1) {
    for (let dx = 0; dx < 2; dx += 1) {
      putAtlasPixel(output, info, x + dx, y + dy, color);
    }
  }
}

function drawForeheadGlyph(output, info, startX, startY, anchor, glyph, color) {
  const cx = startX + anchor.x;
  const cy = startY + anchor.y;

  if (glyph === 'dot') {
    drawDot(output, info, cx - 1, cy - 1, color);
    return;
  }

  if (glyph === 'twin-dot') {
    drawDot(output, info, cx - 1, cy - 4, color);
    drawDot(output, info, cx - 1, cy + 3, color);
    return;
  }

  if (glyph === 'diamond') {
    putAtlasPixel(output, info, cx, cy - 4, color);
    putAtlasPixel(output, info, cx - 3, cy - 1, color);
    putAtlasPixel(output, info, cx + 3, cy - 1, color);
    putAtlasPixel(output, info, cx, cy + 2, color);
    drawDot(output, info, cx - 1, cy - 1, color);
    return;
  }

  if (glyph === 'tiny-circuit') {
    putAtlasPixel(output, info, cx, cy - 5, color);
    putAtlasPixel(output, info, cx, cy - 4, color);
    putAtlasPixel(output, info, cx, cy - 2, color);
    putAtlasPixel(output, info, cx, cy, color);
    putAtlasPixel(output, info, cx - 3, cy, color);
    putAtlasPixel(output, info, cx + 3, cy - 2, color);
    putAtlasPixel(output, info, cx + 4, cy - 2, color);
    return;
  }

  drawDot(output, info, cx - 1, cy - 6, color);
  drawDot(output, info, cx - 1, cy - 1, color);
  drawDot(output, info, cx - 1, cy + 4, color);
}

function applyForeheadMark(output, sourceData, info, variation, anchors) {
  const bodyPatch = hexToRgb(variation.bodyPalette.colors.body);
  const markColor = hexToRgb(variation.bodyPalette.colors.detail);

  for (let row = 0; row < rows; row += 1) {
    for (let frame = 0; frame < columns; frame += 1) {
      const startX = frame * cellWidth;
      const startY = row * cellHeight;
      const anchor = anchors[row * columns + frame];

      for (let y = 0; y < cellHeight; y += 1) {
        for (let x = 0; x < cellWidth; x += 1) {
          const index = pixelOffset(startX + x, startY + y, info.width);
          const pixel = sourcePixel(sourceData, index);
          if (!isOriginalForeheadMarkPixel(pixel, x, y)) continue;

          output[index] = bodyPatch.r;
          output[index + 1] = bodyPatch.g;
          output[index + 2] = bodyPatch.b;
          output[index + 3] = 255;
        }
      }

      drawForeheadGlyph(output, info, startX, startY, anchor, variation.foreheadMark.glyph, markColor);
    }
  }
}

function composeVariationAtlas(sourceData, info, variation, layerAssets, anchors) {
  const output = Buffer.from(sourceData);

  for (let index = 0; index < output.length; index += 4) {
    const pixelIndex = index / 4;
    const atlasX = pixelIndex % info.width;
    const atlasY = Math.floor(pixelIndex / info.width);
    const localX = atlasX % cellWidth;
    const localY = atlasY % cellHeight;
    const source = {
      r: output[index],
      g: output[index + 1],
      b: output[index + 2],
      a: output[index + 3],
    };
    const pixelClass = classifyPrimePixel(source, localX, localY);
    if (pixelClass === 'transparent' || pixelClass === 'preserve') continue;

    const recolored = recolorPrimePixel(pixelClass, source, variation);
    output[index] = recolored.r;
    output[index + 1] = recolored.g;
    output[index + 2] = recolored.b;
  }

  applyAntennaShapeLayer(output, sourceData, info, variation, layerAssets);
  applyForeheadMark(output, sourceData, info, variation, anchors);

  return output;
}

function metadataForVariation(variation, layerAssets) {
  const hasAntennaShapeLayer = variation.antennaShape.id === 'origin-loop' && Boolean(layerAssets?.antennaShapes.has(variation.antennaShape.id));

  return {
    schemaVersion: variation.schemaVersion,
    seed: variation.seed,
    tokenId: variation.tokenId,
    serial: variation.serial,
    traits: {
      bodyPalette: variation.bodyPalette.id,
      eyeStyle: variation.eyeStyle.id,
      antennaShape: variation.antennaShape.id,
      antennaColor: variation.antennaColor.id,
      foreheadMark: variation.foreheadMark.id,
      expressionSet: variation.expressionSet.id,
    },
    visualStatus: {
      bodyPalette: 'baked_into_finished_atlas',
      antennaColor: 'baked_into_finished_atlas',
      eyeStyle: 'metadata_pending_layer_art',
      antennaShape: hasAntennaShapeLayer ? 'baked_from_native_prime_layer' : 'metadata_pending_artist_layer',
      foreheadMark: 'baked_from_frame_anchored_glyph',
      expressionSet: 'metadata_pending_layer_art',
    },
  };
}

async function loadRawAtlas(filePath) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const expectedWidth = cellWidth * columns;
  const expectedHeight = cellHeight * rows;

  if (info.width !== expectedWidth || info.height !== expectedHeight) {
    throw new Error(`${path.relative(root, filePath)} must be ${expectedWidth}x${expectedHeight}; got ${info.width}x${info.height}.`);
  }

  return { data, path: filePath };
}

async function loadTraitLayerAssets() {
  try {
    const registry = JSON.parse(await fs.readFile(traitRegistryPath, 'utf8'));
    const antennaShapes = new Map();
    const antennaMaskPath = registry.masks?.antenna_shape ? path.join(root, registry.masks.antenna_shape) : null;
    const antennaMask = antennaMaskPath ? (await loadRawAtlas(antennaMaskPath)).data : null;

    for (const layer of registry.layers?.antenna_shape ?? []) {
      if (!layer.id || !layer.atlas) continue;
      antennaShapes.set(layer.id, await loadRawAtlas(path.join(root, layer.atlas)));
    }

    return { antennaMask, antennaShapes };
  } catch (error) {
    if (error?.code === 'ENOENT') return { antennaMask: null, antennaShapes: new Map() };
    throw error;
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function ensureSourcePack() {
  const manifest = {
    schemaVersion: 'prime-source-pack.v1',
    sprite: 'prime-test-l01',
    baseAtlas: 'public/pets/prime-test/state-atlas.png',
    cell: { width: cellWidth, height: cellHeight, columns, rows },
    compositionMode: 'offline_finished_atlas_export',
    layers: [
      { id: 'body', status: 'base_atlas_classified', visualCoverage: ['body_palette'] },
      { id: 'antenna-signal', status: 'base_atlas_classified', visualCoverage: ['antenna_color'] },
      { id: 'eyes', status: 'pending_artist_layer_atlas', visualCoverage: ['eye_style', 'expression_set'] },
      { id: 'forehead-mark', status: 'frame_anchored_glyph', visualCoverage: ['forehead_mark'] },
      { id: 'antenna-shape', status: 'registered_layer_atlas', visualCoverage: ['antenna_shape'] },
      { id: 'wardrobe', status: 'future_layer_atlas', visualCoverage: ['clothes', 'accessories'] },
    ],
    note: 'This source pack intentionally bakes finished state atlases offline. Runtime sticker overlays are not production-approved.',
  };

  await writeJson(sourcePackPath, manifest);
}

async function main() {
  const seedArg = process.argv.find((arg) => arg.startsWith('--seed='))?.slice('--seed='.length);
  const countArg = process.argv.find((arg) => arg.startsWith('--count='))?.slice('--count='.length);
  const seed = (seedArg || defaultSeed).trim().toLowerCase() || defaultSeed;
  const count = Math.max(1, Number.parseInt(countArg || String(defaultCount), 10));
  const outputDir = path.join(generatedRoot, seed);
  const { data, info } = await sharp(baseAtlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  if (info.width !== cellWidth * columns || info.height !== cellHeight * rows) {
    throw new Error(`Expected base atlas ${cellWidth * columns}x${cellHeight * rows}; got ${info.width}x${info.height}.`);
  }

  await ensureSourcePack();
  const layerAssets = await loadTraitLayerAssets();
  const anchors = markAnchors(data, info);
  await fs.mkdir(outputDir, { recursive: true });

  const tokens = [];
  for (let serial = 0; serial < count; serial += 1) {
    const variation = createVariation(seed, serial);
    const tokenDir = path.join(outputDir, variation.tokenId);
    const atlasPath = path.join(tokenDir, 'state-atlas.png');
    const metadataPath = path.join(tokenDir, 'metadata.json');
    const metadata = metadataForVariation(variation, layerAssets);
    const atlasData = composeVariationAtlas(data, info, variation, layerAssets, anchors);

    await fs.mkdir(tokenDir, { recursive: true });
    await sharp(atlasData, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4,
      },
    }).png().toFile(atlasPath);
    await writeJson(metadataPath, metadata);

    tokens.push({
      tokenId: variation.tokenId,
      serial: variation.serial,
      atlas: path.relative(root, atlasPath),
      metadata: path.relative(root, metadataPath),
      traits: metadata.traits,
    });
  }

  const manifestPath = path.join(outputDir, 'manifest.json');
  await writeJson(manifestPath, {
    schemaVersion: outputSchemaVersion,
    seed,
    count,
    sourcePack: path.relative(root, sourcePackPath),
    baseAtlas: path.relative(root, baseAtlasPath),
    cell: { width: cellWidth, height: cellHeight, columns, rows },
    visualCoverage: {
      bodyPalette: 'baked',
      antennaColor: 'baked',
      eyeStyle: 'metadata_pending_layer_art',
      antennaShape: 'origin_loop_only_baked_non_origin_shapes_pending_artist_layers',
      foreheadMark: 'baked_from_frame_anchored_glyph',
      expressionSet: 'metadata_pending_layer_art',
    },
    tokens,
  });

  console.log(JSON.stringify({
    manifest: path.relative(root, manifestPath),
    sourcePack: path.relative(root, sourcePackPath),
    tokens: tokens.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
