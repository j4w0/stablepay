import { AssetsSidebarView, type AssetBalanceItem } from '@stablepay/client-ui';
import {
  supportedStablecoins,
  supportedTestnetStablecoins,
} from '@stablepay/common/config/stablepay';
import { useGlobalStore } from '@stablepay/common/stores/global';
import { useWalletStore } from '@stablepay/common/stores/wallet';
import { erc20Abi } from '@stablepay/common/utils/erc20';
import { useEffect } from 'react';
import { formatUnits } from 'viem';
import { useReadContracts } from 'wagmi';
import { isSidebarActive } from '../utils/walletConnection';

const balanceKey = (chainId: number, contractAddress: string) =>
  `${chainId}:${contractAddress.toLowerCase()}`;

const formatMoney = (value: number) => {
  if (!Number.isFinite(value)) return '0.00';
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const AssetsSidebarService = () => {
  const denominationCurrency = 'USD';
  const { webAuthnKey, status, address: storedAddress } = useWalletStore();

  const setStableAssetBalances = useGlobalStore(
    (state) => state.setStableAssetBalances
  );
  const totalAssetsUsd = useGlobalStore((state) => state.totalAssetsUsd);
  const stableAssetBalances = useGlobalStore(
    (state) => state.stableAssetBalances
  );
  const lastFetchedAt = useGlobalStore((state) => state.lastFetchedAt);
  const setLastFetchedAt = useGlobalStore((state) => state.setLastFetchedAt);

  const activeAddress = storedAddress;
  const isWalletConnected = isSidebarActive(status, webAuthnKey, activeAddress);

  const isDev = import.meta.env.DEV;
  const allTokens = isDev ? supportedTestnetStablecoins : supportedStablecoins;

  const refreshIntervalMs = 5 * 60 * 1000;
  const shouldFetch = isWalletConnected;

  const {
    data: balanceData,
    isFetching,
    refetch,
  } = useReadContracts({
    contracts: allTokens.map((token) => ({
      address: token.contractAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [activeAddress!],
      chainId: token.chainId,
    })),
    query: {
      enabled: false,
    },
  });

  const storedBalanceMap = new Map(
    stableAssetBalances.map((balance) => [
      balanceKey(balance.token.chainId, balance.token.contractAddress),
      balance.amount,
    ])
  );

  const assets: AssetBalanceItem[] = allTokens
    .map((token, index) => {
      const fetched = balanceData?.[index]?.result as unknown as bigint | null;
      const storedAmount =
        storedBalanceMap.get(
          balanceKey(token.chainId, token.contractAddress)
        ) ?? 0;
      const formattedBalance = fetched
        ? formatUnits(fetched, token.decimals)
        : storedAmount.toString();
      return {
        token,
        formattedBalance,
      } satisfies AssetBalanceItem;
    })
    .filter((item) => {
      if (isWalletConnected) {
        return true;
      }
      const n = Number(item.formattedBalance);
      return Number.isFinite(n) && n > 0;
    })
    .sort((a, b) => Number(b.formattedBalance) - Number(a.formattedBalance));

  useEffect(() => {
    if (!shouldFetch) {
      return;
    }

    const now = Date.now();
    const isStale =
      lastFetchedAt === null || now - lastFetchedAt >= refreshIntervalMs;

    if (isStale) {
      refetch();
    }

    const intervalId = window.setInterval(() => {
      refetch();
    }, refreshIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [lastFetchedAt, refreshIntervalMs, refetch, shouldFetch]);

  const handleRefresh = () => {
    if (!shouldFetch) {
      return;
    }
    refetch()
      .then(() => setLastFetchedAt(Date.now()))
      .catch((e) => {
        setLastFetchedAt(Date.now());
        console.error(e);
      });
  };

  useEffect(() => {
    if (!balanceData) {
      return;
    }

    const nextBalances = allTokens.map((token, index) => {
      const fetched = balanceData?.[index]?.result as unknown as bigint | null;
      const amount = fetched ? Number(formatUnits(fetched, token.decimals)) : 0;
      return {
        token,
        amount,
      };
    });

    const isSameLength = nextBalances.length === stableAssetBalances.length;
    const isSameValues = isSameLength
      ? nextBalances.every((nextBalance, idx) => {
          const current = stableAssetBalances[idx];
          return (
            current?.token.contractAddress.toLowerCase() ===
              nextBalance.token.contractAddress.toLowerCase() &&
            current?.token.chainId === nextBalance.token.chainId &&
            current?.amount === nextBalance.amount
          );
        })
      : false;

    if (!isSameValues) {
      setStableAssetBalances(nextBalances);
    }

    setLastFetchedAt(Date.now());
  }, [
    allTokens,
    balanceData,
    setLastFetchedAt,
    setStableAssetBalances,
    stableAssetBalances,
  ]);

  return (
    <AssetsSidebarView
      isLoading={isFetching}
      isConnected={isWalletConnected}
      denominationCurrency={denominationCurrency}
      totalAmountFormatted={formatMoney(totalAssetsUsd)}
      assets={assets}
      lastUpdatedAt={lastFetchedAt}
      onRefresh={handleRefresh}
    />
  );
};
