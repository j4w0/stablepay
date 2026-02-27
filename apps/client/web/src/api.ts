import { ZERODEV_RPC_URL } from '@stablepay/common/config/zerodev';
import {
  PaymentStatus,
  type PaymentDTO,
} from '@stablepay/common/interfaces/Payment';
import type { Address } from 'viem';
import { arbitrum, polygon, sepolia } from 'viem/chains';

type ApiResult<T> = {
  data: T;
  error: null;
};

type MerchantMock = {
  version: '1.0';
  merchantId: string;
  address: Address;
  supportedNetworkIDs: number[];
  supportedCurrencies: string[];
  metadata: {
    name: string;
    description?: string;
  };
};

type CreatePaymentBody = {
  merchantAddress: string;
  amount: string;
  currency: string;
  tokenAddress?: string;
  chainId?: number;
};

type UpdatePaymentBody = {
  txHash?: string;
};

const mockMerchants: MerchantMock[] = [
  {
    version: '1.0',
    merchantId: '11111111-1111-4111-8111-111111111111',
    address: '0x1111111111111111111111111111111111111111',
    supportedNetworkIDs: [11155111],
    supportedCurrencies: ['JPY'],
    metadata: {
      name: 'StablePay Demo Merchant',
      description: 'Local mock merchant for web demo.',
    },
  },
];

const paymentsStore = new Map<string, PaymentDTO>();

const bundlerRpcUrlByChainId = new Map<number, string>([
  [sepolia.id, ZERODEV_RPC_URL],
  [
    polygon.id,
    import.meta.env.VITE_BUNDLER_RPC_URL_POLYGON ||
      import.meta.env.VITE_BUNDLER_RPC_URL ||
      '',
  ],
  [
    arbitrum.id,
    import.meta.env.VITE_BUNDLER_RPC_URL_ARBITRUM ||
      import.meta.env.VITE_BUNDLER_RPC_URL ||
      '',
  ],
]);

const asSuccess = <T>(data: T): ApiResult<T> => ({
  data,
  error: null,
});

const findMerchantByAddress = (address: string) =>
  mockMerchants.find(
    (merchant) => merchant.address.toLowerCase() === address.toLowerCase(),
  );

const findMerchantById = (id: string) =>
  mockMerchants.find((merchant) => merchant.merchantId === id);

const getBundlerRpcUrl = (chainId: number) => {
  const rpcUrl = bundlerRpcUrlByChainId.get(chainId);
  if (!rpcUrl) return null;
  return rpcUrl;
};

type UserOpReceiptRpcResult = {
  success?: boolean;
  receipt?: {
    status?: string;
  };
};

const getUserOperationReceiptFromBundler = async (
  rpcUrl: string,
  hash: `0x${string}`,
): Promise<UserOpReceiptRpcResult | null> => {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getUserOperationReceipt',
      params: [hash],
    }),
  });

  if (!response.ok) {
    throw new Error(`Bundler RPC request failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    result?: UserOpReceiptRpcResult | null;
    error?: { message?: string };
  };

  if (payload.error) {
    throw new Error(payload.error.message || 'Bundler RPC returned an error');
  }

  return payload.result ?? null;
};

const getPaymentWithProgress = async (
  payment: PaymentDTO,
): Promise<PaymentDTO> => {
  if (
    payment.status === PaymentStatus.Completed ||
    payment.status === PaymentStatus.Failed ||
    payment.status === PaymentStatus.Expired
  ) {
    return payment;
  }

  if (!payment.txHash || !payment.chainId) {
    return payment;
  }

  const rpcUrl = getBundlerRpcUrl(payment.chainId);
  if (!rpcUrl) {
    return payment;
  }

  try {
    const receipt = await getUserOperationReceiptFromBundler(
      rpcUrl,
      payment.txHash as `0x${string}`,
    );

    if (!receipt) {
      if (payment.status === PaymentStatus.Processing) {
        return payment;
      }

      const next = {
        ...payment,
        status: PaymentStatus.Processing,
        updatedAt: new Date().toISOString(),
      } satisfies PaymentDTO;
      paymentsStore.set(payment.paymentRef, next);
      return next;
    }

    const isSuccess =
      typeof receipt.success === 'boolean'
        ? receipt.success
        : receipt.receipt?.status === '0x1';

    const next = {
      ...payment,
      status: isSuccess ? PaymentStatus.Completed : PaymentStatus.Failed,
      updatedAt: new Date().toISOString(),
    } satisfies PaymentDTO;

    paymentsStore.set(payment.paymentRef, next);
    return next;
  } catch (error) {
    console.error('Failed to sync payment status from chain:', error);
    return payment;
  }
};

const merchantsHandler = Object.assign(
  ({ id }: { id: string }) => ({
    get: async () => {
      const merchant =
        findMerchantById(id) ??
        findMerchantById('11111111-1111-4111-8111-111111111111')!;
      return asSuccess(merchant);
    },
  }),
  {
    lookup: ({ address }: { address: string }) => ({
      get: async () => {
        const merchant =
          findMerchantByAddress(address) ??
          findMerchantById('11111111-1111-4111-8111-111111111111')!;
        return asSuccess(merchant);
      },
    }),
    merchants: ({ id }: { id: string }) => ({
      get: async () => {
        const merchant =
          findMerchantById(id) ??
          findMerchantById('11111111-1111-4111-8111-111111111111')!;
        return asSuccess(merchant);
      },
    }),
  },
);

const paymentsHandler = Object.assign(
  ({ ref }: { ref: string }) => ({
    get: async () => {
      const existing = paymentsStore.get(ref);

      if (!existing) {
        const fallback: PaymentDTO = {
          paymentRef: ref,
          merchantId: '11111111-1111-4111-8111-111111111111',
          amount: '1',
          currency: 'USD',
          status: PaymentStatus.Pending,
          chainId: 11155111,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        paymentsStore.set(ref, fallback);
        return asSuccess(fallback);
      }

      return asSuccess(await getPaymentWithProgress(existing));
    },
    put: async (payload: UpdatePaymentBody) => {
      const existing = paymentsStore.get(ref);
      if (existing) {
        const next: PaymentDTO = {
          ...existing,
          txHash: payload.txHash,
          status: payload.txHash ? PaymentStatus.Processing : existing.status,
          updatedAt: new Date().toISOString(),
        };
        paymentsStore.set(ref, next);
      }

      return asSuccess({ ok: true });
    },
  }),
  {
    post: async (payload: CreatePaymentBody) => {
      const paymentRef = `mock-${Date.now()}`;
      const merchant =
        findMerchantByAddress(payload.merchantAddress) ??
        findMerchantById('11111111-1111-4111-8111-111111111111')!;

      const payment: PaymentDTO = {
        paymentRef,
        merchantId: merchant.merchantId,
        amount: payload.amount,
        currency: payload.currency,
        tokenAddress: payload.tokenAddress,
        chainId: payload.chainId,
        status: PaymentStatus.Pending,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      paymentsStore.set(paymentRef, payment);
      return asSuccess({ paymentRef });
    },
  },
);

export const api = {
  api: {
    merchants: merchantsHandler,
    payments: paymentsHandler,
  },
};
