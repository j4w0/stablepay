import { Button } from '@stablepay/ui-base';
import { ArrowRightLeft, Scan } from 'lucide-react';
import React from 'react';

import { type WalletOverviewProps } from './WalletOverviewInterface';

export const WalletOverviewView: React.FC<WalletOverviewProps> = ({
  balance,
  onScan,
  onSend,
}) => {
  return (
    <div className='flex flex-col h-full w-full items-center justify-center space-y-12 p-6'>
      <div className='text-center space-y-2'>
        <h2 className='text-muted-foreground text-lg font-medium'>
          Total Balance
        </h2>
        <div className='text-5xl font-bold tracking-tight'>
          $
          {balance.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </div>

      <div className='flex gap-4 w-full max-w-sm justify-center'>
        <Button
          onClick={onSend}
          className='flex-1 flex flex-col items-center justify-center h-24 gap-2 text-base'
          variant='outline'
        >
          <ArrowRightLeft className='w-6 h-6' />
          <span>Send / Receive</span>
        </Button>
        <Button
          onClick={onScan}
          className='flex-1 flex flex-col items-center justify-center h-24 gap-2 text-base'
          variant='outline'
        >
          <Scan className='w-6 h-6' />
          <span>Scan</span>
        </Button>
      </div>
    </div>
  );
};
