import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { type StableCoinInfo } from '../config/stablepay';

export interface StableAssetBalance {
  token: StableCoinInfo;
  amount: number;
}

export interface GlobalStoreState {
  stableAssetBalances: StableAssetBalance[];
  totalAssetsUsd: number;
  lastFetchedAt: number | null;
  setStableAssetBalances: (balances: StableAssetBalance[]) => void;
  setLastFetchedAt: (timestamp: number | null) => void;
  resetAssets: () => void;
}

const fxRateToUsd: Record<string, number> = {
  USD: 1,
  EUR: 1 / 0.92,
  JPY: 1 / 150,
};

const computeTotalUsd = (balances: StableAssetBalance[]) =>
  balances.reduce((sum, balance) => {
    const rate = fxRateToUsd[balance.token.currency] ?? 1;
    const amount = Number.isFinite(balance.amount) ? balance.amount : 0;
    return sum + amount * rate;
  }, 0);

export const useGlobalStore = create<GlobalStoreState>()(
  persist(
    (set) => ({
      stableAssetBalances: [],
      totalAssetsUsd: 0,
      lastFetchedAt: null,
      setStableAssetBalances: (balances) =>
        set({
          stableAssetBalances: balances,
          totalAssetsUsd: computeTotalUsd(balances),
        }),
      setLastFetchedAt: (timestamp) => set({ lastFetchedAt: timestamp }),
      resetAssets: () =>
        set({
          stableAssetBalances: [],
          totalAssetsUsd: 0,
          lastFetchedAt: null,
        }),
    }),
    {
      name: 'stablepay-global-storage',
      partialize: (state) => ({
        stableAssetBalances: state.stableAssetBalances,
        totalAssetsUsd: state.totalAssetsUsd,
        lastFetchedAt: state.lastFetchedAt,
      }),
    }
  )
);
