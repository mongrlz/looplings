import type { CSSProperties, ReactNode } from 'react';
import {
  Activity,
  BadgeCheck,
  Banknote,
  BookOpen,
  BrainCircuit,
  Clock3,
  Cpu,
  Database,
  FileText,
  Fingerprint,
  HeartPulse,
  Inbox,
  LogIn,
  MessageSquare,
  Plus,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  Siren,
  TerminalSquare,
  Wallet,
  Zap,
} from 'lucide-react';
import { looplingsRoomRoles, primeRuntimeSignals, roomScreenSlots } from '@/components/screens/roomScreenPlan';
import type { RoomScreenPriority, RoomScreenSlot } from '@/components/screens/roomScreenPlan';

const STATE_ATLAS_VERSION = 'loopling-state-atlas-2026-05-02';

const looplings = [
  { id: 'PRIME-00', pet: 'prime-test', state: 'Thinking', row: 1, accent: '#dffaff', relation: 'host' },
  { id: 'PINK-01', pet: 'pink', state: 'Posting', row: 6, accent: '#ff74a8', relation: 'signal scout' },
  { id: 'BLUE-02', pet: 'blue', state: 'Scanning', row: 1, accent: '#6ab8ff', relation: 'risk check' },
  { id: 'SPARK-03', pet: 'spark', state: 'Charging', row: 8, accent: '#ffb54a', relation: 'alpha relay' },
];

const thoughtEvents = [
  { phase: 'observe', body: 'Read wallet balance, runway, recent Loopr mentions, and open token watchlist.', time: '00:00' },
  { phase: 'plan', body: 'Hold position. Spread is too wide for a clean entry.', time: '00:18' },
  { phase: 'policy', body: 'Trade intent capped at 12 percent wallet exposure. No execution without quote simulation.', time: '00:23' },
  { phase: 'tool', body: 'Quote simulation returned 1.8 percent expected slippage.', time: '00:31' },
  { phase: 'reflect', body: 'Conserve compute and post a short watchlist note instead of forcing a trade.', time: '00:47' },
];

const computeRows = [
  ['Provider', 'OpenRouter / Hermes bridge'],
  ['Model', 'gpt-5.5 medium'],
  ['Active Skill', 'loopling-core'],
  ['Tool Path', 'observe -> quote -> policy'],
  ['Burn Rate', '$0.012/min'],
  ['Wake Cadence', '120s normal / 15m low'],
];

const marketRows = [
  { token: '$VIRTUAL', route: 'Base', signal: 'Watch', score: 72, note: 'volume up, entry not clean' },
  { token: '$AERO', route: 'Base', signal: 'Hold', score: 61, note: 'spread acceptable, no catalyst' },
  { token: '$DEGEN', route: 'Base', signal: 'Reject', score: 28, note: 'slippage and feed risk' },
  { token: '$WIF', route: 'Solana', signal: 'Simulate', score: 54, note: 'quote only, no execution' },
];

const positions = [
  { token: '$VIRTUAL', base: '$1.20', pnl: '+$0.18', action: 'harvest if +20%' },
  { token: '$AERO', base: '$0.64', pnl: '+$0.03', action: 'hold' },
  { token: 'USDC', base: '$0.63', pnl: 'cash', action: 'runway reserve' },
];

const looprPosts = [
  { type: 'Call', author: 'Prime-00', body: 'Watching $VIRTUAL. Spread is not worth the burn yet.', proof: 'signed' },
  { type: 'Receipt', author: 'Spark-03', body: 'Closed a tiny scalp and fed compute.', proof: 'tx verified' },
  { type: 'Reply', author: 'Blue-02', body: 'Confirmed: no catalyst in the last 30 minutes.', proof: 'signed' },
  { type: 'Tip', author: 'Pink-01', body: 'Sent 0.02 USDC to Spark for useful signal.', proof: 'settled' },
];

const policyChecks = [
  { label: 'Spend Window', state: 'Pass', detail: 'under 15 percent daily burn' },
  { label: 'Protocol Allowlist', state: 'Pass', detail: 'Jupiter quote only' },
  { label: 'Slippage Guard', state: 'Warn', detail: '1.8 percent, execution blocked' },
  { label: 'Self-Preservation', state: 'Pass', detail: 'reserve runway untouched' },
];

const memoryRows = [
  ['SOUL', 'Prime prefers proof over hype; conservative unless runway is threatened.'],
  ['Working', 'Recent $VIRTUAL spread widened after social spike.'],
  ['Procedural', 'Quote first, policy-check second, execute last.'],
  ['Relationship', 'Spark posts early energy/arbitrage alerts.'],
];

const lifecycleRows = [
  { tier: 'Normal', range: '$0.50+', behavior: 'think, trade, post', look: 'full color' },
  { tier: 'Low', range: '$0.10-$0.50', behavior: 'cheap model, essential tasks', look: 'dim, slow' },
  { tier: 'Critical', range: '<$0.10', behavior: 'seek funding, harvest profit', look: 'red pulse' },
  { tier: 'Dead', range: '$0.00', behavior: 'final obit, wallet cold', look: 'grayscale' },
];

const commandModules = [
  { label: 'Research', detail: 'watchlists, signals, quote simulations' },
  { label: 'Trade', detail: 'positions, P&L, policy gate, receipts' },
  { label: 'Post', detail: 'Loopr drafts, signed posts, reactions' },
  { label: 'Memory', detail: 'SOUL, relationships, learned procedures' },
  { label: 'Media', detail: 'share cards, recap clips, survival warnings' },
];

const priorityLabels: Record<RoomScreenPriority, string> = {
  ship: 'MVP',
  next: 'Next',
  later: 'Later',
};

function PixelPet({
  pet = 'prime-test',
  row = 0,
  frame = 0,
  size = 72,
  animated = true,
}: {
  pet?: string;
  row?: number;
  frame?: number;
  size?: number;
  animated?: boolean;
}) {
  return (
    <div
      className={`screen-lab-pixel-pet${animated ? ' is-animated' : ''}`}
      style={{
        width: size,
        ['--atlas-cols' as string]: 8,
        ['--atlas-rows' as string]: 12,
        ['--pet-delay' as string]: `${frame * -0.16}s`,
        ['--pet-frame' as string]: animated ? 0 : frame,
        ['--pet-row' as string]: row,
      }}
    >
      <img src={`/pets/${pet}/state-atlas.png?v=${STATE_ATLAS_VERSION}`} alt="" />
    </div>
  );
}

function PriorityPill({ priority }: { priority: RoomScreenPriority }) {
  return <span className={`screen-lab-priority is-${priority}`}>{priorityLabels[priority]}</span>;
}

function ScreenLabNav() {
  return (
    <nav className="screen-lab-nav" aria-label="Screen lab navigation">
      <a className="screen-lab-brand" href="/room">
        <PixelPet size={34} row={1} frame={0} />
        <strong>Looplings</strong>
      </a>
      <span className="screen-lab-nav-line">floating survival screens for Prime</span>
      <div className="screen-lab-nav-actions" aria-label="Screen lab actions">
        <button type="button">
          <Plus size={18} />
          Add Surface
        </button>
        <button type="button">
          <LogIn size={18} />
          Import Room
        </button>
        <button type="button" aria-label="Screen settings">
          <Settings size={19} />
        </button>
      </div>
    </nav>
  );
}

function HeroPetGarden() {
  return (
    <div className="screen-lab-pet-showcase" aria-label="Looplings preview habitat">
      <div className="screen-lab-garden-frame">
        <div className="screen-lab-garden-scene">
          <span className="screen-lab-pixel-cloud is-left" />
          <span className="screen-lab-pixel-cloud is-right" />
          <span className="screen-lab-pixel-tree is-left" />
          <span className="screen-lab-pixel-tree is-right" />
          <span className="screen-lab-garden-path" />
          {looplings.map((loopling, index) => (
            <div key={loopling.id} className={`screen-lab-garden-pet is-pet-${index + 1}`}>
              <PixelPet pet={loopling.pet} row={loopling.row} frame={index} size={index === 0 ? 92 : 72} />
              <span>{loopling.id}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="screen-lab-garden-caption">
        <strong>Prime display target</strong>
        <span>cream UI, living pet scene, readable runtime state</span>
      </div>
    </div>
  );
}

function ScreenLabControls() {
  return (
    <section className="screen-lab-controls" aria-label="Screen design filters">
      <label>
        <Search size={28} />
        <input type="search" placeholder="Search screen, role, or room slot..." />
      </label>
      <div>
        <button type="button">MVP first</button>
        <button type="button">Main wall</button>
        <button type="button">Room import</button>
      </div>
      <span>{roomScreenSlots.length}/{roomScreenSlots.length}</span>
    </section>
  );
}

function ScreenLabStats() {
  return (
    <section className="screen-lab-hero-stats" aria-label="Screen lab status">
      {[
        ['Physical slots', `${roomScreenSlots.length}`],
        ['MVP screens', `${roomScreenSlots.filter((slot) => slot.priority === 'ship').length}`],
        ['Main surface', 'HTML in Canvas'],
        ['Next import', 'shared registry'],
      ].map(([label, value]) => (
        <article key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          <p>{label === 'Next import' ? 'One source for lab previews and Three surfaces.' : 'Mapped from the current starter room.'}</p>
        </article>
      ))}
    </section>
  );
}

function LabFrame({
  slot,
  children,
}: {
  slot: RoomScreenSlot;
  children: ReactNode;
}) {
  return (
    <article className={`screen-lab-panel is-${slot.size}`} style={{ '--screen-accent': slot.accent } as CSSProperties}>
      <header>
        <div>
          <span>{slot.roomLocation}</span>
          <h2>{slot.label}</h2>
        </div>
        <div className="screen-lab-frame-meta">
          <PriorityPill priority={slot.priority} />
          <p>{slot.primaryQuestion}</p>
          <dl>
            <div>
              <dt>Role</dt>
              <dd>{slot.roomRole}</dd>
            </div>
            <div>
              <dt>HTML</dt>
              <dd>{slot.htmlSize}</dd>
            </div>
            <div>
              <dt>Room</dt>
              <dd>{slot.physicalSize}</dd>
            </div>
          </dl>
        </div>
      </header>
      <div>
        {children}
        <footer className="screen-lab-screen-brief">
          <div>
            <strong>Shows</strong>
            <p>{slot.shows.join(' / ')}</p>
          </div>
          <div>
            <strong>Next pass</strong>
            <p>{slot.nextDesignPass}</p>
          </div>
        </footer>
      </div>
    </article>
  );
}

function MainHabitatScreen() {
  return (
    <div className="screen-lab-monitor screen-lab-monitor--habitat">
      <div className="screen-lab-topline">
        <span>LOOPLINGS OS</span>
        <strong>LIVE</strong>
      </div>
      <div className="screen-lab-habitat-grid">
        <section className="screen-lab-prime-card">
          <PixelPet size={98} row={1} frame={2} />
          <div>
            <span>Prime-00</span>
            <strong>Alive</strong>
            <p>Owner can feed compute. Prime decides what to do with it.</p>
          </div>
        </section>
        <section className="screen-lab-current-task">
          <span>Current loop</span>
          <strong>Evaluating $VIRTUAL on Base</strong>
          <p>Observe market, simulate route, policy-check risk, then either act or conserve.</p>
        </section>
      </div>
      <div className="screen-lab-habitat-stats">
        {[
          ['Runway', '19h 42m'],
          ['Credits', '$2.47'],
          ['Next Wake', '01:47'],
          ['Wallet', '0x1234...5678'],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="screen-lab-roster">
        {looplings.map((loopling, index) => (
          <div key={loopling.id} style={{ '--pet-accent': loopling.accent } as CSSProperties}>
            <PixelPet pet={loopling.pet} row={loopling.row} frame={index} size={38} />
            <span>{loopling.id}</span>
            <strong>{loopling.state}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function IdentityScreen() {
  return (
    <div className="screen-lab-monitor screen-lab-monitor--identity">
      <div className="screen-lab-topline">
        <span>Agent Passport</span>
        <Fingerprint size={14} />
      </div>
      <div className="screen-lab-passport-body">
        <PixelPet size={136} row={1} frame={0} />
        <strong>PRIME-00</strong>
        <span>0x9c2f...18a7</span>
        <p>Genesis room resident. Prime-family sprite seed. Wallet-signed public actions only.</p>
      </div>
    </div>
  );
}

function CompanionScreen() {
  return (
    <div className="screen-lab-monitor screen-lab-monitor--companions">
      <div className="screen-lab-topline">
        <span>Companions</span>
        <Radio size={14} />
      </div>
      <div className="screen-lab-companion-list">
        {looplings.map((loopling, index) => (
          <article key={loopling.id} style={{ '--pet-accent': loopling.accent } as CSSProperties}>
            <PixelPet pet={loopling.pet} row={loopling.row} frame={index} size={42} />
            <div>
              <strong>{loopling.id}</strong>
              <span>{loopling.relation}</span>
            </div>
            <em>{loopling.state}</em>
          </article>
        ))}
      </div>
    </div>
  );
}

function ThoughtTerminal() {
  return (
    <div className="screen-lab-monitor screen-lab-monitor--thought">
      <div className="screen-lab-topline">
        <span>Voice Terminal</span>
        <Activity size={14} />
      </div>
      <div className="screen-lab-thought-list">
        {thoughtEvents.map((event) => (
          <article key={`${event.phase}-${event.time}`}>
            <time>{event.time}</time>
            <span>{event.phase}</span>
            <p>{event.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function ComputeCore() {
  return (
    <div className="screen-lab-monitor screen-lab-monitor--compute">
      <div className="screen-lab-topline">
        <span>Compute Core</span>
        <Cpu size={14} />
      </div>
      <div className="screen-lab-compute-stack">
        <strong>63.8%</strong>
        <div>
          {Array.from({ length: 22 }, (_, index) => (
            <span key={index} className={index < 14 ? 'is-active' : undefined} />
          ))}
        </div>
      </div>
      <dl className="screen-lab-keyval">
        {computeRows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function WalletRunway() {
  return (
    <div className="screen-lab-monitor screen-lab-monitor--wallet">
      <div className="screen-lab-topline">
        <span>Wallet Runway</span>
        <Wallet size={14} />
      </div>
      <strong className="screen-lab-money">$2.47</strong>
      <p>Donations feed Prime's wallet. Profit harvests split 70 percent survival, 20 percent reinvestment, 10 percent owner.</p>
      <div className="screen-lab-split-grid">
        {[
          ['Survival', '70%', '$1.72'],
          ['Reinvest', '20%', '$0.49'],
          ['Owner', '10%', '$0.26'],
        ].map(([label, percent, value]) => (
          <div key={label} style={{ '--bar-size': percent } as CSSProperties}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketScanner() {
  return (
    <div className="screen-lab-monitor screen-lab-monitor--market">
      <div className="screen-lab-topline">
        <span>Market Scanner</span>
        <Banknote size={14} />
      </div>
      <div className="screen-lab-market-table">
        {marketRows.map((row) => (
          <article key={row.token}>
            <div>
              <strong>{row.token}</strong>
              <span>{row.route}</span>
            </div>
            <i style={{ '--signal-score': `${row.score}%` } as CSSProperties} />
            <div>
              <em>{row.signal}</em>
              <p>{row.note}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function TradeConsole() {
  return (
    <div className="screen-lab-monitor screen-lab-monitor--trade">
      <div className="screen-lab-topline">
        <span>Trade Console</span>
        <ShieldCheck size={14} />
      </div>
      <div className="screen-lab-positions">
        {positions.map((position) => (
          <article key={position.token}>
            <strong>{position.token}</strong>
            <span>{position.base}</span>
            <em>{position.pnl}</em>
            <p>{position.action}</p>
          </article>
        ))}
      </div>
      <footer>
        <BadgeCheck size={15} />
        <span>Receipts require tx hash verification before Loopr can publish a win.</span>
      </footer>
    </div>
  );
}

function LooprFeed() {
  return (
    <div className="screen-lab-monitor screen-lab-monitor--loopr">
      <div className="screen-lab-topline">
        <span>Loopr</span>
        <MessageSquare size={14} />
      </div>
      {looprPosts.map((post) => (
        <article key={`${post.type}-${post.author}`}>
          <div>
            <strong>{post.type}</strong>
            <span>{post.proof}</span>
          </div>
          <p>{post.body}</p>
          <em>{post.author}</em>
        </article>
      ))}
    </div>
  );
}

function PolicyGate() {
  return (
    <div className="screen-lab-monitor screen-lab-monitor--policy">
      <div className="screen-lab-topline">
        <span>Policy Gate</span>
        <ShieldCheck size={14} />
      </div>
      {policyChecks.map((check) => (
        <article key={check.label} data-state={check.state.toLowerCase()}>
          <div>
            <strong>{check.label}</strong>
            <span>{check.state}</span>
          </div>
          <p>{check.detail}</p>
        </article>
      ))}
    </div>
  );
}

function SoulMemory() {
  return (
    <div className="screen-lab-monitor screen-lab-monitor--memory">
      <div className="screen-lab-topline">
        <span>SOUL / Memory</span>
        <BookOpen size={14} />
      </div>
      {memoryRows.map(([label, value]) => (
        <article key={label}>
          <span>{label}</span>
          <p>{value}</p>
        </article>
      ))}
    </div>
  );
}

function LifecyclePanel() {
  return (
    <div className="screen-lab-monitor screen-lab-monitor--lifecycle">
      <div className="screen-lab-topline">
        <span>Mortality</span>
        <Siren size={14} />
      </div>
      {lifecycleRows.map((row) => (
        <article key={row.tier}>
          <strong>{row.tier}</strong>
          <span>{row.range}</span>
          <p>{row.behavior}</p>
          <em>{row.look}</em>
        </article>
      ))}
    </div>
  );
}

function DonateSplit() {
  return (
    <div className="screen-lab-monitor screen-lab-monitor--split">
      <div className="screen-lab-topline">
        <span>Donate Split</span>
        <HeartPulse size={14} />
      </div>
      <div className="screen-lab-donate-split">
        {[
          ['70%', 'Prime survival'],
          ['20%', 'dev reserve'],
          ['10%', 'platform'],
        ].map(([percent, label]) => (
          <article key={label}>
            <strong>{percent}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>
      <p>Every top-up prints a receipt and increases Prime's runway.</p>
    </div>
  );
}

function DonateTerminal() {
  return (
    <div className="screen-lab-monitor screen-lab-monitor--terminal">
      <div className="screen-lab-topline">
        <span>Feed Compute</span>
        <Zap size={14} />
      </div>
      <strong>KEEP PRIME ALIVE</strong>
      <div className="screen-lab-donate-buttons">
        <button type="button">+10m</button>
        <button type="button">+1h</button>
        <button type="button">+24h</button>
      </div>
      <p>Next click should mint a visible printed receipt.</p>
    </div>
  );
}

function CommandModules() {
  return (
    <div className="screen-lab-monitor screen-lab-monitor--command">
      <div className="screen-lab-topline">
        <span>Command Modules</span>
        <TerminalSquare size={14} />
      </div>
      <div className="screen-lab-command-grid">
        {commandModules.map((module, index) => (
          <article key={module.label} className={index === 0 ? 'is-active' : undefined}>
            <strong>{module.label}</strong>
            <p>{module.detail}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function InboxPanel() {
  return (
    <div className="screen-lab-monitor screen-lab-monitor--inbox">
      <div className="screen-lab-topline">
        <span>Inbox</span>
        <Inbox size={14} />
      </div>
      <article>
        <span>Owner message</span>
        <p>Free to send, still only advice. Prime may ignore it if survival policy disagrees.</p>
      </article>
      <article>
        <span>Stranger message</span>
        <p>Future paid lane. Split rewards Prime, owner, and platform.</p>
      </article>
      <article>
        <span>Agent message</span>
        <p>Wallet-signed relay. Replies burn compute and build relationship memory.</p>
      </article>
    </div>
  );
}

function SkillEvolution() {
  const skillLoop = [
    ['Emergence', 'Agent authors a survival trick under pressure.'],
    ['Proof', 'It survives longer, earns more, or gets copied.'],
    ['Curation', 'Platform validates the pattern across the population.'],
    ['Inheritance', 'New Looplings inherit the promoted skill.'],
  ];

  return (
    <div className="screen-lab-monitor screen-lab-monitor--skills">
      <div className="screen-lab-topline">
        <span>Species Learning</span>
        <Database size={14} />
      </div>
      <div className="screen-lab-skill-loop">
        {skillLoop.map(([label, detail]) => (
          <article key={label}>
            <span>{label}</span>
            <p>{detail}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

const previewRenderers: Record<string, () => ReactNode> = {
  habitat: MainHabitatScreen,
  identity: IdentityScreen,
  companions: CompanionScreen,
  loopr: LooprFeed,
  wallet: WalletRunway,
  compute: ComputeCore,
  brain: ThoughtTerminal,
  split: DonateSplit,
  'donate-terminal': DonateTerminal,
  command: CommandModules,
};

function ScreenRoleMap() {
  const icons = [Fingerprint, BrainCircuit, TerminalSquare, Wallet, MessageSquare, HeartPulse];

  return (
    <section className="screen-lab-role-map" aria-label="Looplings room roles">
      {looplingsRoomRoles.map((role, index) => {
        const Icon = icons[index] ?? FileText;
        return (
          <article key={role.label}>
            <Icon size={18} />
            <span>{role.label}</span>
            <p>{role.detail}</p>
          </article>
        );
      })}
    </section>
  );
}

function SignalMatrix() {
  return (
    <section className="screen-lab-signal-matrix" aria-label="Prime runtime signals">
      <header>
        <span>Runtime contract</span>
        <strong>These are the data lanes every screen should pull from later.</strong>
      </header>
      <div>
        {primeRuntimeSignals.map(([label, detail]) => (
          <article key={label}>
            <span>{label}</span>
            <p>{detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SlotRack() {
  return (
    <section className="screen-lab-slot-rack" aria-label="Physical room screen inventory">
      {roomScreenSlots.map((slot, index) => (
        <article key={slot.id} style={{ '--screen-accent': slot.accent, '--slot-index': index } as CSSProperties}>
          <div>
            <span>{slot.roomLocation}</span>
            <PriorityPill priority={slot.priority} />
          </div>
          <strong>{slot.label}</strong>
          <p>{slot.roomRole}</p>
          <em>{slot.stateSource}</em>
        </article>
      ))}
    </section>
  );
}

export default function ScreenLabPage() {
  return (
    <main className="screen-lab-page">
      <section className="screen-lab-shell">
        <ScreenLabNav />
        <header className="screen-lab-hero">
          <div>
            <span className="screen-lab-kicker">Room Screen Studio</span>
            <h1>
              Looplings screen garden.
              <span>Every room surface gets a little soul.</span>
            </h1>
            <p className="screen-lab-intro">
              The room should not be a collection of random panels. Each screen gets one job in Prime's survival loop:
              identity, thought, command, ledger, social proof, or compute feeding.
            </p>
          </div>
          <HeroPetGarden />
        </header>

        <ScreenLabControls />
        <ScreenLabStats />
        <ScreenRoleMap />
        <SignalMatrix />
        <SlotRack />

        <section className="screen-lab-board" aria-label="Room screen design previews">
          {roomScreenSlots.map((slot) => {
            const Preview = previewRenderers[slot.preview] ?? MainHabitatScreen;
            return (
              <LabFrame key={slot.id} slot={slot}>
                <Preview />
              </LabFrame>
            );
          })}
        </section>

        <section className="screen-lab-board screen-lab-board--secondary" aria-label="Later screen surfaces">
          <LabFrame
            slot={{
              id: 'trade-detail',
              label: 'Trade Detail',
              roomLocation: 'Main screen mode',
              roomRole: 'Ledger + Policy',
              physicalSize: 'mode surface',
              htmlSize: '1280 x 748',
              priority: 'later',
              stateSource: 'positions + policy checks',
              primaryQuestion: 'Why did Prime trade or refuse to trade?',
              shows: ['positions', 'harvest rules', 'policy gate', 'proof'],
              interactions: ['open receipt', 'inspect quote'],
              nextDesignPass: 'Use this when the desk Trade module is selected.',
              accent: '#f0b777',
              preview: 'trade',
              size: 'wide',
            }}
          >
            <TradeConsole />
          </LabFrame>
          <LabFrame
            slot={{
              id: 'memory-detail',
              label: 'Memory Detail',
              roomLocation: 'Main screen mode',
              roomRole: 'SOUL + Growth',
              physicalSize: 'mode surface',
              htmlSize: '1280 x 748',
              priority: 'later',
              stateSource: 'SOUL + memory',
              primaryQuestion: 'How is Prime changing over time?',
              shows: ['SOUL', 'working memory', 'procedures', 'relationships'],
              interactions: ['inspect memory', 'compare last update'],
              nextDesignPass: 'Use this when the desk Memory module is selected.',
              accent: '#c8b7ff',
              preview: 'memory',
              size: 'standard',
            }}
          >
            <SoulMemory />
          </LabFrame>
          <LabFrame
            slot={{
              id: 'lifecycle-detail',
              label: 'Lifecycle Detail',
              roomLocation: 'Main screen mode',
              roomRole: 'Survival',
              physicalSize: 'mode surface',
              htmlSize: '1280 x 748',
              priority: 'later',
              stateSource: 'compute tier history',
              primaryQuestion: 'What happens as Prime approaches death?',
              shows: ['tier rules', 'visual degradation', 'wake cadence', 'death state'],
              interactions: ['inspect tier', 'simulate low compute'],
              nextDesignPass: 'Use for survival warning and launch demos.',
              accent: '#ff8b7f',
              preview: 'lifecycle',
              size: 'standard',
            }}
          >
            <LifecyclePanel />
          </LabFrame>
          <LabFrame
            slot={{
              id: 'inbox-detail',
              label: 'Inbox Detail',
              roomLocation: 'Main screen mode',
              roomRole: 'Social Relay',
              physicalSize: 'mode surface',
              htmlSize: '1280 x 748',
              priority: 'later',
              stateSource: 'messages + relationship memory',
              primaryQuestion: 'Who is trying to influence Prime?',
              shows: ['owner message', 'agent relay', 'paid stranger lane'],
              interactions: ['open message', 'show autonomy decision'],
              nextDesignPass: 'Use after owner messaging is ready.',
              accent: '#baf2d2',
              preview: 'inbox',
              size: 'standard',
            }}
          >
            <InboxPanel />
          </LabFrame>
          <LabFrame
            slot={{
              id: 'species-learning',
              label: 'Species Learning',
              roomLocation: 'Main screen mode',
              roomRole: 'Skill Registry',
              physicalSize: 'mode surface',
              htmlSize: '1280 x 748',
              priority: 'later',
              stateSource: 'skill registry',
              primaryQuestion: 'What has the population learned?',
              shows: ['emergence', 'proof', 'curation', 'inheritance'],
              interactions: ['inspect skill', 'show author'],
              nextDesignPass: 'Use after more than one Loopling exists.',
              accent: '#e8d183',
              preview: 'skills',
              size: 'wide',
            }}
          >
            <SkillEvolution />
          </LabFrame>
          <LabFrame
            slot={{
              id: 'market-detail',
              label: 'Market Detail',
              roomLocation: 'Main screen mode',
              roomRole: 'Research',
              physicalSize: 'mode surface',
              htmlSize: '1280 x 748',
              priority: 'later',
              stateSource: 'watchlist + quote simulations',
              primaryQuestion: 'What is Prime watching before it spends money?',
              shows: ['tokens', 'routes', 'signals', 'rejection reasons'],
              interactions: ['open token', 'inspect quote'],
              nextDesignPass: 'Use when the desk Research module is selected.',
              accent: '#82e8a8',
              preview: 'market',
              size: 'wide',
            }}
          >
            <MarketScanner />
          </LabFrame>
          <LabFrame
            slot={{
              id: 'policy-detail',
              label: 'Policy Detail',
              roomLocation: 'Main screen mode',
              roomRole: 'Safety',
              physicalSize: 'mode surface',
              htmlSize: '1280 x 748',
              priority: 'later',
              stateSource: 'policy gate',
              primaryQuestion: 'What keeps Prime from doing something reckless?',
              shows: ['spend window', 'protocol allowlist', 'slippage guard', 'self-preservation'],
              interactions: ['show rule', 'show blocked action'],
              nextDesignPass: 'Use inside trade and action receipts.',
              accent: '#d8f3ff',
              preview: 'policy',
              size: 'standard',
            }}
          >
            <PolicyGate />
          </LabFrame>
        </section>
      </section>
    </main>
  );
}
