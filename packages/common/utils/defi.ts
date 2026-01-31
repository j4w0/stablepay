import { createKernelDefiClient } from '@zerodev/defi';
import type {
  KernelAccountClient,
  KernelSmartAccountImplementation,
} from '@zerodev/sdk';
import type { EntryPointVersion, SmartAccount } from 'viem/account-abstraction';
import { ZERODEV_PROJECT_ID } from '../config/zerodev';

export { baseTokenAddresses, defiTokenAddresses } from '@zerodev/defi';

export const getDefiClient = (
  kernelClient: KernelAccountClient<
    any,
    any,
    SmartAccount<KernelSmartAccountImplementation<EntryPointVersion>>
  >,
) => {
  return createKernelDefiClient(kernelClient, ZERODEV_PROJECT_ID);
};
