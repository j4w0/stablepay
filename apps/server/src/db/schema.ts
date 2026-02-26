import type { MerchantInfoDataV1_0 } from '@stablepay/common/interfaces/Merchant';
import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const merchants = sqliteTable('merchants', {
  merchantId: text('merchant_id').primaryKey(),
  version: text('version').notNull(),
  address: text('address').notNull(),
  supportedNetworkIDs: text('supported_network_ids', { mode: 'json' })
    .$type<number[]>()
    .notNull(),
  supportedCurrencies: text('supported_currencies', { mode: 'json' })
    .$type<string[]>()
    .notNull(),
  metadata: text('metadata', { mode: 'json' })
    .$type<MerchantInfoDataV1_0['metadata']>()
    .notNull(),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const payments = sqliteTable('payments', {
  paymentRef: text('payment_ref').primaryKey(),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.merchantId),
  amount: text('amount').notNull(),
  currency: text('currency').notNull(),
  tokenAddress: text('token_address'),
  chainId: integer('chain_id'),
  status: text('status').notNull(),
  txHash: text('tx_hash'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
});
