import { type WalletConnectionStatus } from '@stablepay/common/stores/wallet';
import { type StoredWebAuthnKey } from '@stablepay/common/utils/passkey';
import { type Address } from 'viem';

export const hasWalletSession = (
  webAuthnKey?: StoredWebAuthnKey
): webAuthnKey is StoredWebAuthnKey => Boolean(webAuthnKey);

export const isWalletConnected = (status: WalletConnectionStatus) =>
  status === 'connected';

export const isWalletReady = (
  status: WalletConnectionStatus,
  webAuthnKey?: StoredWebAuthnKey
) => isWalletConnected(status) || hasWalletSession(webAuthnKey);

export const isSidebarActive = (
  status: WalletConnectionStatus,
  webAuthnKey: StoredWebAuthnKey | undefined,
  address: Address | undefined
) => isWalletReady(status, webAuthnKey) && Boolean(address);
