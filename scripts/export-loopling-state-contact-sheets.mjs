import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {
  FROZEN_ATLAS_VARIANTS,
  LOOPLING_GENERATOR_STATES,
} from '../src/lib/loopling-generator.ts';

const root = process.cwd();
const outputDir = path.join(root, 'public/nft-gen-lab/state-contact-sheets');
const cellWidth = 192;
const cellHeight = 208;
const thumbWidth = 96;
const thumbHeight = 104;
const cardWidth = 156;
const cardHeight = 168;
const columns = 13;
const rows = Math.ceil(FROZEN_ATLAS_VARIANTS.length / columns);

function svgLabel(text, subtext) {
  const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const safeSubtext = subtext.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  return Buffer.from(`
    <svg width="${cardWidth}" height="${cardHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" rx="10" fill="#10161a" stroke="#2c3941"/>
      <text x="12" y="132" font-family="monospace" font-size="10" fill="#f4efe6">${safeText}</text>
      <text x="12" y="150" font-family="monospace" font-size="9" fill="#93a2aa">${safeSubtext}</text>
    </svg>
  `);
}

async function frameBuffer(variantId, stateRow) {
  const atlasPath = path.join(root, 'public/pets', variantId, 'state-atlas.png');

  return sharp(atlasPath)
    .extract({
      left: 0,
      top: stateRow * cellHeight,
      width: cellWidth,
      height: cellHeight,
    })
    .resize(thumbWidth, thumbHeight, { kernel: 'nearest' })
    .png()
    .toBuffer();
}

async function contactSheetForState(stateId, state) {
  const width = columns * cardWidth;
  const height = rows * cardHeight;
  const composites = [];

  for (let index = 0; index < FROZEN_ATLAS_VARIANTS.length; index += 1) {
    const variant = FROZEN_ATLAS_VARIANTS[index];
    const left = (index % columns) * cardWidth;
    const top = Math.floor(index / columns) * cardHeight;
    const thumb = await frameBuffer(variant.id, state.row);
    const label = svgLabel(`A${String(index + 1).padStart(3, '0')} ${variant.label}`, variant.id);

    composites.push({ input: label, left, top });
    composites.push({
      input: thumb,
      left: left + Math.floor((cardWidth - thumbWidth) / 2),
      top: top + 16,
    });
  }

  const filename = `${String(state.row).padStart(2, '0')}-${stateId}.png`;
  const outPath = path.join(outputDir, filename);

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: '#080b0d',
    },
  })
    .composite(composites)
    .png()
    .toFile(outPath);

  return {
    stateId,
    row: state.row,
    label: state.label,
    file: `/nft-gen-lab/state-contact-sheets/${filename}`,
    variants: FROZEN_ATLAS_VARIANTS.length,
  };
}

await fs.mkdir(outputDir, { recursive: true });

const sheets = [];

for (const [stateId, state] of Object.entries(LOOPLING_GENERATOR_STATES)) {
  sheets.push(await contactSheetForState(stateId, state));
}

const manifest = {
  schemaVersion: 'looplings-state-contact-sheets.v1',
  generatedFrom: 'approved frozen atlas variants',
  cell: { width: cellWidth, height: cellHeight },
  firstFrameOnly: true,
  sheets,
};

await fs.writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(JSON.stringify({
  outputDir: path.relative(root, outputDir),
  sheets: sheets.length,
  variantsPerSheet: FROZEN_ATLAS_VARIANTS.length,
}, null, 2));
