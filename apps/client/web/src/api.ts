import {
  PaymentStatus,
  type PaymentDTO,
} from '@stablepay/common/interfaces/Payment';
import type { Address } from 'viem';

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
    supportedCurrencies: ['USD'],
    metadata: {
      name: 'StablePay Demo Merchant',
      description: 'Local mock merchant for web demo.',
    },
  },
];

const paymentsStore = new Map<string, PaymentDTO>();

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

const getPaymentWithProgress = (payment: PaymentDTO): PaymentDTO => {
  if (
    payment.status === PaymentStatus.Completed ||
    payment.status === PaymentStatus.Failed ||
    payment.status === PaymentStatus.Expired
  ) {
    return payment;
  }

  const elapsedMs = Date.now() - Date.parse(payment.createdAt);

  if (!payment.txHash) {
    if (elapsedMs >= 3_000 && payment.status !== PaymentStatus.Processing) {
      const next = {
        ...payment,
        status: PaymentStatus.Processing,
        updatedAt: new Date().toISOString(),
      } satisfies PaymentDTO;
      paymentsStore.set(payment.paymentRef, next);
      return next;
    }

    return payment;
  }

  if (elapsedMs >= 8_000) {
    const next = {
      ...payment,
      status: PaymentStatus.Completed,
      updatedAt: new Date().toISOString(),
    } satisfies PaymentDTO;
    paymentsStore.set(payment.paymentRef, next);
    return next;
  }

  if (payment.status !== PaymentStatus.Processing) {
    const next = {
      ...payment,
      status: PaymentStatus.Processing,
      updatedAt: new Date().toISOString(),
    } satisfies PaymentDTO;
    paymentsStore.set(payment.paymentRef, next);
    return next;
  }

  return payment;
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

      return asSuccess(getPaymentWithProgress(existing));
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
