import { api } from '@/services/api';
import type {
  PaymentDTO,
  PaymentStatus,
} from '@stablepay/common/interfaces/Payment';
import {
  PaymentsTableView,
  type PaymentsTableViewProps,
} from '@stablepay/merchant-ui';
import { Effect } from 'effect';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export function PaymentsTable() {
  const [payments, setPayments] = useState<PaymentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRefs, setSelectedRefs] = useState<string[]>([]);
  const limit = 20;

  const fetchPayments = useCallback(
    (page = 1) => {
      const fetchEffect = Effect.gen(function* (_) {
        yield* _(
          Effect.sync(() => {
            setIsLoading(true);
            setError(undefined);
          })
        );

        const offset = (page - 1) * limit;
        const response = yield* _(
          Effect.tryPromise({
            try: () =>
              api.api.payments.get({
                query: {
                  limit: limit.toString(),
                  offset: offset.toString(),
                },
              }),
            catch: (error) => error,
          })
        );

        if (response.error) {
          yield* _(Effect.fail(new Error('Failed to fetch payments')));
        }

        const payload = response.data as {
          items: PaymentDTO[];
          total: number;
          limit: number;
          offset: number;
        };

        yield* _(
          Effect.sync(() => {
            setPayments(payload?.items ?? []);
            setTotalCount(Number(payload?.total ?? 0));
            setCurrentPage(page);
            setSelectedRefs([]);
          })
        );
      }).pipe(
        Effect.catchAll((err) =>
          Effect.sync(() => {
            setError('Failed to load payments. Please try again.');
            console.error(err);
          })
        ),
        Effect.ensuring(
          Effect.sync(() => {
            setIsLoading(false);
          })
        )
      );

      return Effect.runPromise(fetchEffect);
    },
    [limit]
  );

  useEffect(() => {
    fetchPayments(1);
  }, [fetchPayments]);

  const handleRefresh = useCallback(() => {
    fetchPayments(currentPage);
  }, [currentPage, fetchPayments]);

  const handlePageChange: PaymentsTableViewProps['onPageChange'] = useCallback(
    (page) => {
      if (page === currentPage) return;
      fetchPayments(page);
    },
    [currentPage, fetchPayments]
  );

  const handleUpdateStatus: PaymentsTableViewProps['onUpdateStatus'] =
    useCallback((paymentRef: string, status: PaymentStatus) => {
      const updateEffect = Effect.gen(function* (_) {
        const response = yield* _(
          Effect.tryPromise({
            try: () => api.api.payments({ ref: paymentRef }).put({ status }),
            catch: (error) => error,
          })
        );

        if (response.error) {
          yield* _(Effect.fail(new Error('Failed to update payment status')));
        }

        const updated = response.data as PaymentDTO;
        yield* _(
          Effect.sync(() => {
            setPayments((prev) =>
              prev.map((payment) =>
                payment.paymentRef === updated.paymentRef ? updated : payment
              )
            );
            toast.success('Payment status updated.');
          })
        );
      }).pipe(
        Effect.catchAll((err) =>
          Effect.sync(() => {
            toast.error('Failed to update payment status.');
            console.error(err);
          })
        )
      );

      return Effect.runPromise(updateEffect);
    }, []);

  const handleDeletePayment: PaymentsTableViewProps['onDeletePayment'] =
    useCallback(
      (paymentRef: string) => {
        const confirmed = window.confirm(
          'Remove this payment record? This action cannot be undone.'
        );
        if (!confirmed) return undefined;

        const deleteEffect = Effect.gen(function* (_) {
          const response = yield* _(
            Effect.tryPromise({
              try: () => api.api.payments({ ref: paymentRef }).delete(),
              catch: (error) => error,
            })
          );

          if (response.error) {
            yield* _(Effect.fail(new Error('Failed to delete payment')));
          }

          yield* _(
            Effect.sync(() => {
              setPayments((prev) =>
                prev.filter((payment) => payment.paymentRef !== paymentRef)
              );
              setTotalCount((prev) => Math.max(0, prev - 1));
              setSelectedRefs((prev) =>
                prev.filter((ref) => ref !== paymentRef)
              );
              toast.success('Payment removed.');
            })
          );

          if (payments.length === 1 && currentPage > 1) {
            yield* _(Effect.sync(() => fetchPayments(currentPage - 1)));
          }
        }).pipe(
          Effect.catchAll((err) =>
            Effect.sync(() => {
              toast.error('Failed to remove payment.');
              console.error(err);
            })
          )
        );

        return Effect.runPromise(deleteEffect);
      },
      [currentPage, fetchPayments, payments.length]
    );

  const handleToggleSelect: PaymentsTableViewProps['onToggleSelect'] =
    useCallback((paymentRef: string) => {
      setSelectedRefs((prev) =>
        prev.includes(paymentRef)
          ? prev.filter((ref) => ref !== paymentRef)
          : [...prev, paymentRef]
      );
    }, []);

  const handleToggleSelectAll: PaymentsTableViewProps['onToggleSelectAll'] =
    useCallback(() => {
      setSelectedRefs((prev) =>
        prev.length === payments.length
          ? []
          : payments.map((payment) => payment.paymentRef)
      );
    }, [payments]);

  const handleBulkDelete: PaymentsTableViewProps['onBulkDelete'] =
    useCallback(() => {
      if (selectedRefs.length === 0) return undefined;

      const confirmed = window.confirm(
        `Remove ${selectedRefs.length} payment record(s)? This action cannot be undone.`
      );
      if (!confirmed) return undefined;

      const bulkDeleteEffect = Effect.gen(function* (_) {
        const response = yield* _(
          Effect.tryPromise({
            try: () => api.api.payments.delete({ paymentRefs: selectedRefs }),
            catch: (error) => error,
          })
        );

        if (response.error) {
          yield* _(Effect.fail(new Error('Failed to delete payments')));
        }

        yield* _(
          Effect.sync(() => {
            setPayments((prev) =>
              prev.filter(
                (payment) => !selectedRefs.includes(payment.paymentRef)
              )
            );
            setTotalCount((prev) => Math.max(0, prev - selectedRefs.length));
            setSelectedRefs([]);
            toast.success('Selected payments removed.');
          })
        );

        if (selectedRefs.length >= payments.length && currentPage > 1) {
          yield* _(Effect.sync(() => fetchPayments(currentPage - 1)));
        }
      }).pipe(
        Effect.catchAll((err) =>
          Effect.sync(() => {
            toast.error('Failed to remove selected payments.');
            console.error(err);
          })
        )
      );

      return Effect.runPromise(bulkDeleteEffect);
    }, [currentPage, fetchPayments, payments.length, selectedRefs]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <PaymentsTableView
      payments={payments}
      isLoading={isLoading}
      error={error}
      selectedRefs={selectedRefs}
      currentPage={currentPage}
      totalPages={totalPages}
      onRefresh={handleRefresh}
      onPageChange={handlePageChange}
      onUpdateStatus={handleUpdateStatus}
      onDeletePayment={handleDeletePayment}
      onToggleSelect={handleToggleSelect}
      onToggleSelectAll={handleToggleSelectAll}
      onBulkDelete={handleBulkDelete}
    />
  );
}
