import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {
  FROZEN_ATLAS_VARIANTS,
  LOOPLING_GENERATOR_STATES,
} from '../src/lib/loopling-generator.ts';

const args = new Map();

for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const root = process.cwd();
const outPath = args.get('--out')
  ? path.resolve(args.get('--out'))
  : path.join(root, 'public/nft-gen-lab/motion-qa.json');
const cellWidth = Number(args.get('--cell-width') ?? 192);
const cellHeight = Number(args.get('--cell-height') ?? 208);
const columns = Number(args.get('--columns') ?? 8);
const alphaThreshold = Number(args.get('--alpha-threshold') ?? 18);
const edgePadding = Number(args.get('--edge-padding') ?? 2);
const centerRangeLimit = Number(args.get('--center-range-limit') ?? 36);
const areaRatioLimit = Number(args.get('--area-ratio-limit') ?? 2.2);
const recycledRowChangedRatioLimit = Number(args.get('--recycled-row-changed-ratio-limit') ?? 0.01);

function rowPixels(data, atlasWidth, row) {
  const output = Buffer.alloc(cellWidth * cellHeight * columns * 4);

  for (let y = 0; y < cellHeight; y += 1) {
    const sourceStart = ((row * cellHeight + y) * atlasWidth) * 4;
    const sourceEnd = sourceStart + cellWidth * columns * 4;
    data.copy(output, y * cellWidth * columns * 4, sourceStart, sourceEnd);
  }

  return output;
}

function rowDifference(a, b) {
  let changed = 0;
  let total = 0;

  for (let index = 0; index < a.length; index += 4) {
    const alphaA = a[index + 3];
    const alphaB = b[index + 3];

    if (alphaA <= alphaThreshold && alphaB <= alphaThreshold) continue;
    total += 1;

    const delta =
      Math.abs(a[index] - b[index]) +
      Math.abs(a[index + 1] - b[index + 1]) +
      Math.abs(a[index + 2] - b[index + 2]) +
      Math.abs(alphaA - alphaB);

    if (delta > 20) changed += 1;
  }

  return {
    changedRatio: changed / Math.max(1, total),
  };
}

function boundsForFrame(data, atlasWidth, row, column) {
  const frameLeft = column * cellWidth;
  const frameTop = row * cellHeight;
  let left = cellWidth;
  let top = cellHeight;
  let right = -1;
  let bottom = -1;
  let area = 0;

  for (let y = 0; y < cellHeight; y += 1) {
    for (let x = 0; x < cellWidth; x += 1) {
      const atlasX = frameLeft + x;
      const atlasY = frameTop + y;
      const alpha = data[(atlasY * atlasWidth + atlasX) * 4 + 3];

      if (alpha <= alphaThreshold) continue;
      area += 1;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (area === 0) return null;

  return {
    area,
    left,
    top,
    right,
    bottom,
    width: right - left + 1,
    height: bottom - top + 1,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
  };
}

function range(values) {
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    range: Math.max(...values) - Math.min(...values),
  };
}

function round(value) {
  return Number(value.toFixed(2));
}

function inspectStateRow(frames) {
  const warnings = [];
  const validFrames = frames.filter(Boolean);

  if (validFrames.length !== frames.length) {
    warnings.push({
      type: 'empty-frame',
      detail: `${frames.length - validFrames.length} of ${frames.length} frames had no opaque sprite pixels`,
    });
  }

  if (validFrames.length === 0) {
    return {
      status: 'review',
      warnings,
      metrics: null,
    };
  }

  const left = range(validFrames.map((frame) => frame.left));
  const top = range(validFrames.map((frame) => frame.top));
  const right = range(validFrames.map((frame) => frame.right));
  const bottom = range(validFrames.map((frame) => frame.bottom));
  const centerX = range(validFrames.map((frame) => frame.centerX));
  const centerY = range(validFrames.map((frame) => frame.centerY));
  const area = range(validFrames.map((frame) => frame.area));
  const areaRatio = area.max / Math.max(1, area.min);

  if (
    left.min <= edgePadding ||
    top.min <= edgePadding ||
    right.max >= cellWidth - edgePadding - 1 ||
    bottom.max >= cellHeight - edgePadding - 1
  ) {
    warnings.push({
      type: 'edge-risk',
      detail: `bounds left ${left.min}, top ${top.min}, right ${right.max}, bottom ${bottom.max}`,
    });
  }

  if (centerX.range > centerRangeLimit || centerY.range > centerRangeLimit) {
    warnings.push({
      type: 'large-motion-range',
      detail: `center ranges x ${round(centerX.range)}, y ${round(centerY.range)}`,
    });
  }

  if (areaRatio > areaRatioLimit) {
    warnings.push({
      type: 'area-spike',
      detail: `opaque area ratio ${round(areaRatio)} from ${area.min} to ${area.max}`,
    });
  }

  return {
    status: warnings.length === 0 ? 'pass' : 'review',
    warnings,
    metrics: {
      left,
      top,
      right,
      bottom,
      centerX: { min: round(centerX.min), max: round(centerX.max), range: round(centerX.range) },
      centerY: { min: round(centerY.min), max: round(centerY.max), range: round(centerY.range) },
      area: { min: area.min, max: area.max, range: area.range, ratio: round(areaRatio) },
    },
  };
}

async function inspectVariant(variant) {
  const atlasPath = path.join(root, 'public/pets', variant.id, 'state-atlas.png');
  const { data, info } = await sharp(atlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rows = [];
  const rowPixelMap = new Map();

  for (const [stateId, state] of Object.entries(LOOPLING_GENERATOR_STATES)) {
    const frames = [];
    rowPixelMap.set(stateId, rowPixels(data, info.width, state.row));

    for (let column = 0; column < columns; column += 1) {
      frames.push(boundsForFrame(data, info.width, state.row, column));
    }

    const inspection = inspectStateRow(frames);

    rows.push({
      variantId: variant.id,
      variantLabel: variant.label,
      stateId,
      stateLabel: state.label,
      row: state.row,
      status: inspection.status,
      warnings: inspection.warnings,
      metrics: inspection.metrics,
    });
  }

  for (let index = 0; index < rows.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < rows.length; nextIndex += 1) {
      const row = rows[index];
      const nextRow = rows[nextIndex];
      const difference = rowDifference(rowPixelMap.get(row.stateId), rowPixelMap.get(nextRow.stateId));

      if (difference.changedRatio > recycledRowChangedRatioLimit) continue;

      const warning = {
        type: 'recycled-state-row',
        detail: `${row.stateLabel} and ${nextRow.stateLabel} rows are ${Number((difference.changedRatio * 100).toFixed(2))}% different`,
      };

      row.warnings.push(warning);
      nextRow.warnings.push(warning);
      row.status = 'review';
      nextRow.status = 'review';
    }
  }

  return rows;
}

const rows = [];

for (const variant of FROZEN_ATLAS_VARIANTS) {
  rows.push(...await inspectVariant(variant));
}

const warningCounts = rows
  .flatMap((row) => row.warnings.map((warning) => warning.type))
  .reduce((counts, type) => {
    counts[type] = (counts[type] ?? 0) + 1;
    return counts;
  }, {});

const report = {
  schemaVersion: 'loopling-motion-qa.v1',
  generatedFrom: 'generator-approved AI-authored frozen atlas variants',
  rule: 'Each generator-approved full atlas is checked for empty frames, clipping risk, large center motion range, and frame-to-frame opaque area spikes. Quarantined palette-baked experiments are intentionally excluded.',
  thresholds: {
    cellWidth,
    cellHeight,
    columns,
    alphaThreshold,
    edgePadding,
    centerRangeLimit,
    areaRatioLimit,
    recycledRowChangedRatioLimit,
  },
  summary: {
    approvedLooks: FROZEN_ATLAS_VARIANTS.length,
    statesPerLook: Object.keys(LOOPLING_GENERATOR_STATES).length,
    totalStateRows: rows.length,
    passRows: rows.filter((row) => row.status === 'pass').length,
    reviewRows: rows.filter((row) => row.status === 'review').length,
    warningCounts,
  },
  reviewExamples: rows.filter((row) => row.status === 'review').slice(0, 40),
  rows,
};

await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify(report.summary, null, 2));
