import { PresentQRCodeView, SendView } from '@stablepay/client-ui';
import { useWalletStore } from '@stablepay/common/stores/wallet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@stablepay/ui-base';
import { Effect } from 'effect';
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { isWalletReady } from '../utils/walletConnection';

export const SendImpl: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { address, status, webAuthnKey } = useWalletStore();
  const isReady = isWalletReady(status, webAuthnKey);

  if (!isReady) {
    return (
      <div className='text-center text-sm text-muted-foreground'>
        Connect your wallet to send and receive payments.
      </div>
    );
  }

  if (!address) {
    return (
      <div className='text-center text-sm text-muted-foreground'>
        Restoring wallet session...
      </div>
    );
  }

  const handleSend = useCallback((address: string, amount: string) => {
    setIsLoading(true);

    const sendEffect = Effect.gen(function* (_) {
      // TODO: Implement actual send logic
      yield* _(
        Effect.sync(() => {
          console.log(`Sending ${amount} to ${address}`);
        })
      );
      yield* _(Effect.sleep(1000));
      yield* _(
        Effect.sync(() => {
          toast.success(`Sent ${amount} to ${address}`);
        })
      );
    }).pipe(
      Effect.catchAll((error) =>
        Effect.sync(() => {
          console.error(error);
          toast.error('Failed to send');
        })
      ),
      Effect.ensuring(
        Effect.sync(() => {
          setIsLoading(false);
        })
      )
    );

    return Effect.runPromise(sendEffect);
  }, []);

  return (
    <Tabs defaultValue='send' className='w-full'>
      <TabsList className='grid w-full grid-cols-2 mb-4'>
        <TabsTrigger value='send'>Send</TabsTrigger>
        <TabsTrigger value='receive'>Receive</TabsTrigger>
      </TabsList>
      <TabsContent value='send'>
        <SendView onSend={handleSend} isLoading={isLoading} />
      </TabsContent>
      <TabsContent value='receive'>
        <PresentQRCodeView value={address} />
      </TabsContent>
    </Tabs>
  );
};
