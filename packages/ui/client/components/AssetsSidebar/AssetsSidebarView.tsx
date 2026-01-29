import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from '@stablepay/ui-base';
import { RefreshCw } from 'lucide-react';
import React from 'react';
import { type AssetsSidebarViewProps } from './AssetsSidebarInterface';

const formatBalanceForDisplay = (raw: string) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  if (n === 0) return '0';
  if (n < 0.0001) return '<0.0001';
  return n.toFixed(4);
};

export const AssetsSidebarView: React.FC<AssetsSidebarViewProps> = ({
  isLoading,
  isConnected,
  denominationCurrency,
  totalAmountFormatted,
  assets,
  lastUpdatedAt,
  onRefresh,
}) => {
  const updatedLabel = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleString()
    : 'Not updated yet';

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader className='border-b'>
          <CardTitle>Total assets</CardTitle>
          <CardDescription>
            Denominated in {denominationCurrency}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-semibold'>
            {totalAmountFormatted} {denominationCurrency}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='border-b'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <CardTitle>Assets</CardTitle>
              <CardDescription>
                Your balances across supported tokens
              </CardDescription>
            </div>
            {isConnected && onRefresh && (
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                onClick={onRefresh}
                title={`Last updated: ${updatedLabel}`}
                aria-label='Refresh asset balances'
                disabled={isLoading}
              >
                <RefreshCw className={isLoading ? 'animate-spin' : undefined} />
              </Button>
            )}
          </div>
          {isConnected && (
            <div className='text-xs text-muted-foreground mt-2'>
              Updated: {updatedLabel}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className='text-sm text-muted-foreground'>
              Connect your wallet to view assets.
            </div>
          ) : assets.length === 0 ? (
            <div className='text-sm text-muted-foreground'>
              No supported assets found.
            </div>
          ) : (
            <div className='space-y-3'>
              {assets.map((asset, idx) => (
                <div
                  key={`${asset.token.chainId}-${asset.token.contractAddress}`}
                >
                  <div className='flex items-center justify-between'>
                    <div className='min-w-0'>
                      <div className='font-medium truncate'>
                        {asset.token.displaySymbol}
                      </div>
                      <div className='text-xs text-muted-foreground truncate'>
                        {asset.token.displayName}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='font-mono'>
                        {formatBalanceForDisplay(asset.formattedBalance)}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {asset.token.currency}
                      </div>
                    </div>
                  </div>
                  {idx !== assets.length - 1 && <Separator className='mt-3' />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
