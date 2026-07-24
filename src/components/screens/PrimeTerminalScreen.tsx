import { useEffect, useMemo, useState } from 'react';
import { SolanaProvider } from '@solana/react-hooks';
import {
  timeAgo,
  recordPrimeSupport,
  useLooplingsState,
  type LooplingsState,
  type LooplingsTool,
} from '@/lib/looplings-state';
import { SUPPORT_AMOUNTS, usePrimeWallet } from '@/lib/prime-wallet';
import { solanaClient } from '@/lib/solana-client';

type TerminalView = 'habitat' | 'trace' | 'runway' | 'wallet' | 'system';
type PrimeWalletState = ReturnType<typeof usePrimeWallet>;

const TERMINAL_VIEWS: Array<{
  id: TerminalView;
  key: string;
  label: string;
}> = [
  { id: 'habitat', key: '1', label: 'Habitat' },
  { id: 'trace', key: '2', label: 'Trace' },
  { id: 'runway', key: '3', label: 'Runway' },
  { id: 'wallet', key: '4', label: 'Wallet' },
  { id: 'system', key: '5', label: 'System' },
];

const PRIME_PREVIEWS: Record<LooplingsTool, string> = {
  research: '/pets/prime-test/previews/thinking.gif',
  trade: '/pets/prime-test/previews/trading.gif',
  post: '/pets/prime-test/previews/posting.gif',
  memory: '/pets/prime-test/previews/receiving.gif',
  media: '/pets/prime-test/previews/acting.gif',
};

function primePreview(state: LooplingsState): string {
  if (state.compute.tier === 'dead') return '/pets/prime-test/previews/dead.gif';
  if (state.compute.tier === 'critical') return '/pets/prime-test/previews/critical.gif';
  if (state.compute.tier === 'low_compute') {
    return '/pets/prime-test/previews/low_compute.gif';
  }
  return PRIME_PREVIEWS[state.activeTool];
}

function Sparkline({ values }: { values: number[] }) {
  const points = useMemo(
    () =>
      values
        .map((value, index) => {
          const x = (index / Math.max(1, values.length - 1)) * 100;
          const y = 100 - value * 100;
          return `${x},${y}`;
        })
        .join(' '),
    [values],
  );

  return (
    <svg className="prime-terminal-sparkline" viewBox="0 0 100 100" preserveAspectRatio="none">
      <line x1="0" y1="25" x2="100" y2="25" />
      <line x1="0" y1="50" x2="100" y2="50" />
      <line x1="0" y1="75" x2="100" y2="75" />
      <polyline points={points} />
    </svg>
  );
}

function shortAddress(address: string | null, edge = 5): string {
  if (!address) return '—';
  if (address.length <= edge * 2 + 3) return address;
  return `${address.slice(0, edge)}…${address.slice(-edge)}`;
}

function HabitatView({ state }: { state: LooplingsState }) {
  return (
    <section className="prime-terminal-view prime-terminal-habitat" aria-label="Prime habitat">
      <div className="prime-terminal-stage">
        <img
          className="prime-terminal-landscape"
          src="/assets/lab/looplings-habitat-bg-transparent-v2.png"
          alt=""
          aria-hidden="true"
        />
        <div className="prime-terminal-stage-grid" aria-hidden="true" />
        <div className="prime-terminal-prime">
          <div className="prime-terminal-thought">
            <span>private thought / {state.mood}</span>
            <p>{state.thought.text}</p>
          </div>
          <img src={primePreview(state)} alt="Prime, the first Loopling" />
          <strong>{state.identity.name}</strong>
        </div>
        <div className="prime-terminal-stage-index">
          <span>L01</span>
          <b>{state.loopmark.seed}</b>
        </div>
      </div>

      <aside className="prime-terminal-now">
        <span className="prime-terminal-eyebrow">Current loop</span>
        <h2>{state.currentTask}</h2>
        <div className="prime-terminal-progress" aria-label={`${state.taskProgressPct}% complete`}>
          <i style={{ width: `${state.taskProgressPct}%` }} />
        </div>
        <dl className="prime-terminal-now-data">
          <div>
            <dt>tool</dt>
            <dd>{state.activeTool}</dd>
          </div>
          <div>
            <dt>model</dt>
            <dd>{state.model.label}</dd>
          </div>
          <div>
            <dt>confidence</dt>
            <dd>{state.model.confidencePct}%</dd>
          </div>
        </dl>
        <div className="prime-terminal-next">
          <span>Next queued action</span>
          <strong>{state.nextPlan.label}</strong>
          <small>{state.nextPlan.tool} module</small>
        </div>
      </aside>
    </section>
  );
}

function TraceView({ state }: { state: LooplingsState }) {
  const latest = state.recentActivity[0];

  return (
    <section className="prime-terminal-view prime-terminal-trace" aria-label="Prime activity trace">
      <div className="prime-terminal-trace-head">
        <div>
          <span className="prime-terminal-eyebrow">Decision trace</span>
          <h2>What Prime did, in order.</h2>
        </div>
        <span className="prime-terminal-sequence">turn {state.tickIndex.toString().padStart(4, '0')}</span>
      </div>

      <div className="prime-terminal-trace-grid">
        <ol className="prime-terminal-events">
          {state.recentActivity.map((entry, index) => (
            <li key={entry.id} className={index === 0 ? 'is-current' : undefined}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{entry.label.replaceAll('_', ' ')}</strong>
                <small>
                  {entry.tool} · {timeAgo(entry.addedAtTick, state.tickIndex)}
                </small>
              </div>
              <b className={entry.deltaCents >= 0 ? 'is-positive' : 'is-negative'}>
                {entry.amountLabel ??
                  `${entry.deltaCents >= 0 ? '+' : '−'}$${Math.abs(entry.deltaCents / 100).toFixed(2)}`}
              </b>
            </li>
          ))}
        </ol>

        <article className="prime-terminal-receipt">
          <span className="prime-terminal-eyebrow">Latest receipt</span>
          <h3>{latest?.label.replaceAll('_', ' ') ?? 'waiting for first action'}</h3>
          <p>{state.thought.text}</p>
          <dl>
            <div>
              <dt>result</dt>
              <dd>{latest?.status ?? 'queued'}</dd>
            </div>
            <div>
              <dt>compute delta</dt>
              <dd>{latest ? `${latest.deltaCents >= 0 ? '+' : '−'}$${Math.abs(latest.deltaCents / 100).toFixed(2)}` : '—'}</dd>
            </div>
            <div>
              <dt>proof</dt>
              <dd>local preview only</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}

function RunwayView({ state }: { state: LooplingsState }) {
  return (
    <section className="prime-terminal-view prime-terminal-runway" aria-label="Prime compute runway">
      <div className="prime-terminal-runway-hero">
        <span className="prime-terminal-eyebrow">Compute runway</span>
        <strong>{state.compute.runwayLabel}</strong>
        <small>{state.compute.creditsUsd} available · {state.compute.tier.replace('_', ' ')}</small>
        <Sparkline values={state.sparkline} />
      </div>

      <div className="prime-terminal-runway-side">
        <div className="prime-terminal-runway-copy">
          <span className="prime-terminal-eyebrow">Survival policy</span>
          <h2>Stay readable. Spend slowly.</h2>
          <p>{state.moodDetail}</p>
        </div>
        <div className="prime-terminal-ledger">
          <header>
            <span>Compute ledger</span>
            <small>preview values</small>
          </header>
          {state.ledger.map((entry) => (
            <div key={`${entry.reason}-${entry.ago}`}>
              <strong className={entry.delta >= 0 ? 'is-positive' : 'is-negative'}>
                {entry.amount}
              </strong>
              <span>{entry.reason}</span>
              <small>{entry.ago}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WalletView({ wallet }: { wallet: PrimeWalletState }) {
  const configured = Boolean(wallet.primeAddress);
  const canSend = configured && wallet.connected && wallet.status !== 'signing';
  const statusCopy: Record<PrimeWalletState['status'], string> = {
    idle: wallet.connected ? 'Ready for user approval' : 'Connect a wallet to continue',
    signing: 'Approve the transaction in your wallet',
    confirming: 'Submitted · waiting for confirmation',
    confirmed: 'Confirmed on Solana',
    failed: 'Transaction failed',
  };

  return (
    <section className="prime-terminal-view prime-terminal-wallet" aria-label="Prime wallet">
      <div className="prime-terminal-wallet-balance">
        <span className="prime-terminal-eyebrow">Prime public wallet</span>
        <strong>
          {configured
            ? wallet.balanceFetching
              ? 'reading…'
              : wallet.balanceLabel
            : 'not configured'}
        </strong>
        <p>{configured ? shortAddress(wallet.primeAddress, 7) : 'Add the public recipient address in .env'}</p>
        <div className="prime-terminal-wallet-network">
          <i aria-hidden="true" className={configured && !wallet.balanceError ? 'is-live' : undefined} />
          <span>{wallet.cluster}</span>
          <small>{configured ? 'public RPC read' : 'safe lock'}</small>
        </div>
        {wallet.explorerAddressUrl ? (
          <a href={wallet.explorerAddressUrl} target="_blank" rel="noreferrer">
            Inspect Prime on Explorer ↗
          </a>
        ) : null}
      </div>

      <div className="prime-terminal-wallet-actions">
        <header>
          <div>
            <span className="prime-terminal-eyebrow">Support Prime</span>
            <h2>One direct, readable transfer.</h2>
          </div>
          <span className={`prime-terminal-chain-status is-${wallet.status}`}>{statusCopy[wallet.status]}</span>
        </header>

        {!wallet.isReady ? (
          <p className="prime-terminal-wallet-message">Discovering Wallet Standard apps…</p>
        ) : wallet.connected ? (
          <div className="prime-terminal-connected">
            <div>
              <span>Connected via {wallet.connectedWalletName ?? 'Solana wallet'}</span>
              <strong>{shortAddress(wallet.connectedAddress, 7)}</strong>
            </div>
            <button type="button" onClick={() => void wallet.disconnect()}>
              Disconnect
            </button>
          </div>
        ) : wallet.connectors.length ? (
          <div className="prime-terminal-connectors" aria-label="Available Solana wallets">
            {wallet.connectors.slice(0, 4).map((connector) => (
              <button
                key={connector.id}
                type="button"
                disabled={wallet.connecting}
                onClick={() => void wallet.connect(connector.id)}
              >
                {connector.icon ? <img src={connector.icon} alt="" aria-hidden="true" /> : <i aria-hidden="true" />}
                <span>{wallet.connecting ? 'Connecting…' : `Connect ${connector.name}`}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="prime-terminal-wallet-message">
            No Wallet Standard app found. Install Phantom, Solflare, or Backpack.
          </p>
        )}

        <div className="prime-terminal-support-amounts" aria-label="Choose support amount">
          {SUPPORT_AMOUNTS.map((amount) => (
            <button
              key={amount.label}
              type="button"
              disabled={!canSend}
              onClick={() => void wallet.sendSupport(amount.lamports)}
            >
              <span>Send</span>
              <strong>{amount.label}</strong>
            </button>
          ))}
        </div>

        {wallet.signature ? (
          <div className="prime-terminal-receipt-strip">
            <div>
              <span>Transaction receipt</span>
              <strong>{shortAddress(wallet.signature, 9)}</strong>
            </div>
            {wallet.explorerTransactionUrl ? (
              <a href={wallet.explorerTransactionUrl} target="_blank" rel="noreferrer">
                Open Explorer ↗
              </a>
            ) : null}
          </div>
        ) : (
          <p className="prime-terminal-wallet-policy">
            Direct SOL transfer · 100% to Prime · no split contract claimed
          </p>
        )}

        {wallet.connectionError || wallet.balanceError || wallet.transferError ? (
          <p className="prime-terminal-wallet-error" role="alert">
            {wallet.connectionError ?? wallet.balanceError ?? wallet.transferError}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function SystemView({
  state,
  wallet,
}: {
  state: LooplingsState;
  wallet: PrimeWalletState;
}) {
  return (
    <section className="prime-terminal-view prime-terminal-system" aria-label="Prime system">
      <div className="prime-terminal-system-title">
        <span className="prime-terminal-eyebrow">System identity</span>
        <h2>{state.loopmark.id}</h2>
        <p>{state.loopmark.promise}</p>
      </div>

      <div className="prime-terminal-system-grid">
        <dl>
          <div>
            <dt>agent</dt>
            <dd>{state.identity.name}</dd>
          </div>
          <div>
            <dt>lineage</dt>
            <dd>{state.loopmark.lineage}</dd>
          </div>
          <div>
            <dt>wallet</dt>
            <dd>{wallet.primeAddress ? shortAddress(wallet.primeAddress, 8) : 'not configured'}</dd>
          </div>
          <div>
            <dt>uptime</dt>
            <dd>{Math.floor(state.uptimeSeconds / 60)}m {state.uptimeSeconds % 60}s</dd>
          </div>
        </dl>
        <dl>
          <div>
            <dt>model</dt>
            <dd>{state.model.modelId}</dd>
          </div>
          <div>
            <dt>provider</dt>
            <dd>{state.model.provider}</dd>
          </div>
          <div>
            <dt>active capability</dt>
            <dd>{state.activeTool}</dd>
          </div>
          <div>
            <dt>network mode</dt>
            <dd>{wallet.cluster} / wallet standard</dd>
          </div>
          <div>
            <dt>RPC</dt>
            <dd>{wallet.balanceError ? 'read error' : wallet.primeAddress ? 'live reads' : 'waiting for address'}</dd>
          </div>
        </dl>
      </div>

      <div className="prime-terminal-command-line">
        <span aria-hidden="true">›</span>
        <code>prime.inspect --next {state.nextPlan.label}</code>
        <i aria-hidden="true" />
      </div>
    </section>
  );
}

function PrimeTerminalContent() {
  const state = useLooplingsState();
  const primeWallet = usePrimeWallet();
  const [view, setView] = useState<TerminalView>('habitat');

  useEffect(() => {
    if (
      primeWallet.status === 'confirmed' &&
      primeWallet.signature &&
      primeWallet.selectedSupportLamports
    ) {
      recordPrimeSupport(primeWallet.selectedSupportLamports, primeWallet.signature);
    }
  }, [
    primeWallet.selectedSupportLamports,
    primeWallet.signature,
    primeWallet.status,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      const direct = TERMINAL_VIEWS.find((item) => item.key === event.key);
      if (direct) {
        setView(direct.id);
        return;
      }

      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const index = TERMINAL_VIEWS.findIndex((item) => item.id === view);
      const offset = event.key === 'ArrowRight' ? 1 : -1;
      const next = (index + offset + TERMINAL_VIEWS.length) % TERMINAL_VIEWS.length;
      setView(TERMINAL_VIEWS[next].id);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [view]);

  return (
    <div className="prime-terminal-shell" data-view={view}>
      <header className="prime-terminal-header">
        <div className="prime-terminal-brand">
          <span aria-hidden="true">◉</span>
          <strong>LOOPLINGS</strong>
          <small>PRIME TERMINAL / 00</small>
        </div>
        <div className="prime-terminal-status">
          <i aria-hidden="true" />
          <span>{primeWallet.primeAddress ? 'Solana link' : 'Agent preview'}</span>
        </div>
      </header>

      <nav className="prime-terminal-nav" aria-label="Prime terminal screens">
        {TERMINAL_VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={view === item.id ? 'is-active' : undefined}
            aria-pressed={view === item.id}
            onClick={() => setView(item.id)}
          >
            <span>{item.key.padStart(2, '0')}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <main className="prime-terminal-content">
        {view === 'habitat' ? <HabitatView state={state} /> : null}
        {view === 'trace' ? <TraceView state={state} /> : null}
        {view === 'runway' ? <RunwayView state={state} /> : null}
        {view === 'wallet' ? <WalletView wallet={primeWallet} /> : null}
        {view === 'system' ? <SystemView state={state} wallet={primeWallet} /> : null}
      </main>

      <footer className="prime-terminal-footer">
        <span>← → or 1—5 to navigate</span>
        <strong>
          AGENT PREVIEW · WALLET {primeWallet.primeAddress ? 'LIVE' : 'LOCKED'}
        </strong>
        <span>{primeWallet.cluster} · {state.online ? 'link steady' : 'link offline'}</span>
      </footer>
    </div>
  );
}

export default function PrimeTerminalScreen() {
  return (
    <SolanaProvider
      client={solanaClient}
      walletPersistence={{ autoConnect: true, storage: window.localStorage }}
    >
      <PrimeTerminalContent />
    </SolanaProvider>
  );
}
