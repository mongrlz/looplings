import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const packPath = path.join(root, 'public/pets/prime-test/prime-l01-state-pack.json');
const variationModelPath = path.join(root, 'src/lib/prime-variation-model.ts');
const traitRegistryPath = path.join(root, 'public/pets/prime-test/traits/prime-trait-registry.v1.json');
const generatedManifestPath = path.join(root, 'public/pets/prime-test/generated/prime-genesis/manifest.json');
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

async function validateTraitAtlas(atlasFile, label, expected, { maxFilledRatio = 0.22 } = {}) {
  let metadata;
  try {
    metadata = await sharp(atlasFile).ensureAlpha().metadata();
  } catch {
    failures.push(`${label} points to missing or unreadable file: ${path.relative(root, atlasFile)}.`);
    return;
  }

  if (metadata.width !== expected.width || metadata.height !== expected.height) {
    failures.push(`${label} dimensions ${metadata.width}x${metadata.height} do not match expected ${expected.width}x${expected.height}.`);
    return;
  }

  let totalAlphaPixels = 0;
  for (let row = 0; row < expected.rows; row += 1) {
    for (let frameIndex = 0; frameIndex < expected.columns; frameIndex += 1) {
      const { data } = await sharp(atlasFile)
        .ensureAlpha()
        .extract({
          left: frameIndex * expected.cellWidth,
          top: row * expected.cellHeight,
          width: expected.cellWidth,
          height: expected.cellHeight,
        })
        .raw()
        .toBuffer({ resolveWithObject: true });

      let alphaPixels = 0;
      for (let index = 3; index < data.length; index += 4) {
        if (data[index] > 8) alphaPixels += 1;
      }

      totalAlphaPixels += alphaPixels;
      if (alphaPixels === 0) failures.push(`${label} row ${row + 1} frame ${frameIndex + 1} is blank.`);
    }
  }

  const filledRatio = totalAlphaPixels / (expected.width * expected.height);
  if (filledRatio > maxFilledRatio) {
    failures.push(`${label} fills ${(filledRatio * 100).toFixed(1)}% of the atlas; trait layers should stay mostly transparent.`);
  }
}

try {
  const traitRegistry = JSON.parse(await fs.readFile(traitRegistryPath, 'utf8'));
  const expectedTraitAtlas = {
    cellWidth: pack.cell.width,
    cellHeight: pack.cell.height,
    columns: pack.cell.columns,
    rows: expectedRows,
    width: expectedWidth,
    height: expectedHeight,
  };
  const modelText = await fs.readFile(variationModelPath, 'utf8');
  const shapeSectionStart = modelText.indexOf('export const PRIME_ANTENNA_SHAPES_V1');
  const shapeSectionEnd = modelText.indexOf('export const PRIME_ANTENNA_COLORS_V1');
  const shapeSection = shapeSectionStart >= 0 && shapeSectionEnd > shapeSectionStart
    ? modelText.slice(shapeSectionStart, shapeSectionEnd)
    : '';
  const expectedShapeIds = [...shapeSection.matchAll(/id: '([^']+)'/g)].map((match) => match[1]);
  const registryShapeIds = (traitRegistry.layers?.antenna_shape ?? []).map((layer) => layer.id);

  for (const shapeId of expectedShapeIds) {
    if (!registryShapeIds.includes(shapeId)) warnings.push(`antenna_shape/${shapeId} is metadata-only until an artist-approved layer atlas exists.`);
  }

  for (const layer of traitRegistry.layers?.antenna_shape ?? []) {
    await validateTraitAtlas(
      path.join(root, layer.atlas),
      `antenna_shape/${layer.id}`,
      expectedTraitAtlas,
    );
  }

  if (traitRegistry.masks?.antenna_shape) {
    await validateTraitAtlas(
      path.join(root, traitRegistry.masks.antenna_shape),
      'antenna_shape/_base-mask',
      expectedTraitAtlas,
      { maxFilledRatio: 0.28 },
    );
  } else {
    failures.push('Trait registry is missing masks.antenna_shape.');
  }
} catch (error) {
  warnings.push(`Trait registry validation skipped: ${error.message}`);
}

try {
  const generatedManifest = JSON.parse(await fs.readFile(generatedManifestPath, 'utf8'));
  const tokenCount = generatedManifest.tokens?.length ?? 0;

  if (generatedManifest.schemaVersion !== 'prime-generated-atlas-pack.v1') {
    failures.push(`Generated atlas pack schema is ${generatedManifest.schemaVersion}.`);
  }
  if (generatedManifest.seed !== 'prime-genesis') {
    failures.push(`Generated atlas pack seed is ${generatedManifest.seed}.`);
  }
  if (tokenCount < 24) {
    failures.push(`Generated atlas pack has ${tokenCount} tokens; expected at least 24 for the default lab batch.`);
  }

  for (const token of generatedManifest.tokens ?? []) {
    const tokenAtlasPath = path.join(root, token.atlas);
    const tokenMetadataPath = path.join(root, token.metadata);
    let tokenAtlas;
    try {
      tokenAtlas = await sharp(tokenAtlasPath).ensureAlpha().metadata();
    } catch {
      failures.push(`${token.tokenId} generated atlas is missing or unreadable: ${token.atlas}.`);
      continue;
    }

    if (tokenAtlas.width !== expectedWidth || tokenAtlas.height !== expectedHeight) {
      failures.push(`${token.tokenId} generated atlas dimensions ${tokenAtlas.width}x${tokenAtlas.height} do not match ${expectedWidth}x${expectedHeight}.`);
    }

    try {
      const tokenMetadata = JSON.parse(await fs.readFile(tokenMetadataPath, 'utf8'));
      if (tokenMetadata.tokenId !== token.tokenId) failures.push(`${token.tokenId} metadata tokenId mismatch.`);
      if (!tokenMetadata.visualStatus?.bodyPalette?.includes('baked')) failures.push(`${token.tokenId} metadata does not mark bodyPalette as baked.`);
      if (!tokenMetadata.visualStatus?.antennaColor?.includes('baked')) failures.push(`${token.tokenId} metadata does not mark antennaColor as baked.`);
    } catch {
      failures.push(`${token.tokenId} metadata is missing or invalid: ${token.metadata}.`);
    }
  }
} catch (error) {
  failures.push(`Generated atlas pack validation failed: ${error.message}`);
}

console.log(JSON.stringify({
  pack: path.relative(root, packPath),
  atlas: path.relative(root, atlasPath),
  traitRegistry: path.relative(root, traitRegistryPath),
  generatedPack: path.relative(root, generatedManifestPath),
  status: pack.status,
  failures,
  warnings,
}, null, 2));

if (failures.length) process.exit(1);
