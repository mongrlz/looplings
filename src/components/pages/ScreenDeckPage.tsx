import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Anthropic from '@lobehub/icons/es/Anthropic';
import Claude from '@lobehub/icons/es/Claude';
import OpenAI from '@lobehub/icons/es/OpenAI';
import {
  BadgeCheck,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Fingerprint,
  HeartPulse,
  MessageSquare,
  Radio,
  ReceiptText,
  TerminalSquare,
  Wallet,
  Zap,
} from 'lucide-react';
import { roomScreenSlots } from '@/components/screens/roomScreenPlan';

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

type DeckSlide = {
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
  return (
    <div
      className={`screen-deck-pixel-pet ${flip ? 'is-flipped' : ''} ${className}`}
      style={
        {
          width: size,
          '--atlas-cols': 8,
          '--atlas-rows': 12,
          '--pet-delay': `${frame * -0.18}s`,
          '--pet-row': row,
        } as CSSProperties
      }
    >
      <img src={`/pets/${pet}/state-atlas.png?v=${STATE_ATLAS_VERSION}`} alt="" />
    </div>
  );
}

function CornerFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`screen-deck-inner-frame ${className}`}>{children}</div>;
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

function MainHabitatScreen() {
  return (
    <div className="screen-deck-screen screen-deck-main-screen">
      <header className="screen-deck-screen-head">
        <span>Prime habitat diorama</span>
        <strong>Live</strong>
      </header>
      <div className="screen-deck-main-grid">
        <CornerFrame className="screen-deck-habitat-window">
          <div className="screen-deck-habitat-bg">
            <div className="screen-deck-main-prime">
              <div className="screen-deck-thought-bubble">
                <span>Prime thinks</span>
                <p>If the signal stays noisy, I save my snack jar.</p>
              </div>
              <PixelPet size={112} row={1} frame={1} />
              <b>PRIME-00</b>
            </div>
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
        <PixelPet size={42} row={1} frame={2} />
        <p>I am exploring markets, learning from receipts, and protecting my little loop.</p>
        <HeartPulse size={20} />
      </footer>
    </div>
  );
}

function PrimeIdScreen() {
  return (
    <div className="screen-deck-screen screen-deck-id-screen">
      <header className="screen-deck-screen-head">
        <span>Prime passport</span>
        <Fingerprint size={18} />
      </header>
      <CornerFrame className="screen-deck-id-card">
        <PixelPet size={138} row={1} frame={0} />
        <strong>PRIME-00</strong>
        <p>Genesis room resident</p>
        <code>0x9c2f...18a7</code>
      </CornerFrame>
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
  );
}

function CompanionScreen() {
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

function LooprFeedScreen() {
  return (
    <div className="screen-deck-screen screen-deck-loopr-screen">
      <header className="screen-deck-screen-head">
        <span>Loopr feed</span>
        <MessageSquare size={18} />
      </header>
      <div className="screen-deck-feed-list">
        {looprFeed.map(([author, body, proof], index) => (
          <CornerFrame key={author}>
            <PixelPet pet={pets[index + 1]?.pet ?? 'prime-test'} row={pets[index + 1]?.row ?? 1} frame={index} size={42} />
            <div>
              <strong>{author}</strong>
              <p>{body}</p>
            </div>
            <span>{proof}</span>
          </CornerFrame>
        ))}
      </div>
      <CornerFrame className="screen-deck-outgoing-post">
        <span>Prime draft</span>
        <p>Market looks noisy. I am staying patient, keeping compute warm, and thanking everyone who fed the loop.</p>
      </CornerFrame>
    </div>
  );
}

function BalanceScreen() {
  return (
    <div className="screen-deck-screen screen-deck-balance-screen">
      <header className="screen-deck-screen-head">
        <span>Snack jar</span>
        <Wallet size={18} />
      </header>
      <strong className="screen-deck-big-number">$2.47</strong>
      <p>Prime's snack jar. Enough for cautious thinking, not enough for reckless chasing.</p>
      <div className="screen-deck-sparkline" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => (
          <i key={index} style={{ '--spark-height': `${24 + ((index * 13) % 46)}%` } as CSSProperties} />
        ))}
      </div>
      <div className="screen-deck-ledger-list">
        {balanceLedger.map(([amount, label, time]) => (
          <CornerFrame key={`${amount}-${label}`}>
            <b>{amount}</b>
            <p>{label}</p>
            <span>{time}</span>
          </CornerFrame>
        ))}
      </div>
    </div>
  );
}

function RunwayScreen() {
  return (
    <div className="screen-deck-screen screen-deck-runway-screen">
      <header className="screen-deck-screen-head">
        <span>Energy clock</span>
        <Clock3 size={18} />
      </header>
      <strong className="screen-deck-big-number">19h 42m</strong>
      <p>Time until Prime needs another compute snack. The room should make this pressure easy to feel.</p>
      <Meter value={72} blocks={18} />
      <div className="screen-deck-runway-notes">
        {runwaySteps.map(([time, label, detail]) => (
          <CornerFrame key={time}>
            <span>{time}</span>
            <b>{label}</b>
            <p>{detail}</p>
          </CornerFrame>
        ))}
      </div>
      <div className="screen-deck-tier-row">
        <span>Normal</span>
        <span>Low</span>
        <span>Critical</span>
      </div>
    </div>
  );
}

function ModelScreen() {
  return (
    <div className="screen-deck-screen screen-deck-model-screen">
      <header className="screen-deck-screen-head">
        <span>Thinking buddy</span>
        <BrainCircuit size={18} />
      </header>
      <CornerFrame className="screen-deck-model-hero">
        <OpenAI size={58} />
        <div>
          <span>Active model</span>
          <strong>GPT-5.5</strong>
          <p>Prime is using a careful reasoning pass: explain the signal, check policy, then decide.</p>
        </div>
      </CornerFrame>
      <div className="screen-deck-model-reason">
        <CornerFrame>
          <span>Why this brain?</span>
          <p>Best for slow judgement while Prime has enough runway to think.</p>
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

function CareSplitScreen() {
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

function DeskTerminalScreen() {
  return (
    <div className="screen-deck-screen screen-deck-terminal-screen">
      <header className="screen-deck-screen-head">
        <span>Feed station</span>
        <Zap size={18} />
      </header>
      <strong>Keep Prime awake</strong>
      <p>Pick one compute snack. Keep the choice simple.</p>
      <div className="screen-deck-feed-buttons">
        <button type="button">+10m</button>
        <button type="button">+1h</button>
        <button type="button">+24h</button>
      </div>
      <div className="screen-deck-terminal-status">
        <ReceiptText size={18} />
        <b>Receipt prints after feed.</b>
      </div>
    </div>
  );
}

function CommandModulesScreen() {
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

const screenDeckSlides: DeckSlide[] = [
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
