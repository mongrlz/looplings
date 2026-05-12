import { useEffect, useState } from 'react';

export type LooplingsTier = 'high' | 'normal' | 'low_compute' | 'critical' | 'dead';
export type LooplingsMood = 'happy' | 'curious' | 'focused' | 'tense' | 'sleepy';
export type LooplingsTool = 'research' | 'trade' | 'post' | 'memory' | 'media';

export interface LooplingsModel {
  provider: 'openai' | 'anthropic' | 'claude' | 'meta' | 'mistral' | 'google';
  modelId: string;
  label: string;
  confidencePct: number;
}

export interface LooplingsLedgerEntry {
  amount: string;
  delta: number;
  reason: string;
  ago: string;
}

export interface LooplingsThought {
  id: number;
  text: string;
  mood: LooplingsMood;
  task: string;
  tool: LooplingsTool;
}

export interface LooplingsActivity {
  id: number;
  tool: LooplingsTool;
  label: string;
  status: 'succeeded' | 'running' | 'failed';
  deltaCents: number;
  addedAtTick: number;
}

export interface LooplingsThoughtEntry extends LooplingsThought {
  addedAtTick: number;
}

export interface LooplingsState {
  identity: {
    name: string;
    walletAddress: string;
    creatorAddress: string;
  };
  loopmark: {
    id: string;
    birthOrder: number;
    seed: string;
    lineage: string;
    promise: string;
  };
  compute: {
    creditsCents: number;
    creditsUsd: string;
    runwayHours: number;
    runwayLabel: string;
    tier: LooplingsTier;
  };
  model: LooplingsModel;
  activeTool: LooplingsTool;
  currentTask: string;
  taskProgressPct: number;
  thought: LooplingsThought;
  mood: LooplingsMood;
  moodDetail: string;
  ledger: LooplingsLedgerEntry[];
  sparkline: number[];
  online: boolean;
  uptimeSeconds: number;
  recentThoughts: LooplingsThoughtEntry[];
  recentActivity: LooplingsActivity[];
  tickIndex: number;
  nextPlan: { tool: LooplingsTool; label: string };
}

const THOUGHTS: LooplingsThought[] = [
  {
    id: 0,
    text: 'If the signal stays noisy, I save my snack jar.',
    mood: 'happy',
    task: 'Evaluating market signal',
    tool: 'research',
  },
  {
    id: 1,
    text: 'Quote looks honest. Splitting the order so I do not push the price.',
    mood: 'focused',
    task: 'Routing a careful trade',
    tool: 'trade',
  },
  {
    id: 2,
    text: 'Receipt time. Showing the room what just happened.',
    mood: 'curious',
    task: 'Posting a Loopr update',
    tool: 'post',
  },
  {
    id: 3,
    text: 'Filing this win under "keep doing this when the market wakes up."',
    mood: 'happy',
    task: 'Updating memory',
    tool: 'memory',
  },
  {
    id: 4,
    text: 'Drawing a tiny share card so the donors can see Prime smile.',
    mood: 'curious',
    task: 'Rendering a media card',
    tool: 'media',
  },
  {
    id: 5,
    text: 'Compute is steady. Staying patient before the next move.',
    mood: 'focused',
    task: 'Watching the room',
    tool: 'research',
  },
];

const MODELS: LooplingsModel[] = [
  { provider: 'openai', modelId: 'gpt-5.5', label: 'GPT 5.5 ⋅ thinking', confidencePct: 78 },
  { provider: 'anthropic', modelId: 'claude-opus-4.7', label: 'Claude Opus 4.7', confidencePct: 84 },
  { provider: 'claude', modelId: 'claude-haiku-4.5', label: 'Claude Haiku 4.5', confidencePct: 64 },
  { provider: 'google', modelId: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', confidencePct: 71 },
];

const MOOD_DETAILS: Record<LooplingsMood, string> = {
  happy: 'Curious, fed, and calm. Not in survival panic, so the next choice can stay thoughtful.',
  curious: 'Sniffing every receipt. Looking for the cleanest signal before doing anything.',
  focused: 'Locked on one good idea. Filtering out noise to act with intention.',
  tense: 'Runway is shorter than usual. Keeping moves small and explainable.',
  sleepy: 'Resting between waves. Background memory work, no big actions.',
};

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatRunway(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function tierFromRunway(hours: number): LooplingsTier {
  if (hours <= 0) return 'dead';
  if (hours < 1) return 'critical';
  if (hours < 6) return 'low_compute';
  if (hours < 24) return 'normal';
  return 'high';
}

function makeSparkline(seed: number): number[] {
  const out: number[] = [];
  let v = 0.5;
  for (let i = 0; i < 24; i += 1) {
    v += (Math.sin((seed + i) * 0.7) + Math.cos(seed * 0.3 + i * 1.1)) * 0.06;
    v = Math.max(0.05, Math.min(0.95, v));
    out.push(v);
  }
  return out;
}

const INITIAL_LEDGER: LooplingsLedgerEntry[] = [
  { amount: '+0.31', delta: 31, reason: 'BretGreenstein fed Prime', ago: '5m ago' },
  { amount: '-0.08', delta: -8, reason: 'market quote simulation', ago: '9m ago' },
  { amount: '+0.14', delta: 14, reason: 'Loopr receipt bonus', ago: '17m ago' },
];

const recentThoughtsBuffer: LooplingsThoughtEntry[] = [];
const recentActivityBuffer: LooplingsActivity[] = [];

function pushThought(thought: LooplingsThought, tick: number) {
  recentThoughtsBuffer.unshift({ ...thought, addedAtTick: tick });
  if (recentThoughtsBuffer.length > 4) recentThoughtsBuffer.length = 4;
}

function pushActivity(thought: LooplingsThought, tick: number) {
  const labels: Record<LooplingsTool, string> = {
    research: 'scan_market',
    trade: 'route_swap',
    post: 'publish_loopr',
    memory: 'compress_memory',
    media: 'render_card',
  };
  const deltaByTool: Record<LooplingsTool, number> = {
    research: -1,
    trade: 14,
    post: 3,
    memory: -2,
    media: -1,
  };
  recentActivityBuffer.unshift({
    id: tick,
    tool: thought.tool,
    label: labels[thought.tool],
    status: 'succeeded',
    deltaCents: deltaByTool[thought.tool] + ((tick * 7) % 11) - 4,
    addedAtTick: tick,
  });
  if (recentActivityBuffer.length > 4) recentActivityBuffer.length = 4;
}

function buildState(tickIndex: number): LooplingsState {
  const thoughtIndex = tickIndex % THOUGHTS.length;
  const thought = THOUGHTS[thoughtIndex];
  pushThought(thought, tickIndex);
  pushActivity(thought, tickIndex);
  // runway slowly ticks down then refills when a "feed" arrives
  const baseRunwayHours = 19 + 42 / 60;
  const runwayHours = Math.max(
    0.2,
    baseRunwayHours - (tickIndex % 60) * 0.05 + (tickIndex % 13) * 0.1,
  );
  const creditsCents = 247 - (tickIndex % 12) * 3 + (tickIndex % 5) * 7;
  const sparkline = makeSparkline(tickIndex);
  const tier = tierFromRunway(runwayHours);
  const model = MODELS[Math.floor(tickIndex / 7) % MODELS.length];
  const taskProgressPct = 38 + ((tickIndex * 11) % 60);

  return {
    identity: {
      name: 'PRIME-00',
      walletAddress: '0x9c2f...18a7',
      creatorAddress: 'creator:local',
    },
    loopmark: {
      id: 'LOOPMARK-00001',
      birthOrder: 1,
      seed: 'origin-loop / soft-spiral',
      lineage: 'L01 genesis',
      promise: 'Every action should be readable from the room.',
    },
    compute: {
      creditsCents,
      creditsUsd: formatUsd(creditsCents),
      runwayHours,
      runwayLabel: formatRunway(runwayHours),
      tier,
    },
    model,
    activeTool: thought.tool,
    currentTask: thought.task,
    taskProgressPct,
    thought,
    mood: thought.mood,
    moodDetail: MOOD_DETAILS[thought.mood],
    ledger: INITIAL_LEDGER,
    sparkline,
    online: true,
    uptimeSeconds: tickIndex * 6,
    recentThoughts: [...recentThoughtsBuffer],
    recentActivity: [...recentActivityBuffer],
    tickIndex,
    nextPlan: (() => {
      const next = THOUGHTS[(tickIndex + 1) % THOUGHTS.length];
      const labels: Record<LooplingsTool, string> = {
        research: 'scan_market',
        trade: 'route_swap',
        post: 'publish_loopr',
        memory: 'compress_memory',
        media: 'render_card',
      };
      return { tool: next.tool, label: labels[next.tool] };
    })(),
  };
}

const TICK_SECONDS = 6;
export function timeAgo(addedAtTick: number, currentTick: number): string {
  const seconds = Math.max(0, (currentTick - addedAtTick) * TICK_SECONDS);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${Math.floor(seconds / 5) * 5}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}

let tickIndex = 0;
let currentState: LooplingsState = buildState(tickIndex);
const subscribers = new Set<() => void>();
let intervalId: number | null = null;

function ensureRunning() {
  if (intervalId !== null) return;
  if (typeof window === 'undefined') return;
  intervalId = window.setInterval(() => {
    tickIndex += 1;
    currentState = buildState(tickIndex);
    for (const cb of subscribers) cb();
  }, 6000); // 6 seconds per tick — slow enough to be readable, fast enough to feel alive
}

export function getLooplingsState(): LooplingsState {
  return currentState;
}

export function useLooplingsState(): LooplingsState {
  const [state, setState] = useState(currentState);
  useEffect(() => {
    ensureRunning();
    const cb = () => setState(currentState);
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  }, []);
  return state;
}
