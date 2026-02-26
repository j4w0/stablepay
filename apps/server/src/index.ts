import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { ZERODEV_RPC_URL } from '@stablepay/common/config/zerodev';
import {
  MerchantInfoDataVersion,
  MerchantQRCodeVersion,
} from '@stablepay/common/interfaces/Merchant';
import { PaymentStatus } from '@stablepay/common/interfaces/Payment';
import { Effect } from 'effect';
import { Elysia, t } from 'elysia';
import { http } from 'viem';
import {
  createBundlerClient,
  getUserOperationReceipt,
  UserOperationReceiptNotFoundError,
} from 'viem/account-abstraction';
import { arbitrum, polygon, sepolia, type Chain } from 'viem/chains';
import { dbStore } from './store';

const chainById = new Map<number, Chain>([
  [sepolia.id, sepolia],
  [polygon.id, polygon],
  [arbitrum.id, arbitrum],
]);

const bundlerRpcUrlByChainId = new Map<number, string>([
  [
    sepolia.id,
    process.env.BUNDLER_RPC_URL_SEPOLIA ||
      process.env.ZERODEV_RPC_URL ||
      ZERODEV_RPC_URL,
  ],
  [
    polygon.id,
    process.env.BUNDLER_RPC_URL_POLYGON || process.env.BUNDLER_RPC_URL || '',
  ],
  [
    arbitrum.id,
    process.env.BUNDLER_RPC_URL_ARBITRUM || process.env.BUNDLER_RPC_URL || '',
  ],
]);

const bundlerClientCache = new Map<
  number,
  ReturnType<typeof createBundlerClient>
>();

const getBundlerClient = (chainId: number) => {
  const chain = chainById.get(chainId);
  const rpcUrl = bundlerRpcUrlByChainId.get(chainId);
  if (!chain || !rpcUrl) return null;

  const cached = bundlerClientCache.get(chainId);
  if (cached) return cached;

  const client = createBundlerClient({
    chain,
    transport: http(rpcUrl),
  });
  bundlerClientCache.set(chainId, client);
  return client;
};

const syncPaymentStatusFromUserOp = async (paymentRef: string) => {
  let currentPayment: Awaited<ReturnType<typeof dbStore.getPayment>> | null =
    null;

  const syncEffect = Effect.gen(function* (_) {
    currentPayment = yield* _(
      Effect.tryPromise({
        try: () => dbStore.getPayment(paymentRef),
        catch: (error) => error,
      })
    );

    if (!currentPayment || !currentPayment.txHash || !currentPayment.chainId) {
      return currentPayment;
    }

    const payment = currentPayment;

    const chainId = payment.chainId;
    if (!chainId) return currentPayment;
    const client = getBundlerClient(chainId);
    if (!client) return currentPayment;

    const receipt = yield* _(
      Effect.tryPromise({
        try: () =>
          getUserOperationReceipt(client, {
            hash: payment.txHash as `0x${string}`,
          }),
        catch: (error) => error,
      })
    );

    const nextStatus = receipt.success
      ? PaymentStatus.Completed
      : PaymentStatus.Failed;

    yield* _(
      Effect.tryPromise({
        try: () =>
          dbStore.updatePaymentStatus(
            payment.paymentRef,
            nextStatus,
            payment.txHash
          ),
        catch: (error) => error,
      })
    );

    currentPayment = yield* _(
      Effect.tryPromise({
        try: () => dbStore.getPayment(paymentRef),
        catch: (error) => error,
      })
    );

    return currentPayment;
  }).pipe(
    Effect.catchAll((error) => {
      if (error instanceof UserOperationReceiptNotFoundError) {
        return Effect.succeed(currentPayment);
      }

      return Effect.sync(() => {
        console.error('Failed to sync user operation status:', error);
        return currentPayment;
      });
    })
  );

  return Effect.runPromise(syncEffect);
};

const app = new Elysia()
  .use(swagger())
  .use(cors())
  .group('/api', (app) =>
    app
      .get('/health', () => ({ status: 'ok' }))

      // Create Merchant
      .post(
        '/merchants',
        ({ body }) =>
          Effect.runPromise(
            Effect.gen(function* (_) {
              const merchantId = crypto.randomUUID();
              const merchant = {
                version: MerchantInfoDataVersion.V1_0,
                merchantId,
                address: body.address as `0x${string}`,
                supportedNetworkIDs: body.supportedNetworkIDs,
                supportedCurrencies: body.supportedCurrencies,
                metadata: body.metadata,
              };
              yield* _(
                Effect.tryPromise({
                  try: () => dbStore.addMerchant(merchant),
                  catch: (error) => error,
                })
              );
              return merchant;
            })
          ),
        {
          body: t.Object({
            address: t.String(),
            supportedNetworkIDs: t.Array(t.Number()),
            supportedCurrencies: t.Array(t.String()),
            metadata: t.Object({
              name: t.String(),
              description: t.Optional(t.String()),
              websiteUrl: t.Optional(t.String()),
              logoUrl: t.Optional(t.String()),
            }),
          }),
        }
      )

      // Get Merchant Info (Public)
      .get('/merchants/:id', ({ params: { id }, set }) =>
        Effect.runPromise(
          Effect.gen(function* (_) {
            const merchant = yield* _(
              Effect.tryPromise({
                try: () => dbStore.getMerchant(id),
                catch: (error) => error,
              })
            );
            if (!merchant) {
              yield* _(
                Effect.sync(() => {
                  set.status = 404;
                })
              );
              return 'Merchant not found';
            }
            return merchant;
          })
        )
      )

      // Get Merchant Info by Address (Public)
      .get('/merchants/lookup/:address', ({ params: { address }, set }) =>
        Effect.runPromise(
          Effect.gen(function* (_) {
            const merchant = yield* _(
              Effect.tryPromise({
                try: () => dbStore.getMerchantByAddress(address),
                catch: (error) => error,
              })
            );
            if (!merchant) {
              yield* _(
                Effect.sync(() => {
                  set.status = 404;
                })
              );
              return 'Merchant not found';
            }
            return merchant;
          })
        )
      )

      // List Merchants (Public)
      .get(
        '/merchants',
        ({ query }) =>
          Effect.runPromise(
            Effect.gen(function* (_) {
              const limit = query.limit ? Number.parseInt(query.limit) : 10;
              const offset = query.offset ? Number.parseInt(query.offset) : 0;
              return yield* _(
                Effect.tryPromise({
                  try: () => dbStore.listMerchants(limit, offset),
                  catch: (error) => error,
                })
              );
            })
          ),
        {
          query: t.Object({
            limit: t.Optional(t.String()),
            offset: t.Optional(t.String()),
          }),
        }
      )

      // Create Merchant QR Code Data
      .post(
        '/merchants/:id/qrcode',
        ({ params: { id }, body, set }) =>
          Effect.runPromise(
            Effect.gen(function* (_) {
              const merchant = yield* _(
                Effect.tryPromise({
                  try: () => dbStore.getMerchant(id),
                  catch: (error) => error,
                })
              );
              if (!merchant) {
                yield* _(
                  Effect.sync(() => {
                    set.status = 404;
                  })
                );
                return 'Merchant not found';
              }

              let paymentRequest = undefined;

              if (body.amount && body.currency) {
                paymentRequest = {
                  amount: body.amount,
                  currency: body.currency,
                };
              }

              return {
                version: MerchantQRCodeVersion.V1_0,
                merchantId: merchant.merchantId,
                address: merchant.address,
                supportedNetworkIDs: merchant.supportedNetworkIDs,
                paymentRequest,
              };
            })
          ),
        {
          body: t.Object({
            amount: t.Optional(t.String()),
            currency: t.Optional(t.String()),
          }),
        }
      )

      // Create Payment
      .post(
        '/payments',
        ({ body, set }) =>
          Effect.runPromise(
            Effect.gen(function* (_) {
              let merchant = null;
              if (body.merchantId) {
                merchant = yield* _(
                  Effect.tryPromise({
                    try: () => dbStore.getMerchant(body.merchantId!),
                    catch: (error) => error,
                  })
                );
              } else if (body.merchantAddress) {
                merchant = yield* _(
                  Effect.tryPromise({
                    try: () =>
                      dbStore.getMerchantByAddress(body.merchantAddress!),
                    catch: (error) => error,
                  })
                );
              }

              if (!merchant) {
                yield* _(
                  Effect.sync(() => {
                    set.status = 404;
                  })
                );
                return 'Merchant not found';
              }

              const paymentRef = crypto.randomUUID();
              const now = new Date().toISOString();

              const payment = {
                paymentRef,
                merchantId: merchant.merchantId,
                amount: body.amount,
                currency: body.currency,
                tokenAddress: body.tokenAddress,
                chainId: body.chainId,
                status: PaymentStatus.Pending,
                createdAt: now,
                updatedAt: now,
              };

              yield* _(
                Effect.tryPromise({
                  try: () => dbStore.createPayment(payment),
                  catch: (error) => error,
                })
              );

              return payment;
            })
          ),
        {
          body: t.Object({
            merchantId: t.Optional(t.String()),
            merchantAddress: t.Optional(t.String()),
            amount: t.String(),
            currency: t.String(),
            tokenAddress: t.String(),
            chainId: t.Number(),
          }),
        }
      )

      // List Payments
      .get(
        '/payments',
        ({ query }) =>
          Effect.runPromise(
            Effect.gen(function* (_) {
              const limit = query.limit ? Number(query.limit) : 20;
              const offset = query.offset ? Number(query.offset) : 0;
              const merchantId = query.merchantId || undefined;

              const [items, total] = yield* _(
                Effect.all([
                  Effect.tryPromise({
                    try: () => dbStore.listPayments(limit, offset, merchantId),
                    catch: (error) => error,
                  }),
                  Effect.tryPromise({
                    try: () => dbStore.countPayments(merchantId),
                    catch: (error) => error,
                  }),
                ])
              );

              return {
                items,
                total,
                limit,
                offset,
              };
            })
          ),
        {
          query: t.Object({
            limit: t.Optional(t.String()),
            offset: t.Optional(t.String()),
            merchantId: t.Optional(t.String()),
          }),
        }
      )

      // Get Payment Status
      // payment status should be passively updated for saving api calls
      .get('/payments/:ref', ({ params: { ref }, set }) =>
        Effect.runPromise(
          Effect.gen(function* (_) {
            const payment = yield* _(
              Effect.tryPromise({
                try: () => dbStore.getPayment(ref),
                catch: (error) => error,
              })
            );
            if (!payment) {
              yield* _(
                Effect.sync(() => {
                  set.status = 404;
                })
              );
              return 'Payment not found';
            }

            if (payment.txHash && payment.chainId) {
              const updated = yield* _(
                Effect.tryPromise({
                  try: () => syncPaymentStatusFromUserOp(ref),
                  catch: (error) => error,
                })
              );
              return updated ?? payment;
            }

            return payment;
          })
        )
      )

      // Update Payment Status (Submit Hash)
      .put(
        '/payments/:ref',
        ({ params: { ref }, body, set }) =>
          Effect.runPromise(
            Effect.gen(function* (_) {
              const payment = yield* _(
                Effect.tryPromise({
                  try: () => dbStore.getPayment(ref),
                  catch: (error) => error,
                })
              );
              if (!payment) {
                yield* _(
                  Effect.sync(() => {
                    set.status = 404;
                  })
                );
                return 'Payment not found';
              }

              let targetStatus = body.status as PaymentStatus | undefined;

              if (body.txHash) {
                targetStatus = PaymentStatus.Processing;
              }

              if (!targetStatus) {
                return payment;
              }

              return yield* _(
                Effect.tryPromise({
                  try: () =>
                    dbStore.updatePaymentStatus(ref, targetStatus, body.txHash),
                  catch: (error) => error,
                })
              );
            })
          ),
        {
          body: t.Object({
            status: t.Optional(t.Enum(PaymentStatus)),
            txHash: t.Optional(t.String()),
          }),
        }
      )

      // Delete Payment
      .delete('/payments/:ref', ({ params: { ref }, set }) =>
        Effect.runPromise(
          Effect.gen(function* (_) {
            const deleted = yield* _(
              Effect.tryPromise({
                try: () => dbStore.deletePayment(ref),
                catch: (error) => error,
              })
            );
            if (!deleted) {
              yield* _(
                Effect.sync(() => {
                  set.status = 404;
                })
              );
              return 'Payment not found';
            }
            return deleted;
          })
        )
      )

      // Bulk Delete Payments
      .delete(
        '/payments',
        ({ body }) =>
          Effect.runPromise(
            Effect.gen(function* (_) {
              const deletedCount = yield* _(
                Effect.tryPromise({
                  try: () => dbStore.deletePayments(body.paymentRefs),
                  catch: (error) => error,
                })
              );
              return { deletedCount };
            })
          ),
        {
          body: t.Object({
            paymentRefs: t.Array(t.String()),
          }),
        }
      )
  )
  .listen(3000);
export type AppType = typeof app;

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
