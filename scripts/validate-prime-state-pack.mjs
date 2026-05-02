import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const packPath = path.join(root, 'public/pets/prime-test/prime-l01-state-pack.json');
const prototypeAtlasPath = path.join(root, 'public/pets/prime-test/state-atlas.png');
const productionAtlasPath = path.join(root, 'public/pets/prime-test/production-state-atlas.png');

const pack = JSON.parse(await fs.readFile(packPath, 'utf8'));
const atlasPath = pack.productionAtlas ? path.join(root, pack.productionAtlas.replace(/^\//, 'public/')) : prototypeAtlasPath;
const atlas = await sharp(atlasPath).ensureAlpha().metadata();
const statesWithArt = pack.states.filter((state) => state.sourceType !== 'missing' && state.currentAsset !== '');
const expectedWidth = pack.cell.width * pack.cell.columns;
const expectedRows = Math.max(1, ...statesWithArt.map((state) => state.row + 1));
const expectedHeight = pack.cell.height * expectedRows;
const failures = [];
const warnings = [];
const rowHashes = new Map();

if (atlas.width !== expectedWidth) {
  failures.push(`Atlas width ${atlas.width} does not match expected ${expectedWidth}.`);
}

if (atlas.height !== expectedHeight) {
  failures.push(`Atlas height ${atlas.height} does not match expected ${expectedHeight}.`);
}

for (const state of pack.states) {
  if (state.sourceType === 'missing') {
    if (state.status !== 'needs_art') warnings.push(`${state.id} is missing art but status is ${state.status}.`);
    continue;
  }

  if (state.frameCount < 1) failures.push(`${state.id} has no frames.`);
  if (state.id !== 'dead' && state.frameCount !== pack.cell.defaultFrameCount) {
    failures.push(`${state.id} must use ${pack.cell.defaultFrameCount} frames.`);
  }
  if (state.id === 'dead' && state.frameCount !== 1 && state.frameCount !== pack.cell.defaultFrameCount) {
    failures.push(`dead must be a one-frame hold or ${pack.cell.defaultFrameCount}-frame compatibility row.`);
  }
  if ((state.status === 'approved' || state.status === 'production_locked') && state.sourceType !== 'generated_state_row') {
    failures.push(`${state.id} cannot be ${state.status} while sourceType is ${state.sourceType}.`);
  }

  if (state.status === 'draft' && state.sourceType !== 'generated_state_row') {
    warnings.push(`${state.id} is a user-kept draft but still needs an independent generated row before approval.`);
  }
  if (state.sourceType === 'prototype_remix') {
    warnings.push(`${state.id} is prototype-only and must be regenerated before approval.`);
  }

  const frameHashes = [];
  for (let frameIndex = 0; frameIndex < state.frameCount; frameIndex += 1) {
    const { data } = await sharp(atlasPath)
      .ensureAlpha()
      .extract({
        left: frameIndex * pack.cell.width,
        top: state.row * pack.cell.height,
        width: pack.cell.width,
        height: pack.cell.height,
      })
      .raw()
      .toBuffer({ resolveWithObject: true });

    let alphaPixels = 0;
    for (let index = 3; index < data.length; index += 4) {
      if (data[index] > 0) alphaPixels += 1;
    }
    if (alphaPixels === 0) failures.push(`${state.id} frame ${frameIndex + 1} is blank.`);

    frameHashes.push(crypto.createHash('sha256').update(data).digest('hex'));
  }

  const rowHash = crypto.createHash('sha256').update(frameHashes.join(':')).digest('hex');
  const duplicate = rowHashes.get(rowHash);
  if (duplicate) failures.push(`${state.id} duplicates the rendered row for ${duplicate}.`);
  rowHashes.set(rowHash, state.id);
}

if (pack.productionAtlas) {
  try {
    await fs.access(productionAtlasPath);
  } catch {
    failures.push(`productionAtlas points to missing file: ${pack.productionAtlas}`);
  }
}

console.log(JSON.stringify({
  pack: path.relative(root, packPath),
  atlas: path.relative(root, atlasPath),
  status: pack.status,
  failures,
  warnings,
}, null, 2));

if (failures.length) process.exit(1);
