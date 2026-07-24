import { useCallback, useMemo, useState } from 'react';
import {
  useBalance,
  useSolTransfer,
  useWaitForSignature,
  useWalletConnection,
} from '@solana/react-hooks';
import {
  explorerAddressUrl,
  explorerTransactionUrl,
  getValidPrimeWalletAddress,
  SOLANA_CLUSTER,
  SOLANA_RPC_URL,
} from '@/lib/solana-client';

export const SUPPORT_AMOUNTS = [
  { label: '0.01 SOL', lamports: 10_000_000n },
  { label: '0.05 SOL', lamports: 50_000_000n },
  { label: '0.10 SOL', lamports: 100_000_000n },
] as const;

function formatSol(lamports: bigint | null): string {
  if (lamports === null) return '—';

  const whole = lamports / 1_000_000_000n;
  const remainder = (lamports % 1_000_000_000n)
    .toString()
    .padStart(9, '0')
    .slice(0, 4)
    .replace(/0+$/, '');

  return remainder ? `${whole}.${remainder} SOL` : `${whole} SOL`;
}

function readableError(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return String(error);
}

export function usePrimeWallet() {
  const primeAddress = useMemo(() => getValidPrimeWalletAddress(), []);
  const [selectedSupportLamports, setSelectedSupportLamports] = useState<bigint | null>(null);
  const wallet = useWalletConnection();
  const balance = useBalance(primeAddress ?? undefined, { watch: true });
  const transfer = useSolTransfer();
  const signature = transfer.signature?.toString() ?? null;
  const confirmation = useWaitForSignature(signature ?? undefined, {
    commitment: 'confirmed',
    disabled: !signature,
    subscribe: true,
  });

  const sendSupport = useCallback(
    async (lamports: bigint) => {
      if (!primeAddress) {
        throw new Error('Prime wallet is not configured.');
      }
      if (!wallet.connected) {
        throw new Error('Connect a Solana wallet before supporting Prime.');
      }

      transfer.reset();
      setSelectedSupportLamports(lamports);
      return transfer.send(
        {
          amount: lamports,
          destination: primeAddress,
        },
        {
          commitment: 'confirmed',
          skipPreflight: false,
        },
      );
    },
    [primeAddress, transfer, wallet.connected],
  );

  const status =
    confirmation.waitStatus === 'success'
      ? 'confirmed'
      : confirmation.waitStatus === 'error'
        ? 'failed'
        : transfer.isSending
          ? 'signing'
          : signature
            ? 'confirming'
            : 'idle';

  return {
    balanceError: readableError(balance.error),
    balanceFetching: balance.fetching,
    balanceLabel: formatSol(balance.lamports),
    cluster: SOLANA_CLUSTER,
    confirmationStatus: confirmation.confirmationStatus,
    connected: wallet.connected,
    connectedAddress: wallet.wallet?.account.address.toString() ?? null,
    connectedWalletName: wallet.currentConnector?.name ?? null,
    connecting: wallet.connecting,
    connectionError: readableError(wallet.error),
    connectors: wallet.connectors,
    disconnect: wallet.disconnect,
    explorerAddressUrl: primeAddress ? explorerAddressUrl(primeAddress) : null,
    explorerTransactionUrl: signature ? explorerTransactionUrl(signature) : null,
    isReady: wallet.isReady,
    primeAddress,
    rpcUrl: SOLANA_RPC_URL,
    selectedSupportLamports,
    sendSupport,
    signature,
    status,
    transferError: readableError(transfer.error) ?? readableError(confirmation.waitError),
    connect: wallet.connect,
  };
}
