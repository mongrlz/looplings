import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';

const run = promisify(execFile);
const root = process.cwd();
const petId = process.argv.find((arg) => arg.startsWith('--pet='))?.split('=')[1];

if (!petId) {
  console.error('Usage: node scripts/export-loopling-state-previews.mjs --pet=<pet-id>');
  process.exit(1);
}

const petDir = path.join(root, 'public/pets', petId);
const atlasPath = path.join(petDir, 'state-atlas.png');
const manifestPath = path.join(petDir, 'state-atlas.json');
const previewDir = path.join(petDir, 'previews');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const { cellWidth, cellHeight, columns, rows } = manifest;

async function frameBuffer(row, frame) {
  return sharp(atlasPath)
    .extract({
      left: frame * cellWidth,
      top: row * cellHeight,
      width: cellWidth,
      height: cellHeight,
    })
    .png()
    .toBuffer();
}

async function writeGif(rowMeta) {
  const framesDir = path.join(previewDir, '.frames', rowMeta.id);
  await fs.rm(framesDir, { recursive: true, force: true });
  await fs.mkdir(framesDir, { recursive: true });

  for (let frame = 0; frame < rowMeta.frameCount; frame += 1) {
    await fs.writeFile(
      path.join(framesDir, `frame-${String(frame).padStart(3, '0')}.png`),
      await frameBuffer(rowMeta.row, frame),
    );
  }

  const fps = rowMeta.fps > 0 ? rowMeta.fps : 1;
  const outputPath = path.join(previewDir, `${rowMeta.id}.gif`);
  const palettePath = path.join(framesDir, 'palette.png');

  await run('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-framerate',
    String(fps),
    '-i',
    path.join(framesDir, 'frame-%03d.png'),
    '-vf',
    'palettegen=reserve_transparent=on:transparency_color=000000',
    palettePath,
  ]);

  await run('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-framerate',
    String(fps),
    '-i',
    path.join(framesDir, 'frame-%03d.png'),
    '-i',
    palettePath,
    '-lavfi',
    'paletteuse=alpha_threshold=128',
    '-loop',
    '0',
    outputPath,
  ]);

  await fs.rm(framesDir, { recursive: true, force: true });
}

async function writeContactSheet() {
  const labelHeight = 34;
  const rowGap = 18;
  const sheetWidth = cellWidth * columns;
  const sheetHeight = rows.length * (cellHeight + labelHeight + rowGap) - rowGap;
  const composites = [];

  for (const rowMeta of rows) {
    const rowTop = rowMeta.row * (cellHeight + labelHeight + rowGap);
    const rowImage = await sharp(atlasPath)
      .extract({
        left: 0,
        top: rowMeta.row * cellHeight,
        width: sheetWidth,
        height: cellHeight,
      })
      .png()
      .toBuffer();
    composites.push({ input: rowImage, left: 0, top: rowTop + labelHeight });
  }

  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: { r: 10, g: 12, b: 14, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toFile(path.join(previewDir, 'contact-sheet.png'));
}

await fs.mkdir(previewDir, { recursive: true });
for (const rowMeta of rows) {
  await writeGif(rowMeta);
}
await writeContactSheet();

console.log(JSON.stringify({
  pet: petId,
  previewDir: path.relative(root, previewDir),
  gifs: rows.map((row) => `${row.id}.gif`),
  contactSheet: 'contact-sheet.png',
}, null, 2));
