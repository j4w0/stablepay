import { createAppKit } from '@reown/appkit/react';
import {
  networks,
  projectId,
  wagmiAdapter,
} from '@stablepay/common/config/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { WagmiProvider, type Config } from 'wagmi';

const queryClient = new QueryClient();

// Create the modal
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  features: {
    analytics: true,
  },
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
