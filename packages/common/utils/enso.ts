import { EnsoClient } from '@ensofinance/sdk';
import { Effect } from 'effect';
import { parseUnits, type Address } from 'viem';
import { sepolia } from 'viem/chains';

import { stablepayConfig, type StableCoinInfo } from '../config/stablepay';
import { type StableAssetBalance } from '../stores/global';
import type { SwapRequest, SwapRoute } from '../interfaces/swap';

type EnsoRouteParams = Parameters<EnsoClient['getRouteData']>[0];
type EnsoRouteData = Awaited<ReturnType<EnsoClient['getRouteData']>>;

export interface EnsoSpecificOptions {
  apiKey?: string;
  routingStrategy?: EnsoRouteParams['routingStrategy'];
  routeParams?: Partial<EnsoRouteParams>;
}

export type EnsoSwapRequest = SwapRequest & EnsoSpecificOptions;

const normalizeAddress = (value: string) => value.toLowerCase();

const parseAmount = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const findTargetBalance = (
  balances: StableAssetBalance[],
  targetToken: StableCoinInfo,
) =>
  balances.find(
    (balance) =>
      balance.token.chainId === targetToken.chainId &&
      normalizeAddress(balance.token.contractAddress) ===
        normalizeAddress(targetToken.contractAddress),
  );

const selectSourceBalance = (
  balances: StableAssetBalance[],
  targetToken: StableCoinInfo,
  targetAmount: number, // Target amount in unit (e.g. 10.5 USD)
) => {
  // Filter out the target token itself
  const candidates = balances
    .filter(
      (balance) =>
        !(
          balance.token.chainId === targetToken.chainId &&
          normalizeAddress(balance.token.contractAddress) ===
            normalizeAddress(targetToken.contractAddress)
        ) && balance.amount > 0,
    )
    .map((balance) => ({
      balance,
      // Calculate normalized value (assuming 1 unit = 1 USD roughly for stablecoins)
      // balance.amount is the number of units (e.g. 10.5)
      value: balance.amount,
      sameChain: balance.token.chainId === targetToken.chainId,
    }));

  // Filter candidates that have enough value (assuming 1:1 exchange rate as a heuristic)
  // We add a safety factor since 1 USDC != 1 DAI exactly
  const safetyFactor = 1.1;
  const enoughBalance = candidates.filter(
    (candidate) => candidate.value >= targetAmount * safetyFactor,
  );

  const preferred = (
    enoughBalance.length > 0 ? enoughBalance : candidates
  ).sort((a, b) => {
    // Prefer same chain first
    if (a.sameChain !== b.sameChain) return a.sameChain ? -1 : 1;
    // Then prefer higher balance
    return b.value - a.value;
  });

  return preferred[0]?.balance ?? null;
};

const resolveApiKey = (override?: string) =>
  override?.trim() || stablepayConfig.ensoApiKey?.trim() || '';

export const buildEnsoSwapPlan = (
  request: EnsoSwapRequest,
): Effect.Effect<SwapRoute | null, Error> =>
  Effect.gen(function* (_) {
    const targetAmount = parseAmount(request.targetAmount);
    if (targetAmount <= 0) {
      return null;
    }

    const targetBalance = findTargetBalance(
      request.balances,
      request.targetToken,
    );

    if (targetBalance && targetBalance.amount >= targetAmount) {
      return null;
    }

    const sourceBalance = selectSourceBalance(
      request.balances,
      request.targetToken,
      targetAmount,
    );

    if (!sourceBalance) {
      return null;
    }

    const apiKey = resolveApiKey(request.apiKey);
    if (!apiKey) {
      yield* _(Effect.fail(new Error('Enso API key is required.')));
    }

    const client = new EnsoClient({ apiKey });

    // Skip price check on testnets to prevent failures when Enso price API lacks data
    const isTestnet =
      sourceBalance.token.chainId === sepolia.id ||
      request.targetToken.chainId === sepolia.id;

    // Price can be number or string in Enso SDK (Quantity type)
    let sourceTokenPrice: { price: number | string } | undefined;
    let targetTokenPrice: { price: number | string } | undefined;

    if (isTestnet) {
      // Mock 1:1 price parity for testnets
      // This ensures we can calculate a route even if specific token prices are missing
      sourceTokenPrice = { price: 1 };
      targetTokenPrice = { price: 1 };
    } else {
      const prices = yield* _(
        Effect.tryPromise({
          try: () =>
            Promise.all([
              client.getPriceData({
                chainId: sourceBalance.token.chainId,
                address: sourceBalance.token.contractAddress as `0x${string}`,
              }),
              client.getPriceData({
                chainId: request.targetToken.chainId,
                address: request.targetToken.contractAddress as `0x${string}`,
              }),
            ]),
          catch: (error) => new Error(`Failed to fetch prices: ${error}`),
        }),
      );
      sourceTokenPrice = prices[0];
      targetTokenPrice = prices[1];
    }

    if (!sourceTokenPrice?.price || !targetTokenPrice?.price) {
      yield* _(Effect.fail(new Error('Failed to fetch valid token prices')));
    }

    // safe unwrap
    const finalSourcePrice = sourceTokenPrice!;
    const finalTargetPrice = targetTokenPrice!;

    // targetAmount ($) = targetAmount (units) * targetPrice
    // sourceAmount (units) = targetAmount ($) / sourcePrice
    // Add 1% slippage buffer to ensure we cover the target amount after swap fees/slippage
    const targetPrice = Number(finalTargetPrice.price);
    const sourcePrice = Number(finalSourcePrice.price);

    const targetValueUsd = targetAmount * targetPrice;
    const sourceAmountRaw = (targetValueUsd / sourcePrice) * 1.01;

    // Convert the calculated source amount (human-readable) to raw units (BigInt)
    // We use toFixed(decimals) to match the token's precision before parsing
    const fromAmount = parseUnits(
      sourceAmountRaw.toFixed(sourceBalance.token.decimals),
      sourceBalance.token.decimals,
    ).toString();

    const routeParams: EnsoRouteParams = {
      chainId: sourceBalance.token.chainId,
      fromAddress: request.fromAddress as `0x${string}`,
      tokenIn: [sourceBalance.token.contractAddress as `0x${string}`],
      tokenOut: [request.targetToken.contractAddress as `0x${string}`],
      amountIn: [fromAmount],
      routingStrategy: request.routingStrategy ?? 'router',
      receiver: (request.merchantAddress ??
        request.fromAddress) as `0x${string}`,
      spender: request.fromAddress as `0x${string}`,
      ...request.routeParams,
    };

    const routeData = yield* _(
      Effect.tryPromise({
        try: () => client.getRouteData(routeParams),
        catch: (error) => new Error(`Enso route calculation failed: ${error}`),
      }),
    );

    return {
      provider: 'enso',
      fromToken: sourceBalance.token,
      toToken: request.targetToken,
      fromAmount,
      toAmount: request.targetAmount,
      tx: {
        to: routeData.tx.to as Address,
        data: routeData.tx.data as `0x${string}`,
        value: BigInt(routeData.tx.value),
        target: routeData.tx.to as Address, // Enso router is the target for approval
      },
      quote: {
        estimatedGas: routeData.gas.toString(),
        priceImpact: routeData.priceImpact ?? undefined,
      },
    } satisfies SwapRoute;
  });
