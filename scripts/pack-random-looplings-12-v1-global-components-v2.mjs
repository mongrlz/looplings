import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourceBatchId = 'random-looplings-12-v1';
const outputBatchId = 'random-looplings-12-v2';
const sourceRoot = path.join(root, 'public/nft-gen-lab/ai-sources', sourceBatchId);
const generatedRowRoot = path.join(root, 'public/nft-gen-lab/ai-sources', outputBatchId);
const packRoot = path.join(root, 'public/nft-gen-lab/row-packs', outputBatchId);
const petsRoot = path.join(root, 'public/pets');

const cellWidth = 192;
const cellHeight = 208;
const columns = 8;

const rowDefs = [
  { id: 'idle', label: 'Idle breathing', fps: 5 },
  { id: 'thinking', label: 'Thinking focus', fps: 5 },
  { id: 'acting', label: 'Tool action', fps: 8 },
  { id: 'trading', label: 'Trading workstation', fps: 9 },
  { id: 'trade_win', label: 'Trade win celebration', fps: 8 },
  { id: 'trade_loss', label: 'Trade loss reaction', fps: 5 },
  { id: 'posting', label: 'Posting device loop', fps: 6 },
  { id: 'receiving', label: 'Receiving signal loop', fps: 6 },
  { id: 'sleeping', label: 'Sleeping breath', fps: 2 },
  { id: 'low_compute', label: 'Low compute fade', fps: 3 },
  { id: 'critical', label: 'Critical alert', fps: 8 },
  { id: 'dead', label: 'Dead memorial', fps: 0 },
];

const characters = [
  {
    id: 'lab-ai-cast-charcoal-square',
    label: 'Cast Charcoal Square',
    sourceSlug: 'charcoal-square',
    bodyPalette: 'Charcoal Gray',
    eyeStyle: 'Tired Blue',
    antennaShape: 'Square Loop',
    antennaColor: 'Cyan Frame',
    foreheadGlyph: 'Cyan Square',
    note: 'Charcoal body with a cyan square antenna, tired eyes, and blocky terminal props.',
  },
  {
    id: 'lab-ai-cast-cherry-flame',
    label: 'Cast Cherry Flame',
    sourceSlug: 'cherry-flame',
    bodyPalette: 'Cherry Ember',
    eyeStyle: 'Ember Glow',
    antennaShape: 'Flame Loop',
    antennaColor: 'Living Flame',
    foreheadGlyph: 'Ember Diamond',
    note: 'Dark cherry body with a flame antenna, orange eyes, and ember device props.',
  },
  {
    id: 'lab-ai-cast-cobalt-moon',
    label: 'Cast Cobalt Moon',
    sourceSlug: 'cobalt-moon',
    bodyPalette: 'Cobalt Blue',
    eyeStyle: 'Midnight Round',
    antennaShape: 'Moon Ring',
    antennaColor: 'Cobalt Moon',
    foreheadGlyph: 'Moon Diamond',
    note: 'Cobalt body with a crescent-moon ring antenna, navy eyes, and night-trading props.',
  },
  {
    id: 'lab-ai-cast-coral-twinloop',
    label: 'Cast Coral Twinloop',
    sourceSlug: 'coral-twinloop',
    bodyPalette: 'Coral Peach',
    eyeStyle: 'Amber Twin Gloss',
    antennaShape: 'Twin Loop',
    antennaColor: 'Coral Ribbon',
    foreheadGlyph: 'Coral Diamond',
    note: 'Coral body with a twin-loop antenna, amber eyes, and paired social/trading devices.',
  },
  {
    id: 'lab-ai-cast-frost-diamond',
    label: 'Cast Frost Diamond',
    sourceSlug: 'frost-diamond',
    bodyPalette: 'Frost White',
    eyeStyle: 'Teal Crystal',
    antennaShape: 'Diamond Loop',
    antennaColor: 'Frost Signal',
    foreheadGlyph: 'Ice Diamond',
    note: 'Frost white body with a diamond antenna, teal eyes, and crystalline tools.',
  },
  {
    id: 'lab-ai-cast-honey-coin',
    label: 'Cast Honey Coin',
    sourceSlug: 'honey-coin',
    bodyPalette: 'Honey Gold',
    eyeStyle: 'Amber Coin Gloss',
    antennaShape: 'Coin Ring',
    antennaColor: 'Gold Edge',
    foreheadGlyph: 'Honey Diamond',
    note: 'Honey gold body with a coin-ring antenna, amber eyes, and treasurer props.',
  },
  {
    id: 'lab-ai-cast-moss-leaf',
    label: 'Cast Moss Leaf',
    sourceSlug: 'moss-leaf',
    bodyPalette: 'Moss Olive',
    eyeStyle: 'Olive Round',
    antennaShape: 'Leaf Loop',
    antennaColor: 'Moss Signal',
    foreheadGlyph: 'Leaf Diamond',
    note: 'Moss green body with a leaf antenna, olive eyes, and garden-ledger props.',
  },
  {
    id: 'lab-ai-cast-pearl-monk',
    label: 'Cast Pearl Monk',
    sourceSlug: 'pearl-monk',
    bodyPalette: 'Pearl Grey',
    eyeStyle: 'Half-Lidded Slate',
    antennaShape: 'Plain Ring',
    antennaColor: 'Silver White',
    foreheadGlyph: 'Origin Circle',
    note: 'Pearl grey body with a plain silver ring antenna, half-lidded eyes, and altar props.',
  },
  {
    id: 'lab-ai-cast-rose-bow',
    label: 'Cast Rose Bow',
    sourceSlug: 'rose-bow',
    bodyPalette: 'Rose Pink',
    eyeStyle: 'Lash Pink Gloss',
    antennaShape: 'Bow Loop',
    antennaColor: 'Rose Ribbon',
    foreheadGlyph: 'Rose Knot',
    note: 'Rose pink body with a bow-loop antenna, lashes, and charm-phone props.',
  },
];

const selectedSlugs = new Set(process.argv.slice(2));
const selectedCharacters = selectedSlugs.size > 0
  ? characters.filter((character) => selectedSlugs.has(character.sourceSlug) || selectedSlugs.has(character.id))
  : characters;

if (selectedCharacters.length === 0) {
  throw new Error(`No matching characters for args: ${[...selectedSlugs].join(', ')}`);
}

function idx(x, y, width) {
  return (y * width + x) * 4;
}

function blank(width, height) {
  return Buffer.alloc(width * height * 4);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function keyGreen(data) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dominance = g - Math.max(r, b);
    const isChroma = g > 205 && r < 82 && b < 100 && dominance > 125;
    const isBrightFringe = g > 165 && r < 120 && b < 130 && dominance > 70;
    const isDarkFringe = g > 48 && dominance > 22 && g > r * 1.26 && g > b * 1.12;
    if (isChroma || isBrightFringe || isDarkFringe) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
    }
  }
}

function copyRect(source, sourceWidth, left, top, width, height) {
  const output = blank(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = idx(left + x, top + y, sourceWidth);
      const targetIndex = idx(x, y, width);
      output[targetIndex] = source[sourceIndex];
      output[targetIndex + 1] = source[sourceIndex + 1];
      output[targetIndex + 2] = source[sourceIndex + 2];
      output[targetIndex + 3] = source[sourceIndex + 3];
    }
  }
  return output;
}

function components(data, width, height, alphaThreshold = 18) {
  const visited = new Uint8Array(width * height);
  const found = [];

  for (let start = 0; start < visited.length; start += 1) {
    if (visited[start] || data[start * 4 + 3] <= alphaThreshold) continue;
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

      for (const next of [pixel - 1, pixel + 1, pixel - width, pixel + width]) {
        if (next < 0 || next >= visited.length || visited[next]) continue;
        const nx = next % width;
        const ny = Math.floor(next / width);
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
        if (data[next * 4 + 3] <= alphaThreshold) continue;
        visited[next] = 1;
        stack.push(next);
      }
    }

    found.push({
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

  return found.sort((a, b) => b.area - a.area);
}

function keepLargestConnectedComponent(frame) {
  const pixelCount = cellWidth * cellHeight;
  const visited = new Uint8Array(pixelCount);
  const keep = new Uint8Array(pixelCount);
  const stack = [];
  let largest = [];

  for (let start = 0; start < pixelCount; start += 1) {
    if (visited[start] || frame[start * 4 + 3] <= 18) continue;
    const pixels = [];
    stack.push(start);
    visited[start] = 1;

    while (stack.length > 0) {
      const pixel = stack.pop();
      pixels.push(pixel);
      const x = pixel % cellWidth;
      const y = Math.floor(pixel / cellWidth);

      for (const neighbor of [pixel - 1, pixel + 1, pixel - cellWidth, pixel + cellWidth]) {
        if (neighbor < 0 || neighbor >= pixelCount || visited[neighbor]) continue;
        const nx = neighbor % cellWidth;
        const ny = Math.floor(neighbor / cellWidth);
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
        if (frame[neighbor * 4 + 3] <= 18) continue;
        visited[neighbor] = 1;
        stack.push(neighbor);
      }
    }

    if (pixels.length > largest.length) largest = pixels;
  }

  for (const pixel of largest) keep[pixel] = 1;
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    if (!visited[pixel] || keep[pixel]) continue;
    const targetIndex = pixel * 4;
    frame[targetIndex] = 0;
    frame[targetIndex + 1] = 0;
    frame[targetIndex + 2] = 0;
    frame[targetIndex + 3] = 0;
  }
}

function targetMetrics(rowIndex) {
  if (rowIndex === 11) return { targetHeight: 142, maxWidth: 186, maxHeight: 168, topBias: 24 };
  if (rowIndex === 8) return { targetHeight: 150, maxWidth: 186, maxHeight: 176, topBias: 16 };
  if (rowIndex === 3 || rowIndex === 6 || rowIndex === 7 || rowIndex === 10) {
    return { targetHeight: 174, maxWidth: 184, maxHeight: 198, topBias: 0 };
  }
  return { targetHeight: 178, maxWidth: 176, maxHeight: 200, topBias: 0 };
}

async function normalizeComponent(source, info, component, rowIndex) {
  const pad = 12;
  const left = Math.max(0, component.left - pad);
  const top = Math.max(0, component.top - pad);
  const right = Math.min(info.width, component.right + pad + 1);
  const bottom = Math.min(info.height, component.bottom + pad + 1);
  const cropWidth = right - left;
  const cropHeight = bottom - top;
  const crop = copyRect(source, info.width, left, top, cropWidth, cropHeight);
  const { targetHeight, maxWidth, maxHeight, topBias } = targetMetrics(rowIndex);
  const scale = Math.min(targetHeight / cropHeight, maxWidth / cropWidth, maxHeight / cropHeight, 2.4);
  const resizedWidth = Math.max(1, Math.round(cropWidth * scale));
  const resizedHeight = Math.max(1, Math.round(cropHeight * scale));
  const resized = await sharp(crop, { raw: { width: cropWidth, height: cropHeight, channels: 4 } })
    .resize({ width: resizedWidth, height: resizedHeight, fit: 'fill', kernel: 'nearest' })
    .raw()
    .toBuffer();

  const frame = blank(cellWidth, cellHeight);
  const frameLeft = Math.round((cellWidth - resizedWidth) / 2);
  const frameTop = Math.max(3, Math.round((cellHeight - resizedHeight) / 2) + topBias);

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

  keyGreen(frame);
  keepLargestConnectedComponent(frame);
  return frame;
}

function composeRow(frames) {
  const width = cellWidth * columns;
  const output = blank(width, cellHeight);

  for (let column = 0; column < columns; column += 1) {
    const frame = frames[column];
    for (let y = 0; y < cellHeight; y += 1) {
      for (let x = 0; x < cellWidth; x += 1) {
        const sourceIndex = idx(x, y, cellWidth);
        const targetIndex = idx(column * cellWidth + x, y, width);
        output[targetIndex] = frame[sourceIndex];
        output[targetIndex + 1] = frame[sourceIndex + 1];
        output[targetIndex + 2] = frame[sourceIndex + 2];
        output[targetIndex + 3] = frame[sourceIndex + 3];
      }
    }
  }

  return output;
}

async function packGeneratedReceivingRow(character, rowIndex) {
  const generatedSourcePath = path.join(
    generatedRowRoot,
    character.sourceSlug,
    `${String(rowIndex).padStart(2, '0')}-receiving-source.png`,
  );
  if (!(await fileExists(generatedSourcePath))) return null;

  const { data, info } = await sharp(generatedSourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  keyGreen(data);
  const rowComponents = components(data, info.width, info.height)
    .filter((component) => component.area >= 1000 && component.width >= 35 && component.height >= 60)
    .sort((a, b) => b.area - a.area)
    .slice(0, columns)
    .sort((a, b) => a.centerX - b.centerX);

  if (rowComponents.length !== columns) {
    throw new Error(`${character.sourceSlug} generated receiving row expected ${columns} frames, found ${rowComponents.length}`);
  }

  const frames = [];
  for (const component of rowComponents) {
    frames.push(await normalizeComponent(data, info, component, rowIndex));
  }

  return {
    rowBuffer: composeRow(frames),
    source: path.relative(root, generatedSourcePath),
    sourceGroup: 'generated-receiving-v2',
    components: rowComponents,
  };
}

async function packCharacter(character) {
  const sourcePath = path.join(sourceRoot, character.sourceSlug, 'source-atlas.png');
  const packDir = path.join(packRoot, character.sourceSlug);
  const petDir = path.join(petsRoot, character.id);
  const atlasPath = path.join(petDir, 'state-atlas.png');
  await fs.mkdir(packDir, { recursive: true });
  await fs.mkdir(petDir, { recursive: true });

  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  keyGreen(data);

  const spriteComponents = components(data, info.width, info.height)
    .filter((component) => component.area >= 1000 && component.width >= 35 && component.height >= 60)
    .sort((a, b) => a.centerY - b.centerY);

  if (spriteComponents.length !== 88 && spriteComponents.length !== rowDefs.length * columns) {
    throw new Error(`${character.sourceSlug} expected 88 or ${rowDefs.length * columns} source components, found ${spriteComponents.length}`);
  }

  const detectedGroups = [];
  for (let index = 0; index < spriteComponents.length; index += columns) {
    detectedGroups.push(spriteComponents.slice(index, index + columns));
  }

  const mappedGroups = detectedGroups.length === rowDefs.length
    ? detectedGroups
    : [
        detectedGroups[0],
        detectedGroups[1],
        detectedGroups[2],
        detectedGroups[3],
        detectedGroups[4],
        detectedGroups[5],
        detectedGroups[6],
        detectedGroups[6],
        detectedGroups[7],
        detectedGroups[8],
        detectedGroups[9],
        detectedGroups[10],
      ];

  const rowBuffers = [];
  const rowReports = [];
  let usedGeneratedReceiving = false;

  for (let rowIndex = 0; rowIndex < rowDefs.length; rowIndex += 1) {
    const row = rowDefs[rowIndex];
    let rowBuffer;
    let rowComponents;
    let source = path.relative(root, sourcePath);
    let sourceGroup = detectedGroups.indexOf(mappedGroups[rowIndex]);

    if (row.id === 'receiving') {
      const generatedRow = await packGeneratedReceivingRow(character, rowIndex);
      if (generatedRow) {
        rowBuffer = generatedRow.rowBuffer;
        rowComponents = generatedRow.components;
        source = generatedRow.source;
        sourceGroup = generatedRow.sourceGroup;
        usedGeneratedReceiving = true;
      }
    }

    if (!rowBuffer) {
      rowComponents = mappedGroups[rowIndex].sort((a, b) => a.centerX - b.centerX);
      const frames = [];
      for (const component of rowComponents) {
        frames.push(await normalizeComponent(data, info, component, rowIndex));
      }
      rowBuffer = composeRow(frames);
    }

    const rowPath = path.join(packDir, `${String(rowIndex).padStart(2, '0')}-${row.id}-row.png`);
    await sharp(rowBuffer, { raw: { width: cellWidth * columns, height: cellHeight, channels: 4 } }).png().toFile(rowPath);
    rowBuffers.push(rowBuffer);
    rowReports.push({
      row: rowIndex,
      id: row.id,
      out: path.relative(root, rowPath),
      source,
      sourceGroup,
      components: rowComponents.map((component) => ({
        area: component.area,
        width: component.width,
        height: component.height,
        centerX: Number(component.centerX.toFixed(1)),
        centerY: Number(component.centerY.toFixed(1)),
      })),
    });
  }

  const atlasWidth = cellWidth * columns;
  const atlasHeight = cellHeight * rowDefs.length;
  const atlas = blank(atlasWidth, atlasHeight);
  for (let rowIndex = 0; rowIndex < rowBuffers.length; rowIndex += 1) {
    const row = rowBuffers[rowIndex];
    for (let y = 0; y < cellHeight; y += 1) {
      for (let x = 0; x < atlasWidth; x += 1) {
        const sourceIndex = idx(x, y, atlasWidth);
        const targetIndex = idx(x, rowIndex * cellHeight + y, atlasWidth);
        atlas[targetIndex] = row[sourceIndex];
        atlas[targetIndex + 1] = row[sourceIndex + 1];
        atlas[targetIndex + 2] = row[sourceIndex + 2];
        atlas[targetIndex + 3] = row[sourceIndex + 3];
      }
    }
  }
  keyGreen(atlas);
  await sharp(atlas, { raw: { width: atlasWidth, height: atlasHeight, channels: 4 } }).png().toFile(atlasPath);

  await fs.writeFile(path.join(packDir, 'pack-report.json'), `${JSON.stringify({
    id: `${character.sourceSlug}-global-components-v2-pack`,
    character: character.id,
    outputAtlas: path.relative(root, atlasPath),
    sourceAtlas: path.relative(root, sourcePath),
    sourceComponents: spriteComponents.length,
    usedGeneratedReceiving,
    note: 'Repacked from global connected components because the original AI source sheet contains 11 visual rows and is not aligned to a strict 8x12 grid.',
    rows: rowReports,
  }, null, 2)}\n`);

  await fs.writeFile(path.join(petDir, 'state-atlas.json'), `${JSON.stringify({
    sprite: `${character.id}-l01`,
    displayName: character.label,
    atlas: path.relative(root, atlasPath),
    source: 'random-looplings-12-v2-global-component-repack',
    sourceAtlas: path.relative(root, sourcePath),
    sourceComponents: spriteComponents.length,
    rowPacks: path.relative(root, packDir) + '/',
    cellWidth,
    cellHeight,
    columns,
    rows: rowDefs.map((row, rowIndex) => ({ id: row.id, label: row.label, row: rowIndex, frameCount: columns, fps: row.fps })),
    traits: {
      bodyPalette: character.bodyPalette,
      eyeStyle: character.eyeStyle,
      antennaShape: character.antennaShape,
      antennaColor: character.antennaColor,
      foreheadGlyph: character.foreheadGlyph,
    },
    repairNotes: [
      'Repacked from actual sprite connected components instead of slicing the 11-row source atlas into a false 12-row grid.',
      usedGeneratedReceiving
        ? 'Receiving row uses a fresh generated bitmap row so posting and receiving do not recycle the same motion.'
        : 'Receiving row falls back to the nearest source device row until a fresh generated receiving row is added.',
      'Removed chroma green and isolated the main connected body per frame to avoid green fringe and loose overlay fragments.',
      character.note,
    ],
    note: `Random Looplings v2 global-component repair for ${character.label}.`,
  }, null, 2)}\n`);

  return {
    id: character.id,
    slug: character.sourceSlug,
    usedGeneratedReceiving,
    atlas: path.relative(root, atlasPath),
  };
}

const packed = [];
for (const character of selectedCharacters) {
  packed.push(await packCharacter(character));
}

console.log(JSON.stringify({
  packed: packed.length,
  atlases: packed,
}, null, 2));
