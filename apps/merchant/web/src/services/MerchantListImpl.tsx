import { api } from '@/services/api';
import type { MerchantInfoDataV1_0 } from '@stablepay/common/interfaces/Merchant';
import {
  MerchantListView,
  type MerchantListViewProps,
} from '@stablepay/merchant-ui';
import { Effect } from 'effect';
import { useCallback, useEffect, useState } from 'react';

export function MerchantList() {
  const [merchants, setMerchants] = useState<MerchantInfoDataV1_0[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 12;

  const fetchMerchants = useCallback(
    (reset = false, currentOffset = 0) => {
      const fetchEffect = Effect.gen(function* (_) {
        yield* _(
          Effect.sync(() => {
            setIsLoading(true);
            setError(undefined);
          })
        );

        const response = yield* _(
          Effect.tryPromise({
            try: () =>
              api.api.merchants.get({
                query: {
                  limit: limit.toString(),
                  offset: currentOffset.toString(),
                },
              }),
            catch: (error) => error,
          })
        );

        if (response.error) {
          yield* _(Effect.fail(new Error('Failed to fetch merchants')));
        }

        const newMerchants = response.data as MerchantInfoDataV1_0[];

        yield* _(
          Effect.sync(() => {
            if (reset) {
              setMerchants(newMerchants);
              setOffset(limit);
            } else {
              setMerchants((prev) => [...prev, ...newMerchants]);
              setOffset((prev) => prev + limit);
            }

            setHasMore(newMerchants.length === limit);
          })
        );
      }).pipe(
        Effect.catchAll((err) =>
          Effect.sync(() => {
            setError(err instanceof Error ? err.message : 'An error occurred');
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
    fetchMerchants(true, 0);
  }, [fetchMerchants]);

  const handleLoadMore = useCallback(() => {
    fetchMerchants(false, offset);
  }, [fetchMerchants, offset]);

  const handleRefresh = useCallback(() => {
    fetchMerchants(true, 0);
  }, [fetchMerchants]);

  const props: MerchantListViewProps = {
    merchants,
    isLoading,
    error,
    limit,
    offset,
    onLoadMore: handleLoadMore,
    onRefresh: handleRefresh,
    hasMore,
  };

  return <MerchantListView {...props} />;
}
