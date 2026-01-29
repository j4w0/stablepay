import {
  PaymentConfirmationView,
  type SwapRouteInfo,
} from '@stablepay/client-ui';
import {
  supportedStablecoins,
  supportedTestnetStablecoins,
} from '@stablepay/common/config/stablepay';
import { publicClient } from '@stablepay/common/config/zerodev';
import { type SwapRoute } from '@stablepay/common/interfaces/swap';
import { useGlobalStore } from '@stablepay/common/stores/global';
import { useWalletStore } from '@stablepay/common/stores/wallet';
import { buildEnsoSwapPlan } from '@stablepay/common/utils/enso';
import { erc20Abi } from '@stablepay/common/utils/erc20';
import { getKernelClientWithPasskey } from '@stablepay/common/utils/initZeroDev';
import { useNavigate } from '@tanstack/react-router';
import { Effect } from 'effect';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  encodeFunctionData,
  formatUnits,
  parseUnits,
  type Address,
} from 'viem';
import { arbitrum, polygon, sepolia } from 'viem/chains';
import { api } from '../api';
import { Route } from '../routes/pay/$address';

export const PaymentConfirmationService = () => {
  const { address } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [merchantName, setMerchantName] = useState<string | undefined>(
    undefined,
  );
  const [swapPlan, setSwapPlan] = useState<SwapRoute | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  const {
    webAuthnKey,
    setAddress,
    setStatus,
    address: smartWalletAddress,
  } = useWalletStore();
  const stableAssetBalances = useGlobalStore(
    (state) => state.stableAssetBalances,
  );
  const totalAssetsUsd = useGlobalStore((state) => state.totalAssetsUsd);

  const paymentCurrency = search.currency || 'USD';
  const paymentAmountRaw = Number(search.amount || '0');
  const paymentAmount = Number.isFinite(paymentAmountRaw)
    ? paymentAmountRaw
    : 0;

  const isDev = import.meta.env.DEV;
  const allTokens = isDev ? supportedTestnetStablecoins : supportedStablecoins;

  // Identify Target Token
  const targetToken = useMemo(() => {
    const targetChainId =
      search.networks?.[0] ?? (isDev ? sepolia.id : arbitrum.id);
    const targetSymbol = search.currency ?? 'USDC';
    return allTokens.find(
      (t) => t.currency === targetSymbol && t.chainId === targetChainId,
    );
  }, [search.networks, search.currency, allTokens, isDev]);

  // Determine if we can pay directly
  const directBalance = useMemo(() => {
    if (!targetToken) return undefined;
    return stableAssetBalances.find(
      (b) =>
        b.token.chainId === targetToken.chainId &&
        b.token.contractAddress.toLowerCase() ===
          targetToken.contractAddress.toLowerCase(),
    );
  }, [targetToken, stableAssetBalances]);

  const isDirectPayment = useMemo(() => {
    const directAmount = directBalance?.amount ?? 0;
    return directAmount >= paymentAmount;
  }, [directBalance, paymentAmount]);

  // Calculate Swap Route if needed
  useEffect(() => {
    if (
      isDirectPayment ||
      !targetToken ||
      !smartWalletAddress ||
      !address ||
      paymentAmount === 0
    ) {
      setSwapPlan(null);
      return;
    }

    const calcRouteEffect = Effect.gen(function* (_) {
      yield* _(Effect.sync(() => setIsCalculatingRoute(true)));

      const plan = yield* _(
        buildEnsoSwapPlan({
          balances: stableAssetBalances,
          targetToken,
          targetAmount: paymentAmount.toString(),
          fromAddress: smartWalletAddress,
          merchantAddress: address,
        }),
      );

      yield* _(Effect.sync(() => setSwapPlan(plan)));
      yield* _(Effect.sync(() => setIsCalculatingRoute(false)));
    });

    Effect.runPromise(
      calcRouteEffect.pipe(
        Effect.tapError((error) =>
          Effect.sync(() => {
            console.error('Failed to calculate route:', error);
            setIsCalculatingRoute(false);
          }),
        ),
      ),
    );
  }, [
    isDirectPayment,
    targetToken,
    smartWalletAddress,
    address,
    paymentAmount,
    stableAssetBalances,
  ]);

  const chainNameById = useMemo(
    () =>
      new Map<number, string>([
        [arbitrum.id, arbitrum.name],
        [polygon.id, polygon.name],
        [sepolia.id, sepolia.name],
      ]),
    [],
  );

  const formattedNetworks = useMemo(() => {
    const raw = search.networks;
    if (!raw || raw.length === 0) return undefined;

    const ids = raw.filter((value) => Number.isFinite(value));

    const mapIdToName = (id: number) =>
      `${chainNameById.get(id) ?? 'Unknown'} (${id})`;

    const uniqueIds = Array.from(new Set(ids));
    return uniqueIds.map(mapIdToName).join(', ');
  }, [chainNameById, search.networks]);

  // TODO: Replace with real FX rates from API
  const getMockFxRate = (from: string, to: string) => {
    // 1 USD = X Currency
    const rates: Record<string, number> = {
      USD: 1,
      JPY: 150,
      EUR: 0.92,
    };
    // Convert from -> USD -> to
    // Amount(USD) = Amount(From) / Rate(From)
    // Amount(To) = Amount(USD) * Rate(To)
    // Factor = Rate(To) / Rate(From)
    const rateFrom = rates[from];
    const rateTo = rates[to];
    if (!rateFrom || !rateTo) return 1;
    return rateTo / rateFrom;
  };

  const unifiedBalance = useMemo(() => {
    const rate = getMockFxRate('USD', paymentCurrency);
    const amount =
      (Number.isFinite(totalAssetsUsd) ? totalAssetsUsd : 0) * rate;
    const formattedAmount = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return {
      amount,
      formattedAmount,
      currency: paymentCurrency,
      hasEnoughBalance: amount >= paymentAmount,
    };
  }, [paymentAmount, paymentCurrency, totalAssetsUsd]);

  useEffect(() => {
    if (!address) return;

    const fetchMerchantEffect = Effect.tryPromise({
      try: async () => {
        const { data } = await api.api.merchants.lookup({ address }).get();
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
          }),
        ),
        Effect.tapError((error) =>
          Effect.sync(() => {
            console.error('Failed to fetch merchant details:', error);
          }),
        ),
      ),
    );
  }, [address]);

  const routeInfo: SwapRouteInfo | undefined = useMemo(() => {
    if (!swapPlan) return undefined;
    return {
      fromTokenSymbol: swapPlan.fromToken.displaySymbol,
      fromAmount: formatUnits(
        BigInt(swapPlan.fromAmount),
        swapPlan.fromToken.decimals,
      ),
      fromChainId: swapPlan.fromToken.chainId,
      toTokenSymbol: swapPlan.toToken.displaySymbol,
      toAmount: swapPlan.toAmount,
      toChainId: swapPlan.toToken.chainId,
    };
  }, [swapPlan]);

  useEffect(() => {
    if (!webAuthnKey) {
      setAddress(undefined);
      setStatus('idle');
      toast.error('Session missing. Please log in again.');
      navigate({ to: '/onboarding' });
    }
  }, [navigate, webAuthnKey, setAddress, setStatus]);

  const handleConfirm = () => {
    const confirmEffect = Effect.gen(function* (_) {
      yield* _(
        Effect.sync(() => {
          setIsLoading(true);
        }),
      );

      if (!webAuthnKey) {
        yield* _(
          Effect.fail(new Error('Session missing. Please log in again.')),
        );
      }

      // 1. Identify Target Token
      const targetChainId =
        search.networks?.[0] ?? (isDev ? sepolia.id : arbitrum.id);
      const targetSymbol = search.currency ?? 'USDC';

      const targetToken = allTokens.find(
        (t) => t.currency === targetSymbol && t.chainId === targetChainId,
      );

      if (!targetToken) {
        yield* _(
          Effect.fail(
            new Error(
              `Unsupported target currency: ${targetSymbol} on chain ${targetChainId}`,
            ),
          ),
        );
      }

      // Filter undefined to keep type safety; targetToken is guaranteed not null here due to yield* fail above?
      // Actually yield* fail throws, so yes.
      // But TS might not know.
      const safeTargetToken = targetToken!;

      // 2. Check Direct Balance
      const directBalance = stableAssetBalances.find(
        (b) =>
          b.token.chainId === safeTargetToken.chainId &&
          b.token.contractAddress.toLowerCase() ===
            safeTargetToken.contractAddress.toLowerCase(),
      );

      const directAmount = directBalance?.amount ?? 0;
      const isDirectPayment = directAmount >= paymentAmount;

      let calls: { to: Address; value: bigint; data: `0x${string}` }[] = [];
      let txChainId = safeTargetToken.chainId;
      // Used for API reporting - what did we ACTUALLY send?
      // The API seems to want "what the merchant received" details?
      // "tokenAddress: mockToken.contractAddress".
      // If payment is SWAP, user sends Token A, Merchant gets Token B.
      // API likely tracks the PAYMENT intent (Token B).

      if (isDirectPayment) {
        const amountWei = parseUnits(
          paymentAmount.toFixed(safeTargetToken.decimals),
          safeTargetToken.decimals,
        );
        const callData = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [address as Address, amountWei],
        });
        calls.push({
          to: safeTargetToken.contractAddress as Address,
          value: 0n,
          data: callData,
        });
      } else {
        yield* _(Effect.sync(() => toast.info('Calculating swap route...')));

        const plan = yield* _(
          buildEnsoSwapPlan({
            balances: stableAssetBalances,
            targetToken: safeTargetToken,
            targetAmount: paymentAmount.toString(),
            fromAddress: smartWalletAddress!,
            merchantAddress: address,
          }),
        );

        if (!plan) {
          yield* _(
            Effect.fail(new Error('Insufficient balance or no route found')),
          );
        }

        const safePlan = plan!;

        txChainId = safePlan.fromToken.chainId;
        const swapRouter = safePlan.tx.target;
        const approveAmount = BigInt(safePlan.fromAmount);

        // Approve
        const approveData = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [swapRouter, approveAmount],
        });
        calls.push({
          to: safePlan.fromToken.contractAddress as Address,
          value: 0n,
          data: approveData,
        });

        // Swap
        calls.push({
          to: safePlan.tx.to,
          value: safePlan.tx.value,
          data: safePlan.tx.data,
        });
      }

      // Notify Backend about intent (Optimistic)
      const { data, error } = yield* _(
        Effect.tryPromise({
          try: () =>
            api.api.payments.post({
              merchantAddress: address,
              amount: search.amount?.toString() || '0',
              currency: search.currency || 'USDC',
              tokenAddress: safeTargetToken.contractAddress, // Merchant expects this
              chainId: safeTargetToken.chainId,
            }),
          catch: (error) => error,
        }),
      );

      if (error) {
        yield* _(Effect.fail(new Error(JSON.stringify(error.value))));
      }

      if (!data || typeof data !== 'object' || !('paymentRef' in data)) {
        yield* _(
          Effect.fail(new Error('Invalid payment initialization response')),
        );
      }
      const paymentData = data as { paymentRef: string };

      yield* _(Effect.sync(() => toast.info('Preparing session account...')));

      const { kernelClient, account } = yield* _(
        Effect.tryPromise({
          try: () =>
            getKernelClientWithPasskey(
              publicClient,
              txChainId,
              webAuthnKey!,
              smartWalletAddress,
            ),
          catch: (error) => error,
        }),
      );

      const encodedCalls = yield* _(
        Effect.tryPromise({
          try: () => account.encodeCalls(calls),
          catch: (error) => error,
        }),
      );

      yield* _(Effect.sync(() => toast.info('Sending user operation...')));

      const userOpHash = yield* _(
        Effect.tryPromise({
          try: () =>
            kernelClient.sendUserOperation({
              callData: encodedCalls,
            }),
          catch: (error) => error,
        }),
      );

      console.log('User Operation Hash:', userOpHash);

      const { error: updateError } = yield* _(
        Effect.tryPromise({
          try: () =>
            api.api.payments({ ref: paymentData.paymentRef }).put({
              txHash: userOpHash,
            }),
          catch: (error) => error,
        }),
      );

      if (updateError) {
        yield* _(
          Effect.sync(() => {
            console.error('Failed to update payment hash:', updateError.value);
            toast.error('Payment submitted, but tracking update failed.');
          }),
        );
      }

      yield* _(
        Effect.sync(() => {
          toast.success('Payment submitted. Tracking on-chain status...');
          navigate({
            to: '/payment/$ref',
            params: { ref: paymentData.paymentRef },
          });
        }),
      );
    }).pipe(
      Effect.catchAll((err) =>
        Effect.sync(() => {
          const message =
            err instanceof Error ? err.message : 'Failed to process payment';
          toast.error(message);
          console.error(err);
        }),
      ),
      Effect.ensuring(
        Effect.sync(() => {
          setIsLoading(false);
        }),
      ),
    );

    return Effect.runPromise(confirmEffect);
  };

  return (
    <PaymentConfirmationView
      merchantAddress={address}
      merchantName={merchantName}
      amount={search.amount.toString()}
      currency={search.currency}
      networks={formattedNetworks}
      isLoading={isLoading}
      onConfirm={handleConfirm}
      unifiedBalance={unifiedBalance}
      routeInfo={routeInfo}
      isCalculatingRoute={isCalculatingRoute}
    />
  );
};
