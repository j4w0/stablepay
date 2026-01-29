import { api } from '@/services/api';
import {
  supportedStablecoins,
  supportedTestnetStablecoins,
} from '@stablepay/common/config/stablepay';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Textarea,
} from '@stablepay/ui-base';
import { createFileRoute } from '@tanstack/react-router';
import { Effect } from 'effect';
import { useState } from 'react';
import { toast } from 'sonner';
import * as chains from 'viem/chains';

export const Route = createFileRoute('/merchants/new')({
  component: CreateMerchantPage,
});

// Helper to get chain name
const getChainName = (chainId: number) => {
  const chain = Object.values(chains).find((c) => c.id === chainId);
  return chain?.name || `Chain ID ${chainId}`;
};

// Unique lists
const allStablecoins = [
  ...supportedStablecoins,
  ...supportedTestnetStablecoins,
];
const uniqueCurrencies = Array.from(
  new Set(allStablecoins.map((c) => c.currency))
);
const uniqueChainIds = Array.from(
  new Set(allStablecoins.map((c) => c.chainId))
);

function CreateMerchantPage() {
  const [address, setAddress] = useState('');
  const [selectedNetworks, setSelectedNetworks] = useState<number[]>([
    11155111,
  ]); // Default Sepolia
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([
    'USD',
    'JPY',
  ]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [logo, setLogo] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleNetwork = (id: number) => {
    setSelectedNetworks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleCurrency = (code: string) => {
    setSelectedCurrencies((prev) =>
      prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitEffect = Effect.gen(function* (_) {
      yield* _(
        Effect.sync(() => {
          setLoading(true);
        })
      );

      const { data, error } = yield* _(
        Effect.tryPromise({
          try: () =>
            api.api.merchants.post({
              address,
              supportedNetworkIDs: selectedNetworks,
              supportedCurrencies: selectedCurrencies,
              metadata: {
                name,
                description,
                websiteUrl: website,
                logoUrl: logo,
              },
            }),
          catch: (error) => error,
        })
      );

      if (error) {
        yield* _(
          Effect.sync(() => {
            toast.error('Failed to create merchant');
            console.error(error);
          })
        );
        return;
      }

      yield* _(
        Effect.sync(() => {
          toast.success('Merchant created successfully!');
          console.log('Merchant created:', data);
          toast.info(`Merchant ID: ${data.merchantId}`);
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
          <CardTitle>Create New Merchant</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Merchant Name</Label>
              <Input
                id='name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='My Awesome Store'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='address'>Wallet Address</Label>
              <Input
                id='address'
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder='0x...'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='networks'>Supported Networks</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' className='w-full justify-between'>
                    {selectedNetworks.length > 0
                      ? `${selectedNetworks.length} selected`
                      : 'Select Networks'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56'>
                  <DropdownMenuLabel>Networks</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {uniqueChainIds.map((id) => (
                    <DropdownMenuCheckboxItem
                      key={id}
                      checked={selectedNetworks.includes(id)}
                      onCheckedChange={() => toggleNetwork(id)}
                    >
                      {getChainName(id)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='currencies'>Supported Currencies</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' className='w-full justify-between'>
                    {selectedCurrencies.length > 0
                      ? selectedCurrencies.join(', ')
                      : 'Select Currencies'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56'>
                  <DropdownMenuLabel>Currencies</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {uniqueCurrencies.map((c) => (
                    <DropdownMenuCheckboxItem
                      key={c}
                      checked={selectedCurrencies.includes(c)}
                      onCheckedChange={() => toggleCurrency(c)}
                    >
                      {c}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Describe your store...'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='website'>Website URL</Label>
              <Input
                id='website'
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder='https://...'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='logo'>Logo URL</Label>
              <Input
                id='logo'
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder='https://...'
              />
            </div>

            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Creating...' : 'Create Merchant'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
