import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const args = new Map();

for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const out = args.get('--out');
const rows = args.get('--rows');

if (!out || !rows) {
  console.error('Usage: node scripts/assemble-loopling-ai-atlas-from-row-packs.mjs --out <state-atlas.png> --rows <source.png:row,...>');
  process.exit(1);
}

const cellWidth = Number(args.get('--cell-width') ?? 192);
const cellHeight = Number(args.get('--cell-height') ?? 208);
const columns = Number(args.get('--columns') ?? 8);
const outPath = path.resolve(out);
const rowSpecs = rows.split(',').map((token) => token.trim()).filter(Boolean);

if (rowSpecs.length !== 12) {
  console.error(`Expected exactly 12 output row specs, received ${rowSpecs.length}.`);
  process.exit(1);
}

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

function parseRowSpec(spec) {
  const divider = spec.lastIndexOf(':');
  if (divider <= 0 || divider === spec.length - 1) {
    throw new Error(`Invalid row spec "${spec}". Expected <source.png>:<row>.`);
  }

  return {
    sourcePath: path.resolve(spec.slice(0, divider)),
    sourceRow: Number(spec.slice(divider + 1)),
  };
}

async function rowBuffer(sourcePath, row) {
  return sharp(sourcePath)
    .extract({
      left: 0,
      top: row * cellHeight,
      width: cellWidth * columns,
      height: cellHeight,
    })
    .png()
    .toBuffer();
}

await fs.mkdir(path.dirname(outPath), { recursive: true });

const composites = [];
const resolvedRows = [];

for (let outputRow = 0; outputRow < rowSpecs.length; outputRow += 1) {
  const spec = parseRowSpec(rowSpecs[outputRow]);
  const input = await rowBuffer(spec.sourcePath, spec.sourceRow);

  resolvedRows.push({
    outputRow,
    source: spec.sourcePath,
    row: spec.sourceRow,
  });

  composites.push({
    input,
    left: 0,
    top: outputRow * cellHeight,
  });
}

await transparentCanvas(cellWidth * columns, cellHeight * rowSpecs.length)
  .composite(composites)
  .png()
  .toFile(outPath);

console.log(JSON.stringify({
  out: outPath,
  rows: resolvedRows,
  outputSize: `${cellWidth * columns}x${cellHeight * rowSpecs.length}`,
}, null, 2));
