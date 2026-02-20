import { PaymentStatus } from '@stablepay/common/interfaces/Payment';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@stablepay/ui-base';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import React from 'react';
import type { PaymentStatusProps } from './PaymentStatusInterface';

export const PaymentStatusView: React.FC<PaymentStatusProps> = ({
  status,
  amount,
  currency,
  txHash,
  chainId,
  merchantName,
  updatedAt,
  onRefresh,
  onReturnHome,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case PaymentStatus.Completed:
        return <CheckCircle2 className='w-16 h-16 text-green-500' />;
      case PaymentStatus.Failed:
        return <XCircle className='w-16 h-16 text-red-500' />;
      case PaymentStatus.Processing:
      case PaymentStatus.Pending:
      default:
        return <Clock className='w-16 h-16 text-yellow-500 animate-pulse' />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case PaymentStatus.Completed:
        return 'Payment Successful';
      case PaymentStatus.Failed:
        return 'Payment Failed';
      case PaymentStatus.Processing:
        return 'Processing Payment...';
      case PaymentStatus.Pending:
        return 'Waiting for Payment';
      default:
        return status;
    }
  };

  const userOpExplorerUrl = () => {
    if (!txHash) return undefined;

    if (chainId && chainId !== 11155111) return undefined;
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  };

  return (
    <div className='flex items-center justify-center h-full'>
      <Card className='w-full max-w-md text-center'>
        <CardHeader>
          <div className='flex justify-center mb-4'>{getStatusIcon()}</div>
          <CardTitle>{getStatusText()}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='text-3xl font-bold'>
            {amount} <span className='text-lg font-normal'>{currency}</span>
          </div>

          {(status === PaymentStatus.Processing ||
            status === PaymentStatus.Pending) && (
            <p className='text-muted-foreground animate-pulse'>
              Tracking on-chain status...
            </p>
          )}

          <div className='bg-muted p-4 rounded-md text-left text-sm space-y-2'>
            {merchantName && (
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Merchant</span>
                <span className='font-medium'>{merchantName}</span>
              </div>
            )}
            {txHash && (
              <div className='flex flex-col gap-1'>
                <span className='text-muted-foreground'>
                  AA Transaction Hash
                </span>
                <span className='font-mono text-xs break-all'>{txHash}</span>
                {userOpExplorerUrl() && (
                  <a
                    href={userOpExplorerUrl()}
                    target='_blank'
                    rel='noreferrer'
                    className='text-xs text-primary underline underline-offset-4'
                  >
                    View on explorer
                  </a>
                )}
              </div>
            )}
            {updatedAt && (
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Last Update</span>
                <span>{new Date(updatedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className='flex justify-center gap-2'>
          {onRefresh && (
            <Button variant='outline' onClick={onRefresh}>
              Refresh Status
            </Button>
          )}
          {status !== PaymentStatus.Pending && onReturnHome && (
            <Button onClick={onReturnHome}>Return to Home</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
