import sharp from 'sharp';

const atlasPath = 'public/pets/lab-ai-storm-loop/state-atlas.png';
const cellWidth = 192;
const cellHeight = 208;
const columns = 8;
const rows = 12;
const alphaThreshold = 18;

function idx(x, y, width) {
  return (y * width + x) * 4;
}

function components(frame) {
  const visited = new Uint8Array(cellWidth * cellHeight);
  const found = [];

  for (let start = 0; start < visited.length; start += 1) {
    if (visited[start] || frame[start * 4 + 3] <= alphaThreshold) continue;
    const stack = [start];
    visited[start] = 1;
    const pixels = [];
    let left = cellWidth;
    let top = cellHeight;
    let right = -1;
    let bottom = -1;

    while (stack.length > 0) {
      const pixel = stack.pop();
      const x = pixel % cellWidth;
      const y = Math.floor(pixel / cellWidth);
      pixels.push(pixel);
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);

      for (const neighbor of [pixel - 1, pixel + 1, pixel - cellWidth, pixel + cellWidth]) {
        if (neighbor < 0 || neighbor >= visited.length || visited[neighbor]) continue;
        const nx = neighbor % cellWidth;
        const ny = Math.floor(neighbor / cellWidth);
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
        if (frame[neighbor * 4 + 3] <= alphaThreshold) continue;
        visited[neighbor] = 1;
        stack.push(neighbor);
      }
    }

    found.push({
      pixels,
      area: pixels.length,
      left,
      top,
      right,
      bottom,
      centerX: Math.round((left + right) / 2),
      centerY: Math.round((top + bottom) / 2),
    });
  }

  return found.sort((a, b) => b.area - a.area);
}

function nearestPair(component, target) {
  let best = null;
  const strideA = Math.max(1, Math.floor(component.pixels.length / 160));
  const strideB = Math.max(1, Math.floor(target.pixels.length / 320));

  for (let aIndex = 0; aIndex < component.pixels.length; aIndex += strideA) {
    const a = component.pixels[aIndex];
    const ax = a % cellWidth;
    const ay = Math.floor(a / cellWidth);

    for (let bIndex = 0; bIndex < target.pixels.length; bIndex += strideB) {
      const b = target.pixels[bIndex];
      const bx = b % cellWidth;
      const by = Math.floor(b / cellWidth);
      const distance = (ax - bx) ** 2 + (ay - by) ** 2;

      if (!best || distance < best.distance) {
        best = { ax, ay, bx, by, distance };
      }
    }
  }

  return best ?? {
    ax: component.centerX,
    ay: component.centerY,
    bx: target.centerX,
    by: target.centerY,
  };
}

function sampleColor(frame, component) {
  let best = null;

  for (const pixel of component.pixels) {
    const index = pixel * 4;
    if (frame[index + 3] <= alphaThreshold) continue;
    const score = frame[index] + frame[index + 1] + frame[index + 2] + frame[index + 3];
    if (!best || score > best.score) {
      best = {
        color: [frame[index], frame[index + 1], frame[index + 2], 255],
        score,
      };
    }
  }

  return best?.color ?? [120, 205, 255, 255];
}

function put(frame, x, y, color) {
  if (x < 0 || y < 0 || x >= cellWidth || y >= cellHeight) return;
  const index = idx(x, y, cellWidth);
  frame[index] = color[0];
  frame[index + 1] = color[1];
  frame[index + 2] = color[2];
  frame[index + 3] = Math.max(frame[index + 3], color[3]);
}

function dot(frame, x, y, color, radius = 0) {
  for (let yy = y - radius; yy <= y + radius; yy += 1) {
    for (let xx = x - radius; xx <= x + radius; xx += 1) {
      if (Math.abs(xx - x) + Math.abs(yy - y) > radius + 1) continue;
      put(frame, xx, yy, color);
    }
  }
}

function line(frame, x0, y0, x1, y1, color, radius = 0) {
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (true) {
    dot(frame, x, y, color, radius);
    if (x === x1 && y === y1) break;
    const e2 = err * 2;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function connectFrame(frame) {
  for (let pass = 0; pass < 4; pass += 1) {
    const parts = components(frame);
    if (parts.length <= 1) break;

    const main = parts[0];
    for (const part of parts.slice(1)) {
      if (part.area < 18) continue;
      const target = nearestPair(part, main);
      const color = sampleColor(frame, part);
      const radius = part.area > 180 ? 1 : 0;
      line(frame, target.ax, target.ay, target.bx, target.by, color, radius);
    }
  }
}

const image = sharp(atlasPath).ensureAlpha();
const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

for (let row = 0; row < rows; row += 1) {
  for (let column = 0; column < columns; column += 1) {
    const frame = Buffer.alloc(cellWidth * cellHeight * 4);

    for (let y = 0; y < cellHeight; y += 1) {
      const sourceStart = idx(column * cellWidth, row * cellHeight + y, info.width);
      const sourceEnd = sourceStart + cellWidth * 4;
      data.copy(frame, y * cellWidth * 4, sourceStart, sourceEnd);
    }

    connectFrame(frame);

    for (let y = 0; y < cellHeight; y += 1) {
      const targetStart = idx(column * cellWidth, row * cellHeight + y, info.width);
      const sourceStart = y * cellWidth * 4;
      frame.copy(data, targetStart, sourceStart, sourceStart + cellWidth * 4);
    }
  }
}

await sharp(data, {
  raw: {
    width: info.width,
    height: info.height,
    channels: 4,
  },
}).png().toFile(atlasPath);

console.log(JSON.stringify({ atlas: atlasPath, repaired: true }, null, 2));
