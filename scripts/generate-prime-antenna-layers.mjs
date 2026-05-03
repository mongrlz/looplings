import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const baseAtlasPath = path.join(root, 'public/pets/prime-test/state-atlas.png');
const outputRoot = path.join(root, 'public/pets/prime-test/traits');
const antennaRoot = path.join(outputRoot, 'antenna-shape');
const maskPath = path.join(antennaRoot, '_base-mask/state-atlas.png');
const registryPath = path.join(outputRoot, 'prime-trait-registry.v1.json');

const cellWidth = 192;
const cellHeight = 208;
const columns = 8;
const rows = 12;
const atlasWidth = cellWidth * columns;
const atlasHeight = cellHeight * rows;

const shapes = [
  { id: 'origin-loop', label: 'Origin Loop', silhouette: 'single-loop' },
];

const colors = {
  outline: '#151824',
  signal: '#bdf3ff',
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pixelIndex(x, y, width = atlasWidth) {
  return (y * width + x) * 4;
}

function isSignalPixel(data, x, y) {
  const index = pixelIndex(x, y);
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  const a = data[index + 3];

  return a > 20 && g > 86 && b > 100 && r < 225 && g > r + 4 && b > r + 8;
}

function componentForFrame(data, row, frame) {
  const startX = frame * cellWidth;
  const startY = row * cellHeight;
  const visited = new Uint8Array(cellWidth * cellHeight);
  let best = null;

  for (let y = 0; y < cellHeight; y += 1) {
    for (let x = 0; x < cellWidth; x += 1) {
      const localIndex = y * cellWidth + x;
      if (visited[localIndex]) continue;

      const globalX = startX + x;
      const globalY = startY + y;
      if (!isSignalPixel(data, globalX, globalY)) {
        visited[localIndex] = 1;
        continue;
      }

      const queue = [[x, y]];
      visited[localIndex] = 1;
      let cursor = 0;
      const points = [];
      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;
      let sumX = 0;
      let sumY = 0;

      while (cursor < queue.length) {
        const [currentX, currentY] = queue[cursor];
        cursor += 1;
        points.push([currentX, currentY]);
        minX = Math.min(minX, currentX);
        minY = Math.min(minY, currentY);
        maxX = Math.max(maxX, currentX);
        maxY = Math.max(maxY, currentY);
        sumX += currentX;
        sumY += currentY;

        for (const [nextX, nextY] of [
          [currentX + 1, currentY],
          [currentX - 1, currentY],
          [currentX, currentY + 1],
          [currentX, currentY - 1],
        ]) {
          if (nextX < 0 || nextX >= cellWidth || nextY < 0 || nextY >= cellHeight) continue;
          const nextIndex = nextY * cellWidth + nextX;
          if (visited[nextIndex]) continue;
          visited[nextIndex] = 1;
          if (isSignalPixel(data, startX + nextX, startY + nextY)) queue.push([nextX, nextY]);
        }
      }

      const count = points.length;
      const width = maxX - minX + 1;
      const height = maxY - minY + 1;
      const score = count * 10 + width * height;

      if (count >= 8 && (!best || score > best.score)) {
        best = {
          count,
          score,
          points,
          minX,
          minY,
          maxX,
          maxY,
          width,
          height,
          cx: sumX / count,
          cy: sumY / count,
        };
      }
    }
  }

  return best;
}

function fallbackAnchor(row) {
  if (row === 11) {
    return {
      minX: 147,
      minY: 104,
      maxX: 187,
      maxY: 132,
      width: 41,
      height: 29,
      cx: 168,
      cy: 118,
      points: [],
    };
  }

  return {
    minX: 78,
    minY: 10,
    maxX: 114,
    maxY: 56,
    width: 37,
    height: 47,
    cx: 96,
    cy: 32,
    points: [],
  };
}

function antennaAnchor(data, row, frame) {
  const anchor = componentForFrame(data, row, frame) ?? fallbackAnchor(row);
  const sourceLeft = frame * cellWidth;
  const sourceTop = row * cellHeight;
  const cx = Math.round(anchor.cx);
  let socketY = anchor.maxY + 2;

  for (let y = Math.max(0, anchor.maxY + 1); y < cellHeight; y += 1) {
    let foundHead = false;

    for (let x = Math.max(0, cx - 4); x <= Math.min(cellWidth - 1, cx + 4); x += 1) {
      const pixel = sourcePixel(data, sourceLeft + x, sourceTop + y);
      if (pixel.a > 24 && !sourceLooksLikeAntenna(data, sourceLeft + x, sourceTop + y)) {
        foundHead = true;
        break;
      }
    }

    if (foundHead) {
      socketY = y;
      break;
    }
  }

  return {
    ...anchor,
    socketX: anchor.cx,
    socketY: clamp(socketY, anchor.maxY, row === 11 ? 150 : 70),
  };
}

function shapeStroke(pathData, width, color, opacity = 1) {
  return `<path d="${pathData}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`;
}

function sourcePixel(data, x, y) {
  const index = pixelIndex(x, y);
  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
    a: data[index + 3],
  };
}

function sourceLooksLikeAntenna(data, x, y) {
  const pixel = sourcePixel(data, x, y);
  if (pixel.a <= 8) return false;
  if (isSignalPixel(data, x, y)) return true;

  const light = pixel.r * 0.299 + pixel.g * 0.587 + pixel.b * 0.114;
  const blueChroma = pixel.b > 62 && pixel.g > 58 && pixel.r < 170 && pixel.b > pixel.r + 8;

  return light < 86 || blueChroma;
}

async function originalAntennaLayer(data, row, frame, anchor) {
  const sourceLeft = frame * cellWidth;
  const sourceTop = row * cellHeight;
  const output = Buffer.alloc(cellWidth * cellHeight * 4);
  const mask = new Uint8Array(cellWidth * cellHeight);

  if (anchor.points.length) {
    for (const [pointX, pointY] of anchor.points) {
      for (let y = Math.max(0, pointY - 6); y <= Math.min(cellHeight - 1, pointY + 6); y += 1) {
        for (let x = Math.max(0, pointX - 6); x <= Math.min(cellWidth - 1, pointX + 6); x += 1) {
          mask[y * cellWidth + x] = 1;
        }
      }
    }
  } else {
    for (let y = Math.max(0, anchor.minY - 7); y <= Math.min(cellHeight - 1, anchor.maxY + 7); y += 1) {
      for (let x = Math.max(0, anchor.minX - 7); x <= Math.min(cellWidth - 1, anchor.maxX + 7); x += 1) {
        mask[y * cellWidth + x] = 1;
      }
    }
  }

  for (let y = 0; y < cellHeight; y += 1) {
    for (let x = 0; x < cellWidth; x += 1) {
      if (!mask[y * cellWidth + x]) continue;
      const globalX = sourceLeft + x;
      const globalY = sourceTop + y;
      if (!sourceLooksLikeAntenna(data, globalX, globalY)) continue;

      const sourceIndex = pixelIndex(globalX, globalY);
      const outputIndex = (y * cellWidth + x) * 4;
      output[outputIndex] = data[sourceIndex];
      output[outputIndex + 1] = data[sourceIndex + 1];
      output[outputIndex + 2] = data[sourceIndex + 2];
      output[outputIndex + 3] = data[sourceIndex + 3];
    }
  }

  return sharp(output, {
    raw: {
      width: cellWidth,
      height: cellHeight,
      channels: 4,
    },
  }).png().toBuffer();
}

function ellipseStroke(cx, cy, rx, ry, width, color, opacity = 1) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}"/>`;
}

function circleStroke(cx, cy, radius, width, color, opacity = 1) {
  return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}"/>`;
}

function standingAntennaSvg(shape, anchor) {
  const cx = anchor.cx;
  const socketY = anchor.socketY ?? anchor.maxY;
  const radius = clamp(Math.max(anchor.width, anchor.height) * 0.23, 8, 13);
  const stemEnd = socketY + 2;
  const stemLength = clamp(anchor.height * 0.22, 8, 13);
  const parts = [];
  let stemStart = socketY - stemLength;

  if (shape.silhouette === 'halo-loop') {
    stemStart = socketY - stemLength;
  } else if (shape.silhouette === 'teardrop-loop') {
    stemStart = socketY - stemLength - 1;
  } else if (shape.silhouette === 'double-loop') {
    stemStart = socketY - stemLength + 1;
  } else if (shape.silhouette === 'soft-spiral') {
    stemStart = socketY - stemLength - 1;
  }

  const stem = `M${cx} ${stemStart} L${cx} ${stemEnd}`;

  parts.push(shapeStroke(stem, 6, colors.outline));
  parts.push(shapeStroke(stem, 3, colors.signal));

  if (shape.silhouette === 'halo-loop') {
    const loopY = stemStart - radius * 0.62;
    for (const [width, color, opacity] of [[6, colors.outline, 1], [3, colors.signal, 1]]) {
      parts.push(ellipseStroke(cx, loopY, radius * 1.25, radius * 0.84, width, color, opacity));
    }
  } else if (shape.silhouette === 'teardrop-loop') {
    const top = stemStart - radius * 2.15;
    const bottom = stemStart + 2;
    const tear = `M${cx} ${top} C${cx - radius - 8} ${top + radius * 0.9} ${cx - radius * 0.78} ${bottom - 1} ${cx} ${bottom} C${cx + radius * 0.78} ${bottom - 1} ${cx + radius + 8} ${top + radius * 0.9} ${cx} ${top} Z`;
    for (const [width, color, opacity] of [[6, colors.outline, 1], [3, colors.signal, 1]]) {
      parts.push(shapeStroke(tear, width, color, opacity));
    }
  } else if (shape.silhouette === 'double-loop') {
    const loopY = stemStart - radius * 0.52;
    const loopRadius = radius * 0.62;
    const left = cx - loopRadius;
    const right = cx + loopRadius;
    const bridge = `M${left + loopRadius} ${loopY} L${right - loopRadius} ${loopY}`;
    for (const [width, color, opacity] of [[5.5, colors.outline, 1], [2.8, colors.signal, 1]]) {
      parts.push(shapeStroke(bridge, width, color, opacity));
      parts.push(circleStroke(left, loopY, loopRadius, width, color, opacity));
      parts.push(circleStroke(right, loopY, loopRadius, width, color, opacity));
    }
  } else if (shape.silhouette === 'soft-spiral') {
    const loopY = stemStart - radius * 0.66;
    const spiral = `M${cx + radius * 0.88} ${loopY} C${cx + radius * 0.88} ${loopY - radius * 0.86} ${cx - radius * 0.1} ${loopY - radius * 1.05} ${cx - radius * 0.7} ${loopY - radius * 0.45} C${cx - radius * 1.35} ${loopY + radius * 0.25} ${cx - radius * 0.4} ${loopY + radius * 1.1} ${cx + radius * 0.3} ${loopY + radius * 0.58} C${cx + radius * 0.83} ${loopY + radius * 0.2} ${cx + radius * 0.35} ${loopY - radius * 0.35} ${cx - radius * 0.05} ${loopY - radius * 0.06}`;
    for (const [width, color, opacity] of [[6, colors.outline, 1], [3, colors.signal, 1]]) {
      parts.push(shapeStroke(spiral, width, color, opacity));
    }
  } else {
    const loopY = stemStart - radius * 0.08;
    for (const [width, color, opacity] of [[6, colors.outline, 1], [3, colors.signal, 1]]) {
      parts.push(circleStroke(cx, loopY, radius, width, color, opacity));
    }
  }

  return parts.join('\n');
}

function sideAntennaSvg(shape, anchor) {
  const cy = anchor.cy;
  const left = anchor.minX;
  const right = anchor.maxX;
  const radius = clamp(Math.max(anchor.height, 22) * 0.42, 9, 15);
  const loopX = Math.min(right - radius - 2, 178);
  const stem = `M${left - 1} ${cy} L${loopX - radius - 2} ${cy}`;
  const parts = [];

  parts.push(shapeStroke(stem, 6, colors.outline));
  parts.push(shapeStroke(stem, 3, colors.signal));

  if (shape.silhouette === 'teardrop-loop') {
    const tear = `M${loopX + radius + 5} ${cy} C${loopX + 1} ${cy - radius - 12} ${loopX - radius - 9} ${cy - radius * 0.55} ${loopX - radius - 9} ${cy} C${loopX - radius - 9} ${cy + radius * 0.55} ${loopX + 1} ${cy + radius + 12} ${loopX + radius + 5} ${cy} Z`;
    for (const [width, color, opacity] of [[6, colors.outline, 1], [3, colors.signal, 1]]) {
      parts.push(shapeStroke(tear, width, color, opacity));
    }
  } else if (shape.silhouette === 'halo-loop') {
    for (const [width, color, opacity] of [[6, colors.outline, 1], [3, colors.signal, 1]]) {
      parts.push(ellipseStroke(loopX, cy, radius * 1.22, radius * 0.82, width, color, opacity));
    }
  } else if (shape.silhouette === 'double-loop') {
    const r = radius * 0.68;
    for (const [width, color, opacity] of [[5.5, colors.outline, 1], [2.8, colors.signal, 1]]) {
      parts.push(circleStroke(loopX - r, cy, r, width, color, opacity));
      parts.push(circleStroke(loopX + r, cy, r, width, color, opacity));
    }
  } else if (shape.silhouette === 'soft-spiral') {
    const spiral = `M${loopX + radius} ${cy} C${loopX + radius} ${cy - radius} ${loopX - radius * 0.3} ${cy - radius} ${loopX - radius * 0.7} ${cy - radius * 0.2} C${loopX - radius} ${cy + radius * 0.5} ${loopX} ${cy + radius} ${loopX + radius * 0.35} ${cy + radius * 0.26} C${loopX + radius * 0.55} ${cy - radius * 0.14} ${loopX + radius * 0.08} ${cy - radius * 0.26} ${loopX - radius * 0.08} ${cy}`;
    for (const [width, color, opacity] of [[6, colors.outline, 1], [3, colors.signal, 1]]) {
      parts.push(shapeStroke(spiral, width, color, opacity));
    }
  } else {
    for (const [width, color, opacity] of [[6, colors.outline, 1], [3, colors.signal, 1]]) {
      parts.push(circleStroke(loopX, cy, radius, width, color, opacity));
    }
  }

  return parts.join('\n');
}

function antennaSvg(shape, anchor) {
  const isSidePose = anchor.width > anchor.height * 1.25 && anchor.cy > 78;
  const geometry = isSidePose ? sideAntennaSvg(shape, anchor) : standingAntennaSvg(shape, anchor);
  return `
    <svg width="${cellWidth}" height="${cellHeight}" viewBox="0 0 ${cellWidth} ${cellHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="none"/>
      ${geometry}
    </svg>
  `;
}

function dilatedMaskSvg(anchor) {
  const dots = anchor.points.map(([x, y]) => {
    const cx = x;
    const cy = y;
    return `<rect x="${cx - 6}" y="${cy - 6}" width="13" height="13" fill="#fff"/>`;
  }).join('\n');

  if (dots) {
    return `
      <svg width="${cellWidth}" height="${cellHeight}" viewBox="0 0 ${cellWidth} ${cellHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="none"/>
        ${dots}
      </svg>
    `;
  }

  const x = Math.max(0, anchor.minX - 9);
  const y = Math.max(0, anchor.minY - 9);
  const width = Math.min(cellWidth - x, anchor.width + 18);
  const height = Math.min(cellHeight - y, anchor.height + 18);

  return `
    <svg width="${cellWidth}" height="${cellHeight}" viewBox="0 0 ${cellWidth} ${cellHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="none"/>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#fff"/>
    </svg>
  `;
}

async function renderSvg(svg) {
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function writeAtlas(outputPath, cells) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await sharp({
    create: {
      width: atlasWidth,
      height: atlasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(cells)
    .png()
    .toFile(outputPath);
}

async function main() {
  const { data, info } = await sharp(baseAtlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== atlasWidth || info.height !== atlasHeight) {
    throw new Error(`Prime atlas must be ${atlasWidth}x${atlasHeight}; got ${info.width}x${info.height}.`);
  }

  const anchors = [];
  for (let row = 0; row < rows; row += 1) {
    for (let frame = 0; frame < columns; frame += 1) {
      anchors.push({
        row,
        frame,
        anchor: antennaAnchor(data, row, frame),
      });
    }
  }

  const maskCells = await Promise.all(anchors.map(async ({ row, frame, anchor }) => ({
    input: await renderSvg(dilatedMaskSvg(anchor)),
    left: frame * cellWidth,
    top: row * cellHeight,
  })));
  await writeAtlas(maskPath, maskCells);

  const layerEntries = [];
  for (const shape of shapes) {
    const atlasPath = path.join(antennaRoot, shape.id, 'state-atlas.png');
    const cells = await Promise.all(anchors.map(async ({ row, frame, anchor }) => ({
      input: shape.id === 'origin-loop'
        ? await originalAntennaLayer(data, row, frame, anchor)
        : await renderSvg(antennaSvg(shape, anchor)),
      left: frame * cellWidth,
      top: row * cellHeight,
    })));

    await writeAtlas(atlasPath, cells);
    layerEntries.push({
      id: shape.id,
      axis: 'antenna_shape',
      label: shape.label,
      silhouette: shape.silhouette,
      atlas: path.relative(root, atlasPath),
    });
  }

  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(
    registryPath,
    `${JSON.stringify({
      schemaVersion: 'prime-traits.v1',
      sprite: 'prime-test-l01',
      baseAtlas: 'public/pets/prime-test/state-atlas.png',
      cell: { width: cellWidth, height: cellHeight, columns, rows },
      masks: {
        antenna_shape: path.relative(root, maskPath),
      },
      layers: {
        antenna_shape: layerEntries,
      },
    }, null, 2)}\n`,
  );

  console.log(JSON.stringify({
    registry: path.relative(root, registryPath),
    mask: path.relative(root, maskPath),
    layers: layerEntries.map((entry) => entry.atlas),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
