import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const args = new Map();

for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const source = args.get('--source');
const out = args.get('--out');

if (!source || !out) {
  console.error('Usage: node scripts/pack-loopling-ai-atlas.mjs --source <source.png> --out <state-atlas.png>');
  process.exit(1);
}

const columns = Number(args.get('--columns') ?? 8);
const rows = Number(args.get('--rows') ?? 12);
const cellWidth = Number(args.get('--cell-width') ?? 192);
const cellHeight = Number(args.get('--cell-height') ?? 208);
const padX = Number(args.get('--pad-x') ?? 12);
const padTop = Number(args.get('--pad-top') ?? 8);
const padBottom = Number(args.get('--pad-bottom') ?? 8);
const sourcePath = path.resolve(source);
const outPath = path.resolve(out);
const outDir = path.dirname(outPath);
const minComponentArea = Number(args.get('--min-component-area') ?? 450);

function transparentCanvas(width, height) {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).png();
}

async function keyGreen(buffer) {
  const image = sharp(buffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const greenDistance = g - Math.max(r, b);

    if (g > 78 && greenDistance > 18 && r < 150 && b < 150) {
      const alphaCut = Math.max(0, Math.min(1, (greenDistance - 18) / 54));
      data[index + 3] = Math.round(data[index + 3] * (1 - alphaCut));

      if (alphaCut > 0.38) {
        data[index] = 0;
        data[index + 1] = 0;
        data[index + 2] = 0;
      }
    }
  }

  return sharp(data, { raw: info }).png().toBuffer();
}

async function keyGreenRaw(buffer) {
  const keyed = await keyGreen(buffer);
  return sharp(keyed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

async function getAlphaBounds(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      if (alpha <= 12) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < 0 || maxY < 0) return null;
  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

async function normalizedFrame(frameBuffer) {
  const keyed = await keyGreen(frameBuffer);
  const bounds = await getAlphaBounds(keyed);
  if (!bounds) return transparentCanvas(cellWidth, cellHeight).toBuffer();

  const maxWidth = cellWidth - padX * 2;
  const maxHeight = cellHeight - padTop - padBottom;
  const scale = Math.min(maxWidth / bounds.width, maxHeight / bounds.height, 1.5);
  const frameWidth = Math.max(1, Math.round(bounds.width * scale));
  const frameHeight = Math.max(1, Math.round(bounds.height * scale));
  const trimmed = await sharp(keyed)
    .extract(bounds)
    .resize({
      width: frameWidth,
      height: frameHeight,
      kernel: 'nearest',
      fit: 'fill',
    })
    .png()
    .toBuffer();
  const left = Math.round((cellWidth - frameWidth) / 2);
  const top = Math.max(padTop, Math.round((cellHeight - frameHeight) / 2));

  return transparentCanvas(cellWidth, cellHeight)
    .composite([{ input: trimmed, left, top }])
    .png()
    .toBuffer();
}

function componentBounds(data, info, start, visited) {
  const stack = [start];
  visited[start] = 1;
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  let area = 0;

  while (stack.length > 0) {
    const pixel = stack.pop();
    const x = pixel % info.width;
    const y = Math.floor(pixel / info.width);
    area += 1;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);

    const neighbors = [
      pixel - 1,
      pixel + 1,
      pixel - info.width,
      pixel + info.width,
    ];

    for (const neighbor of neighbors) {
      if (neighbor < 0 || neighbor >= visited.length || visited[neighbor]) continue;
      const nx = neighbor % info.width;
      const ny = Math.floor(neighbor / info.width);
      if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
      if (data[neighbor * 4 + 3] <= 18) continue;
      visited[neighbor] = 1;
      stack.push(neighbor);
    }
  }

  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    area,
    centerX: minX + (maxX - minX + 1) / 2,
    centerY: minY + (maxY - minY + 1) / 2,
  };
}

async function detectFrames(sourceBuffer) {
  const { data, info } = await keyGreenRaw(sourceBuffer);
  const visited = new Uint8Array(info.width * info.height);
  const components = [];

  for (let pixel = 0; pixel < visited.length; pixel += 1) {
    if (visited[pixel] || data[pixel * 4 + 3] <= 18) continue;
    const bounds = componentBounds(data, info, pixel, visited);
    if (bounds.area >= minComponentArea && bounds.width >= 16 && bounds.height >= 16) {
      components.push(bounds);
    }
  }

  const selected = components.sort((a, b) => a.centerY - b.centerY);
  const grouped = [];
  const sourceColumns = Math.max(columns, Math.round(selected.length / rows));

  for (let row = 0; row < rows; row += 1) {
    const rowFrames = selected
      .slice(row * sourceColumns, row * sourceColumns + sourceColumns)
      .sort((a, b) => a.centerX - b.centerX);
    const chosen = [];

    for (let column = 0; column < columns; column += 1) {
      const index = rowFrames.length <= columns
        ? column
        : Math.round((column / (columns - 1)) * (rowFrames.length - 1));
      chosen.push(rowFrames[index]);
    }

    grouped.push(chosen.filter(Boolean));
  }

  return { grouped, componentCount: components.length, selectedCount: grouped.flat().length, sourceColumns };
}

async function normalizeDetectedFrame(sourceBuffer, bounds) {
  const extractionPad = 8;
  const left = Math.max(0, Math.floor(bounds.left - extractionPad));
  const top = Math.max(0, Math.floor(bounds.top - extractionPad));
  const sourceInfo = await sharp(sourceBuffer).metadata();
  const right = Math.min(sourceInfo.width, Math.ceil(bounds.left + bounds.width + extractionPad));
  const bottom = Math.min(sourceInfo.height, Math.ceil(bounds.top + bounds.height + extractionPad));
  const frameBuffer = await sharp(sourceBuffer)
    .extract({
      left,
      top,
      width: right - left,
      height: bottom - top,
    })
    .png()
    .toBuffer();

  return normalizedFrame(frameBuffer);
}

await fs.mkdir(outDir, { recursive: true });

const sourceInfo = await sharp(sourcePath).metadata();
const sourceBuffer = await sharp(sourcePath).png().toBuffer();
const detection = await detectFrames(sourceBuffer);
const composites = [];
const clippedFrames = [];

for (let row = 0; row < rows; row += 1) {
  for (let column = 0; column < columns; column += 1) {
    const detected = detection.grouped[row]?.[column];
    const frame = detected
      ? await normalizeDetectedFrame(sourceBuffer, detected)
      : await transparentCanvas(cellWidth, cellHeight).toBuffer();
    const bounds = await getAlphaBounds(frame);

    if (bounds && (bounds.top <= 1 || bounds.left <= 1 || bounds.left + bounds.width >= cellWidth - 1 || bounds.top + bounds.height >= cellHeight - 1)) {
      clippedFrames.push({ row, column, bounds });
    }

    composites.push({
      input: frame,
      left: column * cellWidth,
      top: row * cellHeight,
    });
  }
}

await transparentCanvas(cellWidth * columns, cellHeight * rows)
  .composite(composites)
  .png()
  .toFile(outPath);

console.log(JSON.stringify({
  out: outPath,
  source: sourcePath,
  sourceSize: `${sourceInfo.width}x${sourceInfo.height}`,
  outputSize: `${cellWidth * columns}x${cellHeight * rows}`,
  componentCount: detection.componentCount,
  selectedCount: detection.selectedCount,
  detectedSourceColumns: detection.sourceColumns,
  clippedFrames,
}, null, 2));
