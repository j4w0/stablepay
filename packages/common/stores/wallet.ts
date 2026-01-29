import { type CreateKernelAccountReturnType } from '@zerodev/sdk';
import type { Address } from 'viem';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoredWebAuthnKey } from '../utils/passkey';

export type WalletConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'error';
export type WalletKind = 'passkey' | 'external';

export type WalletObject = CreateKernelAccountReturnType;

export interface WalletStoreState {
  status: WalletConnectionStatus;
  wallet?: WalletObject;
  webAuthnKey?: StoredWebAuthnKey;
  address?: Address;
  error?: string;

  setStatus: (status: WalletConnectionStatus) => void;
  setWallet: (wallet: WalletObject | undefined) => void;
  setAddress: (address: Address | undefined) => void;
  setWebAuthnKey: (webAuthnKey: StoredWebAuthnKey | undefined) => void;
  setError: (error: string | undefined) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletStoreState>()(
  persist(
    (set) => ({
      status: 'idle',
      wallet: undefined,
      error: undefined,

      setStatus: (status) => set({ status }),
      setWallet: (wallet) => set({ wallet }),
      setAddress: (address) => set({ address }),
      setWebAuthnKey: (webAuthnKey) => set({ webAuthnKey }),
      setError: (error) => set({ error }),
      reset: () =>
        set({
          status: 'idle',
          webAuthnKey: undefined,
          address: undefined,
          error: undefined,
        }),
    }),
    {
      name: 'stablepay-wallet-storage',
      partialize: (state) => ({
        webAuthnKey: state.webAuthnKey,
        address: state.address,
      }),
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return { webAuthnKey: undefined, address: undefined };
        }

        const { webAuthnKey, address } =
          persistedState as Partial<WalletStoreState>;

        return {
          webAuthnKey: webAuthnKey ?? undefined,
          address: address ?? undefined,
        };
      },
    }
  )
);
