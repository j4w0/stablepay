import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { sepolia, type AppKitNetwork } from '@reown/appkit/networks';

// Get projectId from https://cloud.reown.com
export const projectId = 'd322f77e2861f1f123c95901367af39c'; // TODO: Replace with environment variable

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [sepolia];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
});
