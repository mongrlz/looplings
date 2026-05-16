import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const petsRoot = path.join(root, 'public/pets');

const bases = [
  { id: 'pink', label: 'Heartline' },
  { id: 'mint', label: 'Halo' },
  { id: 'graphite', label: 'Reserve' },
];

const palettes = [
  {
    id: 'rose',
    label: 'Rose',
    body: '#ff9eb9',
    shadow: '#cc5f84',
    light: '#ffd7e4',
    signal: '#ff77a9',
    eye: '#4b1029',
    eyeGlow: '#ffccdf',
  },
  {
    id: 'aqua',
    label: 'Aqua',
    body: '#62e6ea',
    shadow: '#2496a0',
    light: '#caffff',
    signal: '#7df8ff',
    eye: '#062d40',
    eyeGlow: '#d9ffff',
  },
  {
    id: 'gold',
    label: 'Gold',
    body: '#ffd45d',
    shadow: '#c98322',
    light: '#fff1a6',
    signal: '#fff064',
    eye: '#3a2507',
    eyeGlow: '#fff7c7',
  },
  {
    id: 'violet',
    label: 'Violet',
    body: '#b983ff',
    shadow: '#7141b8',
    light: '#e8d7ff',
    signal: '#d7aaff',
    eye: '#24123d',
    eyeGlow: '#f1e6ff',
  },
  {
    id: 'lime',
    label: 'Lime',
    body: '#cfe96e',
    shadow: '#7d9c2e',
    light: '#f6ffc0',
    signal: '#efff77',
    eye: '#1f3008',
    eyeGlow: '#fbffd8',
  },
  {
    id: 'blue',
    label: 'Blue',
    body: '#83c9ff',
    shadow: '#3b78be',
    light: '#d6f0ff',
    signal: '#8ee3ff',
    eye: '#071b4d',
    eyeGlow: '#dcf7ff',
  },
  {
    id: 'coral',
    label: 'Coral',
    body: '#ff8a70',
    shadow: '#bd4a37',
    light: '#ffd7ca',
    signal: '#ffb063',
    eye: '#40120a',
    eyeGlow: '#ffe2d9',
  },
  {
    id: 'teal',
    label: 'Teal',
    body: '#48d2b7',
    shadow: '#16826f',
    light: '#cafff2',
    signal: '#66ffd9',
    eye: '#062d2a',
    eyeGlow: '#dffff8',
  },
  {
    id: 'amber',
    label: 'Amber',
    body: '#f0a33a',
    shadow: '#9a5a14',
    light: '#ffe6a8',
    signal: '#ffc857',
    eye: '#332006',
    eyeGlow: '#fff0c6',
  },
  {
    id: 'orchid',
    label: 'Orchid',
    body: '#d978dc',
    shadow: '#90409b',
    light: '#f6d1ff',
    signal: '#ff91f4',
    eye: '#33123d',
    eyeGlow: '#ffe1ff',
  },
  {
    id: 'moss',
    label: 'Moss',
    body: '#8fb35a',
    shadow: '#4e6b2f',
    light: '#dceeb5',
    signal: '#bfe87a',
    eye: '#182709',
    eyeGlow: '#eff7cf',
  },
  {
    id: 'slate',
    label: 'Slate',
    body: '#6f7d91',
    shadow: '#3d4658',
    light: '#c5d1df',
    signal: '#8fb9ff',
    eye: '#0d1523',
    eyeGlow: '#dceaff',
  },
];

function hexToRgb(hex) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mix(source, target, amount) {
  return {
    r: clamp(source.r + (target.r - source.r) * amount),
    g: clamp(source.g + (target.g - source.g) * amount),
    b: clamp(source.b + (target.b - source.b) * amount),
  };
}

function luminance(pixel) {
  return pixel.r * 0.299 + pixel.g * 0.587 + pixel.b * 0.114;
}

function saturation(pixel) {
  return Math.max(pixel.r, pixel.g, pixel.b) - Math.min(pixel.r, pixel.g, pixel.b);
}

function readPixel(data, info, x, y) {
  if (x < 0 || y < 0 || x >= info.width || y >= info.height) return null;
  const index = (y * info.width + x) * 4;
  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
    a: data[index + 3],
  };
}

function isNearDarkDetail(data, info, x, y) {
  for (let offsetY = -4; offsetY <= 4; offsetY += 1) {
    for (let offsetX = -4; offsetX <= 4; offsetX += 1) {
      const neighbor = readPixel(data, info, x + offsetX, y + offsetY);
      if (!neighbor || neighbor.a <= 8) continue;
      if (luminance(neighbor) < 46) return true;
    }
  }

  return false;
}

function toneColor(pixel, palette) {
  const shadow = hexToRgb(palette.shadow);
  const body = hexToRgb(palette.body);
  const light = hexToRgb(palette.light);
  const value = Math.max(0, Math.min(1, (luminance(pixel) - 58) / 172));

  if (value < 0.44) {
    return mix(shadow, body, value / 0.44);
  }

  return mix(body, light, (value - 0.44) / 0.56);
}

function isEyeGlintCandidate(context) {
  const inLeftEye = context.localX >= 45 && context.localX <= 84;
  const inRightEye = context.localX >= 108 && context.localX <= 147;
  const inEyeBand = context.localY >= 72 && context.localY <= 116;
  return inEyeBand && (inLeftEye || inRightEye) && context.nearDarkDetail;
}

function isEyeZone(context) {
  const inLeftEye = context.localX >= 42 && context.localX <= 86;
  const inRightEye = context.localX >= 106 && context.localX <= 150;
  const inEyeBand = context.localY >= 70 && context.localY <= 120;
  return inEyeBand && (inLeftEye || inRightEye) && context.nearDarkDetail;
}

function eyeColor(pixel, palette) {
  const eye = hexToRgb(palette.eye);
  const glow = hexToRgb(palette.eyeGlow);
  const value = Math.max(0, Math.min(1, (luminance(pixel) - 58) / 166));
  return mix(eye, glow, value);
}

function recolor(pixel, palette, context) {
  if (pixel.a <= 8) return { r: pixel.r, g: pixel.g, b: pixel.b };

  const source = { r: pixel.r, g: pixel.g, b: pixel.b };
  const light = luminance(pixel);
  const chroma = saturation(pixel);

  if (isEyeZone(context)) {
    if (light < 32 && chroma < 32) return source;
    if (light > 218 && chroma < 48 && isEyeGlintCandidate(context)) {
      return hexToRgb(palette.eyeGlow);
    }
    if (chroma > 14 || light > 118) return eyeColor(pixel, palette);
  }

  if (light < 48 && chroma < 50) return source;
  if (chroma >= 82 && light >= 92 && light < 190) {
    return hexToRgb(palette.signal);
  }

  return toneColor(pixel, palette);
}

async function copyJson(baseId, variantId, label, palette) {
  const sourcePath = path.join(petsRoot, baseId, 'state-atlas.json');
  const targetPath = path.join(petsRoot, variantId, 'state-atlas.json');
  const manifest = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
  manifest.sprite = `${variantId}-l01`;
  manifest.atlas = `public/pets/${variantId}/state-atlas.png`;
  manifest.source = 'approved-atlas-palette-bake';
  manifest.sourceAtlas = `public/pets/${baseId}/state-atlas.png`;
  manifest.palette = {
    id: palette.id,
    label: palette.label,
  };
  manifest.displayName = label;
  await fs.writeFile(targetPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function bakeVariant(base, palette) {
  const variantId = `lab-${base.id}-${palette.id}`;
  const label = `${palette.label} ${base.label}`;
  const targetDir = path.join(petsRoot, variantId);
  await fs.mkdir(targetDir, { recursive: true });

  const sourcePath = path.join(petsRoot, base.id, 'state-atlas.png');
  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let index = 0; index < data.length; index += 4) {
    const pixelIndex = index / 4;
    const x = pixelIndex % info.width;
    const y = Math.floor(pixelIndex / info.width);
    const pixel = {
      r: data[index],
      g: data[index + 1],
      b: data[index + 2],
      a: data[index + 3],
    };
    const next = recolor(pixel, palette, {
      localX: x % 192,
      localY: y % 208,
      nearDarkDetail: isNearDarkDetail(data, info, x, y),
    });
    data[index] = next.r;
    data[index + 1] = next.g;
    data[index + 2] = next.b;
  }

  await sharp(data, { raw: info }).png().toFile(path.join(targetDir, 'state-atlas.png'));
  await copyJson(base.id, variantId, label, palette);
  await fs.writeFile(path.join(targetDir, 'qa.json'), `${JSON.stringify({
    asset: variantId,
    status: 'candidate',
    sourceAtlas: `public/pets/${base.id}/state-atlas.png`,
    generationMethod: 'approved-atlas-palette-bake',
    note: 'This is a full monolithic exported PNG atlas generated from an audit-approved atlas source. It is not a runtime overlay.',
  }, null, 2)}\n`);

  return { id: variantId, label, base: base.id, palette: palette.id };
}

const generated = [];

for (const base of bases) {
  for (const palette of palettes) {
    generated.push(await bakeVariant(base, palette));
  }
}

await fs.mkdir(path.join(root, 'public/nft-gen-lab'), { recursive: true });
await fs.writeFile(
  path.join(root, 'public/nft-gen-lab/generated-approved-variants.json'),
  `${JSON.stringify({ schemaVersion: 'loopling-approved-baked-variants.v1', generated }, null, 2)}\n`,
);

console.log(JSON.stringify({ generated: generated.length, variants: generated }, null, 2));
