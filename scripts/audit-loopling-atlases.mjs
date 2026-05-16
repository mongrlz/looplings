import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {
  FROZEN_ATLAS_VARIANTS,
  QUARANTINED_MOTION_REVIEW_LAB_ATLAS_VARIANTS,
  QUARANTINED_PALETTE_BAKED_ATLAS_VARIANTS,
  QUARANTINED_RECYCLED_ANIMATION_ATLAS_VARIANTS,
  QUARANTINED_RECYCLED_LAB_ATLAS_VARIANTS,
} from '../src/lib/loopling-generator.ts';

const args = new Map();

for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const root = process.cwd();
const petsDir = path.join(root, 'public/pets');
const generatorApprovedIds = new Set(FROZEN_ATLAS_VARIANTS.map((variant) => variant.id));
const quarantinedIds = new Set(QUARANTINED_PALETTE_BAKED_ATLAS_VARIANTS.map((variant) => variant.id));
const recycledAnimationIds = new Set([
  ...QUARANTINED_RECYCLED_ANIMATION_ATLAS_VARIANTS,
  ...QUARANTINED_RECYCLED_LAB_ATLAS_VARIANTS,
].map((variant) => variant.id));
const motionReviewIds = new Set(QUARANTINED_MOTION_REVIEW_LAB_ATLAS_VARIANTS.map((variant) => variant.id));
const outPath = args.get('--out') ? path.resolve(args.get('--out')) : null;
const cellWidth = Number(args.get('--cell-width') ?? 192);
const cellHeight = Number(args.get('--cell-height') ?? 208);
const columns = Number(args.get('--columns') ?? 8);
const rows = Number(args.get('--rows') ?? 12);
const alphaThreshold = Number(args.get('--alpha-threshold') ?? 18);
const minDetachedArea = Number(args.get('--min-detached-area') ?? 18);

function connectedComponents(data, width, height) {
  const visited = new Uint8Array(width * height);
  const components = [];

  for (let start = 0; start < visited.length; start += 1) {
    if (visited[start] || data[start * 4 + 3] <= alphaThreshold) continue;
    const stack = [start];
    visited[start] = 1;
    let area = 0;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    while (stack.length > 0) {
      const pixel = stack.pop();
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      area += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      for (const neighbor of [pixel - 1, pixel + 1, pixel - width, pixel + width]) {
        if (neighbor < 0 || neighbor >= visited.length || visited[neighbor]) continue;
        const nx = neighbor % width;
        const ny = Math.floor(neighbor / width);
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
        if (data[neighbor * 4 + 3] <= alphaThreshold) continue;
        visited[neighbor] = 1;
        stack.push(neighbor);
      }
    }

    components.push({
      area,
      left: minX,
      top: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    });
  }

  return components.sort((a, b) => b.area - a.area);
}

async function petAtlasIds() {
  const entries = await fs.readdir(petsDir, { withFileTypes: true });
  const ids = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const atlasPath = path.join(petsDir, entry.name, 'state-atlas.png');
    try {
      await fs.access(atlasPath);
      ids.push(entry.name);
    } catch {
      // no-op
    }
  }

  return ids.sort();
}

async function auditPet(id) {
  const atlasPath = path.join(petsDir, id, 'state-atlas.png');
  const image = sharp(atlasPath).ensureAlpha();
  const metadata = await image.metadata();
  const expectedWidth = cellWidth * columns;
  const expectedHeight = cellHeight * rows;
  const badFrames = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const { data, info } = await image
        .clone()
        .extract({
          left: column * cellWidth,
          top: row * cellHeight,
          width: cellWidth,
          height: cellHeight,
        })
        .raw()
        .toBuffer({ resolveWithObject: true });
      const components = connectedComponents(data, info.width, info.height);
      const detached = components.slice(1).filter((component) => component.area >= minDetachedArea);

      if (detached.length > 0) {
        badFrames.push({
          row,
          column,
          detached: detached.slice(0, 6),
        });
      }
    }
  }

  const hasExpectedSize = metadata.width === expectedWidth && metadata.height === expectedHeight;

  return {
    id,
    atlas: path.relative(root, atlasPath),
    status: hasExpectedSize && badFrames.length === 0 ? 'approved' : 'rejected',
    size: `${metadata.width}x${metadata.height}`,
    expectedSize: `${expectedWidth}x${expectedHeight}`,
    hasExpectedSize,
    detachedFrameCount: badFrames.length,
    examples: badFrames.slice(0, 5),
  };
}

const results = [];

for (const id of await petAtlasIds()) {
  results.push(await auditPet(id));
}

const audit = {
  schemaVersion: 'loopling-atlas-audit.v1',
  rule: 'Generator-approved atlases must be registered monolithic 192x208x8x12 PNG grids from the curated AI-authored pool. Palette-baked experiments and atlases with recycled state rows can pass technical PNG checks but remain quarantined from reset generation and mint math.',
  approved: results
    .filter((result) => result.status === 'approved' && generatorApprovedIds.has(result.id))
    .map((result) => result.id),
  generatorApproved: results
    .filter((result) => result.status === 'approved' && generatorApprovedIds.has(result.id))
    .map((result) => result.id),
  quarantinedPaletteBakes: results
    .filter((result) => quarantinedIds.has(result.id))
    .map((result) => result.id),
  quarantinedRecycledAnimations: results
    .filter((result) => recycledAnimationIds.has(result.id))
    .map((result) => result.id),
  quarantinedMotionReview: results
    .filter((result) => motionReviewIds.has(result.id))
    .map((result) => result.id),
  technicallyValidButNotGeneratorApproved: results
    .filter((result) => result.status === 'approved' && !generatorApprovedIds.has(result.id))
    .map((result) => result.id),
  technicallyValid: results.filter((result) => result.status === 'approved').map((result) => result.id),
  rejected: results.filter((result) => result.status === 'rejected').map((result) => result.id),
  results,
};

if (outPath) {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(audit, null, 2)}\n`);
}

console.log(JSON.stringify(audit, null, 2));
