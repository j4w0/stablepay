import {
  TransactionHistoryView,
  type Transaction,
  type TransactionHistoryViewProps,
} from '@stablepay/client-ui';
import { Effect } from 'effect';
import { useEffect, useState } from 'react';

export const TransactionHistoryService = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const fetchTransactionsEffect = Effect.gen(function* (_) {
      yield* _(Effect.sleep(1000));

      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'receive',
          amount: '100.00',
          currency: 'USDC',
          date: '2023-10-27',
          status: 'completed',
          from: '0x123...abc',
        },
        {
          id: '2',
          type: 'send',
          amount: '50.00',
          currency: 'USDC',
          date: '2023-10-26',
          status: 'completed',
          to: '0x456...def',
        },
        {
          id: '3',
          type: 'send',
          amount: '2.50',
          currency: 'USDC',
          date: '2023-10-25',
          status: 'failed',
          to: '0x789...ghi',
        },
      ];

      return mockTransactions;
    });

    const loadEffect = Effect.gen(function* (_) {
      yield* _(
        Effect.sync(() => {
          if (!isCancelled) {
            setIsLoading(true);
          }
        })
      );

      const data = yield* _(fetchTransactionsEffect);

      yield* _(
        Effect.sync(() => {
          if (!isCancelled) {
            setTransactions(data);
            setIsLoading(false);
          }
        })
      );
    }).pipe(
      Effect.catchAll(() =>
        Effect.sync(() => {
          if (!isCancelled) {
            setIsLoading(false);
          }
        })
      )
    );

    Effect.runPromise(loadEffect);

    return () => {
      isCancelled = true;
    };
  }, []);

  const viewProps: TransactionHistoryViewProps = {
    transactions,
    isLoading,
  };

  return <TransactionHistoryView {...viewProps} />;
};
