import { WalletOverviewView } from '@stablepay/client-ui';
import { useGlobalStore } from '@stablepay/common/stores/global';
import { useNavigate } from '@tanstack/react-router';
import React from 'react';

export const WalletOverviewImpl: React.FC = () => {
  const totalAssetsUsd = useGlobalStore((state) => state.totalAssetsUsd);
  const navigate = useNavigate();

  const handleScan = () => {
    navigate({ to: '/scan' });
  };

  const handleSend = () => {
    navigate({ to: '/send' });
  };

  return (
    <WalletOverviewView
      balance={Number.isFinite(totalAssetsUsd) ? totalAssetsUsd : 0}
      onScan={handleScan}
      onSend={handleSend}
    />
  );
};
