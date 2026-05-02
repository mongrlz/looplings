import { useEffect, useRef } from 'react';

/**
 * web4.ai-style background — Conway's Game of Life.
 * A subtle, sparse simulation of cellular automata that evolves over time.
 * Matches the aesthetic of web4.ai with greenish nodes and ghosting effects.
 */

const ACCENT = { r: 22, g: 163, b: 74 };
const PALE = { r: 22, g: 163, b: 74 };
const PAPER = '#faf8f4';

const CELL_SIZE = 6;
const GRID_GAP = 2;
const CELL_STEP = CELL_SIZE + GRID_GAP;
const UPDATE_EVERY = 10;
const RESEED_EVERY = 180;

const CLUSTER_SEED_COUNT = 42;
const CLUSTER_SIZE = 10;
const CLUSTER_DENSITY = 0.34;

interface Cell {
  alive: 0 | 1;
  age: number;
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let grid: Uint8Array = new Uint8Array(0);
    let nextGrid: Uint8Array = new Uint8Array(0);
    let ages: Float32Array = new Float32Array(0);
    let tick = 0;
    let animId: number;

    const index = (r: number, c: number) => r * cols + c;

    const resetArrays = () => {
      const size = cols * rows;
      grid = new Uint8Array(size);
      nextGrid = new Uint8Array(size);
      ages = new Float32Array(size);
    };

    const stampCluster = (cx: number, cy: number) => {
      for (let y = 0; y < CLUSTER_SIZE; y++) {
        for (let x = 0; x < CLUSTER_SIZE; x++) {
          if (Math.random() < CLUSTER_DENSITY) {
            const c = (cx + x + cols) % cols;
            const r = (cy + y + rows) % rows;
            grid[index(r, c)] = 1;
          }
        }
      }
    };

    const warmUp = (steps: number) => {
      for (let i = 0; i < steps; i++) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = index(r, c);
            const alive = grid[idx] === 1;
            let neighbors = 0;

            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const rr = (r + dr + rows) % rows;
                const cc = (c + dc + cols) % cols;
                neighbors += grid[index(rr, cc)];
              }
            }

            nextGrid[idx] = alive
              ? (neighbors === 2 || neighbors === 3 ? 1 : 0)
              : (neighbors === 3 ? 1 : 0);
          }
        }

        const temp = grid;
        grid = nextGrid;
        nextGrid = temp;
      }
    };

    const seed = () => {
      grid.fill(0);
      nextGrid.fill(0);
      ages.fill(0);

      for (let i = 0; i < CLUSTER_SEED_COUNT; i++) {
        const cx = Math.floor(Math.random() * cols);
        const cy = Math.floor(Math.random() * rows);
        stampCluster(cx, cy);
      }

      warmUp(8);
    };

    const buildGrid = () => {
      cols = Math.ceil(w / CELL_STEP) + 2;
      rows = Math.ceil(h / CELL_STEP) + 2;
      resetArrays();
      seed();
    };

    const update = () => {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = index(r, c);
          const alive = grid[idx] === 1;
          let neighbors = 0;

          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const rr = (r + dr + rows) % rows;
              const cc = (c + dc + cols) % cols;
              neighbors += grid[index(rr, cc)];
            }
          }

          const nextAlive = alive
            ? (neighbors === 2 || neighbors === 3 ? 1 : 0)
            : (neighbors === 3 ? 1 : 0);

          nextGrid[idx] = nextAlive;
          ages[idx] = nextAlive
            ? Math.min(1, ages[idx] + 0.22)
            : Math.max(0, ages[idx] - 0.07);
        }
      }

      const temp = grid;
      grid = nextGrid;
      nextGrid = temp;

      if (tick % RESEED_EVERY === 0) {
        for (let i = 0; i < 4; i++) {
          const cx = Math.floor(Math.random() * cols);
          const cy = Math.floor(Math.random() * rows);
          stampCluster(cx, cy);
        }
      }
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGrid();
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, w, h);

      if (tick % UPDATE_EVERY === 0) {
        update();
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = index(r, c);
          const age = ages[idx];
          if (age <= 0) continue;

          const x = c * CELL_STEP;
          const y = r * CELL_STEP;

          if (grid[idx] === 1) {
            const alpha = 0.055 + age * 0.06;
            ctx.fillStyle = `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, ${alpha.toFixed(3)})`;
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
          } else {
            const ghostAlpha = 0.01 + age * 0.022;
            ctx.fillStyle = `rgba(${PALE.r}, ${PALE.g}, ${PALE.b}, ${ghostAlpha.toFixed(3)})`;
            ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          }
        }
      }

      tick++;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
