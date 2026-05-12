import { useEffect, useState } from 'react';

export interface JupiterPriceRow {
  mint: string;
  symbol: string;
  usdPrice: number | null;
  priceChange24h: number | null;
  blockId: number | null;
  source: 'jupiter' | 'fallback';
}

const WATCHLIST = [
  {
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    fallbackPrice: 96.49,
    fallbackChange: 1.12,
  },
  {
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    symbol: 'JUP',
    fallbackPrice: 0.2411,
    fallbackChange: -6.6,
  },
  {
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    symbol: 'BONK',
    fallbackPrice: 0.00000742,
    fallbackChange: -0.72,
  },
] as const;

const JUPITER_URL = 'https://lite-api.jup.ag/price/v3';

interface JupiterEntry {
  usdPrice?: number;
  priceChange24h?: number;
  blockId?: number;
}

function rowsFromFallback(): JupiterPriceRow[] {
  return WATCHLIST.map((token) => ({
    mint: token.mint,
    symbol: token.symbol,
    usdPrice: token.fallbackPrice,
    priceChange24h: token.fallbackChange,
    blockId: null,
    source: 'fallback',
  }));
}

export function useJupiterPrices(refreshMs = 15_000): {
  rows: JupiterPriceRow[];
  lastUpdatedMs: number | null;
  live: boolean;
} {
  const [rows, setRows] = useState<JupiterPriceRow[]>(rowsFromFallback);
  const [lastUpdatedMs, setLastUpdatedMs] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function pull() {
      try {
        const url = `${JUPITER_URL}?ids=${WATCHLIST.map((t) => t.mint).join(',')}`;
        const res = await fetch(url, { headers: { accept: 'application/json' } });
        if (!res.ok) return;
        const data = (await res.json()) as Record<string, JupiterEntry | undefined>;
        if (cancelled) return;
        setRows(
          WATCHLIST.map((token) => {
            const entry = data[token.mint];
            if (!entry || typeof entry.usdPrice !== 'number') {
              return {
                mint: token.mint,
                symbol: token.symbol,
                usdPrice: token.fallbackPrice,
                priceChange24h: token.fallbackChange,
                blockId: null,
                source: 'fallback',
              };
            }
            return {
              mint: token.mint,
              symbol: token.symbol,
              usdPrice: entry.usdPrice,
              priceChange24h:
                typeof entry.priceChange24h === 'number' ? entry.priceChange24h : null,
              blockId: typeof entry.blockId === 'number' ? entry.blockId : null,
              source: 'jupiter',
            };
          }),
        );
        setLastUpdatedMs(Date.now());
      } catch {
        // network/cors failure — keep last good rows
      }
    }

    pull();
    const id = window.setInterval(pull, refreshMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [refreshMs]);

  const live = rows.some((row) => row.source === 'jupiter');
  return { rows, lastUpdatedMs, live };
}

export function formatJupiterPrice(usd: number | null): string {
  if (usd === null) return '—';
  if (usd >= 100) return `$${usd.toFixed(2)}`;
  if (usd >= 1) return `$${usd.toFixed(3)}`;
  if (usd >= 0.01) return `$${usd.toFixed(4)}`;
  if (usd >= 0.0001) return `$${usd.toFixed(6)}`;
  return `$${usd.toFixed(8)}`;
}

export function formatJupiterChange(pct: number | null): string {
  if (pct === null) return '—';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

export function quoteAgeLabel(lastUpdatedMs: number | null): string {
  if (lastUpdatedMs === null) return 'pending';
  const seconds = Math.max(1, Math.round((Date.now() - lastUpdatedMs) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  return `${mins}m ago`;
}
