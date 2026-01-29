import { WalletOverviewView } from '@stablepay/client-ui';
import React, { useState } from 'react';

export const WalletOverviewImpl: React.FC = () => {
  // Mockup data for the first view
  // In a real app, this would come from a store or API hook
  const [balance] = useState(1234.56);

  const handleScan = () => {
    console.log('Scan action triggered');
    // TODO: Implement scan logic
  };

  const handlePresentQr = () => {
    console.log('Present QR action triggered');
    // TODO: Implement QR presentation logic
  };

  return (
    <WalletOverviewView
      balance={balance}
      onScan={handleScan}
      onPresentQr={handlePresentQr}
    />
  );
};
