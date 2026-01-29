import { SettingsView } from '@stablepay/client-ui';
import { useGlobalStore } from '@stablepay/common/stores/global';
import { useWalletStore } from '@stablepay/common/stores/wallet';
import React from 'react';

export const SettingsImpl: React.FC = () => {
  const resetWallet = useWalletStore((state) => state.reset);
  const resetAssets = useGlobalStore((state) => state.resetAssets);

  const handleResetAll = () => {
    // Reset Zustand state
    resetWallet();
    resetAssets();

    useWalletStore.persist.clearStorage();
    useGlobalStore.persist.clearStorage();

    localStorage.removeItem('stablepay-wallet-storage');
    localStorage.removeItem('stablepay-global-storage');

    // Clear localStorage
    localStorage.clear();
    sessionStorage.clear();

    // Reload to ensure clean state
    window.location.reload();
  };

  return <SettingsView onResetAll={handleResetAll} />;
};
