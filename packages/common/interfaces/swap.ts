import type { Address } from 'viem';
import type { StableCoinInfo } from '../config/stablepay';
import type { StableAssetBalance } from '../stores/global';

export type SwapProviderId = 'enso' | 'lifi' | 'mock';

export interface SwapRoute {
  provider: SwapProviderId;
  fromToken: StableCoinInfo;
  toToken: StableCoinInfo;
  fromAmount: string; // The amount to spend in atomic units (wei)
  toAmount: string; // The amount to receive in human readable units (e.g. "10.0") matching the request
  
  tx: {
    to: Address;       // The address to send the transaction to (the router/executor)
    data: `0x${string}`; // The transaction calldata
    value: bigint;     // The native value to send (usually 0 for token swaps)
    target: Address;   // The address to approve tokens to (usually same as to, but might differ)
  };
  
  quote: {
    estimatedGas?: string;
    priceImpact?: number | string;
    slippage?: string;
  };
}

export interface SwapRequest {
  balances: StableAssetBalance[];
  targetToken: StableCoinInfo;
  targetAmount: string; // The formatted amount (e.g. "10.0")
  fromAddress: string;
  merchantAddress?: string;
  slippagePercent?: number; // 0-100, default 1 (approx 1%)
}
