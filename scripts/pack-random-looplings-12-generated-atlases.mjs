import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const batchId = 'random-looplings-12-v1';
const sourceRoot = path.join(root, 'public/nft-gen-lab/ai-sources', batchId);
const packRoot = path.join(root, 'public/nft-gen-lab/row-packs', batchId);
const petsRoot = path.join(root, 'public/pets');

const cellWidth = 192;
const cellHeight = 208;
const columns = 8;

const rows = [
  { id: 'idle', label: 'Idle personality loop', fps: 5 },
  { id: 'thinking', label: 'Thinking focus loop', fps: 5 },
  { id: 'acting', label: 'Tool action loop', fps: 8 },
  { id: 'trading', label: 'Trading workstation loop', fps: 9 },
  { id: 'trade_win', label: 'Trade win celebration', fps: 8 },
  { id: 'trade_loss', label: 'Trade loss reaction', fps: 5 },
  { id: 'posting', label: 'Posting device loop', fps: 6 },
  { id: 'receiving', label: 'Receiving signal loop', fps: 6 },
  { id: 'sleeping', label: 'Sleeping breath loop', fps: 2 },
  { id: 'low_compute', label: 'Low compute fade loop', fps: 3 },
  { id: 'critical', label: 'Critical alert loop', fps: 8 },
  { id: 'dead', label: 'Dead memorial frame', fps: 0 },
];

const characters = [
  {
    id: 'lab-ai-cast-apricot-button',
    label: 'Cast Apricot Button',
    sourceSlug: 'apricot-button',
    note: 'Apricot body with a button-ring antenna, blue eyes, and button/clicker props.',
  },
  {
    id: 'lab-ai-cast-teal-crescent',
    label: 'Cast Teal Crescent',
    sourceSlug: 'teal-crescent',
    note: 'Deep teal body with a crescent antenna, sleepy eyes, and moonlit data props.',
  },
  {
    id: 'lab-ai-cast-lavender-wishstar',
    label: 'Cast Lavender Wishstar',
    sourceSlug: 'lavender-wishstar',
    note: 'Lavender body with a star antenna, bright violet eyes, and wish/star devices.',
  },
  {
    id: 'lab-ai-cast-charcoal-square',
    label: 'Cast Charcoal Square',
    sourceSlug: 'charcoal-square',
    note: 'Charcoal body with a cyan square antenna, tired eyes, and blocky terminal props.',
  },
  {
    id: 'lab-ai-cast-coral-twinloop',
    label: 'Cast Coral Twinloop',
    sourceSlug: 'coral-twinloop',
    note: 'Coral body with a twin-loop antenna, amber eyes, and paired social/trading devices.',
  },
  {
    id: 'lab-ai-cast-frost-diamond',
    label: 'Cast Frost Diamond',
    sourceSlug: 'frost-diamond',
    note: 'Frost white body with a diamond antenna, teal eyes, and crystalline tools.',
  },
  {
    id: 'lab-ai-cast-moss-leaf',
    label: 'Cast Moss Leaf',
    sourceSlug: 'moss-leaf',
    note: 'Moss green body with a leaf antenna, olive eyes, and garden-ledger props.',
  },
  {
    id: 'lab-ai-cast-cobalt-moon',
    label: 'Cast Cobalt Moon',
    sourceSlug: 'cobalt-moon',
    note: 'Cobalt body with a crescent-moon ring antenna, navy eyes, and night-trading props.',
  },
  {
    id: 'lab-ai-cast-rose-bow',
    label: 'Cast Rose Bow',
    sourceSlug: 'rose-bow',
    note: 'Rose pink body with a bow-loop antenna, lashes, and charm-phone props.',
  },
  {
    id: 'lab-ai-cast-honey-coin',
    label: 'Cast Honey Coin',
    sourceSlug: 'honey-coin',
    note: 'Honey gold body with a coin-ring antenna, amber eyes, and treasurer props.',
  },
  {
    id: 'lab-ai-cast-pearl-monk',
    label: 'Cast Pearl Monk',
    sourceSlug: 'pearl-monk',
    note: 'Pearl grey body with a plain silver ring antenna, half-lidded eyes, and altar props.',
  },
  {
    id: 'lab-ai-cast-cherry-flame',
    label: 'Cast Cherry Flame',
    sourceSlug: 'cherry-flame',
    note: 'Dark cherry body with a flame antenna, orange eyes, and ember device props.',
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
    const greenDominance = g - Math.max(r, b);
    const isChroma = g > 205 && r < 78 && b < 95 && greenDominance > 130;
    const isBrightFringe = g > 170 && r < 115 && b < 125 && greenDominance > 75;
    const isDarkFringe = g > 52 && greenDominance > 24 && g > r * 1.28 && g > b * 1.14;

    if (isChroma || isBrightFringe || isDarkFringe) {
      data[index] = 0;
      data[index + 1] = 0;
      data[index + 2] = 0;
      data[index + 3] = 0;
    }
  }
}

function connectedComponents(data, width, height, alphaThreshold = 22) {
  const visited = new Uint8Array(width * height);
  const components = [];

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

    components.push({
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

  return components.sort((a, b) => b.area - a.area);
}

function copyRect(source, sourceWidth, left, top, width, height) {
  const output = transparent(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = idx(left + x, top + y, sourceWidth);
      const targetIndex = idx(x, y, width);
      output[targetIndex] = source[sourceIndex];
      output[targetIndex + 1] = source[sourceIndex + 1];
      output[targetIndex + 2] = source[sourceIndex + 2];
      output[targetIndex + 3] = source[sourceIndex + 3];
    }
  }

  return output;
}

function targetMetrics(rowIndex) {
  if (rowIndex === 11) return { targetHeight: 142, maxWidth: 184, maxHeight: 190 };
  if (rowIndex === 10) return { targetHeight: 176, maxWidth: 174, maxHeight: 200 };
  if (rowIndex === 8) return { targetHeight: 156, maxWidth: 184, maxHeight: 178 };
  return { targetHeight: 174, maxWidth: 170, maxHeight: 198 };
}

async function normalizeFrame(cell, width, height, rowIndex) {
  keyGreen(cell);
  const components = connectedComponents(cell, width, height)
    .filter((component) => component.area >= 80 && component.width >= 6 && component.height >= 6);
  const main = components.find((component) => component.area >= 500) ?? components[0];

  if (!main) {
    throw new Error(`empty generated cell at row ${rowIndex}`);
  }

  const pad = 12;
  const left = Math.max(0, main.left - pad);
  const top = Math.max(0, main.top - pad);
  const right = Math.min(width, main.right + pad + 1);
  const bottom = Math.min(height, main.bottom + pad + 1);
  const cropWidth = right - left;
  const cropHeight = bottom - top;
  const crop = copyRect(cell, width, left, top, cropWidth, cropHeight);
  const { targetHeight, maxWidth, maxHeight } = targetMetrics(rowIndex);
  const scale = Math.min(targetHeight / cropHeight, maxWidth / cropWidth, maxHeight / cropHeight, 2.5);
  const resizedWidth = Math.max(1, Math.round(cropWidth * scale));
  const resizedHeight = Math.max(1, Math.round(cropHeight * scale));
  const resized = await sharp(crop, {
    raw: { width: cropWidth, height: cropHeight, channels: 4 },
  })
    .resize({ width: resizedWidth, height: resizedHeight, fit: 'fill', kernel: 'nearest' })
    .raw()
    .toBuffer();
  const frame = transparent(cellWidth, cellHeight);
  const frameLeft = Math.round((cellWidth - resizedWidth) / 2);
  const frameTop = Math.max(3, Math.round((cellHeight - resizedHeight) / 2));

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
  keepLargestConnectedComponent(frame);

  return {
    frame,
    sourceComponent: {
      area: main.area,
      width: main.width,
      height: main.height,
      centerX: Number(main.centerX.toFixed(1)),
      centerY: Number(main.centerY.toFixed(1)),
    },
  };
}

function keepLargestConnectedComponent(frame) {
  const pixelCount = cellWidth * cellHeight;
  const visited = new Uint8Array(pixelCount);
  const keep = new Uint8Array(pixelCount);
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

  for (const pixel of largest) keep[pixel] = 1;

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    if (!visited[pixel] || keep[pixel]) continue;
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

async function packCharacter(character) {
  const sourcePath = path.join(sourceRoot, character.sourceSlug, 'source-atlas.png');
  const packDir = path.join(packRoot, character.sourceSlug);
  const petDir = path.join(petsRoot, character.id);
  const atlasPath = path.join(petDir, 'state-atlas.png');
  await fs.mkdir(packDir, { recursive: true });
  await fs.mkdir(petDir, { recursive: true });

  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  keyGreen(data);

  const sourceCellWidth = Math.floor(info.width / columns);
  const sourceCellHeight = Math.floor(info.height / rows.length);
  const manifestRows = [];
  const rowBuffers = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const frameBuffers = [];
    const components = [];

    for (let column = 0; column < columns; column += 1) {
      const left = column * sourceCellWidth;
      const top = rowIndex * sourceCellHeight;
      const width = column === columns - 1 ? info.width - left : sourceCellWidth;
      const height = rowIndex === rows.length - 1 ? info.height - top : sourceCellHeight;
      const cell = copyRect(data, info.width, left, top, width, height);
      const normalized = await normalizeFrame(cell, width, height, rowIndex);
      frameBuffers.push(normalized.frame);
      components.push(normalized.sourceComponent);
    }

    const rowBuffer = composeRow(frameBuffers);
    const row = rows[rowIndex];
    const rowPath = path.join(packDir, `${String(rowIndex).padStart(2, '0')}-${row.id}-row.png`);
    await sharp(rowBuffer, {
      raw: { width: cellWidth * columns, height: cellHeight, channels: 4 },
    }).png().toFile(rowPath);
    rowBuffers.push(rowBuffer);
    manifestRows.push({
      row: rowIndex,
      id: row.id,
      source: path.relative(root, sourcePath),
      out: path.relative(root, rowPath),
      sourceCell: {
        width: sourceCellWidth,
        height: sourceCellHeight,
      },
      components,
    });
  }

  const atlasWidth = cellWidth * columns;
  const atlasHeight = cellHeight * rows.length;
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
    id: `${character.sourceSlug}-generated-pack`,
    character: character.id,
    outputAtlas: path.relative(root, atlasPath),
    note: `AI-generated full source atlas packed into registered Looplings state atlas cells. ${character.note}`,
    rows: manifestRows,
  };
  await fs.writeFile(path.join(packDir, 'pack-report.json'), `${JSON.stringify(packReport, null, 2)}\n`);

  const metadata = {
    sprite: `${character.id}-l01`,
    displayName: character.label,
    atlas: path.relative(root, atlasPath),
    source: 'random-looplings-12-ai-generated-full-source-atlas-v1-packed-connected-components',
    sourceAtlas: path.relative(root, sourcePath),
    sourceRows: path.relative(root, path.join(sourceRoot, character.sourceSlug)) + '/',
    rowPacks: path.relative(root, packDir) + '/',
    cellWidth,
    cellHeight,
    columns,
    rows: rows.map((row, rowIndex) => ({
      id: row.id,
      label: row.label,
      row: rowIndex,
      frameCount: columns,
      fps: row.fps,
    })),
    repairNotes: [
      'Generated as a fresh AI bitmap source atlas for the random Looplings 12 batch.',
      'Packed into the canonical 192x208 cell, 8-column, 12-row monolithic state atlas contract.',
      'Removed chroma green and green fringe, selected the main connected sprite body per frame, and normalized frame scale for preview stability.',
      character.note,
    ],
    note: 'Random Looplings 12 full atlas generation batch.',
  };
  await fs.writeFile(path.join(petDir, 'state-atlas.json'), `${JSON.stringify(metadata, null, 2)}\n`);

  return {
    id: character.id,
    atlas: path.relative(root, atlasPath),
    metadata: path.relative(root, path.join(petDir, 'state-atlas.json')),
  };
}

const packed = [];

for (const character of characters) {
  packed.push(await packCharacter(character));
}

await fs.writeFile(path.join(packRoot, 'batch-report.json'), `${JSON.stringify({
  id: batchId,
  sourceRoot: path.relative(root, sourceRoot),
  packRoot: path.relative(root, packRoot),
  packed,
}, null, 2)}\n`);

console.log(JSON.stringify({
  packed: packed.length,
  atlases: packed,
}, null, 2));
