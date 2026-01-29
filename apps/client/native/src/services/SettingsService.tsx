import { SettingsView } from '@stablepay/client-ui';
import { useWalletStore } from '@stablepay/common/stores/wallet';
import { useNavigate } from '@tanstack/react-router';
import React from 'react';

export const SettingsImpl: React.FC = () => {
  const navigate = useNavigate();
  const resetWallet = useWalletStore((state) => state.reset);

  const handleResetAll = () => {
    // Reset Zustand state
    resetWallet();

    // Clear localStorage
    localStorage.clear();

    // Reload to ensure clean state
    window.location.reload();
  };

  return <SettingsView onResetAll={handleResetAll} />;
};
