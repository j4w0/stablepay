import { WalletOverviewView } from '@stablepay/client-ui';
import {
  supportedStablecoins,
  supportedTestnetStablecoins,
} from '@stablepay/common/config/stablepay';
import { useGlobalStore } from '@stablepay/common/stores/global';
import { useWalletStore } from '@stablepay/common/stores/wallet';
import { erc20Abi } from '@stablepay/common/utils/erc20';
import { useNavigate } from '@tanstack/react-router';
import React, { useEffect } from 'react';
import { formatUnits } from 'viem';
import { useReadContracts } from 'wagmi';
import { api } from '../api';

const DEMO_MERCHANT = {
  merchantId: '11111111-1111-4111-8111-111111111111',
  address: '0x1111111111111111111111111111111111111111',
  currency: 'USD',
  amount: 1,
  networks: [11155111],
} as const;

export const WalletOverviewImpl: React.FC = () => {
  const totalAssetsUsd = useGlobalStore((state) => state.totalAssetsUsd);
  const setStableAssetBalances = useGlobalStore(
    (state) => state.setStableAssetBalances,
  );
  const setLastFetchedAt = useGlobalStore((state) => state.setLastFetchedAt);
  const resetAssets = useGlobalStore((state) => state.resetAssets);
  const { address, reset, status, webAuthnKey } = useWalletStore();
  const navigate = useNavigate();

  const isDev = import.meta.env.DEV;
  const allTokens = isDev ? supportedTestnetStablecoins : supportedStablecoins;
  const refreshIntervalMs = 60 * 1000;
  const shouldFetch = Boolean(address && webAuthnKey && status === 'connected');

  const {
    data: balanceData,
    isFetching,
    refetch,
  } = useReadContracts({
    contracts: allTokens.map((token) => ({
      address: token.contractAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address!],
      chainId: token.chainId,
    })),
    query: {
      enabled: false,
    },
  });

  useEffect(() => {
    if (!shouldFetch) {
      return;
    }

    refetch();
    const intervalId = window.setInterval(() => {
      refetch();
    }, refreshIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refetch, refreshIntervalMs, shouldFetch]);

  useEffect(() => {
    if (!balanceData) {
      return;
    }

    const nextBalances = allTokens.map((token, index) => {
      const fetched = balanceData[index]?.result as unknown as bigint | null;
      const amount = fetched ? Number(formatUnits(fetched, token.decimals)) : 0;
      return {
        token,
        amount,
      };
    });

    setStableAssetBalances(nextBalances);
    setLastFetchedAt(Date.now());
  }, [allTokens, balanceData, setLastFetchedAt, setStableAssetBalances]);

  const handleScan = () => {
    navigate({ to: '/scan' });
  };

  const handleSend = () => {
    navigate({ to: '/send' });
  };

  const handleRefreshBalance = () => {
    if (!shouldFetch) {
      return;
    }

    refetch()
      .then(() => setLastFetchedAt(Date.now()))
      .catch((error) => {
        console.error('Failed to refresh stablecoin balances', error);
      });
  };

  const handleCreateTestTransaction = async () => {
    let merchantAddress: string = DEMO_MERCHANT.address;
    let merchantCurrency: string = DEMO_MERCHANT.currency;
    let merchantNetworks: number[] = [...DEMO_MERCHANT.networks];

    try {
      const { data } = await api.api.merchants
        .merchants({ id: DEMO_MERCHANT.merchantId })
        .get();

      if (data && typeof data === 'object') {
        merchantAddress = data.address ?? merchantAddress;

        if (
          Array.isArray(data.supportedCurrencies) &&
          data.supportedCurrencies.length > 0
        ) {
          merchantCurrency = data.supportedCurrencies[0] ?? merchantCurrency;
        }

        if (
          Array.isArray(data.supportedNetworkIDs) &&
          data.supportedNetworkIDs.length > 0
        ) {
          merchantNetworks = data.supportedNetworkIDs;
        }
      }
    } catch (error) {
      console.error(
        'Failed to fetch demo merchant details, using fallback',
        error,
      );
    }

    navigate({
      to: '/pay/$address',
      params: { address: merchantAddress },
      search: {
        amount: DEMO_MERCHANT.amount,
        currency: merchantCurrency,
        networks: merchantNetworks,
      },
    });
  };

  const handleReset = () => {
    if (!address) {
      navigate({ to: '/onboarding' });
      return;
    }

    reset();
    resetAssets();
    navigate({ to: '/' });
  };

  return (
    <WalletOverviewView
      balance={Number.isFinite(totalAssetsUsd) ? totalAssetsUsd : 0}
      onScan={handleScan}
      onSend={handleSend}
      onRefreshBalance={handleRefreshBalance}
      isRefreshingBalance={isFetching}
      canRefreshBalance={shouldFetch}
      onCreateTestTransaction={handleCreateTestTransaction}
      onReset={handleReset}
      address={address}
    />
  );
};
