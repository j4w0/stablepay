import {
  stablepayConfig,
  supportedStablecoins,
  supportedTestnetStablecoins,
} from '@stablepay/common/config/stablepay';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@stablepay/ui-base';
import { createFileRoute } from '@tanstack/react-router';
import { Effect } from 'effect';
import { QRCodeSVG } from 'qrcode.react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../services/api';

export const Route = createFileRoute('/payments/new')({
  component: CreatePaymentPage,
});

function CreatePaymentPage() {
  const isDev = import.meta.env.DEV;
  const allTokens = isDev ? supportedTestnetStablecoins : supportedStablecoins;
  // Unique currencies
  const currencies = Array.from(new Set(allTokens.map((t) => t.currency)));

  const [merchantId, setMerchantId] = useState('');
  const [amount, setAmount] = useState('');

  const [selectedCurrency, setSelectedCurrency] = useState(
    currencies[0] || 'USD'
  );

  const filteredTokens = allTokens.filter(
    (t) => t.currency === selectedCurrency
  );

  const [tokenKey, setTokenKey] = useState(
    filteredTokens[0]
      ? `${filteredTokens[0].chainId}:${filteredTokens[0].contractAddress}`
      : ''
  );

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    const newFilteredTokens = allTokens.filter(
      (t) => t.currency === newCurrency
    );
    if (newFilteredTokens.length > 0) {
      setTokenKey(
        `${newFilteredTokens[0].chainId}:${newFilteredTokens[0].contractAddress}`
      );
    } else {
      setTokenKey('');
    }
  };

  const [createdPayment, setCreatedPayment] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [loading, setLoading] = useState(false);

  const paymentUrl = useMemo(() => {
    if (!createdPayment) return '';
    const url = new URL(
      `/pay/${createdPayment.address}`,
      stablepayConfig.clientBaseUrl
    );

    // Payment Intent: Amount + Currency + Supported Networks
    url.searchParams.set('amount', amount);
    url.searchParams.set('currency', selectedCurrency);

    // Find all supported chains for this currency
    const supportedChains = allTokens
      .filter((t) => t.currency === selectedCurrency)
      .map((t) => t.chainId);
    // Deduplicate just in case
    const uniqueChains = Array.from(new Set(supportedChains));

    url.searchParams.set('networks', JSON.stringify(uniqueChains));

    return url.toString();
  }, [createdPayment, amount, selectedCurrency, allTokens]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitEffect = Effect.gen(function* (_) {
      yield* _(
        Effect.sync(() => {
          setLoading(true);
          setCreatedPayment(null);
        })
      );

      const selectedToken = allTokens.find(
        (t) => `${t.chainId}:${t.contractAddress}` === tokenKey
      );

      if (!selectedToken) {
        yield* _(
          Effect.sync(() => {
            toast.error('Please select a currency');
          })
        );
        return;
      }

      const { data, error } = yield* _(
        Effect.tryPromise({
          try: () =>
            api.api.merchants({ id: merchantId }).qrcode.post({
              amount: amount,
              currency: selectedCurrency,
            }),
          catch: (error) => error,
        })
      );

      if (error) {
        yield* _(
          Effect.sync(() => {
            toast.error('Failed to create payment');
            console.error(error);
          })
        );
        return;
      }

      if (typeof data === 'string') {
        yield* _(
          Effect.sync(() => {
            toast.error(data);
          })
        );
        return;
      }

      yield* _(
        Effect.sync(() => {
          toast.success('Payment created!');
          setCreatedPayment(data as Record<string, unknown>);
        })
      );
    }).pipe(
      Effect.catchAll((err) =>
        Effect.sync(() => {
          toast.error('An error occurred');
          console.error(err);
        })
      ),
      Effect.ensuring(
        Effect.sync(() => {
          setLoading(false);
        })
      )
    );

    return Effect.runPromise(submitEffect);
  };

  return (
    <div className='max-w-2xl mx-auto'>
      <Card>
        <CardHeader>
          <CardTitle>Create New Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='merchantId'>Merchant ID</Label>
              <Input
                id='merchantId'
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder='UUID'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='amount'>Amount (Units)</Label>
              <Input
                id='amount'
                type='number'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder='1000'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='currencySelect'>Currency</Label>
              <select
                id='currencySelect'
                value={selectedCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='tokenSelect'>Token</Label>
              <select
                id='tokenSelect'
                value={tokenKey}
                onChange={(e) => setTokenKey(e.target.value)}
                className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'
              >
                {filteredTokens.map((token) => (
                  <option
                    key={`${token.chainId}-${token.contractAddress}`}
                    value={`${token.chainId}:${token.contractAddress}`}
                  >
                    {token.displayName} ({token.displaySymbol})
                  </option>
                ))}
              </select>
            </div>

            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Creating...' : 'Create Payment'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {createdPayment && (
        <Card className='mt-8'>
          <CardHeader>
            <CardTitle>Payment QR Code</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col items-center gap-6'>
            <div className='bg-white p-4 rounded-xl border shadow-sm'>
              <QRCodeSVG
                value={paymentUrl}
                size={256}
                level='H'
                includeMargin
              />
            </div>

            <Button
              variant='secondary'
              onClick={() => window.open(paymentUrl, '_blank')}
              className='w-full'
            >
              Test: Jump to Payment Page
            </Button>

            <div className='w-full'>
              <Label className='mb-2 block'>Raw Details</Label>
              <pre className='bg-muted p-4 rounded-md overflow-auto text-xs max-h-60'>
                {JSON.stringify(createdPayment, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
