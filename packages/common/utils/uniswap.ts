import {
  type Address,
  type PublicClient,
  encodeFunctionData,
  parseAbi,
} from 'viem';

// Sepolia Addresses
export const UNISWAP_V3_FACTORY = '0x0227628f3F023bb0B980b67D528571c95c6DaC1c';
export const UNISWAP_V3_QUOTER_V2 =
  '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3';
// Using SwapRouter02
export const UNISWAP_V3_SWAP_ROUTER =
  '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E';

// Fees to check: 0.05%, 0.3%, 1%
export const FEE_TIERS = [500, 3000, 10000];

const FACTORY_ABI = parseAbi([
  'function getPool(address tokenA, address tokenB, uint24 fee) view returns (address pool)',
]);

const QUOTER_V2_ABI = parseAbi([
  'struct QuoteExactInputSingleParams { address tokenIn; address tokenOut; uint256 amountIn; uint24 fee; uint160 sqrtPriceLimitX96; }',
  'function quoteExactInputSingle(QuoteExactInputSingleParams params) public returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
]);

const SWAP_ROUTER_ABI = parseAbi([
  'struct ExactInputSingleParams { address tokenIn; address tokenOut; uint24 fee; address recipient; uint256 amountIn; uint256 amountOutMinimum; uint160 sqrtPriceLimitX96; }',
  'function exactInputSingle(ExactInputSingleParams params) external payable returns (uint256 amountOut)',
]);

export interface UniswapQuote {
  amountOut: bigint;
  fee: number;
}

export const getBestUniswapQuote = async (
  client: PublicClient,
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint,
): Promise<UniswapQuote | null> => {
  let bestQuote: UniswapQuote | null = null;

  for (const fee of FEE_TIERS) {
    // 1. Check if pool exists
    try {
      const poolAddress = await client.readContract({
        address: UNISWAP_V3_FACTORY,
        abi: FACTORY_ABI,
        functionName: 'getPool',
        args: [tokenIn, tokenOut, fee],
      });

      if (poolAddress === '0x0000000000000000000000000000000000000000') {
        continue;
      }

      // 2. Get Quote
      // define params struct
      const params = {
        tokenIn,
        tokenOut,
        amountIn,
        fee,
        sqrtPriceLimitX96: 0n,
      };

      // Use simulateContract ot call to get the return value since QuoterV2 changes state but we want the return
      // Actually QuoterV2 allows static call.
      // In viem, readContract uses eth_call.
      const result = await client.readContract({
        address: UNISWAP_V3_QUOTER_V2,
        abi: QUOTER_V2_ABI,
        functionName: 'quoteExactInputSingle',
        args: [params],
      });

      // result is [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate]
      const amountOut = result[0];

      if (bestQuote === null || amountOut > bestQuote.amountOut) {
        bestQuote = {
          amountOut,
          fee,
        };
      }
    } catch (e) {
      // Ignore errors (pool might not exist or low liquidity causing revert)
      console.warn(`Failed to quote for fee ${fee}`, e);
    }
  }

  return bestQuote;
};

export const getUniswapSwapCallData = (
  tokenIn: Address,
  tokenOut: Address,
  recipient: Address,
  amountIn: bigint,
  amountOutMinimum: bigint,
  fee: number,
) => {
  const params = {
    tokenIn,
    tokenOut,
    fee,
    recipient,
    amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96: 0n,
  };

  const data = encodeFunctionData({
    abi: SWAP_ROUTER_ABI,
    functionName: 'exactInputSingle',
    args: [params],
  });

  return {
    to: UNISWAP_V3_SWAP_ROUTER as Address,
    value: 0n,
    data,
  };
};
