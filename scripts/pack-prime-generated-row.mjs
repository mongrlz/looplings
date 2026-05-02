import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const cellWidth = 192;
const cellHeight = 208;
const columns = 8;
const atlasPath = path.join(root, 'public/pets/prime-test/state-atlas.png');
const atlasManifestPath = path.join(root, 'public/pets/prime-test/state-atlas.json');

const rows = [
  { id: 'idle', label: 'Idle breathing', fps: 5, frameCount: 8, preserveFromAtlas: true },
  { id: 'thinking', label: 'Thinking focus', fps: 5, source: 'thinking-row-generated-v1.png', frameMap: [0, 1, 2, 3, 4, 5, 6, 0] },
  { id: 'acting', label: 'Tool action', fps: 8, source: 'acting-row-generated-v1.png' },
  { id: 'trading', label: 'Market scan', fps: 9, source: 'trading-row-generated-v1.png' },
  { id: 'trade_win', label: 'Trade win bounce', fps: 8, source: 'trade-win-row-generated-v1.png' },
  { id: 'trade_loss', label: 'Trade loss slump', fps: 5, source: 'trade-loss-row-generated-v1.png' },
  { id: 'posting', label: 'Posting send', fps: 6, source: 'posting-row-generated-v1.png' },
  { id: 'receiving', label: 'Receiving listen', fps: 6, source: 'receiving-row-generated-v1.png' },
  { id: 'sleeping', label: 'Sleeping breath', fps: 2, source: 'sleeping-row-generated-v1.png' },
  { id: 'low_compute', label: 'Low compute conserve', fps: 3, source: 'low-compute-row-generated-v1.png' },
  { id: 'critical', label: 'Critical distress', fps: 8, source: 'critical-row-generated-v1.png' },
  { id: 'dead', label: 'Dead grounded', fps: 0, source: 'dead-row-generated-v1.png' },
];

function sourcePath(row) {
  return path.join(root, 'public/pets/prime-test/sources', row.source);
}

function rowOutputPath(row) {
  return path.join(root, 'public/pets/prime-test/rows', `${row.id.replace(/_/g, '-')}-row-v1.png`);
}

function removeGreenMatte(data, info) {
  const out = Buffer.alloc(info.width * info.height * 4);

  for (let index = 0; index < info.width * info.height; index += 1) {
    const source = index * info.channels;
    const target = index * 4;
    const r = data[source];
    const g = data[source + 1];
    const b = data[source + 2];
    const cyanAntenna = r < 90 && g > 110 && b > 125 && Math.abs(g - b) < 95;
    const isGreenMatte = !cyanAntenna && g > 95 && g > r * 1.45 && g > b * 1.12;
    const nearGreenEdge = !cyanAntenna && g > 75 && g > r * 1.25 && g > b;

    out[target] = r;
    out[target + 1] = isGreenMatte || nearGreenEdge ? Math.min(g, 30) : g;
    out[target + 2] = b;
    out[target + 3] = isGreenMatte ? 0 : nearGreenEdge ? 40 : 255;
  }

  return out;
}

function alphaBounds(data, width, height) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 24) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX > maxX || minY > maxY) return null;
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function makeTransparentSource(row) {
  const { data, info } = await sharp(sourcePath(row)).raw().toBuffer({ resolveWithObject: true });
  const rgba = removeGreenMatte(data, info);
  return { buffer: rgba, width: info.width, height: info.height };
}

async function cleanResidualMatte(outputPath) {
  const { data, info } = await sharp(outputPath).raw().toBuffer({ resolveWithObject: true });
  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    if (data[index + 3] > 0 && g > 80 && g > r * 1.2 && g > b * 1.05) {
      data[index + 3] = 0;
    }
  }
  await sharp(data, { raw: info }).png().toFile(outputPath);
}

async function makeGeneratedRow(row) {
  const source = await makeTransparentSource(row);
  const sourceCellWidth = source.width / columns;
  const composites = [];
  const frames = [];

  for (let frame = 0; frame < columns; frame += 1) {
    const sourceFrame = row.frameMap?.[frame] ?? frame;
    const left = Math.round(sourceFrame * sourceCellWidth);
    const right = Math.round((sourceFrame + 1) * sourceCellWidth);
    const width = right - left;
    const { data, info } = await sharp(source.buffer, {
      raw: { width: source.width, height: source.height, channels: 4 },
    })
      .extract({ left, top: 0, width, height: source.height })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const bounds = alphaBounds(data, info.width, info.height);
    if (!bounds) continue;

    frames.push({ data, info, bounds });
  }

  const maxFrameWidth = Math.max(...frames.map((frame) => frame.bounds.width));
  const maxFrameHeight = Math.max(...frames.map((frame) => frame.bounds.height));
  const rowScale = Math.min(146 / maxFrameWidth, 178 / maxFrameHeight);

  for (let frame = 0; frame < frames.length; frame += 1) {
    const { data, info, bounds } = frames[frame];
    const sprite = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .extract(bounds)
      .resize({
        width: Math.max(1, Math.round(bounds.width * rowScale)),
        height: Math.max(1, Math.round(bounds.height * rowScale)),
        fit: 'fill',
        kernel: 'nearest',
        withoutEnlargement: false,
      })
      .png()
      .toBuffer();
    const spriteMeta = await sharp(sprite).metadata();

    composites.push({
      input: sprite,
      left: frame * cellWidth + Math.round((cellWidth - (spriteMeta.width ?? 0)) / 2),
      top: Math.round(cellHeight - (spriteMeta.height ?? 0) - 14),
    });
  }

  const outputPath = rowOutputPath(row);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await sharp({
    create: {
      width: cellWidth * columns,
      height: cellHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outputPath);
  await cleanResidualMatte(outputPath);
  return outputPath;
}

async function preservedIdleRow() {
  return sharp(atlasPath)
    .extract({ left: 0, top: 0, width: cellWidth * columns, height: cellHeight })
    .png()
    .toBuffer();
}

async function composeAtlas() {
  const composites = [];
  const manifestRows = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const input = row.preserveFromAtlas
      ? await preservedIdleRow()
      : await sharp(await makeGeneratedRow(row)).png().toBuffer();

    composites.push({ input, left: 0, top: rowIndex * cellHeight });
    manifestRows.push({
      id: row.id,
      label: row.label,
      row: rowIndex,
      frameCount: row.frameCount ?? columns,
      fps: row.fps,
    });
  }

  await sharp({
    create: {
      width: cellWidth * columns,
      height: cellHeight * rows.length,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(atlasPath);

  await fs.writeFile(
    atlasManifestPath,
    `${JSON.stringify({
      sprite: 'prime-test-l01',
      atlas: path.relative(root, atlasPath),
      cellWidth,
      cellHeight,
      columns,
      rows: manifestRows,
    }, null, 2)}\n`,
  );
}

await composeAtlas();
