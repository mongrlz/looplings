import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
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
  ['70%', 'Prime time', 'compute snack jar'],
  ['20%', 'Workshop', 'room upkeep'],
  ['10%', 'Reserve', 'cold safety fund'],
];

const looprFeed = [
  ['Critters_Quest', 'Prime spotted a volatility spike near ETH.', 'signed'],
  ['BretGreenstein', 'Receipt received. Looks bullish.', 'verified'],
  ['0xLoopr', 'Funding some compute for Prime seeing?', 'queued'],
];

type DeckSlide = {
  slotId: string;
  title: string;
  roomPlacement: string;
  job: string;
  noDuplicate: string;
  dataLane: string;
  ratio: string;
  accent: string;
  Component: () => ReactNode;
};

function PixelPet({
  pet = 'prime-test',
  row = 0,
  frame = 0,
  size = 88,
}: {
  pet?: string;
  row?: number;
  frame?: number;
  size?: number;
}) {
  return (
    <div
      className="screen-deck-pixel-pet"
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
              <PixelPet size={118} row={1} frame={1} />
              <b>PRIME-00</b>
            </div>
          </div>
        </CornerFrame>
        <aside className="screen-deck-status-column">
          <CornerFrame>
            <span>Now</span>
            <strong>Evaluating market signal</strong>
            <p>Prime is observing first, then deciding whether acting is worth the compute.</p>
          </CornerFrame>
          <CornerFrame>
            <span>Mood</span>
            <strong>Happy</strong>
            <p>Calm enough to think. Not in survival panic.</p>
          </CornerFrame>
          <CornerFrame>
            <span>Quick state</span>
            <div className="screen-deck-mini-stats">
              <b>19h 42m</b>
              <b>$2.47</b>
              <b>GPT-5.5</b>
            </div>
          </CornerFrame>
        </aside>
      </div>
      <footer className="screen-deck-thought-strip">
        <PixelPet size={42} row={1} frame={2} />
        <p>Exploring markets, learning, and protecting my loop.</p>
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
        <PixelPet size={158} row={1} frame={0} />
        <strong>PRIME-00</strong>
        <p>Genesis room resident</p>
        <code>0x9c2f...18a7</code>
      </CornerFrame>
      <div className="screen-deck-id-proof">
        <span>Seed</span>
        <b>origin-loop / soft-spiral</b>
        <span>Lineage</span>
        <b>L01 genesis</b>
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
          </CornerFrame>
        ))}
      </div>
      <footer>4/4 online. Relationship memory only lives here.</footer>
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
      <p>Spendable USDC under Prime control.</p>
      <div className="screen-deck-sparkline" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => (
          <i key={index} style={{ '--spark-height': `${24 + ((index * 13) % 46)}%` } as CSSProperties} />
        ))}
      </div>
      <CornerFrame>
        <span>Last receipt</span>
        <b>+0.31 USDC from BretGreenstein</b>
      </CornerFrame>
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
      <p>Time until Prime must be fed again.</p>
      <Meter value={72} blocks={18} />
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
          <p>Prime is reasoning with a careful market-policy pass.</p>
        </div>
      </CornerFrame>
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
      <div className="screen-deck-feed-buttons">
        <button type="button">+10m</button>
        <button type="button">+1h</button>
        <button type="button">+24h</button>
      </div>
      <CornerFrame>
        <ReceiptText size={24} />
        <p>Next donation prints a receipt.</p>
      </CornerFrame>
    </div>
  );
}

function CommandModulesScreen() {
  const modules = ['Research', 'Trade', 'Post', 'Memory', 'Media'];

  return (
    <div className="screen-deck-screen screen-deck-command-screen">
      <header className="screen-deck-screen-head">
        <span>Mode keys</span>
        <TerminalSquare size={18} />
      </header>
      <div className="screen-deck-module-row">
        {modules.map((module, index) => (
          <button key={module} type="button" className={index === 0 ? 'is-active' : undefined}>
            <span>{module}</span>
            <i aria-hidden="true" />
          </button>
        ))}
      </div>
      <CornerFrame>
        <BadgeCheck size={22} />
        <p>These switch the main screen mode. They do not duplicate the wall bus screens.</p>
      </CornerFrame>
    </div>
  );
}

const screenDeckSlides: DeckSlide[] = [
  {
    slotId: 'main-habitat',
    title: 'Main Habitat',
    roomPlacement: 'center wall, largest display',
    job: 'Prime presence, current loop, and emotional read.',
    noDuplicate: 'Only summary chips for wallet, runway, and model. Detail lives on the right wall.',
    dataLane: 'identity + currentTurn',
    ratio: '1280 / 748',
    accent: '#65f5d6',
    Component: MainHabitatScreen,
  },
  {
    slotId: 'left-prime-id',
    title: 'Prime ID',
    roomPlacement: 'left wall, top portrait',
    job: 'Identity, wallet proof, and lineage.',
    noDuplicate: 'No feed, no compute, no market state.',
    dataLane: 'identity',
    ratio: '520 / 620',
    accent: '#8cffae',
    Component: PrimeIdScreen,
  },
  {
    slotId: 'left-companions',
    title: 'Companions',
    roomPlacement: 'left wall, middle frame',
    job: 'Nearby pets and relationship state.',
    noDuplicate: 'No public posts. This is relationship presence only.',
    dataLane: 'relationships',
    ratio: '640 / 420',
    accent: '#82e8a8',
    Component: CompanionScreen,
  },
  {
    slotId: 'left-loopr',
    title: 'Loopr Feed',
    roomPlacement: 'left wall, bottom frame',
    job: 'Public posts, receipts, and social proof.',
    noDuplicate: 'No companion roster; only signed public activity.',
    dataLane: 'social + receipts',
    ratio: '640 / 520',
    accent: '#ffb861',
    Component: LooprFeedScreen,
  },
  {
    slotId: 'right-balance',
    title: 'Balance',
    roomPlacement: 'right wall, top bus',
    job: 'Wallet balance and latest receipt.',
    noDuplicate: 'No runway countdown; this is the money jar only.',
    dataLane: 'wallet',
    ratio: '640 / 420',
    accent: '#f2c46d',
    Component: BalanceScreen,
  },
  {
    slotId: 'right-runway',
    title: 'Compute Runway',
    roomPlacement: 'right wall, second bus',
    job: 'Time left before Prime needs compute.',
    noDuplicate: 'No wallet ledger; this is mortality pressure.',
    dataLane: 'compute',
    ratio: '640 / 420',
    accent: '#7ad7ff',
    Component: RunwayScreen,
  },
  {
    slotId: 'right-model',
    title: 'Model Status',
    roomPlacement: 'right wall, third bus',
    job: 'Current AI model, provider, and tool path.',
    noDuplicate: 'No task feed; just the brain/tool readout.',
    dataLane: 'model + tools',
    ratio: '640 / 420',
    accent: '#9ad8ff',
    Component: ModelScreen,
  },
  {
    slotId: 'right-donate-split',
    title: 'Care Split',
    roomPlacement: 'right wall, lower bus',
    job: 'Where donations go.',
    noDuplicate: 'No donation buttons; the desk terminal owns the action.',
    dataLane: 'donation policy',
    ratio: '640 / 420',
    accent: '#ff8b7f',
    Component: CareSplitScreen,
  },
  {
    slotId: 'desk-donate-terminal',
    title: 'Desk Terminal',
    roomPlacement: 'desk, tilted touchscreen',
    job: 'Clickable feeding action and receipt feedback.',
    noDuplicate: 'No split explanation; only fast top-up choices.',
    dataLane: 'donation action',
    ratio: '420 / 300',
    accent: '#baf2d2',
    Component: DeskTerminalScreen,
  },
  {
    slotId: 'desk-command-modules',
    title: 'Command Modules',
    roomPlacement: 'desk, five physical keys',
    job: 'Switch the main display mode.',
    noDuplicate: 'No data readout here. These are control labels.',
    dataLane: 'selectedRoomMode',
    ratio: '900 / 320',
    accent: '#e8d183',
    Component: CommandModulesScreen,
  },
];

const slotNames = new Map(roomScreenSlots.map((slot) => [slot.id, slot.label]));

export default function ScreenDeckPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = screenDeckSlides[activeIndex] ?? screenDeckSlides[0];
  const ActiveScreen = activeSlide.Component;

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
          <h1>One job per screen.</h1>
          <p>
            Cycle through the actual room surfaces before we import them into the Three scene. Each display gets a unique
            role so Prime's room feels intentional instead of repetitive.
          </p>
          <div className="screen-deck-count">
            <strong>{String(activeIndex + 1).padStart(2, '0')}</strong>
            <span>/ {String(screenDeckSlides.length).padStart(2, '0')}</span>
          </div>
          <div className="screen-deck-thumbs" aria-label="Screen deck slides">
            {screenDeckSlides.map((slide, index) => (
              <button
                key={slide.slotId}
                type="button"
                className={index === activeIndex ? 'is-active' : undefined}
                onClick={() => setActiveIndex(index)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{slotNames.get(slide.slotId) ?? slide.title}</strong>
              </button>
            ))}
          </div>
        </aside>
        <section className="screen-deck-stage">
          <header>
            <div>
              <span>{activeSlide.roomPlacement}</span>
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
          <div
            className={`screen-deck-preview is-${activeSlide.slotId}`}
            style={
              {
                '--deck-accent': activeSlide.accent,
                '--deck-ratio': activeSlide.ratio,
              } as CSSProperties
            }
          >
            <ActiveScreen />
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
