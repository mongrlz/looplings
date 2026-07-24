import {
  autoDiscover,
  createClient,
  toAddress,
  type SolanaClientConfig,
} from '@solana/client';

export type LooplingsSolanaCluster = 'devnet' | 'testnet' | 'mainnet-beta';

const CLUSTER_ENDPOINTS: Record<LooplingsSolanaCluster, string> = {
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
};

const requestedCluster = import.meta.env.VITE_SOLANA_CLUSTER?.trim();

export const SOLANA_CLUSTER: LooplingsSolanaCluster =
  requestedCluster === 'testnet' || requestedCluster === 'mainnet-beta'
    ? requestedCluster
    : 'devnet';

export const SOLANA_RPC_URL =
  import.meta.env.VITE_SOLANA_RPC_URL?.trim() || CLUSTER_ENDPOINTS[SOLANA_CLUSTER];

export const PRIME_SOLANA_WALLET_ADDRESS =
  import.meta.env.VITE_PRIME_SOLANA_WALLET_ADDRESS?.trim() || '';

export function getValidPrimeWalletAddress(): string | null {
  if (!PRIME_SOLANA_WALLET_ADDRESS) return null;

  try {
    return toAddress(PRIME_SOLANA_WALLET_ADDRESS).toString();
  } catch {
    return null;
  }
}

export function explorerAddressUrl(address: string): string {
  const cluster = SOLANA_CLUSTER === 'mainnet-beta' ? '' : `?cluster=${SOLANA_CLUSTER}`;
  return `https://explorer.solana.com/address/${address}${cluster}`;
}

export function explorerTransactionUrl(signature: string): string {
  const cluster = SOLANA_CLUSTER === 'mainnet-beta' ? '' : `?cluster=${SOLANA_CLUSTER}`;
  return `https://explorer.solana.com/tx/${signature}${cluster}`;
}

const clientConfig: SolanaClientConfig = {
  cluster: SOLANA_CLUSTER,
  endpoint: SOLANA_RPC_URL as SolanaClientConfig['endpoint'],
  walletConnectors: autoDiscover(),
};

export const solanaClient = createClient(clientConfig);
