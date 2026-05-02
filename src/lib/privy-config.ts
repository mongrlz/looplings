import type { PrivyClientConfig } from '@privy-io/react-auth';

/**
 * Privy provider configuration.
 *
 * Get an App ID from https://dashboard.privy.io/ and put it in `.env`:
 *   VITE_PRIVY_APP_ID=your_app_id_here
 *
 * The provider is wrapped around the entire React tree in App.tsx so that
 * Privy modals (login, wallet management) render as overlays above the
 * 3D canvas without any layout interference.
 */
export const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID ?? '';

export const privyConfig: PrivyClientConfig = {
  loginMethods: ['email', 'twitter', 'wallet'],
  appearance: {
    theme: 'dark',
    accentColor: '#FFFDF2',
  },
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
  },
};
