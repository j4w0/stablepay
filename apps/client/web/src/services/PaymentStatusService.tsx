import { PaymentStatusView } from '@stablepay/client-ui';
import { PaymentStatus } from '@stablepay/common/interfaces/Payment';
import { Effect } from 'effect';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { Route } from '../routes/payment/$ref';

type PaymentDetails = {
  status: PaymentStatus;
  amount: string;
  currency: string;
  txHash?: string;
  merchantId?: string;
  updatedAt?: string;
  chainId?: number;
};

export const PaymentStatusService = () => {
  const { ref } = Route.useParams();
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [merchantName, setMerchantName] = useState<string | undefined>(
    undefined
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTerminalStatus = useMemo(() => {
    if (!payment?.status) return false;
    return [
      PaymentStatus.Completed,
      PaymentStatus.Failed,
      PaymentStatus.Expired,
    ].includes(payment.status);
  }, [payment?.status]);

  const fetchPaymentEffect = useCallback(
    () =>
      Effect.tryPromise({
        try: async () => {
          const { data, error } = await api.api.payments({ ref }).get();
          if (!data && error) {
            throw error.value;
          }
          if (typeof data === 'string') {
            throw new Error(data);
          }
          if (!data || typeof data !== 'object') {
            throw new Error('Invalid payment response');
          }

          return {
            status: data.status as PaymentStatus,
            amount: data.amount,
            currency: data.currency,
            txHash: data.txHash,
            merchantId: data.merchantId,
            updatedAt: data.updatedAt,
            chainId: data.chainId,
          } satisfies PaymentDetails;
        },
        catch: (error) => error,
      }),
    [ref]
  );

  const fetchPayment = useCallback(
    () =>
      Effect.runPromise(
        fetchPaymentEffect().pipe(
          Effect.tap((data) =>
            Effect.sync(() => {
              setPayment(data);
            })
          ),
          Effect.tapError((err) =>
            Effect.sync(() => {
              console.error('Failed to fetch payment status:', err);
            })
          )
        )
      ),
    [fetchPaymentEffect]
  );

  useEffect(() => {
    fetchPayment();

    if (isTerminalStatus) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    if (!pollRef.current) {
      pollRef.current = setInterval(() => {
        fetchPayment();
      }, 3000);
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [fetchPayment, isTerminalStatus]);

  useEffect(() => {
    if (!payment?.merchantId) return;

    const fetchMerchantEffect = Effect.tryPromise({
      try: async () => {
        const { data } = await api.api
          .merchants({ id: payment.merchantId })
          .get();

        if (data && typeof data === 'object' && 'metadata' in data) {
          return data.metadata.name;
        }

        return undefined;
      },
      catch: (error) => error,
    });

    Effect.runPromise(
      fetchMerchantEffect.pipe(
        Effect.tap((name) =>
          Effect.sync(() => {
            setMerchantName(name);
          })
        ),
        Effect.tapError((error) =>
          Effect.sync(() => {
            console.error(error);
          })
        )
      )
    );
  }, [payment?.merchantId]);

  if (!payment) {
    return (
      <div className='flex items-center justify-center h-full'>
        Loading status...
      </div>
    );
  }

  return (
    <PaymentStatusView
      status={payment.status}
      amount={payment.amount}
      currency={payment.currency}
      txHash={payment.txHash}
      chainId={payment.chainId}
      updatedAt={payment.updatedAt}
      merchantName={merchantName}
      onRefresh={fetchPayment}
    />
  );
};
