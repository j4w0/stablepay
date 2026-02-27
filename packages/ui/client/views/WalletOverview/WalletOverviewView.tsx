import { Button } from '@stablepay/ui-base';
import { ArrowRightLeft, RefreshCcw, Scan } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import React from 'react';

import { type WalletOverviewProps } from './WalletOverviewInterface';

export const WalletOverviewView: React.FC<WalletOverviewProps> = ({
  balance,
  onScan,
  onSend,
  onRefreshBalance,
  isRefreshingBalance,
  canRefreshBalance,
  onCreateTestTransaction,
  onReset,
  address,
}) => {
  const resetButtonText = address ? 'Reset App Data' : 'Go to Onboarding';

  return (
    <div className='flex flex-col md:flex-row h-full w-full items-center justify-center p-6 animate-in fade-in duration-500'>
      {/* Left Side: Balance & Actions */}
      <div className='flex flex-col items-start space-y-8 max-w-sm w-full md:pr-12'>
        <div className='space-y-2 text-left w-full'>
          <h1 className='text-3xl font-bold tracking-tight mb-6'>StablePay</h1>
          <h2 className='text-muted-foreground text-lg font-medium'>
            Total Balance
          </h2>
          <div className='text-5xl font-bold tracking-tight break-all'>
            $
            {balance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          {onRefreshBalance && (
            <div className='pt-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={onRefreshBalance}
                disabled={Boolean(isRefreshingBalance) || !canRefreshBalance}
              >
                <RefreshCcw className='mr-2 h-4 w-4' />
                {isRefreshingBalance ? 'Refreshing...' : 'Refresh Balance'}
              </Button>
            </div>
          )}
        </div>

        <div className='flex gap-4 w-full justify-start'>
          {onCreateTestTransaction ? (
            <Button
              onClick={onCreateTestTransaction}
              className='h-12 px-6 text-base'
              variant='outline'
            >
              Create Test Transaction
            </Button>
          ) : (
            <>
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
            </>
          )}
        </div>

        {onReset && (
          <div className='w-full flex justify-start'>
            <Button
              variant='default'
              className='h-12 px-6 text-base'
              onClick={onReset}
            >
              <RefreshCcw className='mr-2 h-4 w-4' />
              {resetButtonText}
            </Button>
          </div>
        )}
      </div>

      {/* Right Side: QR Code & Address */}
      <div className='flex flex-col items-center justify-center max-w-sm w-full mt-6 pt-6 border-t border-foreground/20 md:mt-0 md:pt-0 md:border-t-0 md:border-l md:border-foreground/25 md:pl-12 md:ml-12'>
        {address ? (
          <div className='flex flex-col items-center space-y-6 w-full p-6 rounded-2xl bg-card/50 backdrop-blur-sm'>
            <div className='p-4 bg-white rounded-xl shadow-sm'>
              <QRCodeSVG value={address} size={180} />
            </div>

            <div className='space-y-2 w-full'>
              <div className='text-xs font-medium text-center text-muted-foreground uppercase'>
                Wallet Address
              </div>
              <div className='p-3 bg-muted/50 rounded-lg text-xs font-mono break-all text-center select-all border'>
                {address}
              </div>
            </div>

            <div className='w-full text-center text-xs text-muted-foreground'>
              Only deposit USDC, JPYC on Sepolia
            </div>

            <div className='w-full flex gap-2'>
              <Button asChild className='flex-1' variant='outline'>
                <a
                  href='https://faucet.circle.com/'
                  target='_blank'
                  rel='noreferrer'
                >
                  USDC Faucet
                </a>
              </Button>
              <Button asChild className='flex-1' variant='outline'>
                <a
                  href='https://faucet.jpyc.co.jp/login'
                  target='_blank'
                  rel='noreferrer'
                >
                  JPYC Faucet
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <a
            href='/onboarding'
            className='flex flex-col items-center justify-center p-8 text-center space-y-4 rounded-2xl border border-dashed w-full h-[360px]'
          >
            <div className='p-4 bg-muted rounded-full'>
              <Scan className='w-8 h-8 text-muted-foreground' />
            </div>
            <div className='space-y-1'>
              <h3 className='font-semibold'>Wallet Not Connected</h3>
              <p className='text-sm text-muted-foreground'>
                Please use the left action to continue onboarding and create or
                import your wallet.
              </p>
            </div>
          </a>
        )}
      </div>
    </div>
  );
};
