import type { PrimeResolvedVariation } from '@/lib/prime-variation-model';
import type { PrimeVisibleStateId } from '@/lib/prime-asset-factory';

export const PRIME_VARIATION_ATLAS_VERSION = 'prime-frame-scale-v2';
export const PRIME_VARIATION_ATLAS_URL = `/pets/prime-test/state-atlas.png?v=${PRIME_VARIATION_ATLAS_VERSION}`;
export const PRIME_VARIATION_LAYER_VERSION = 'prime-antenna-shape-v1';
export const PRIME_VARIATION_ANTENNA_MASK_URL = `/pets/prime-test/traits/antenna-shape/_base-mask/state-atlas.png?v=${PRIME_VARIATION_LAYER_VERSION}`;

export const PRIME_VARIATION_ATLAS = {
  cellWidth: 192,
  cellHeight: 208,
  columns: 8,
  states: {
    idle: { row: 0, frameCount: 8, fps: 5 },
    thinking: { row: 1, frameCount: 8, fps: 5 },
    acting: { row: 2, frameCount: 8, fps: 8 },
    trading: { row: 3, frameCount: 8, fps: 9 },
    trade_win: { row: 4, frameCount: 8, fps: 8 },
    trade_loss: { row: 5, frameCount: 8, fps: 5 },
    posting: { row: 6, frameCount: 8, fps: 6 },
    receiving: { row: 7, frameCount: 8, fps: 6 },
    sleeping: { row: 8, frameCount: 8, fps: 2 },
    low_compute: { row: 9, frameCount: 8, fps: 3 },
    critical: { row: 10, frameCount: 8, fps: 8 },
    dead: { row: 11, frameCount: 8, fps: 0 },
  },
} as const;

export type PrimeAtlasPixelClass =
  | 'transparent'
  | 'preserve'
  | 'body-highlight'
  | 'body'
  | 'body-shadow'
  | 'antenna'
  | 'mark';

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function mix(source: Rgb, target: Rgb, amount: number): Rgb {
  return {
    r: clampChannel(source.r + (target.r - source.r) * amount),
    g: clampChannel(source.g + (target.g - source.g) * amount),
    b: clampChannel(source.b + (target.b - source.b) * amount),
  };
}

function luminance({ r, g, b }: Rgb) {
  return r * 0.299 + g * 0.587 + b * 0.114;
}

function saturation({ r, g, b }: Rgb) {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

export function getPrimeAtlasState(stateId: PrimeVisibleStateId) {
  return PRIME_VARIATION_ATLAS.states[stateId];
}

export function getPrimeAntennaLayerUrl(shapeId: string) {
  return `/pets/prime-test/traits/antenna-shape/${shapeId}/state-atlas.png?v=${PRIME_VARIATION_LAYER_VERSION}`;
}

export function classifyPrimePixel(pixel: Rgb & { a: number }, x: number, y: number): PrimeAtlasPixelClass {
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

export function recolorPrimePixel(
  pixelClass: PrimeAtlasPixelClass,
  source: Rgb,
  variation: PrimeResolvedVariation,
): Rgb {
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
    case 'transparent':
    case 'preserve':
    default:
      return source;
  }
}

export function recolorPrimeFrame(imageData: ImageData, variation: PrimeResolvedVariation): ImageData {
  const data = new Uint8ClampedArray(imageData.data);

  for (let index = 0; index < data.length; index += 4) {
    const pixelIndex = index / 4;
    const x = pixelIndex % imageData.width;
    const y = Math.floor(pixelIndex / imageData.width);
    const source = {
      r: data[index],
      g: data[index + 1],
      b: data[index + 2],
      a: data[index + 3],
    };
    const pixelClass = classifyPrimePixel(source, x, y);
    if (pixelClass === 'transparent' || pixelClass === 'preserve') continue;

    const recolored = recolorPrimePixel(pixelClass, source, variation);
    data[index] = recolored.r;
    data[index + 1] = recolored.g;
    data[index + 2] = recolored.b;
  }

  return new ImageData(data, imageData.width, imageData.height);
}

export function renderPrimeAtlasFrame(
  context: CanvasRenderingContext2D,
  atlasImage: HTMLImageElement,
  stateId: PrimeVisibleStateId,
  frame: number,
) {
  const state = getPrimeAtlasState(stateId);
  const sourceFrame = frame % state.frameCount;
  const sx = sourceFrame * PRIME_VARIATION_ATLAS.cellWidth;
  const sy = state.row * PRIME_VARIATION_ATLAS.cellHeight;

  context.canvas.width = PRIME_VARIATION_ATLAS.cellWidth;
  context.canvas.height = PRIME_VARIATION_ATLAS.cellHeight;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, PRIME_VARIATION_ATLAS.cellWidth, PRIME_VARIATION_ATLAS.cellHeight);
  context.drawImage(
    atlasImage,
    sx,
    sy,
    PRIME_VARIATION_ATLAS.cellWidth,
    PRIME_VARIATION_ATLAS.cellHeight,
    0,
    0,
    PRIME_VARIATION_ATLAS.cellWidth,
    PRIME_VARIATION_ATLAS.cellHeight,
  );
}

function cropAtlasFrame(
  image: HTMLImageElement,
  stateId: PrimeVisibleStateId,
  frame: number,
): ImageData {
  const state = getPrimeAtlasState(stateId);
  const sourceFrame = frame % state.frameCount;
  const sx = sourceFrame * PRIME_VARIATION_ATLAS.cellWidth;
  const sy = state.row * PRIME_VARIATION_ATLAS.cellHeight;
  const scratch = document.createElement('canvas');
  const scratchContext = scratch.getContext('2d');

  scratch.width = PRIME_VARIATION_ATLAS.cellWidth;
  scratch.height = PRIME_VARIATION_ATLAS.cellHeight;
  if (!scratchContext) return new ImageData(scratch.width, scratch.height);

  scratchContext.imageSmoothingEnabled = false;
  scratchContext.clearRect(0, 0, scratch.width, scratch.height);
  scratchContext.drawImage(
    image,
    sx,
    sy,
    PRIME_VARIATION_ATLAS.cellWidth,
    PRIME_VARIATION_ATLAS.cellHeight,
    0,
    0,
    PRIME_VARIATION_ATLAS.cellWidth,
    PRIME_VARIATION_ATLAS.cellHeight,
  );

  return scratchContext.getImageData(0, 0, scratch.width, scratch.height);
}

function sourceLooksLikeAntennaForErase(pixel: Rgb & { a: number }, x: number, y: number) {
  if (pixel.a <= 8) return false;

  const light = luminance(pixel);
  const cyanSignal = pixel.g > 86 && pixel.b > 100 && pixel.r < 225 && pixel.g > pixel.r + 4 && pixel.b > pixel.r + 8;
  const blueChroma = pixel.b > 62 && pixel.g > 58 && pixel.r < 170 && pixel.b > pixel.r + 8;
  const standingZone = y < 72;
  const sidewaysDeadZone = x > 124 && y > 78 && y < 150;

  return cyanSignal || blueChroma || ((standingZone || sidewaysDeadZone) && light < 86);
}

function sourcePixelAt(imageData: ImageData, index: number) {
  return {
    r: imageData.data[index],
    g: imageData.data[index + 1],
    b: imageData.data[index + 2],
    a: imageData.data[index + 3],
  };
}

function localPixelPosition(imageData: ImageData, index: number) {
  const pixelIndex = index / 4;
  return {
    x: pixelIndex % imageData.width,
    y: Math.floor(pixelIndex / imageData.width),
  };
}

function applyAlphaMask(imageData: ImageData, maskData: ImageData, sourceData: ImageData) {
  const data = new Uint8ClampedArray(imageData.data);

  for (let index = 0; index < data.length; index += 4) {
    if (maskData.data[index + 3] <= 8) continue;

    const { x, y } = localPixelPosition(imageData, index);
    if (sourceLooksLikeAntennaForErase(sourcePixelAt(sourceData, index), x, y)) data[index + 3] = 0;
  }

  return new ImageData(data, imageData.width, imageData.height);
}

export function recolorPrimeAntennaLayerFrame(imageData: ImageData, variation: PrimeResolvedVariation): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const target = hexToRgb(variation.antennaColor.color);
  const glow = hexToRgb(variation.antennaColor.glow);

  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] <= 8) continue;

    const source = {
      r: data[index],
      g: data[index + 1],
      b: data[index + 2],
    };
    if (luminance(source) < 70) continue;

    const amount = data[index + 3] < 180 ? 0.72 : 0.92;
    const recolored = mix(source, data[index + 3] < 180 ? glow : target, amount);
    data[index] = recolored.r;
    data[index + 1] = recolored.g;
    data[index + 2] = recolored.b;
  }

  return new ImageData(data, imageData.width, imageData.height);
}

function compositeImageData(base: ImageData, layer: ImageData, sourceData: ImageData) {
  const output = new Uint8ClampedArray(base.data);

  for (let index = 0; index < output.length; index += 4) {
    const layerAlpha = layer.data[index + 3] / 255;
    if (layerAlpha <= 0) continue;

    const { x, y } = localPixelPosition(base, index);
    const source = sourcePixelAt(sourceData, index);
    if (source.a > 8 && !sourceLooksLikeAntennaForErase(source, x, y)) continue;

    const baseAlpha = output[index + 3] / 255;
    const outAlpha = layerAlpha + baseAlpha * (1 - layerAlpha);
    if (outAlpha <= 0) continue;

    output[index] = clampChannel((layer.data[index] * layerAlpha + output[index] * baseAlpha * (1 - layerAlpha)) / outAlpha);
    output[index + 1] = clampChannel((layer.data[index + 1] * layerAlpha + output[index + 1] * baseAlpha * (1 - layerAlpha)) / outAlpha);
    output[index + 2] = clampChannel((layer.data[index + 2] * layerAlpha + output[index + 2] * baseAlpha * (1 - layerAlpha)) / outAlpha);
    output[index + 3] = clampChannel(outAlpha * 255);
  }

  return new ImageData(output, base.width, base.height);
}

export function renderPrimeVariationFrame(
  context: CanvasRenderingContext2D,
  atlasImage: HTMLImageElement,
  variation: PrimeResolvedVariation,
  stateId: PrimeVisibleStateId,
  frame: number,
  antennaLayerImage?: HTMLImageElement | null,
  antennaMaskImage?: HTMLImageElement | null,
) {
  const state = getPrimeAtlasState(stateId);
  const sourceFrame = frame % state.frameCount;
  const sx = sourceFrame * PRIME_VARIATION_ATLAS.cellWidth;
  const sy = state.row * PRIME_VARIATION_ATLAS.cellHeight;

  context.canvas.width = PRIME_VARIATION_ATLAS.cellWidth;
  context.canvas.height = PRIME_VARIATION_ATLAS.cellHeight;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, PRIME_VARIATION_ATLAS.cellWidth, PRIME_VARIATION_ATLAS.cellHeight);
  renderPrimeAtlasFrame(context, atlasImage, stateId, sourceFrame);

  const frameData = context.getImageData(0, 0, PRIME_VARIATION_ATLAS.cellWidth, PRIME_VARIATION_ATLAS.cellHeight);
  const recoloredFrame = recolorPrimeFrame(frameData, variation);

  if (!antennaLayerImage || !antennaMaskImage) {
    context.putImageData(recoloredFrame, 0, 0);
    return;
  }

  const maskedFrame = applyAlphaMask(recoloredFrame, cropAtlasFrame(antennaMaskImage, stateId, frame), frameData);
  const outputFrame = compositeImageData(
    maskedFrame,
    recolorPrimeAntennaLayerFrame(cropAtlasFrame(antennaLayerImage, stateId, frame), variation),
    frameData,
  );
  context.putImageData(outputFrame, 0, 0);
}
