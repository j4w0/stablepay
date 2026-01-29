import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Label,
} from '@stablepay/ui-base';
import React from 'react';
import type { PaymentConfirmationProps } from './PaymentConfirmationInterface';

export const PaymentConfirmationView: React.FC<PaymentConfirmationProps> = ({
  merchantAddress,
  merchantName,
  amount,
  currency,
  networks,
  isLoading,
  onConfirm,
  unifiedBalance,
  routeInfo,
  isCalculatingRoute,
}) => {
  return (
    <div className='flex items-center justify-center h-full'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='bg-muted p-4 rounded-md'>
            <div className='text-sm text-center mb-4'>
              <div className='text-muted-foreground'>Pay to</div>
              {merchantName && (
                <div className='font-bold text-lg'>{merchantName}</div>
              )}
              <div
                className={`font-mono break-all ${
                  merchantName ? 'text-xs text-muted-foreground' : 'font-bold'
                }`}
              >
                {merchantAddress}
              </div>
            </div>

            {amount && (
              <div className='flex justify-between items-center py-2 border-b border-white/10'>
                <Label>Amount</Label>
                <div className='font-mono'>
                  {amount} {currency}
                </div>
              </div>
            )}

            {networks && (
              <div className='flex justify-between items-center py-2 border-b border-white/10'>
                <Label>Networks</Label>
                <div className='font-mono text-xs max-w-50 text-right'>
                  {networks}
                </div>
              </div>
            )}
          </div>

          {unifiedBalance && (
            <div className='space-y-2'>
              <Label>Unified Balance</Label>
              <div className='flex items-center justify-between p-3 rounded-lg border border-white/10'>
                <div className='flex flex-col'>
                  <span className='font-bold'>Unified Stable Balance</span>
                  <span className='text-xs text-muted-foreground'>
                    Combined across supported stablecoins
                  </span>
                </div>
                <div className='flex flex-col items-end'>
                  <span className='font-mono'>
                    {unifiedBalance.formattedAmount} {unifiedBalance.currency}
                  </span>
                  {!unifiedBalance.hasEnoughBalance && (
                    <span className='text-xs text-red-500'>
                      Insufficient Balance
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {isCalculatingRoute && (
            <div className='text-sm text-center text-muted-foreground animate-pulse py-2'>
              Finding best payment route...
            </div>
          )}

          {routeInfo && (
            <div className='space-y-2'>
              <Label>Payment Route (Auto-Swap)</Label>
              <div className='p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 space-y-3 text-sm'>
                <div className='flex justify-between items-center'>
                  <span className='text-muted-foreground'>You Pay</span>
                  <div className='text-right'>
                    <div className='font-bold font-mono'>
                      {parseFloat(routeInfo.fromAmount).toFixed(4)}{' '}
                      {routeInfo.fromTokenSymbol}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Chain ID: {routeInfo.fromChainId}
                    </div>
                  </div>
                </div>

                <div className='flex justify-center text-muted-foreground'>
                  ↓
                </div>

                <div className='flex justify-between items-center'>
                  <span className='text-muted-foreground'>Merchant Gets</span>
                  <div className='text-right'>
                    <div className='font-bold font-mono'>
                      {routeInfo.toAmount} {routeInfo.toTokenSymbol}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Chain ID: {routeInfo.toChainId}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className='text-xs text-center text-muted-foreground'>
            {onConfirm
              ? 'Click to simulate unified payment'
              : 'Checking unified balance...'}
          </div>
        </CardContent>
        {onConfirm && (
          <CardFooter>
            <Button className='w-full' onClick={onConfirm} disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Pay Now'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};
