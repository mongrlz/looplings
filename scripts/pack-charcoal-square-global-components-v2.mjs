import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourcePath = path.join(root, 'public/nft-gen-lab/ai-sources/random-looplings-12-v1/charcoal-square/source-atlas.png');
const generatedReceivingSourcePath = path.join(
  root,
  'public/nft-gen-lab/ai-sources/random-looplings-12-v2/charcoal-square/07-receiving-source.png',
);
const packDir = path.join(root, 'public/nft-gen-lab/row-packs/random-looplings-12-v2/charcoal-square');
const petDir = path.join(root, 'public/pets/lab-ai-cast-charcoal-square');
const atlasPath = path.join(petDir, 'state-atlas.png');
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

function idx(x, y, width) {
  return (y * width + x) * 4;
}

function blank(width, height) {
  return Buffer.alloc(width * height * 4);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function keyGreen(data) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dominance = g - Math.max(r, b);
    const isChroma = g > 205 && r < 82 && b < 100 && dominance > 125;
    const isBrightFringe = g > 165 && r < 120 && b < 130 && dominance > 70;
    const isDarkFringe = g > 48 && dominance > 22 && g > r * 1.26 && g > b * 1.12;
    if (isChroma || isBrightFringe || isDarkFringe) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
    }
  }
}

function copyRect(source, sourceWidth, left, top, width, height) {
  const out = blank(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const si = idx(left + x, top + y, sourceWidth);
      const ti = idx(x, y, width);
      out[ti] = source[si];
      out[ti + 1] = source[si + 1];
      out[ti + 2] = source[si + 2];
      out[ti + 3] = source[si + 3];
    }
  }
  return out;
}

function components(data, width, height, alphaThreshold = 18) {
  const visited = new Uint8Array(width * height);
  const found = [];
  for (let start = 0; start < visited.length; start += 1) {
    if (visited[start] || data[start * 4 + 3] <= alphaThreshold) continue;
    const stack = [start];
    const pixels = [];
    visited[start] = 1;
    let area = 0;
    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;

    while (stack.length > 0) {
      const pixel = stack.pop();
      pixels.push(pixel);
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      area += 1;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
      for (const next of [pixel - 1, pixel + 1, pixel - width, pixel + width]) {
        if (next < 0 || next >= visited.length || visited[next]) continue;
        const nx = next % width;
        const ny = Math.floor(next / width);
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
        if (data[next * 4 + 3] <= alphaThreshold) continue;
        visited[next] = 1;
        stack.push(next);
      }
    }

    found.push({
      area,
      left,
      top,
      right,
      bottom,
      width: right - left + 1,
      height: bottom - top + 1,
      centerX: (left + right) / 2,
      centerY: (top + bottom) / 2,
      pixels,
    });
  }
  return found.sort((a, b) => b.area - a.area);
}

function targetMetrics(rowIndex) {
  if (rowIndex === 11) return { targetHeight: 134, maxWidth: 186, maxHeight: 166, topBias: 26 };
  if (rowIndex === 8) return { targetHeight: 148, maxWidth: 186, maxHeight: 174, topBias: 18 };
  return { targetHeight: 168, maxWidth: 176, maxHeight: 196, topBias: 0 };
}

async function normalizeComponent(source, info, component, rowIndex) {
  const pad = 10;
  const left = Math.max(0, component.left - pad);
  const top = Math.max(0, component.top - pad);
  const right = Math.min(info.width, component.right + pad + 1);
  const bottom = Math.min(info.height, component.bottom + pad + 1);
  const cropWidth = right - left;
  const cropHeight = bottom - top;
  const crop = copyRect(source, info.width, left, top, cropWidth, cropHeight);
  const { targetHeight, maxWidth, maxHeight, topBias } = targetMetrics(rowIndex);
  const scale = Math.min(targetHeight / cropHeight, maxWidth / cropWidth, maxHeight / cropHeight, 2.4);
  const resizedWidth = Math.max(1, Math.round(cropWidth * scale));
  const resizedHeight = Math.max(1, Math.round(cropHeight * scale));
  const resized = await sharp(crop, { raw: { width: cropWidth, height: cropHeight, channels: 4 } })
    .resize({ width: resizedWidth, height: resizedHeight, fit: 'fill', kernel: 'nearest' })
    .raw()
    .toBuffer();
  const frame = blank(cellWidth, cellHeight);
  const frameLeft = Math.round((cellWidth - resizedWidth) / 2);
  const frameTop = Math.max(3, Math.round((cellHeight - resizedHeight) / 2) + topBias);
  for (let y = 0; y < resizedHeight; y += 1) {
    for (let x = 0; x < resizedWidth; x += 1) {
      const si = idx(x, y, resizedWidth);
      const alpha = resized[si + 3];
      if (alpha <= 8) continue;
      const ti = idx(frameLeft + x, frameTop + y, cellWidth);
      frame[ti] = resized[si];
      frame[ti + 1] = resized[si + 1];
      frame[ti + 2] = resized[si + 2];
      frame[ti + 3] = alpha;
    }
  }
  keyGreen(frame);
  return frame;
}

function composeRow(frames) {
  const width = cellWidth * columns;
  const row = blank(width, cellHeight);
  for (let column = 0; column < columns; column += 1) {
    const frame = frames[column];
    for (let y = 0; y < cellHeight; y += 1) {
      for (let x = 0; x < cellWidth; x += 1) {
        const si = idx(x, y, cellWidth);
        const ti = idx(column * cellWidth + x, y, width);
        row[ti] = frame[si];
        row[ti + 1] = frame[si + 1];
        row[ti + 2] = frame[si + 2];
        row[ti + 3] = frame[si + 3];
      }
    }
  }
  return row;
}

async function packGeneratedRowSource(generatedSourcePath, rowIndex) {
  const { data: generatedData, info: generatedInfo } = await sharp(generatedSourcePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  keyGreen(generatedData);
  const rowComponents = components(generatedData, generatedInfo.width, generatedInfo.height)
    .filter((component) => component.area >= 1000 && component.width >= 38 && component.height >= 72)
    .sort((a, b) => b.area - a.area)
    .slice(0, columns)
    .sort((a, b) => a.centerX - b.centerX);

  if (rowComponents.length !== columns) {
    throw new Error(`Expected ${columns} full generated receiving frames, found ${rowComponents.length}`);
  }

  const frames = [];
  for (const component of rowComponents) {
    frames.push(await normalizeComponent(generatedData, generatedInfo, component, rowIndex));
  }

  return {
    rowBuffer: composeRow(frames),
    rowComponents,
  };
}

await fs.mkdir(packDir, { recursive: true });
await fs.mkdir(petDir, { recursive: true });
const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
keyGreen(data);

const spriteComponents = components(data, info.width, info.height)
  .filter((component) => component.area >= 1000 && component.width >= 38 && component.height >= 72)
  .sort((a, b) => a.centerY - b.centerY);

if (spriteComponents.length !== 88 && spriteComponents.length !== rowDefs.length * columns) {
  throw new Error(`Expected 88 or ${rowDefs.length * columns} full sprite components, found ${spriteComponents.length}`);
}

const detectedGroups = [];
for (let index = 0; index < spriteComponents.length; index += columns) {
  detectedGroups.push(spriteComponents.slice(index, index + columns));
}

const mappedGroups = detectedGroups.length === rowDefs.length
  ? detectedGroups
  : [
      detectedGroups[0],
      detectedGroups[1],
      detectedGroups[2],
      detectedGroups[3],
      detectedGroups[4],
      detectedGroups[5],
      detectedGroups[6],
      detectedGroups[6],
      detectedGroups[7],
      detectedGroups[8],
      detectedGroups[9],
      detectedGroups[10],
    ];

const useGeneratedReceiving = await fileExists(generatedReceivingSourcePath);

const rowBuffers = [];
const rowReports = [];

for (let rowIndex = 0; rowIndex < rowDefs.length; rowIndex += 1) {
  const row = rowDefs[rowIndex];
  let rowBuffer;
  let rowComponents;
  let sourceGroup;
  let source;

  if (row.id === 'receiving' && useGeneratedReceiving) {
    const generatedRow = await packGeneratedRowSource(generatedReceivingSourcePath, rowIndex);
    rowBuffer = generatedRow.rowBuffer;
    rowComponents = generatedRow.rowComponents;
    sourceGroup = 'generated-receiving-v2';
    source = path.relative(root, generatedReceivingSourcePath);
  } else {
    rowComponents = mappedGroups[rowIndex].sort((a, b) => a.centerX - b.centerX);
    const frames = [];
    for (const component of rowComponents) {
      frames.push(await normalizeComponent(data, info, component, rowIndex));
    }
    rowBuffer = composeRow(frames);
    sourceGroup = detectedGroups.indexOf(mappedGroups[rowIndex]);
    source = path.relative(root, sourcePath);
  }

  const rowPath = path.join(packDir, `${String(rowIndex).padStart(2, '0')}-${row.id}-row.png`);
  await sharp(rowBuffer, { raw: { width: cellWidth * columns, height: cellHeight, channels: 4 } }).png().toFile(rowPath);
  rowBuffers.push(rowBuffer);
  rowReports.push({
    row: rowIndex,
    id: row.id,
    out: path.relative(root, rowPath),
    source,
    sourceGroup,
    components: rowComponents.map((component) => ({
      area: component.area,
      width: component.width,
      height: component.height,
      centerX: Number(component.centerX.toFixed(1)),
      centerY: Number(component.centerY.toFixed(1)),
    })),
  });
}

const atlasWidth = cellWidth * columns;
const atlasHeight = cellHeight * rowDefs.length;
const atlas = blank(atlasWidth, atlasHeight);
for (let rowIndex = 0; rowIndex < rowBuffers.length; rowIndex += 1) {
  const row = rowBuffers[rowIndex];
  for (let y = 0; y < cellHeight; y += 1) {
    for (let x = 0; x < atlasWidth; x += 1) {
      const si = idx(x, y, atlasWidth);
      const ti = idx(x, rowIndex * cellHeight + y, atlasWidth);
      atlas[ti] = row[si];
      atlas[ti + 1] = row[si + 1];
      atlas[ti + 2] = row[si + 2];
      atlas[ti + 3] = row[si + 3];
    }
  }
}
keyGreen(atlas);
await sharp(atlas, { raw: { width: atlasWidth, height: atlasHeight, channels: 4 } }).png().toFile(atlasPath);

await fs.writeFile(path.join(packDir, 'pack-report.json'), `${JSON.stringify({
  id: 'charcoal-square-global-components-v2-pack',
  character: 'lab-ai-cast-charcoal-square',
  outputAtlas: path.relative(root, atlasPath),
  sourceAtlas: path.relative(root, sourcePath),
  generatedReceivingSource: useGeneratedReceiving ? path.relative(root, generatedReceivingSourcePath) : null,
  note: useGeneratedReceiving
    ? 'Packed from global connected components because the original source sheet was not aligned to a strict 8x12 cell grid. Receiving is replaced with a fresh generated row source.'
    : 'Packed from global connected components because the original source sheet was not aligned to a strict 8x12 cell grid. The source contained 11 visual rows, so receiving is temporarily mapped from the nearest device row until a fresh Charcoal row can be generated.',
  rows: rowReports,
}, null, 2)}\n`);

await fs.writeFile(path.join(petDir, 'state-atlas.json'), `${JSON.stringify({
  sprite: 'lab-ai-cast-charcoal-square-l01',
  displayName: 'Cast Charcoal Square',
  atlas: path.relative(root, atlasPath),
  source: 'random-looplings-12-v2-charcoal-global-component-repack',
  sourceAtlas: path.relative(root, sourcePath),
  generatedReceivingSource: useGeneratedReceiving ? path.relative(root, generatedReceivingSourcePath) : null,
  rowPacks: path.relative(root, packDir) + '/',
  cellWidth,
  cellHeight,
  columns,
  rows: rowDefs.map((row, rowIndex) => ({ id: row.id, label: row.label, row: rowIndex, frameCount: columns, fps: row.fps })),
  repairNotes: [
    'Repacked from the original AI bitmap source atlas after diagnosing Charcoal as a source-grid alignment issue.',
    'Extracted the 88 full sprite components globally, grouped them by actual position, and normalized them into canonical cells.',
    useGeneratedReceiving
      ? 'Generated a fresh receiving row source so posting and receiving no longer recycle the same motion.'
      : 'The original source sheet contained 11 visual rows instead of 12, so the receiving row is temporarily mapped from the nearest device row.',
    'Removed chroma green and avoided row-boundary slicing that previously cut heads, bodies, and terminal props apart.',
    'Charcoal body with cyan square antenna, tired dark eyes, and blocky terminal props.',
  ],
  note: 'Random Looplings first-four v2 Charcoal Square global-component repack.',
}, null, 2)}\n`);

console.log(JSON.stringify({
  id: 'lab-ai-cast-charcoal-square',
  sourceComponents: spriteComponents.length,
  atlas: path.relative(root, atlasPath),
}, null, 2));
