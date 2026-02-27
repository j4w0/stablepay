import { getEntryPoint, KERNEL_V3_1 } from '@zerodev/sdk/constants';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

export const ENTRYPOINT = getEntryPoint('0.7');
export const KERNEL_VERSION = KERNEL_V3_1;

const readEnv = (key: string): string | undefined => {
  const importMetaEnv = (
    import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    }
  ).env;

  return importMetaEnv?.[key];
};

export const ZERODEV_PROJECT_ID =
  readEnv('ZERODEV_PROJECT_ID') || readEnv('VITE_ZERODEV_PROJECT_ID') || '';
export const ZERODEV_RPC_URL = `https://rpc.zerodev.app/api/v3/${ZERODEV_PROJECT_ID}/chain/11155111?selfFunded=true`;
export const PASSKEY_SERVER_URL = `https://passkeys.zerodev.app/api/v3/${ZERODEV_PROJECT_ID}`;

export const publicClient = createPublicClient({
  transport: http(ZERODEV_RPC_URL),
  chain: sepolia,
});
