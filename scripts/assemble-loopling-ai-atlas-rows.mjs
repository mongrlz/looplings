import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const args = new Map();

for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const base = args.get('--base');
const insert = args.get('--insert');
const out = args.get('--out');
const map = args.get('--map');

if (!base || !insert || !out || !map) {
  console.error('Usage: node scripts/assemble-loopling-ai-atlas-rows.mjs --base <base-atlas.png> --insert <insert-rows.png> --out <state-atlas.png> --map <base-row|insert:row,...>');
  process.exit(1);
}

const cellWidth = Number(args.get('--cell-width') ?? 192);
const cellHeight = Number(args.get('--cell-height') ?? 208);
const columns = Number(args.get('--columns') ?? 8);
const outPath = path.resolve(out);
const basePath = path.resolve(base);
const insertPath = path.resolve(insert);
const rowMap = map.split(',').map((token) => token.trim()).filter(Boolean);

if (rowMap.length !== 12) {
  console.error(`Expected exactly 12 output row mappings, received ${rowMap.length}.`);
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

for (let outputRow = 0; outputRow < rowMap.length; outputRow += 1) {
  const token = rowMap[outputRow];
  const isInsert = token.startsWith('insert:');
  const sourceRow = Number(isInsert ? token.replace('insert:', '') : token);
  const sourcePath = isInsert ? insertPath : basePath;
  const input = await rowBuffer(sourcePath, sourceRow);

  composites.push({
    input,
    left: 0,
    top: outputRow * cellHeight,
  });
}

await transparentCanvas(cellWidth * columns, cellHeight * rowMap.length)
  .composite(composites)
  .png()
  .toFile(outPath);

console.log(JSON.stringify({
  out: outPath,
  base: basePath,
  insert: insertPath,
  rows: rowMap,
  outputSize: `${cellWidth * columns}x${cellHeight * rowMap.length}`,
}, null, 2));
