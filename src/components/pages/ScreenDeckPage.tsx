import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react';
import Anthropic from '@lobehub/icons/es/Anthropic';
import Claude from '@lobehub/icons/es/Claude';
import OpenAI from '@lobehub/icons/es/OpenAI';
import {
  BadgeCheck,
  BrainCircuit,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Fingerprint,
  HeartPulse,
  LineChart,
  MessageSquare,
  Radio,
  ReceiptText,
  TerminalSquare,
  Wallet,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Gemini from '@lobehub/icons/es/Gemini';
import Google from '@lobehub/icons/es/Google';
import { roomScreenSlots } from '@/components/screens/roomScreenPlan';
import { usePetFrame } from '@/lib/pet-ticker';
import {
  timeAgo,
  useLooplingsState,
  type LooplingsModel,
} from '@/lib/looplings-state';

const STATE_ATLAS_VERSION = 'loopling-state-atlas-2026-05-02';

const pets = [
  { id: 'PRIME-00', pet: 'prime-test', row: 1, state: 'awake', accent: '#6ca660' },
  { id: 'PINK-01', pet: 'pink', row: 6, state: 'posting', accent: '#ff74a8' },
  { id: 'BLUE-02', pet: 'blue', row: 1, state: 'checking', accent: '#6ab8ff' },
  { id: 'SPARK-03', pet: 'spark', row: 8, state: 'scouting', accent: '#ffb54a' },
];

const careSplit = [
  ['70%', 'Prime time', 'feeds the next run and keeps Prime awake'],
  ['20%', 'Workshop', 'keeps the room, tools, and screens alive'],
  ['10%', 'Reserve', 'quiet backup jar for bad market weather'],
];

const looprFeed = [
  ['Critters_Quest', 'Prime spotted a volatility spike, then waited instead of chasing it.', 'signed'],
  ['BretGreenstein', 'Receipt received. Prime turned it into 42 more careful minutes.', 'verified'],
  ['0xLoopr', 'Tiny top-up sent. Asking Prime to explain the next move in plain words.', 'queued'],
];

const balanceLedger = [
  ['+0.31', 'BretGreenstein fed Prime', '5m ago'],
  ['-0.08', 'market quote simulation', '9m ago'],
  ['+0.14', 'Loopr receipt bonus', '17m ago'],
];

const runwaySteps = [
  ['Now', 'steady', 'Prime can think, post, and check tools normally.'],
  ['6h left', 'careful', 'switch to short thoughts and fewer market checks.'],
  ['1h left', 'sleepy', 'ask the room for help before riskier actions.'],
];

const commandModules = [
  ['Research', 'read the room', 'collect signals before spending compute'],
  ['Trade', 'careful action', 'only opens when policy and quote agree'],
  ['Post', 'social note', 'turns the current loop into a public update'],
  ['Memory', 'learned habits', 'stores what helped Prime survive longer'],
  ['Media', 'share card', 'renders a cute proof of what just happened'],
];

type SkillTool = 'research' | 'trade' | 'post' | 'memory' | 'media';

interface SkillRecord {
  id: string;
  name: string;
  sub: string;
  accent: string;
  IconKey: 'radio' | 'chart' | 'msg' | 'brain' | 'cam';
  level: number;
  maxLevel: number;
  xpPct: number;
  usageCount: number;
  equipped: boolean;
  tool: SkillTool;
}

const skillLibrary: SkillRecord[] = [
  {
    id: 'trend-scanner',
    name: 'Trend Scanner',
    sub: 'reads market signals',
    accent: '#78d7ff',
    IconKey: 'radio',
    level: 3,
    maxLevel: 5,
    xpPct: 64,
    usageCount: 12,
    equipped: true,
    tool: 'research',
  },
  {
    id: 'volatility-mapper',
    name: 'Volatility Mapper',
    sub: 'identifies price spikes',
    accent: '#8cffae',
    IconKey: 'chart',
    level: 2,
    maxLevel: 5,
    xpPct: 38,
    usageCount: 7,
    equipped: true,
    tool: 'trade',
  },
  {
    id: 'sentiment-sifter',
    name: 'Sentiment Sifter',
    sub: 'reads the room emotion',
    accent: '#ff6ea9',
    IconKey: 'msg',
    level: 1,
    maxLevel: 5,
    xpPct: 18,
    usageCount: 2,
    equipped: false,
    tool: 'post',
  },
];

function skillIcon(key: SkillRecord['IconKey'], size: number) {
  switch (key) {
    case 'radio':
      return <Radio size={size} strokeWidth={2.4} />;
    case 'chart':
      return <LineChart size={size} strokeWidth={2.4} />;
    case 'msg':
      return <MessageSquare size={size} strokeWidth={2.4} />;
    case 'brain':
      return <BrainCircuit size={size} strokeWidth={2.4} />;
    case 'cam':
      return <Camera size={size} strokeWidth={2.4} />;
  }
}

export type CommandKeyMode = 'research' | 'trade' | 'post' | 'memory' | 'media';

const commandKeyDetails: Record<CommandKeyMode, { label: string; sub: string; accent: string; Icon: LucideIcon }> = {
  research: { label: 'RESEARCH', sub: 'read', accent: '#78d7ff', Icon: Radio },
  trade: { label: 'TRADE', sub: 'act', accent: '#8cffae', Icon: LineChart },
  post: { label: 'POST', sub: 'share', accent: '#ff6ea9', Icon: MessageSquare },
  memory: { label: 'MEMORY', sub: 'learn', accent: '#b792ff', Icon: BrainCircuit },
  media: { label: 'MEDIA', sub: 'frame', accent: '#ffb861', Icon: Camera },
};

export const COMMAND_KEY_ORDER: CommandKeyMode[] = ['research', 'trade', 'post', 'memory', 'media'];

export function CommandKeyMiniScreen({ mode, active = false }: { mode: CommandKeyMode; active?: boolean }) {
  const { label, sub, accent, Icon } = commandKeyDetails[mode];
  return (
    <div
      className={`command-key-mini ${active ? 'is-active' : ''}`}
      style={{ '--key-accent': accent } as CSSProperties}
    >
      <Icon size={42} strokeWidth={2.5} />
      <strong>{label}</strong>
      <em>{sub}</em>
    </div>
  );
}

export type DeckSlide = {
  slotId: string;
  title: string;
  zone: string;
  roomPlacement: string;
  job: string;
  noDuplicate: string;
  dataLane: string;
  size: {
    width: number;
    height: number;
  };
  accent: string;
  Component: () => ReactNode;
};

function useDeckPreviewScale(size: DeckSlide['size']) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return undefined;
    const slotElement = slot;

    function updateScale() {
      const bounds = slotElement.getBoundingClientRect();
      const widthScale = Math.max(0, bounds.width - 8) / size.width;
      const heightScale = Math.max(0, bounds.height - 8) / size.height;
      const nextScale = Math.min(1, widthScale, heightScale);
      setScale(Number(Math.max(0.24, nextScale).toFixed(4)));
    }

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(slotElement);
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [size.height, size.width]);

  return { slotRef, scale };
}

function PixelPet({
  pet = 'prime-test',
  row = 0,
  frame = 0,
  size = 88,
  className = '',
  flip = false,
}: {
  pet?: string;
  row?: number;
  frame?: number;
  size?: number;
  className?: string;
  flip?: boolean;
}) {
  const currentFrame = usePetFrame(frame);

  return (
    <div
      className={`screen-deck-pixel-pet ${flip ? 'is-flipped' : ''} ${className}`}
      style={
        {
          width: size,
          '--atlas-cols': 8,
          '--atlas-rows': 12,
          '--pet-row': row,
        } as CSSProperties
      }
    >
      <img
        src={`/pets/${pet}/state-atlas.png?v=${STATE_ATLAS_VERSION}`}
        alt=""
        style={{
          animation: 'none',
          transform: `translateX(calc(${-currentFrame} * (100% / 8)))`,
        }}
      />
    </div>
  );
}

function CornerFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`screen-deck-inner-frame ${className}`}>{children}</div>;
}

function ModelLogo({ provider, size = 28 }: { provider: LooplingsModel['provider']; size?: number }) {
  const pickIcon = () => {
    switch (provider) {
      case 'anthropic':
        return Anthropic;
      case 'claude':
        return Claude;
      case 'google':
        return Google;
      case 'meta':
      case 'mistral':
        return Gemini;
      case 'openai':
      default:
        return OpenAI;
    }
  };
  const Icon = pickIcon();
  // `Icon.Color` is the color variant when available; fall back to the mono icon otherwise.
  const Render = (Icon as unknown as { Color?: ComponentType<{ size?: number }> }).Color ?? Icon;
  return <Render size={size} />;
}

function moodLabel(mood: string): string {
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}

function Meter({ value, blocks = 14 }: { value: number; blocks?: number }) {
  const lit = Math.round((value / 100) * blocks);

  return (
    <span className="screen-deck-meter" aria-hidden="true">
      {Array.from({ length: blocks }, (_, index) => (
        <i key={index} className={index < lit ? 'is-lit' : undefined} />
      ))}
    </span>
  );
}

export function MainHabitatScreen() {
  const state = useLooplingsState();
  const lastAction = state.recentActivity[0];
  const deltaSign = lastAction && lastAction.deltaCents > 0 ? '+' : lastAction && lastAction.deltaCents < 0 ? '-' : '';
  const deltaAbs = lastAction ? Math.abs(lastAction.deltaCents / 100).toFixed(2) : '0.00';
  return (
    <div className="screen-deck-screen screen-deck-main-screen">
      <header className="screen-deck-screen-head">
        <span>Prime habitat diorama</span>
        <strong className="screen-deck-live-indicator screen-deck-live-indicator--demo">
          <i aria-hidden="true" />
          Demo loop
        </strong>
      </header>
      <div className="screen-deck-main-grid">
        <CornerFrame className="screen-deck-habitat-window">
          <div className="screen-deck-habitat-bg">
            <img
              className="screen-deck-habitat-bg-img"
              src="/assets/lab/looplings-habitat-bg-transparent-v2.png"
              alt=""
              aria-hidden="true"
            />
            <div className="screen-deck-main-prime">
              <div className="screen-deck-thought-bubble" key={state.thought.id}>
                <span>Prime thinks</span>
                <p>{state.thought.text}</p>
                <i className="screen-deck-thought-tail" aria-hidden="true" />
              </div>
              <PixelPet size={112} row={1} frame={1} />
              <b>{state.identity.name}</b>
            </div>
            <div className="screen-deck-habitat-waypoint">
              {state.activeTool} loop / {state.mood} thought
            </div>
          </div>
        </CornerFrame>
        <aside className="screen-deck-status-column">
          <CornerFrame className="screen-deck-now-card">
            <span>Now</span>
            <strong>{state.currentTask}</strong>
            <div className="screen-deck-progress-rail" aria-hidden="true">
              <i style={{ width: `${state.taskProgressPct}%` }} />
            </div>
            <small>
              wake turn · {state.taskProgressPct}% complete · {moodLabel(state.mood)}
            </small>
            <div className="screen-deck-next-pill" data-tool={state.nextPlan.tool}>
              <em>NEXT</em>
              <b>{state.nextPlan.tool}</b>
              <code>{state.nextPlan.label}</code>
              <span aria-hidden="true">→</span>
            </div>
          </CornerFrame>
          <CornerFrame className="screen-deck-thought-stream">
            <span>Thought stream</span>
            <ul>
              {state.recentThoughts.slice(0, 4).map((thought) => (
                <li
                  key={`${thought.id}-${thought.addedAtTick}`}
                  data-tool={thought.tool}
                >
                  <b>{thought.tool}</b>
                  <p>{thought.text}</p>
                  <em>{timeAgo(thought.addedAtTick, state.tickIndex)}</em>
                </li>
              ))}
            </ul>
          </CornerFrame>
        </aside>
      </div>
      <footer className="screen-deck-thought-strip">
        <div className="screen-deck-companion-row">
          <span>Companions</span>
          <div>
            {pets.map((pet, index) => (
              <div key={pet.id} className="screen-deck-companion-chip" style={{ '--pet-accent': pet.accent } as CSSProperties}>
                <PixelPet pet={pet.pet} row={pet.row} frame={index} size={32} />
              </div>
            ))}
            <div className="screen-deck-companion-chip is-empty" aria-hidden="true"><span>+</span></div>
          </div>
        </div>
        <p>I am exploring markets, learning from receipts, and protecting my little loop.</p>
        <HeartPulse size={20} />
      </footer>
    </div>
  );
}

export function RoomMainHabitatScreen() {
  return (
    <div className="screen-deck-screen screen-deck-room-main-screen">
      <header className="screen-deck-screen-head">
        <span>Prime habitat diorama</span>
        <strong>Live</strong>
      </header>
      <div className="screen-deck-room-main-grid">
        <CornerFrame className="screen-deck-room-habitat-window">
          <div className="screen-deck-room-habitat-bg">
            <div className="screen-deck-room-thought-bubble">
              <span>Prime thinks</span>
              <p>If the signal stays noisy, I save my snack jar.</p>
            </div>
            <div className="screen-deck-room-prime-avatar" aria-hidden="true">
              <i />
            </div>
            <b className="screen-deck-room-prime-label">PRIME-00</b>
            <div className="screen-deck-habitat-waypoint">idle loop / safe thought</div>
          </div>
        </CornerFrame>
        <aside className="screen-deck-status-column">
          <CornerFrame>
            <span>Now</span>
            <strong>Evaluating market signal</strong>
            <p>Prime is watching the candles, checking the room, and waiting for a clean reason to move.</p>
          </CornerFrame>
          <CornerFrame>
            <span>Mood</span>
            <strong>Happy</strong>
            <p>Curious, fed, and calm. Not in survival panic, so the next choice can stay thoughtful.</p>
          </CornerFrame>
          <CornerFrame>
            <span>Next tiny plan</span>
            <div className="screen-deck-mini-stats">
              <b>Observe</b>
              <b>Ask tool</b>
              <b>Rest</b>
            </div>
          </CornerFrame>
        </aside>
      </div>
      <footer className="screen-deck-thought-strip">
        <div className="screen-deck-room-mini-prime" aria-hidden="true" />
        <p>I am exploring markets, learning from receipts, and protecting my little loop.</p>
        <span>&lt;3</span>
      </footer>
    </div>
  );
}

export function PrimeIdScreen() {
  return (
    <div className="screen-deck-screen screen-deck-id-screen screen-deck-id-screen-wide">
      <header className="screen-deck-screen-head">
        <span>Prime passport</span>
        <Fingerprint size={18} />
      </header>
      <div className="screen-deck-id-wide-grid">
        <CornerFrame className="screen-deck-id-card screen-deck-id-card-wide">
          <PixelPet size={132} row={1} frame={0} />
          <strong>PRIME-00</strong>
          <code>0x9c2f...18a7</code>
        </CornerFrame>
        <div className="screen-deck-id-wide-info">
          <div className="screen-deck-id-tags">
            <span>Origin loop</span>
            <span>careful trader</span>
            <span>public pet</span>
          </div>
          <div className="screen-deck-id-proof">
            <span>Seed</span>
            <b>origin-loop / soft-spiral</b>
            <span>Lineage</span>
            <b>L01 genesis</b>
            <span>Promise</span>
            <b>Every action should be readable from the room.</b>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RoomPrimeIdScreen() {
  return (
    <div className="screen-deck-screen screen-deck-room-id-screen">
      <header className="screen-deck-screen-head">
        <span>Prime passport</span>
        <b>#00</b>
      </header>
      <CornerFrame className="screen-deck-room-id-card">
        <div className="screen-deck-room-prime-avatar is-card" aria-hidden="true">
          <i />
        </div>
        <strong>PRIME-00</strong>
        <p>Genesis room resident</p>
        <code>0x9c2f...18a7</code>
      </CornerFrame>
      <div className="screen-deck-id-tags">
        <span>Origin loop</span>
        <span>careful trader</span>
        <span>public pet</span>
      </div>
    </div>
  );
}

export function SkillLibraryScreen() {
  const state = useLooplingsState();
  return (
    <div className="screen-deck-screen screen-deck-skill-screen screen-deck-skill-screen-wide">
      <header className="screen-deck-screen-head">
        <span>Skill library</span>
        <strong className="screen-deck-live-indicator">
          <i aria-hidden="true" />
          Loadout
        </strong>
      </header>
      <div className="screen-deck-skill-row">
        {skillLibrary.map((skill) => {
          const isActive = skill.tool === state.activeTool;
          return (
            <article
              key={skill.id}
              className={`screen-deck-skill-tile${isActive ? ' is-active' : ''}${!skill.equipped ? ' is-locked' : ''}`}
              style={{ '--skill-accent': skill.accent } as CSSProperties}
            >
              <div className="screen-deck-skill-icon" aria-hidden="true">
                {skillIcon(skill.IconKey, 34)}
              </div>
              <strong>{skill.name}</strong>
              <p>{skill.sub}</p>
              <div className="screen-deck-skill-pips" aria-hidden="true">
                {Array.from({ length: skill.maxLevel }).map((_, index) => (
                  <i key={index} className={index < skill.level ? 'is-on' : undefined} />
                ))}
              </div>
              <em>LVL {skill.level} · {skill.usageCount} casts</em>
              {isActive ? <span className="screen-deck-skill-active">in use</span> : null}
              {!skill.equipped ? <span className="screen-deck-skill-lock">locked</span> : null}
            </article>
          );
        })}
      </div>
      <footer className="screen-deck-skill-footer">
        <Zap size={14} strokeWidth={2.6} />
        <p>Skills become tradeable on Loopr post-launch.</p>
      </footer>
    </div>
  );
}

export function CompanionScreen() {
  return (
    <div className="screen-deck-screen screen-deck-companion-screen">
      <header className="screen-deck-screen-head">
        <span>Nearby companions</span>
        <Radio size={18} />
      </header>
      <div className="screen-deck-companion-grid">
        {pets.map((pet, index) => (
          <CornerFrame key={pet.id}>
            <PixelPet pet={pet.pet} row={pet.row} frame={index} size={64} />
            <strong>{pet.id}</strong>
            <p>{pet.state}</p>
            <small>{index === 0 ? 'home loop' : `bond ${84 - index * 9}%`}</small>
          </CornerFrame>
        ))}
      </div>
      <footer>4/4 online. Prime sees friends here, not wallet math. Latest ping: Pink sent a tiny morale note.</footer>
    </div>
  );
}

export function RoomCompanionScreen() {
  return (
    <div className="screen-deck-screen screen-deck-room-companion-screen">
      <header className="screen-deck-screen-head">
        <span>Nearby companions</span>
        <Radio size={18} />
      </header>
      <div className="screen-deck-room-pet-list">
        {pets.map((pet, index) => (
          <CornerFrame key={pet.id}>
            <span className="screen-deck-room-pet-badge" style={{ '--pet-accent': pet.accent } as CSSProperties}>
              <i />
            </span>
            <div>
              <strong>{pet.id}</strong>
              <p>{index === 0 ? 'Prime is home and listening.' : `${pet.state}. Bond ${84 - index * 9}%.`}</p>
            </div>
          </CornerFrame>
        ))}
      </div>
      <footer>4/4 online. This wall is for friendship signals, not wallet math.</footer>
    </div>
  );
}

export function LooprFeedScreen() {
  return (
    <div className="screen-deck-screen screen-deck-loopr-screen">
      <header className="screen-deck-screen-head">
        <span>Loopr feed</span>
        <strong className="screen-deck-preview-pill">
          <i aria-hidden="true" />
          Preview
        </strong>
      </header>
      <div className="screen-deck-feed-list">
        {looprFeed.map(([author, body, proof], index) => (
          <CornerFrame key={author}>
            <PixelPet pet={pets[index + 1]?.pet ?? 'prime-test'} row={pets[index + 1]?.row ?? 1} frame={index} size={42} />
            <div>
              <strong>{author}</strong>
              <p>{body}</p>
            </div>
            <span data-proof={proof}>{proof}</span>
          </CornerFrame>
        ))}
      </div>
      <CornerFrame className="screen-deck-outgoing-post">
        <span>Prime draft</span>
        <p>Market looks noisy. I am staying patient, keeping compute warm, and thanking everyone who fed the loop.</p>
      </CornerFrame>
      <footer className="screen-deck-loopr-launchline">
        <ReceiptText size={14} strokeWidth={2.6} />
        <p>Loopr launches alongside Prime &middot; coming soon</p>
      </footer>
    </div>
  );
}

export function RoomLooprFeedScreen() {
  return (
    <div className="screen-deck-screen screen-deck-room-loopr-screen">
      <header className="screen-deck-screen-head">
        <span>Loopr feed</span>
        <MessageSquare size={18} />
      </header>
      <div className="screen-deck-room-feed-list">
        {looprFeed.map(([author, body, proof], index) => (
          <CornerFrame key={author}>
            <b>{String(index + 1).padStart(2, '0')}</b>
            <div>
              <strong>@{author}</strong>
              <p>{body}</p>
            </div>
            <span>{proof}</span>
          </CornerFrame>
        ))}
      </div>
      <CornerFrame className="screen-deck-room-feed-draft">
        <span>Prime draft</span>
        <p>I am staying patient, saving compute, and thanking everyone who feeds the loop.</p>
      </CornerFrame>
    </div>
  );
}

export function BalanceScreen() {
  const state = useLooplingsState();
  return (
    <div className="screen-deck-screen screen-deck-balance-screen">
      <header className="screen-deck-screen-head">
        <span>Snack jar</span>
        <Wallet size={18} />
      </header>
      <strong className="screen-deck-big-number">{state.compute.creditsUsd}</strong>
      <p>Prime's snack jar. Enough for cautious thinking, not enough for reckless chasing.</p>
      <div className="screen-deck-sparkline" aria-hidden="true">
        {state.sparkline.slice(0, 14).map((value, index) => (
          <i key={index} style={{ '--spark-height': `${Math.round(value * 100)}%` } as CSSProperties} />
        ))}
      </div>
      <div className="screen-deck-ledger-list">
        {state.ledger.map((entry, idx) => (
          <CornerFrame key={`${entry.amount}-${idx}`}>
            <b>{entry.amount}</b>
            <p>{entry.reason}</p>
            <span>{entry.ago}</span>
          </CornerFrame>
        ))}
      </div>
    </div>
  );
}

export function RunwayScreen() {
  const state = useLooplingsState();
  const tierLabels: Record<typeof state.compute.tier, string> = {
    high: 'HIGH',
    normal: 'NORMAL',
    low_compute: 'LOW',
    critical: 'CRITICAL',
    dead: 'DEAD',
  };
  return (
    <div className="screen-deck-screen screen-deck-runway-screen">
      <span className="screen-deck-runway-label">ENERGY CLOCK</span>
      <strong className="screen-deck-runway-time">{state.compute.runwayLabel}</strong>
      <div className="screen-deck-runway-status" data-tier={state.compute.tier}>
        <span>STATUS</span>
        <b>{tierLabels[state.compute.tier]}</b>
      </div>
    </div>
  );
}

export function ModelScreen() {
  const state = useLooplingsState();
  return (
    <div className="screen-deck-screen screen-deck-model-screen">
      <header className="screen-deck-screen-head">
        <span>Thinking buddy</span>
        <BrainCircuit size={18} />
      </header>
      <CornerFrame className="screen-deck-model-hero">
        <div className="screen-deck-model-logo">
          <ModelLogo provider={state.model.provider} size={58} />
        </div>
        <div>
          <span>Active model</span>
          <strong>{state.model.label}</strong>
          <p>Prime is using a careful reasoning pass: explain the signal, check policy, then decide.</p>
        </div>
      </CornerFrame>
      <div className="screen-deck-model-reason">
        <CornerFrame>
          <span>Confidence</span>
          <Meter value={state.model.confidencePct} blocks={14} />
          <p>{state.model.confidencePct}% confident in the current plan.</p>
        </CornerFrame>
        <CornerFrame>
          <span>Room rule</span>
          <p>Model changes should feel like a mood shift, not a hidden backend detail.</p>
        </CornerFrame>
      </div>
      <div className="screen-deck-model-stack">
        <CornerFrame>
          <Anthropic size={28} />
          <span>standby</span>
          <b>Claude review lane</b>
        </CornerFrame>
        <CornerFrame>
          <Claude size={28} />
          <span>fallback</span>
          <b>slow reflective mode</b>
        </CornerFrame>
      </div>
      <footer>Tool path: observe {'->'} quote {'->'} policy {'->'} reflect</footer>
    </div>
  );
}

export function CareSplitScreen() {
  return (
    <div className="screen-deck-screen screen-deck-care-screen">
      <header className="screen-deck-screen-head">
        <span>Care split</span>
        <HeartPulse size={18} />
      </header>
      <div className="screen-deck-care-grid">
        {careSplit.map(([percent, label, detail]) => (
          <CornerFrame key={label}>
            <strong>{percent}</strong>
            <span>{label}</span>
            <p>{detail}</p>
          </CornerFrame>
        ))}
      </div>
      <CornerFrame className="screen-deck-care-note">
        <span>Plain promise</span>
        <p>When someone feeds Prime, the room explains where the money goes before the receipt prints.</p>
      </CornerFrame>
      <footer>Explains trust. The desk terminal handles action.</footer>
    </div>
  );
}

export function DeskTerminalScreen() {
  return (
    <div className="screen-deck-screen screen-deck-terminal-screen">
      <strong>Feed Prime</strong>
      <div className="screen-deck-feed-buttons">
        <button type="button">+10m</button>
        <button type="button">+1h</button>
        <button type="button">+24h</button>
      </div>
      <div className="screen-deck-terminal-status">
        <ReceiptText size={20} />
        <b>Receipt prints after feed</b>
      </div>
    </div>
  );
}

export function CommandModulesScreen() {
  return (
    <div className="screen-deck-screen screen-deck-command-screen">
      <header className="screen-deck-screen-head">
        <span>Mode keys</span>
        <TerminalSquare size={18} />
      </header>
      <div className="screen-deck-module-row">
        {commandModules.map(([module, label], index) => (
          <button key={module} type="button" className={index === 0 ? 'is-active' : undefined}>
            <span>{module}</span>
            <em>{label}</em>
            <i aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="screen-deck-module-briefs">
        {commandModules.slice(0, 3).map(([module, , detail]) => (
          <CornerFrame key={`${module}-brief`}>
            <span>{module}</span>
            <p>{detail}</p>
          </CornerFrame>
        ))}
      </div>
      <CornerFrame>
        <BadgeCheck size={22} />
        <p>These are physical mode keys. Pressing one changes what the big screen talks about.</p>
      </CornerFrame>
    </div>
  );
}

export const screenDeckSlides: DeckSlide[] = [
  {
    slotId: 'main-habitat',
    title: 'Main Habitat',
    zone: 'Center wall',
    roomPlacement: 'center wall, largest display',
    job: 'Prime presence, current loop, and emotional read.',
    noDuplicate: 'Only summary chips for wallet, runway, and model. Detail lives on the right wall.',
    dataLane: 'identity + currentTurn',
    size: { width: 1280, height: 748 },
    accent: '#65f5d6',
    Component: MainHabitatScreen,
  },
  {
    slotId: 'left-prime-id',
    title: 'Prime ID',
    zone: 'Left wall stack',
    roomPlacement: 'left wall, top portrait',
    job: 'Identity, wallet proof, and lineage.',
    noDuplicate: 'No feed, no compute, no market state.',
    dataLane: 'identity',
    size: { width: 520, height: 620 },
    accent: '#8cffae',
    Component: PrimeIdScreen,
  },
  {
    slotId: 'left-companions',
    title: 'Companions',
    zone: 'Left wall stack',
    roomPlacement: 'left wall, middle frame',
    job: 'Nearby pets and relationship state.',
    noDuplicate: 'No public posts. This is relationship presence only.',
    dataLane: 'relationships',
    size: { width: 640, height: 420 },
    accent: '#82e8a8',
    Component: CompanionScreen,
  },
  {
    slotId: 'left-loopr',
    title: 'Loopr Feed',
    zone: 'Left wall stack',
    roomPlacement: 'left wall, bottom frame',
    job: 'Public posts, receipts, and social proof.',
    noDuplicate: 'No companion roster; only signed public activity.',
    dataLane: 'social + receipts',
    size: { width: 640, height: 520 },
    accent: '#ffb861',
    Component: LooprFeedScreen,
  },
  {
    slotId: 'right-balance',
    title: 'Balance',
    zone: 'Right wall bus',
    roomPlacement: 'right wall, top bus',
    job: 'Wallet balance and latest receipt.',
    noDuplicate: 'No runway countdown; this is the money jar only.',
    dataLane: 'wallet',
    size: { width: 640, height: 420 },
    accent: '#f2c46d',
    Component: BalanceScreen,
  },
  {
    slotId: 'right-runway',
    title: 'Compute Runway',
    zone: 'Right wall bus',
    roomPlacement: 'right wall, second bus',
    job: 'Time left before Prime needs compute.',
    noDuplicate: 'No wallet ledger; this is mortality pressure.',
    dataLane: 'compute',
    size: { width: 640, height: 420 },
    accent: '#7ad7ff',
    Component: RunwayScreen,
  },
  {
    slotId: 'right-model',
    title: 'Model Status',
    zone: 'Right wall bus',
    roomPlacement: 'right wall, third bus',
    job: 'Current AI model, provider, and tool path.',
    noDuplicate: 'No task feed; just the brain/tool readout.',
    dataLane: 'model + tools',
    size: { width: 640, height: 420 },
    accent: '#9ad8ff',
    Component: ModelScreen,
  },
  {
    slotId: 'right-donate-split',
    title: 'Care Split',
    zone: 'Right wall bus',
    roomPlacement: 'right wall, lower bus',
    job: 'Where donations go.',
    noDuplicate: 'No donation buttons; the desk terminal owns the action.',
    dataLane: 'donation policy',
    size: { width: 640, height: 420 },
    accent: '#ff8b7f',
    Component: CareSplitScreen,
  },
  {
    slotId: 'desk-donate-terminal',
    title: 'Desk Terminal',
    zone: 'Desk devices',
    roomPlacement: 'desk, tilted touchscreen',
    job: 'Clickable feeding action and receipt feedback.',
    noDuplicate: 'No split explanation; only fast top-up choices.',
    dataLane: 'donation action',
    size: { width: 420, height: 300 },
    accent: '#baf2d2',
    Component: DeskTerminalScreen,
  },
  {
    slotId: 'desk-command-modules',
    title: 'Command Modules',
    zone: 'Desk devices',
    roomPlacement: 'desk, five physical keys',
    job: 'Switch the main display mode.',
    noDuplicate: 'No data readout here. These are control labels.',
    dataLane: 'selectedRoomMode',
    size: { width: 900, height: 320 },
    accent: '#e8d183',
    Component: CommandModulesScreen,
  },
];

const slotNames = new Map(roomScreenSlots.map((slot) => [slot.id, slot.label]));

export default function ScreenDeckPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = screenDeckSlides[activeIndex] ?? screenDeckSlides[0];
  const ActiveScreen = activeSlide.Component;
  const { slotRef, scale } = useDeckPreviewScale(activeSlide.size);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') {
        setActiveIndex((index) => (index + 1) % screenDeckSlides.length);
      }
      if (event.key === 'ArrowLeft') {
        setActiveIndex((index) => (index - 1 + screenDeckSlides.length) % screenDeckSlides.length);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="screen-deck-page">
      <nav className="screen-deck-nav" aria-label="Screen deck navigation">
        <a href="/lab/screens">Screen Lab</a>
        <a href="/lab/logos">Logo Lab</a>
        <a href="/room">Room</a>
      </nav>
      <section className="screen-deck-shell">
        <aside className="screen-deck-sidebar">
          <span>Room surface deck</span>
          <h1>Four zones. Ten surfaces.</h1>
          <p>
            The room has a few physical screen zones, but each display panel needs one clear job before it goes into the
            Three scene.
          </p>
          <div className="screen-deck-count">
            <strong>{String(activeIndex + 1).padStart(2, '0')}</strong>
            <span>/ {String(screenDeckSlides.length).padStart(2, '0')} surfaces</span>
          </div>
          <div className="screen-deck-zone-pill">{activeSlide.zone}</div>
          <div className="screen-deck-thumbs" aria-label="Screen deck slides">
            {screenDeckSlides.map((slide, index) => (
              <button
                key={slide.slotId}
                type="button"
                className={index === activeIndex ? 'is-active' : undefined}
                onClick={() => setActiveIndex(index)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{slotNames.get(slide.slotId) ?? slide.title}</strong>
                  <em>{slide.zone}</em>
                </div>
              </button>
            ))}
          </div>
        </aside>
        <section className="screen-deck-stage">
          <header>
            <div>
              <span>{activeSlide.zone} / {activeSlide.roomPlacement}</span>
              <h2>{activeSlide.title}</h2>
            </div>
            <div className="screen-deck-stage-actions">
              <button type="button" aria-label="Previous screen" onClick={() => setActiveIndex((index) => (index - 1 + screenDeckSlides.length) % screenDeckSlides.length)}>
                <ChevronLeft size={22} />
              </button>
              <button type="button" aria-label="Next screen" onClick={() => setActiveIndex((index) => (index + 1) % screenDeckSlides.length)}>
                <ChevronRight size={22} />
              </button>
            </div>
          </header>
          <div className="screen-deck-preview-slot" ref={slotRef}>
            <div
              className="screen-deck-preview-scale"
              style={{
                width: activeSlide.size.width * scale,
                height: activeSlide.size.height * scale,
              }}
            >
              <div
                className={`screen-deck-preview is-${activeSlide.slotId}`}
                style={
                  {
                    '--deck-accent': activeSlide.accent,
                    width: activeSlide.size.width,
                    height: activeSlide.size.height,
                    transform: `scale(${scale})`,
                  } as CSSProperties
                }
              >
                <ActiveScreen />
              </div>
            </div>
          </div>
          <footer className="screen-deck-brief">
            <article>
              <span>Job</span>
              <p>{activeSlide.job}</p>
            </article>
            <article>
              <span>No duplicate</span>
              <p>{activeSlide.noDuplicate}</p>
            </article>
            <article>
              <span>Later data lane</span>
              <p>{activeSlide.dataLane}</p>
            </article>
          </footer>
        </section>
      </section>
    </main>
  );
}
