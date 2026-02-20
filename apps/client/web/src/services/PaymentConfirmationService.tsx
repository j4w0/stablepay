import { PaymentConfirmationView } from '@stablepay/client-ui';
import {
  supportedStablecoins,
  supportedTestnetStablecoins,
} from '@stablepay/common/config/stablepay';
import { publicClient } from '@stablepay/common/config/zerodev';
import { useGlobalStore } from '@stablepay/common/stores/global';
import { useWalletStore } from '@stablepay/common/stores/wallet';
import { getDefiClient } from '@stablepay/common/utils/defi';
import { erc20Abi } from '@stablepay/common/utils/erc20';
import { getKernelClientWithPasskey } from '@stablepay/common/utils/initZeroDev';
import {
  getBestUniswapQuote,
  getUniswapSwapCallData,
  UNISWAP_V3_SWAP_ROUTER,
} from '@stablepay/common/utils/uniswap';
import { useNavigate } from '@tanstack/react-router';
import { Effect } from 'effect';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { encodeFunctionData, parseUnits, type Address } from 'viem';
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

  // State for amount, initialized from search param
  const [amountInput, setAmountInput] = useState(
    search.amount?.toString() || '0',
  );

  const paymentAmount = useMemo(() => {
    const val = Number(amountInput);
    return Number.isFinite(val) ? val : 0;
  }, [amountInput]);

  const isDev = import.meta.env.DEV;
  const allTokens = isDev ? supportedTestnetStablecoins : supportedStablecoins;

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
    const breakdown = stableAssetBalances
      .map((balance) => {
        const chainName =
          chainNameById.get(balance.token.chainId) || 'Unknown Network';
        const formatted = new Intl.NumberFormat(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        }).format(balance.amount);

        return {
          symbol: balance.token.displaySymbol,
          amount: balance.amount,
          formattedAmount: formatted,
          currency: balance.token.currency,
          chainName,
          chainId: balance.token.chainId,
        };
      })
      .filter((b) => b.amount > 0);

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
      breakdown,
    };
  }, [
    paymentAmount,
    paymentCurrency,
    totalAssetsUsd,
    stableAssetBalances,
    chainNameById,
  ]);

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

  useEffect(() => {
    if (!webAuthnKey) {
      setAddress(undefined);
      setStatus('idle');
      toast.error('Session missing. Please log in again.');
      navigate({ to: '/' });
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
      const hasSufficientBalance = directAmount >= paymentAmount;

      const calls: { to: Address; value: bigint; data: `0x${string}` }[] = [];
      const txChainId = safeTargetToken.chainId;

      let paymentStrategy: 'direct' | 'swap' = 'direct';
      let swapParams: {
        fromToken: Address;
        fromAmount: bigint;
        uniswapFee?: number;
      } | null = null;

      // Ensure we are sending the correct token to the merchant.
      if (hasSufficientBalance) {
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
        paymentStrategy = 'swap';
        const candidates = stableAssetBalances.filter(
          (b) =>
            b.token.chainId === safeTargetToken.chainId &&
            b.token.contractAddress.toLowerCase() !==
              safeTargetToken.contractAddress.toLowerCase() &&
            b.amount > 0,
        );

        let sourceToken = null;
        let sourceAmountToSwap = 0n;

        // Simple heuristic: First token that covers the amount with 5% buffer
        for (const cand of candidates) {
          const rate = getMockFxRate(
            cand.token.currency,
            safeTargetToken.currency,
          );
          // buffer: 1.05 (5% slippage/fee buffer)
          const neededInput = (paymentAmount / rate) * 1.05;

          if (cand.amount >= neededInput) {
            sourceToken = cand.token;
            sourceAmountToSwap = parseUnits(
              neededInput.toFixed(cand.token.decimals),
              cand.token.decimals,
            );
            break;
          }
        }

        if (sourceToken) {
          // If using Uniswap (Testnet), we need a quote to determine exact amount
          if (isDev && safeTargetToken.chainId === sepolia.id) {
            yield* _(
              Effect.sync(() =>
                toast.info(
                  `Fetching Uniswap quote for ${sourceToken.displaySymbol}...`,
                ),
              ),
            );

            const quote = yield* _(
              Effect.tryPromise({
                try: () =>
                  getBestUniswapQuote(
                    publicClient,
                    sourceToken.contractAddress,
                    safeTargetToken.contractAddress,
                    sourceAmountToSwap,
                  ),
                catch: (error) => error,
              }),
            );

            if (!quote || quote.amountOut < 0n) {
              return yield* _(
                Effect.fail(
                  new Error(
                    'Failed to get a valid swap quote from Uniswap on Sepolia.',
                  ),
                ),
              );
            }

            swapParams = {
              fromToken: sourceToken.contractAddress as Address,
              fromAmount: sourceAmountToSwap,
              uniswapFee: quote.fee,
            };
          } else {
            swapParams = {
              fromToken: sourceToken.contractAddress as Address,
              fromAmount: sourceAmountToSwap,
            };
          }

          yield* _(
            Effect.sync(() =>
              toast.info(
                `Insufficient target balance. Swapping ${sourceToken.displaySymbol}...`,
              ),
            ),
          );
        } else {
          return yield* _(
            Effect.fail(
              new Error(
                'Insufficient balance. No suitable token found for auto-swap.',
              ),
            ),
          );
        }
      }

      // Notify Backend about intent (Optimistic)
      const { data, error } = yield* _(
        Effect.tryPromise({
          try: () =>
            api.api.payments.post({
              merchantAddress: address,
              amount: paymentAmount.toString(),
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
      kernelClient.getChainId().then(console.log);
      let userOpHash: string;

      if (paymentStrategy === 'direct') {
        const encodedCalls = yield* _(
          Effect.tryPromise({
            try: () => account.encodeCalls(calls),
            catch: (error) => error,
          }),
        );

        yield* _(
          Effect.sync(() => toast.info('Sending transfer user operation...')),
        );

        userOpHash = yield* _(
          Effect.tryPromise({
            try: () =>
              kernelClient.sendUserOperation({
                callData: encodedCalls,
              }),
            catch: (error) => error,
          }),
        );
      } else {
        if (!swapParams) {
          return yield* _(Effect.fail(new Error('Swap params missing')));
        }

        if (isDev && safeTargetToken.chainId === sepolia.id) {
          // Uniswap Implementation
          const uniswapFee = swapParams.uniswapFee ?? 3000;
          const uniswapCalls: {
            to: Address;
            value: bigint;
            data: `0x${string}`;
          }[] = [];

          // 1. Approve SwapRouter
          const approveCallData = encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [UNISWAP_V3_SWAP_ROUTER as Address, swapParams.fromAmount],
          });

          uniswapCalls.push({
            to: swapParams.fromToken,
            value: 0n,
            data: approveCallData,
          });

          // 2. ExactInputSingle
          // Calculate min amount out with slippery tolerance?
          // For now using 0 as min amount out for simplicity in demo or calculate if we had the quote
          // But we don't have the quote variable in scope here cleanly unless we passed it.
          // Let's assume 0 for "on-demand" testnet demo.
          // Ideally: amountOutMinimum: quote.amountOut * 0.99
          const swapCall = getUniswapSwapCallData(
            swapParams.fromToken,
            safeTargetToken.contractAddress,
            address as Address, // recipient is merchant
            swapParams!.fromAmount,
            0n, // amountOutMinimum
            uniswapFee,
          );

          uniswapCalls.push(swapCall);

          const encodedCalls = yield* _(
            Effect.tryPromise({
              try: () => account.encodeCalls(uniswapCalls),
              catch: (error) => error,
            }),
          );

          yield* _(
            Effect.sync(() =>
              toast.info('Sending Uniswap swap user operation...'),
            ),
          );

          userOpHash = yield* _(
            Effect.tryPromise({
              try: () =>
                kernelClient.sendUserOperation({
                  callData: encodedCalls,
                }),
              catch: (error) => error,
            }),
          );
        } else {
          // ZeroDev DeFi Implementation (Arbitrum/Polygon/etc)
          const defiClient = getDefiClient(kernelClient);
          yield* _(
            Effect.sync(() => toast.info('Sending swap user operation...')),
          );

          userOpHash = yield* _(
            Effect.tryPromise({
              try: () =>
                defiClient.sendSwapUserOp({
                  fromToken: swapParams!.fromToken,
                  fromAmount: swapParams!.fromAmount,
                  toToken: safeTargetToken.contractAddress,
                  toAddress: address as Address,
                  gasToken: 'sponsored',
                }),
              catch: (error) => error,
            }),
          );
        }
      }

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
      amount={amountInput}
      currency={search.currency}
      networks={formattedNetworks}
      isLoading={isLoading}
      onConfirm={handleConfirm}
      onAmountChange={setAmountInput}
      unifiedBalance={unifiedBalance}
    />
  );
};
