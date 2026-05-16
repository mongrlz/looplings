import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourceDir = path.join(root, 'public/nft-gen-lab/path-d/row-sources/path-d-007-graphite-rune-v2');
const packDir = path.join(root, 'public/nft-gen-lab/path-d/row-packs/path-d-007-graphite-rune-v2');
const atlasPath = path.join(root, 'public/pets/path-d-graphite-rune/state-atlas.png');
const cellWidth = 192;
const cellHeight = 208;
const columns = 8;

const rows = [
  'idle',
  'thinking',
  'acting',
  'trading',
  'trade-win',
  'trade-loss',
  'posting',
  'receiving',
  'sleeping',
  'low-compute',
  'critical',
  'dead',
];

function idx(x, y, width) {
  return (y * width + x) * 4;
}

function keyGreen(data) {
  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const greenDominance = g - Math.max(r, b);
    const isChroma = g > 210 && r < 70 && b < 90 && greenDominance > 145;
    const isBrightFringe = g > 185 && r < 105 && b < 120 && greenDominance > 85;
    const isDarkFringe = g > 58 && greenDominance > 28 && g > r * 1.35 && g > b * 1.18;

    if (isChroma || isBrightFringe || isDarkFringe) {
      data[index] = 0;
      data[index + 1] = 0;
      data[index + 2] = 0;
      data[index + 3] = 0;
    }
  }
}

function connectedComponents(data, width, height) {
  const visited = new Uint8Array(width * height);
  const components = [];

  for (let start = 0; start < visited.length; start += 1) {
    if (visited[start] || data[start * 4 + 3] <= 24) continue;
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
        if (data[neighbor * 4 + 3] <= 24) continue;
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

  return components;
}

function transparent(width, height) {
  return Buffer.alloc(width * height * 4);
}

function putPixel(frame, x, y, color) {
  if (x < 0 || y < 0 || x >= cellWidth || y >= cellHeight) return;
  const target = idx(x, y, cellWidth);
  const sourceAlpha = color[3] / 255;
  const destAlpha = frame[target + 3] / 255;
  const outAlpha = sourceAlpha + destAlpha * (1 - sourceAlpha);
  if (outAlpha <= 0) return;

  frame[target] = Math.round((color[0] * sourceAlpha + frame[target] * destAlpha * (1 - sourceAlpha)) / outAlpha);
  frame[target + 1] = Math.round((color[1] * sourceAlpha + frame[target + 1] * destAlpha * (1 - sourceAlpha)) / outAlpha);
  frame[target + 2] = Math.round((color[2] * sourceAlpha + frame[target + 2] * destAlpha * (1 - sourceAlpha)) / outAlpha);
  frame[target + 3] = Math.round(outAlpha * 255);
}

function drawDot(frame, x, y, color, radius = 1) {
  for (let yy = y - radius; yy <= y + radius; yy += 1) {
    for (let xx = x - radius; xx <= x + radius; xx += 1) {
      if (Math.abs(xx - x) + Math.abs(yy - y) > radius + 1) continue;
      putPixel(frame, xx, yy, color);
    }
  }
}

function drawLine(frame, x0, y0, x1, y1, color, radius = 0) {
  let x = Math.round(x0);
  let y = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  const dx = Math.abs(x1 - x);
  const sx = x < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y);
  const sy = y < y1 ? 1 : -1;
  let err = dx + dy;

  while (true) {
    drawDot(frame, x, y, color, radius);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function frameBounds(frame) {
  let left = cellWidth;
  let top = cellHeight;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < cellHeight; y += 1) {
    for (let x = 0; x < cellWidth; x += 1) {
      if (frame[idx(x, y, cellWidth) + 3] <= 20) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  return right < 0 ? null : { left, top, right, bottom };
}

function addConnectedHaloGlints(frame, rowIndex, column) {
  const bounds = frameBounds(frame);
  if (!bounds) return;

  const cx = Math.round((bounds.left + bounds.right) / 2);
  const anchorY = bounds.top + 22 + Math.round(Math.cos(column * 0.65 + rowIndex) * 2);
  const anchorX = cx + Math.round(Math.sin(column * 0.7 + rowIndex) * 4);
  const haloGlow = [132, 102, 255, 96];
  const haloBright = [210, 196, 255, 226];
  const quiet = rowIndex === 8 || rowIndex === 9 || rowIndex === 11;
  const intense = rowIndex === 4 || rowIndex === 7 || rowIndex === 10;
  const reach = quiet ? 5 : intense ? 13 : 9;

  drawLine(frame, anchorX, anchorY, anchorX + reach, anchorY - 4 + (column % 2), haloGlow, 1);
  drawLine(frame, anchorX, anchorY, anchorX + reach, anchorY - 4 + (column % 2), haloBright, 0);

  if (intense || column % 3 === 1) {
    drawLine(frame, anchorX - 8, anchorY - 6, anchorX - 15, anchorY - 10 + (column % 2), haloGlow, 1);
    drawLine(frame, anchorX - 8, anchorY - 6, anchorX - 15, anchorY - 10 + (column % 2), haloBright, 0);
  }
}

async function normalizeComponent(source, info, component, rowIndex, column) {
  const pad = 22;
  const left = Math.max(0, component.left - pad);
  const top = Math.max(0, component.top - pad);
  const right = Math.min(info.width, component.right + pad + 1);
  const bottom = Math.min(info.height, component.bottom + pad + 1);
  const width = right - left;
  const height = bottom - top;
  const crop = transparent(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sx = left + x;
      const sy = top + y;
      const sourceIndex = idx(sx, sy, info.width);
      const targetIndex = idx(x, y, width);
      crop[targetIndex] = source[sourceIndex];
      crop[targetIndex + 1] = source[sourceIndex + 1];
      crop[targetIndex + 2] = source[sourceIndex + 2];
      crop[targetIndex + 3] = source[sourceIndex + 3];
    }
  }

  const maxWidth = rowIndex === 11 ? 180 : 166;
  const maxHeight = rowIndex === 11 ? 182 : 196;
  const scale = Math.min(maxWidth / width, maxHeight / height, 1.18);
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
  const frameTop = Math.max(4, Math.round((cellHeight - resizedHeight) / 2));

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

  addConnectedHaloGlints(frame, rowIndex, column);
  keyGreen(frame);
  return frame;
}

function composeRow(frames) {
  const width = cellWidth * columns;
  const row = transparent(width, cellHeight);

  for (let column = 0; column < columns; column += 1) {
    const frame = frames[column];
    for (let y = 0; y < cellHeight; y += 1) {
      for (let x = 0; x < cellWidth; x += 1) {
        const sourceIndex = idx(x, y, cellWidth);
        const targetIndex = idx(column * cellWidth + x, y, width);
        row[targetIndex] = frame[sourceIndex];
        row[targetIndex + 1] = frame[sourceIndex + 1];
        row[targetIndex + 2] = frame[sourceIndex + 2];
        row[targetIndex + 3] = frame[sourceIndex + 3];
      }
    }
  }

  return row;
}

async function packRow(rowIndex, rowId) {
  const sourcePath = path.join(sourceDir, `${String(rowIndex).padStart(2, '0')}-${rowId}-source.png`);
  const image = sharp(sourcePath).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  keyGreen(data);

  const components = connectedComponents(data, info.width, info.height)
    .filter((component) => component.area >= 2600 && component.width >= 42 && component.height >= 68)
    .sort((a, b) => b.area - a.area)
    .slice(0, columns)
    .sort((a, b) => a.centerX - b.centerX);

  if (components.length !== columns) {
    throw new Error(`${rowId} expected 8 character components, found ${components.length}`);
  }

  const frames = [];
  for (let column = 0; column < columns; column += 1) {
    frames.push(await normalizeComponent(data, info, components[column], rowIndex, column));
  }

  const rowBuffer = composeRow(frames);
  const outPath = path.join(packDir, `${String(rowIndex).padStart(2, '0')}-${rowId}-row.png`);
  await sharp(rowBuffer, {
    raw: { width: cellWidth * columns, height: cellHeight, channels: 4 },
  }).png().toFile(outPath);

  return {
    row: rowIndex,
    id: rowId,
    source: path.relative(root, sourcePath),
    out: path.relative(root, outPath),
    components: components.map(({ area, width, height, centerX, centerY }) => ({
      area,
      width,
      height,
      centerX: Number(centerX.toFixed(1)),
      centerY: Number(centerY.toFixed(1)),
    })),
  };
}

async function assembleAtlas(rowBuffers) {
  const width = cellWidth * columns;
  const height = cellHeight * rows.length;
  const atlas = transparent(width, height);

  for (let rowIndex = 0; rowIndex < rowBuffers.length; rowIndex += 1) {
    const row = rowBuffers[rowIndex];
    for (let y = 0; y < cellHeight; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const sourceIndex = idx(x, y, width);
        const targetIndex = idx(x, rowIndex * cellHeight + y, width);
        atlas[targetIndex] = row[sourceIndex];
        atlas[targetIndex + 1] = row[sourceIndex + 1];
        atlas[targetIndex + 2] = row[sourceIndex + 2];
        atlas[targetIndex + 3] = row[sourceIndex + 3];
      }
    }
  }

  keyGreen(atlas);
  await sharp(atlas, {
    raw: { width, height, channels: 4 },
  }).png().toFile(atlasPath);
}

await fs.mkdir(packDir, { recursive: true });

const manifestRows = [];
const rowBuffers = [];

for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
  const rowId = rows[rowIndex];
  manifestRows.push(await packRow(rowIndex, rowId));
  const rowPath = path.join(packDir, `${String(rowIndex).padStart(2, '0')}-${rowId}-row.png`);
  rowBuffers.push(await sharp(rowPath).ensureAlpha().raw().toBuffer());
}

await assembleAtlas(rowBuffers);

await fs.writeFile(path.join(packDir, 'pack-report.json'), `${JSON.stringify({
  id: 'path-d-graphite-rune-v2-generated-pack',
  outputAtlas: path.relative(root, atlasPath),
  note: 'Fresh AI-generated Graphite Rune Path D rows. Packing selects the 8 full character bodies, removes chroma green, drops loose generated halo/gleam fragments, and bakes connected violet-blue rune halo glints into each frame.',
  rows: manifestRows,
}, null, 2)}\n`);

console.log(JSON.stringify({
  atlas: path.relative(root, atlasPath),
  rows: manifestRows.length,
}, null, 2));
