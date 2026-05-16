import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const batchId = 'random-looplings-12-v2';
const sourceRoot = path.join(root, 'public/nft-gen-lab/ai-sources', batchId);
const packRoot = path.join(root, 'public/nft-gen-lab/row-packs', batchId);
const petsRoot = path.join(root, 'public/pets');

const cellWidth = 192;
const cellHeight = 208;
const columns = 8;

const rowDefs = [
  { id: 'idle', label: 'Idle breathing', fps: 5 },
  { id: 'thinking', label: 'Thinking focus', fps: 5 },
  { id: 'acting', label: 'Tool action', fps: 8 },
  { id: 'trading', label: 'Trading workstation', fps: 9 },
  { id: 'trade_win', label: 'Trade win celebration', fps: 8 },
  { id: 'trade_loss', label: 'Trade loss reaction', fps: 5 },
  { id: 'posting', label: 'Posting device loop', fps: 6 },
  { id: 'receiving', label: 'Receiving signal loop', fps: 6 },
  { id: 'sleeping', label: 'Sleeping breath', fps: 2 },
  { id: 'low_compute', label: 'Low compute fade', fps: 3 },
  { id: 'critical', label: 'Critical alert', fps: 8 },
  { id: 'dead', label: 'Dead memorial', fps: 0 },
];

const characters = [
  {
    id: 'lab-ai-cast-apricot-button',
    label: 'Cast Apricot Button',
    sourceSlug: 'apricot-button',
    note: 'Apricot body, cute mostly-black blue eyes, connected button-ring antenna, button/clicker personality.',
  },
  {
    id: 'lab-ai-cast-teal-crescent',
    label: 'Cast Teal Crescent',
    sourceSlug: 'teal-crescent',
    note: 'Deep teal body, mostly-black sleepy eyes with tiny blue highlights, connected crescent antenna, night-trader personality.',
  },
  {
    id: 'lab-ai-cast-lavender-wishstar',
    label: 'Cast Lavender Wishstar',
    sourceSlug: 'lavender-wishstar',
    note: 'Lavender body, mostly-black violet eyes, connected star-loop antenna, wish/star device personality.',
  },
  {
    id: 'lab-ai-cast-charcoal-square',
    label: 'Cast Charcoal Square',
    sourceSlug: 'charcoal-square',
    note: 'Charcoal body, mostly-black tired blue eyes with tiny highlights, connected cyan square antenna, terminal-operator personality.',
  },
];

function idx(x, y, width) {
  return (y * width + x) * 4;
}

function transparent(width, height) {
  return Buffer.alloc(width * height * 4);
}

function keyGreen(data) {
  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const dominance = g - Math.max(r, b);
    const isChroma = g > 205 && r < 82 && b < 100 && dominance > 125;
    const isBrightFringe = g > 165 && r < 120 && b < 130 && dominance > 70;
    const isDarkFringe = g > 48 && dominance > 22 && g > r * 1.26 && g > b * 1.12;

    if (isChroma || isBrightFringe || isDarkFringe) {
      data[index] = 0;
      data[index + 1] = 0;
      data[index + 2] = 0;
      data[index + 3] = 0;
    }
  }
}

function components(data, width, height, alphaThreshold = 22) {
  const visited = new Uint8Array(width * height);
  const out = [];

  for (let start = 0; start < visited.length; start += 1) {
    if (visited[start] || data[start * 4 + 3] <= alphaThreshold) continue;
    const stack = [start];
    visited[start] = 1;
    let area = 0;
    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;

    while (stack.length > 0) {
      const pixel = stack.pop();
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      area += 1;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);

      for (const neighbor of [pixel - 1, pixel + 1, pixel - width, pixel + width]) {
        if (neighbor < 0 || neighbor >= visited.length || visited[neighbor]) continue;
        const nx = neighbor % width;
        const ny = Math.floor(neighbor / width);
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
        if (data[neighbor * 4 + 3] <= alphaThreshold) continue;
        visited[neighbor] = 1;
        stack.push(neighbor);
      }
    }

    out.push({
      area,
      left,
      top,
      right,
      bottom,
      width: right - left + 1,
      height: bottom - top + 1,
      centerX: (left + right) / 2,
      centerY: (top + bottom) / 2,
    });
  }

  return out.sort((a, b) => b.area - a.area);
}

function copyRect(source, sourceWidth, left, top, width, height) {
  const crop = transparent(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = idx(left + x, top + y, sourceWidth);
      const targetIndex = idx(x, y, width);
      crop[targetIndex] = source[sourceIndex];
      crop[targetIndex + 1] = source[sourceIndex + 1];
      crop[targetIndex + 2] = source[sourceIndex + 2];
      crop[targetIndex + 3] = source[sourceIndex + 3];
    }
  }

  return crop;
}

function targetMetrics(rowIndex) {
  if (rowIndex === 11) return { targetHeight: 124, maxWidth: 176, maxHeight: 152, topBias: 34 };
  if (rowIndex === 8) return { targetHeight: 142, maxWidth: 176, maxHeight: 166, topBias: 24 };
  return { targetHeight: 168, maxWidth: 160, maxHeight: 190, topBias: 0 };
}

async function normalizeComponent(source, info, component, rowIndex) {
  const pad = 16;
  const left = Math.max(0, component.left - pad);
  const top = Math.max(0, component.top - pad);
  const right = Math.min(info.width, component.right + pad + 1);
  const bottom = Math.min(info.height, component.bottom + pad + 1);
  const width = right - left;
  const height = bottom - top;
  const crop = copyRect(source, info.width, left, top, width, height);
  const { targetHeight, maxWidth, maxHeight, topBias } = targetMetrics(rowIndex);
  const scale = Math.min(targetHeight / height, maxWidth / width, maxHeight / height, 1.9);
  const resizedWidth = Math.max(1, Math.round(width * scale));
  const resizedHeight = Math.max(1, Math.round(height * scale));
  const resized = await sharp(crop, {
    raw: { width, height, channels: 4 },
  })
    .resize({ width: resizedWidth, height: resizedHeight, fit: 'fill', kernel: 'nearest' })
    .raw()
    .toBuffer();
  const frame = transparent(cellWidth, cellHeight);
  const frameLeft = Math.round((cellWidth - resizedWidth) / 2);
  const frameTop = Math.max(4, Math.round((cellHeight - resizedHeight) / 2) + topBias);

  for (let y = 0; y < resizedHeight; y += 1) {
    for (let x = 0; x < resizedWidth; x += 1) {
      const sourceIndex = idx(x, y, resizedWidth);
      const alpha = resized[sourceIndex + 3];
      if (alpha <= 8) continue;
      const targetIndex = idx(frameLeft + x, frameTop + y, cellWidth);
      frame[targetIndex] = resized[sourceIndex];
      frame[targetIndex + 1] = resized[sourceIndex + 1];
      frame[targetIndex + 2] = resized[sourceIndex + 2];
      frame[targetIndex + 3] = alpha;
    }
  }

  keyGreen(frame);
  keepLargestComponent(frame);

  return {
    frame,
    component: {
      area: component.area,
      width: component.width,
      height: component.height,
      centerX: Number(component.centerX.toFixed(1)),
      centerY: Number(component.centerY.toFixed(1)),
    },
  };
}

function keepLargestComponent(frame) {
  const all = components(frame, cellWidth, cellHeight, 18);
  const keep = all[0];
  if (!keep || all.length <= 1) return;

  const pixelCount = cellWidth * cellHeight;
  const visited = new Uint8Array(pixelCount);
  const keepPixels = new Uint8Array(pixelCount);
  const stack = [];
  let largest = [];

  for (let start = 0; start < pixelCount; start += 1) {
    if (visited[start] || frame[start * 4 + 3] <= 18) continue;
    const pixels = [];
    stack.push(start);
    visited[start] = 1;

    while (stack.length > 0) {
      const pixel = stack.pop();
      pixels.push(pixel);
      const x = pixel % cellWidth;
      const y = Math.floor(pixel / cellWidth);

      for (const neighbor of [pixel - 1, pixel + 1, pixel - cellWidth, pixel + cellWidth]) {
        if (neighbor < 0 || neighbor >= pixelCount || visited[neighbor]) continue;
        const nx = neighbor % cellWidth;
        const ny = Math.floor(neighbor / cellWidth);
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
        if (frame[neighbor * 4 + 3] <= 18) continue;
        visited[neighbor] = 1;
        stack.push(neighbor);
      }
    }

    if (pixels.length > largest.length) largest = pixels;
  }

  for (const pixel of largest) keepPixels[pixel] = 1;

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    if (!visited[pixel] || keepPixels[pixel]) continue;
    const targetIndex = pixel * 4;
    frame[targetIndex] = 0;
    frame[targetIndex + 1] = 0;
    frame[targetIndex + 2] = 0;
    frame[targetIndex + 3] = 0;
  }
}

function composeRow(frames) {
  const width = cellWidth * columns;
  const output = transparent(width, cellHeight);

  for (let column = 0; column < columns; column += 1) {
    const frame = frames[column];
    for (let y = 0; y < cellHeight; y += 1) {
      for (let x = 0; x < cellWidth; x += 1) {
        const sourceIndex = idx(x, y, cellWidth);
        const targetIndex = idx(column * cellWidth + x, y, width);
        output[targetIndex] = frame[sourceIndex];
        output[targetIndex + 1] = frame[sourceIndex + 1];
        output[targetIndex + 2] = frame[sourceIndex + 2];
        output[targetIndex + 3] = frame[sourceIndex + 3];
      }
    }
  }

  return output;
}

async function packRow(character, rowIndex, row) {
  const sourcePath = path.join(sourceRoot, character.sourceSlug, `${String(rowIndex).padStart(2, '0')}-${row.id}-source.png`);
  const packDir = path.join(packRoot, character.sourceSlug);
  await fs.mkdir(packDir, { recursive: true });

  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  keyGreen(data);
  const found = components(data, info.width, info.height)
    .filter((component) => component.area >= 700 && component.width >= 20 && component.height >= 30)
    .sort((a, b) => b.area - a.area)
    .slice(0, columns)
    .sort((a, b) => a.centerX - b.centerX);

  if (found.length !== columns) {
    throw new Error(`${character.id} ${row.id} expected ${columns} full sprite components, found ${found.length}`);
  }

  const normalized = [];
  const manifestComponents = [];

  for (const component of found) {
    const result = await normalizeComponent(data, info, component, rowIndex);
    normalized.push(result.frame);
    manifestComponents.push(result.component);
  }

  const rowBuffer = composeRow(normalized);
  const outPath = path.join(packDir, `${String(rowIndex).padStart(2, '0')}-${row.id}-row.png`);
  await sharp(rowBuffer, {
    raw: { width: cellWidth * columns, height: cellHeight, channels: 4 },
  }).png().toFile(outPath);

  return {
    row: rowIndex,
    id: row.id,
    source: path.relative(root, sourcePath),
    out: path.relative(root, outPath),
    components: manifestComponents,
  };
}

async function packCharacter(character) {
  const packDir = path.join(packRoot, character.sourceSlug);
  const petDir = path.join(petsRoot, character.id);
  const atlasPath = path.join(petDir, 'state-atlas.png');
  await fs.mkdir(packDir, { recursive: true });
  await fs.mkdir(petDir, { recursive: true });

  const rowReports = [];
  const rowBuffers = [];

  for (let rowIndex = 0; rowIndex < rowDefs.length; rowIndex += 1) {
    const row = rowDefs[rowIndex];
    rowReports.push(await packRow(character, rowIndex, row));
    const rowPath = path.join(packDir, `${String(rowIndex).padStart(2, '0')}-${row.id}-row.png`);
    rowBuffers.push(await sharp(rowPath).ensureAlpha().raw().toBuffer());
  }

  const atlasWidth = cellWidth * columns;
  const atlasHeight = cellHeight * rowDefs.length;
  const atlas = transparent(atlasWidth, atlasHeight);

  for (let rowIndex = 0; rowIndex < rowBuffers.length; rowIndex += 1) {
    const row = rowBuffers[rowIndex];
    for (let y = 0; y < cellHeight; y += 1) {
      for (let x = 0; x < atlasWidth; x += 1) {
        const sourceIndex = idx(x, y, atlasWidth);
        const targetIndex = idx(x, rowIndex * cellHeight + y, atlasWidth);
        atlas[targetIndex] = row[sourceIndex];
        atlas[targetIndex + 1] = row[sourceIndex + 1];
        atlas[targetIndex + 2] = row[sourceIndex + 2];
        atlas[targetIndex + 3] = row[sourceIndex + 3];
      }
    }
  }

  keyGreen(atlas);
  await sharp(atlas, {
    raw: { width: atlasWidth, height: atlasHeight, channels: 4 },
  }).png().toFile(atlasPath);

  const packReport = {
    id: `${character.sourceSlug}-row-sheet-v2-pack`,
    character: character.id,
    outputAtlas: path.relative(root, atlasPath),
    sourceRows: path.relative(root, path.join(sourceRoot, character.sourceSlug)) + '/',
    rows: rowReports,
  };
  await fs.writeFile(path.join(packDir, 'pack-report.json'), `${JSON.stringify(packReport, null, 2)}\n`);

  const metadata = {
    sprite: `${character.id}-l01`,
    displayName: character.label,
    atlas: path.relative(root, atlasPath),
    source: 'random-looplings-12-v2-ai-generated-row-sheets-packed-connected-components',
    sourceRows: path.relative(root, path.join(sourceRoot, character.sourceSlug)) + '/',
    rowPacks: path.relative(root, packDir) + '/',
    cellWidth,
    cellHeight,
    columns,
    rows: rowDefs.map((row, rowIndex) => ({
      id: row.id,
      label: row.label,
      row: rowIndex,
      frameCount: columns,
      fps: row.fps,
    })),
    repairNotes: [
      'Regenerated from per-state AI bitmap row sheets to avoid source-atlas grid cropping.',
      'Packed by connected sprite components, normalized to a stable head/body size, and removed chroma green fringe.',
      'Eyes were prompted as mostly black cute Loopling eyes with tiny highlights, avoiding excessive white eye area.',
      'Dead state was prompted as an actual grounded/dead memorial pose rather than a sleepy pose.',
      character.note,
    ],
    note: 'Random Looplings first-four v2 row-sheet regeneration.',
  };
  await fs.writeFile(path.join(petDir, 'state-atlas.json'), `${JSON.stringify(metadata, null, 2)}\n`);

  return { id: character.id, atlas: path.relative(root, atlasPath) };
}

const requested = new Set(process.argv.slice(2).filter((arg) => !arg.startsWith('--')));
const selected = requested.size > 0
  ? characters.filter((character) => requested.has(character.sourceSlug) || requested.has(character.id))
  : characters;

const packed = [];

for (const character of selected) {
  packed.push(await packCharacter(character));
}

await fs.mkdir(packRoot, { recursive: true });
await fs.writeFile(path.join(packRoot, 'batch-report.json'), `${JSON.stringify({
  id: batchId,
  packed,
}, null, 2)}\n`);

console.log(JSON.stringify({ packed }, null, 2));
