import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
} from '@stablepay/ui-base';
import { Building2, Globe, Mail, MapPin, Phone, RefreshCw } from 'lucide-react';
import type { MerchantListViewProps } from './MerchantListInterface';

export function MerchantListView({
  merchants,
  isLoading,
  error,
  onLoadMore,
  onRefresh,
  hasMore,
}: MerchantListViewProps) {
  if (error) {
    return (
      <div className='p-8'>
        <Card className='border-destructive'>
          <CardHeader>
            <CardTitle className='text-destructive'>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>{error}</p>
            <Button onClick={onRefresh} className='mt-4' variant='outline'>
              <RefreshCw className='mr-2 h-4 w-4' />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='p-8 space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Merchants</h1>
          <p className='text-muted-foreground'>
            View all registered merchants in the system
          </p>
        </div>
        <Button onClick={onRefresh} variant='outline' disabled={isLoading}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {isLoading && merchants.length === 0 ? (
        <div className='flex justify-center items-center py-12'>
          <Spinner className='h-8 w-8' />
        </div>
      ) : merchants.length === 0 ? (
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center py-12'>
              <Building2 className='mx-auto h-12 w-12 text-muted-foreground' />
              <h3 className='mt-4 text-lg font-semibold'>No merchants found</h3>
              <p className='text-sm text-muted-foreground mt-2'>
                Get started by creating your first merchant
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {merchants.map((merchant) => (
              <Card
                key={merchant.merchantId}
                className='hover:shadow-lg transition-shadow'
              >
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <CardTitle className='text-lg'>
                        {merchant.metadata.name}
                      </CardTitle>
                      <p className='text-xs text-muted-foreground mt-1 font-mono truncate'>
                        {merchant.merchantId}
                      </p>
                    </div>
                    {merchant.metadata.logoUrl && (
                      <img
                        src={merchant.metadata.logoUrl}
                        alt={merchant.metadata.name}
                        className='h-12 w-12 rounded-lg object-cover'
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {merchant.metadata.description && (
                    <p className='text-sm text-muted-foreground line-clamp-2'>
                      {merchant.metadata.description}
                    </p>
                  )}

                  <div className='space-y-2 text-xs'>
                    <div className='flex items-center text-muted-foreground'>
                      <Building2 className='mr-2 h-3 w-3' />
                      <span className='font-mono truncate'>
                        {merchant.address}
                      </span>
                    </div>

                    {merchant.metadata.physicalAddress && (
                      <div className='flex items-center text-muted-foreground'>
                        <MapPin className='mr-2 h-3 w-3 flex-shrink-0' />
                        <span className='truncate'>
                          {merchant.metadata.physicalAddress}
                        </span>
                      </div>
                    )}

                    {merchant.metadata.email && (
                      <div className='flex items-center text-muted-foreground'>
                        <Mail className='mr-2 h-3 w-3 flex-shrink-0' />
                        <span className='truncate'>
                          {merchant.metadata.email}
                        </span>
                      </div>
                    )}

                    {merchant.metadata.phoneNumber && (
                      <div className='flex items-center text-muted-foreground'>
                        <Phone className='mr-2 h-3 w-3 flex-shrink-0' />
                        <span>{merchant.metadata.phoneNumber}</span>
                      </div>
                    )}

                    {merchant.metadata.websiteUrl && (
                      <div className='flex items-center text-muted-foreground'>
                        <Globe className='mr-2 h-3 w-3 flex-shrink-0' />
                        <a
                          href={merchant.metadata.websiteUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary hover:underline truncate'
                        >
                          {merchant.metadata.websiteUrl}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className='pt-3 border-t space-y-1'>
                    <div className='flex justify-between text-xs'>
                      <span className='text-muted-foreground'>Networks:</span>
                      <span className='font-medium'>
                        {merchant.supportedNetworkIDs.length}
                      </span>
                    </div>
                    <div className='flex justify-between text-xs'>
                      <span className='text-muted-foreground'>Currencies:</span>
                      <span className='font-medium'>
                        {merchant.supportedCurrencies.join(', ')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {hasMore && (
            <div className='flex justify-center pt-4'>
              <Button
                onClick={onLoadMore}
                disabled={isLoading}
                variant='outline'
              >
                {isLoading ? (
                  <>
                    <Spinner className='mr-2 h-4 w-4' />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
