import path from 'node:path';
import sharp from 'sharp';

const args = new Map();

for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const input = args.get('--input');
const out = args.get('--out');

if (!input || !out) {
  console.error('Usage: node scripts/repair-loopling-atlas-connected-components.mjs --input <state-atlas.png> --out <state-atlas.png>');
  process.exit(1);
}

const cellWidth = Number(args.get('--cell-width') ?? 192);
const cellHeight = Number(args.get('--cell-height') ?? 208);
const columns = Number(args.get('--columns') ?? 8);
const rows = Number(args.get('--rows') ?? 12);
const alphaThreshold = Number(args.get('--alpha-threshold') ?? 0);
const inputPath = path.resolve(input);
const outPath = path.resolve(out);
const expectedWidth = cellWidth * columns;
const expectedHeight = cellHeight * rows;

const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

if (info.width !== expectedWidth || info.height !== expectedHeight) {
  console.error(`Expected ${expectedWidth}x${expectedHeight}, got ${info.width}x${info.height}.`);
  process.exit(1);
}

const cellPixels = cellWidth * cellHeight;
const visited = new Uint8Array(cellPixels);
const keep = new Uint8Array(cellPixels);
const queue = new Int32Array(cellPixels);
const component = new Int32Array(cellPixels);
const detached = [];

function alphaAt(cellX, cellY, localIndex) {
  const localX = localIndex % cellWidth;
  const localY = Math.floor(localIndex / cellWidth);
  const x = cellX * cellWidth + localX;
  const y = cellY * cellHeight + localY;
  return data[(y * info.width + x) * 4 + 3];
}

function clearPixel(cellX, cellY, localIndex) {
  const localX = localIndex % cellWidth;
  const localY = Math.floor(localIndex / cellWidth);
  const x = cellX * cellWidth + localX;
  const y = cellY * cellHeight + localY;
  const offset = (y * info.width + x) * 4;
  data[offset] = 0;
  data[offset + 1] = 0;
  data[offset + 2] = 0;
  data[offset + 3] = 0;
}

for (let row = 0; row < rows; row += 1) {
  for (let column = 0; column < columns; column += 1) {
    visited.fill(0);
    keep.fill(0);

    let largestStart = -1;
    let largestSize = 0;
    const components = [];

    for (let start = 0; start < cellPixels; start += 1) {
      if (visited[start] || alphaAt(column, row, start) <= alphaThreshold) continue;

      let head = 0;
      let tail = 0;
      let count = 0;
      queue[tail] = start;
      tail += 1;
      visited[start] = 1;

      while (head < tail) {
        const current = queue[head];
        head += 1;
        component[count] = current;
        count += 1;

        const x = current % cellWidth;
        const y = Math.floor(current / cellWidth);

        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx < 0 || nx >= cellWidth || ny < 0 || ny >= cellHeight) continue;

          const next = ny * cellWidth + nx;
          if (visited[next] || alphaAt(column, row, next) <= alphaThreshold) continue;

          visited[next] = 1;
          queue[tail] = next;
          tail += 1;
        }
      }

      const pixels = Array.from(component.subarray(0, count));
      components.push({ start, count, pixels });

      if (count > largestSize) {
        largestStart = start;
        largestSize = count;
      }
    }

    for (const item of components) {
      if (item.start === largestStart) {
        for (const pixel of item.pixels) keep[pixel] = 1;
      }
    }

    let removed = 0;

    for (let index = 0; index < cellPixels; index += 1) {
      if (visited[index] && !keep[index]) {
        clearPixel(column, row, index);
        removed += 1;
      }
    }

    if (removed > 0) {
      detached.push({ row, column, removedPixels: removed, keptPixels: largestSize });
    }
  }
}

await sharp(data, {
  raw: {
    width: info.width,
    height: info.height,
    channels: 4,
  },
}).png().toFile(outPath);

console.log(JSON.stringify({
  input: inputPath,
  out: outPath,
  repairedFrameCount: detached.length,
  detached,
}, null, 2));
