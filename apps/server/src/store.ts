import {
  MerchantInfoDataV1_0,
  MerchantInfoDataVersion,
} from '@stablepay/common/interfaces/Merchant';
import {
  PaymentDTO,
  PaymentStatus,
} from '@stablepay/common/interfaces/Payment';
import { eq, inArray, sql } from 'drizzle-orm';
import { Effect } from 'effect';
import type { Address } from 'viem';
import { db } from './db';
import { merchants, payments } from './db/schema';

const runEffect = <T, E>(effect: Effect.Effect<T, E>) =>
  Effect.runPromise(effect);

export class Store {
  async addMerchant(merchant: MerchantInfoDataV1_0) {
    return runEffect(
      Effect.gen(function* (_) {
        yield* _(
          Effect.tryPromise({
            try: () =>
              db.insert(merchants).values({
                merchantId: merchant.merchantId,
                version: merchant.version,
                address: merchant.address,
                supportedNetworkIDs: merchant.supportedNetworkIDs,
                supportedCurrencies: merchant.supportedCurrencies,
                metadata: merchant.metadata,
              }),
            catch: (error) => error,
          })
        );
        return merchant;
      })
    );
  }

  async getMerchant(merchantId: string): Promise<MerchantInfoDataV1_0 | null> {
    return runEffect(
      Effect.gen(function* (_) {
        const result = yield* _(
          Effect.tryPromise({
            try: () =>
              db
                .select()
                .from(merchants)
                .where(eq(merchants.merchantId, merchantId)),
            catch: (error) => error,
          })
        );
        if (result.length === 0) return null;

        const m = result[0];
        return {
          version: m.version as MerchantInfoDataVersion,
          merchantId: m.merchantId,
          address: m.address as Address,
          supportedNetworkIDs: m.supportedNetworkIDs,
          supportedCurrencies: m.supportedCurrencies,
          metadata: m.metadata,
        };
      })
    );
  }

  async getMerchantByAddress(
    address: string
  ): Promise<MerchantInfoDataV1_0 | null> {
    return runEffect(
      Effect.gen(function* (_) {
        const result = yield* _(
          Effect.tryPromise({
            try: () =>
              db
                .select()
                .from(merchants)
                .where(eq(merchants.address, address as Address)),
            catch: (error) => error,
          })
        );
        if (result.length === 0) return null;

        const m = result[0];
        return {
          version: m.version as MerchantInfoDataVersion,
          merchantId: m.merchantId,
          address: m.address as Address,
          supportedNetworkIDs: m.supportedNetworkIDs,
          supportedCurrencies: m.supportedCurrencies,
          metadata: m.metadata,
        };
      })
    );
  }

  async listMerchants(limit = 10, offset = 0): Promise<MerchantInfoDataV1_0[]> {
    return runEffect(
      Effect.gen(function* (_) {
        const result = yield* _(
          Effect.tryPromise({
            try: () => db.select().from(merchants).limit(limit).offset(offset),
            catch: (error) => error,
          })
        );

        return result.map((m) => ({
          version: m.version as MerchantInfoDataVersion,
          merchantId: m.merchantId,
          address: m.address as Address,
          supportedNetworkIDs: m.supportedNetworkIDs,
          supportedCurrencies: m.supportedCurrencies,
          metadata: m.metadata,
        }));
      })
    );
  }

  async createPayment(payment: PaymentDTO) {
    return runEffect(
      Effect.gen(function* (_) {
        yield* _(
          Effect.tryPromise({
            try: () =>
              db.insert(payments).values({
                paymentRef: payment.paymentRef,
                merchantId: payment.merchantId,
                amount: payment.amount,
                currency: payment.currency,
                tokenAddress: payment.tokenAddress,
                chainId: payment.chainId,
                status: payment.status,
                txHash: payment.txHash,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt,
              }),
            catch: (error) => error,
          })
        );
        return payment;
      })
    );
  }

  async getPayment(paymentRef: string): Promise<PaymentDTO | null> {
    return runEffect(
      Effect.gen(function* (_) {
        const result = yield* _(
          Effect.tryPromise({
            try: () =>
              db
                .select()
                .from(payments)
                .where(eq(payments.paymentRef, paymentRef)),
            catch: (error) => error,
          })
        );
        if (result.length === 0) return null;

        const p = result[0];
        return {
          paymentRef: p.paymentRef,
          merchantId: p.merchantId,
          amount: p.amount,
          currency: p.currency,
          tokenAddress: p.tokenAddress || undefined,
          chainId: p.chainId || undefined,
          status: p.status as PaymentStatus,
          txHash: p.txHash || undefined,
          createdAt: p.createdAt || '',
          updatedAt: p.updatedAt || '',
        };
      })
    );
  }

  async updatePaymentStatus(
    paymentRef: string,
    status: PaymentStatus,
    txHash?: string
  ) {
    return runEffect(
      Effect.gen(function* (_) {
        const now = new Date().toISOString();
        const updateData: {
          status: string;
          updatedAt: string;
          txHash?: string;
        } = {
          status,
          updatedAt: now,
        };
        if (txHash) {
          updateData.txHash = txHash;
        }

        const result = yield* _(
          Effect.tryPromise({
            try: () =>
              db
                .update(payments)
                .set(updateData)
                .where(eq(payments.paymentRef, paymentRef))
                .returning(),
            catch: (error) => error,
          })
        );

        if (result.length === 0) return null;

        const p = result[0];
        return {
          paymentRef: p.paymentRef,
          merchantId: p.merchantId,
          amount: p.amount,
          currency: p.currency,
          tokenAddress: p.tokenAddress || undefined,
          chainId: p.chainId || undefined,
          status: p.status as PaymentStatus,
          txHash: p.txHash || undefined,
          createdAt: p.createdAt || '',
          updatedAt: p.updatedAt || '',
        };
      })
    );
  }

  async listPayments(
    limit = 20,
    offset = 0,
    merchantId?: string
  ): Promise<PaymentDTO[]> {
    return runEffect(
      Effect.gen(function* (_) {
        const result = merchantId
          ? yield* _(
              Effect.tryPromise({
                try: () =>
                  db
                    .select()
                    .from(payments)
                    .where(eq(payments.merchantId, merchantId))
                    .limit(limit)
                    .offset(offset),
                catch: (error) => error,
              })
            )
          : yield* _(
              Effect.tryPromise({
                try: () =>
                  db.select().from(payments).limit(limit).offset(offset),
                catch: (error) => error,
              })
            );

        return result.map((p) => ({
          paymentRef: p.paymentRef,
          merchantId: p.merchantId,
          amount: p.amount,
          currency: p.currency,
          tokenAddress: p.tokenAddress || undefined,
          chainId: p.chainId || undefined,
          status: p.status as PaymentStatus,
          txHash: p.txHash || undefined,
          createdAt: p.createdAt || '',
          updatedAt: p.updatedAt || '',
        }));
      })
    );
  }

  async countPayments(merchantId?: string): Promise<number> {
    return runEffect(
      Effect.gen(function* (_) {
        const result = merchantId
          ? yield* _(
              Effect.tryPromise({
                try: () =>
                  db
                    .select({ count: sql<number>`count(*)` })
                    .from(payments)
                    .where(eq(payments.merchantId, merchantId)),
                catch: (error) => error,
              })
            )
          : yield* _(
              Effect.tryPromise({
                try: () =>
                  db.select({ count: sql<number>`count(*)` }).from(payments),
                catch: (error) => error,
              })
            );

        return Number(result[0]?.count ?? 0);
      })
    );
  }

  async deletePayment(paymentRef: string): Promise<PaymentDTO | null> {
    return runEffect(
      Effect.gen(function* (_) {
        const result = yield* _(
          Effect.tryPromise({
            try: () =>
              db
                .delete(payments)
                .where(eq(payments.paymentRef, paymentRef))
                .returning(),
            catch: (error) => error,
          })
        );

        if (result.length === 0) return null;

        const p = result[0];
        return {
          paymentRef: p.paymentRef,
          merchantId: p.merchantId,
          amount: p.amount,
          currency: p.currency,
          tokenAddress: p.tokenAddress || undefined,
          chainId: p.chainId || undefined,
          status: p.status as PaymentStatus,
          txHash: p.txHash || undefined,
          createdAt: p.createdAt || '',
          updatedAt: p.updatedAt || '',
        };
      })
    );
  }

  async deletePayments(paymentRefs: string[]): Promise<number> {
    return runEffect(
      Effect.gen(function* (_) {
        if (paymentRefs.length === 0) return 0;

        const result = yield* _(
          Effect.tryPromise({
            try: () =>
              db
                .delete(payments)
                .where(inArray(payments.paymentRef, paymentRefs))
                .returning(),
            catch: (error) => error,
          })
        );

        return result.length;
      })
    );
  }
}

export const dbStore = new Store();
