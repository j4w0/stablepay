import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
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
  onAmountChange,
  unifiedBalance,
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

            {onAmountChange ? (
              <div className='flex justify-between items-center py-2 border-b border-white/10'>
                <Label>Amount</Label>
                <div className='flex items-center gap-2'>
                  <Input
                    type='number'
                    value={amount}
                    onChange={(e) => onAmountChange(e.target.value)}
                    className='w-32 font-mono text-right h-8'
                    min='0'
                  />
                  <div className='font-mono'>{currency}</div>
                </div>
              </div>
            ) : (
              amount && (
                <div className='flex justify-between items-center py-2 border-b border-white/10'>
                  <Label>Amount</Label>
                  <div className='font-mono'>
                    {amount} {currency}
                  </div>
                </div>
              )
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
              <div className='rounded-lg border border-white/10'>
                <div className='flex items-center justify-between p-3'>
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

                {unifiedBalance.breakdown.length > 0 && (
                  <Accordion type='single' collapsible className='w-full px-3'>
                    <AccordionItem value='details' className='border-none'>
                      <AccordionTrigger className='py-2 text-xs text-muted-foreground'>
                        View Breakdown
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className='space-y-2 pb-3'>
                          {unifiedBalance.breakdown.map((item, idx) => (
                            <div
                              key={`${item.chainId}-${item.symbol}-${idx}`}
                              className='flex justify-between items-center text-sm'
                            >
                              <div className='flex flex-col'>
                                <span className='font-mono'>{item.symbol}</span>
                                <span className='text-[10px] text-muted-foreground'>
                                  {item.chainName}
                                </span>
                              </div>
                              <span className='font-mono'>
                                {item.formattedAmount} {item.currency}
                              </span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
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
            <Button
              className='w-full'
              onClick={onConfirm}
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
            >
              {isLoading ? 'Processing...' : 'Pay Now'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};
