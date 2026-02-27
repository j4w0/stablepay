import {
  createPublicClient,
  createWalletClient,
  formatUnits,
  http,
  parseUnits,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { supportedTestnetStablecoins } from '../packages/common/config/stablepay';
import { erc20Abi } from '../packages/common/utils/erc20';
import {
  getBestUniswapQuote,
  getUniswapSwapCallData,
  UNISWAP_V3_SWAP_ROUTER,
} from '../packages/common/utils/uniswap';

const USDC_SEPOLIA = supportedTestnetStablecoins.find(
  (token) => token.displaySymbol === 'USDC (sepolia)',
);
const JPYC_SEPOLIA = supportedTestnetStablecoins.find(
  (token) => token.displaySymbol === 'JPYC (sepolia)',
);

if (!USDC_SEPOLIA || !JPYC_SEPOLIA) {
  throw new Error('Failed to resolve USDC/JPYC testnet token configuration.');
}

const parseArg = (name) => {
  const prefix = `--${name}=`;
  const match = Bun.argv.find((arg) => arg.startsWith(prefix));
  return match?.slice(prefix.length);
};

const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
if (!privateKey) {
  throw new Error('Missing env `SEPOLIA_PRIVATE_KEY`.');
}

const amountInput = parseArg('amount') ?? process.env.SWAP_AMOUNT_USDC ?? '1';
const slippageBpsInput =
  parseArg('slippageBps') ?? process.env.SLIPPAGE_BPS ?? '100';

const amountIn = parseUnits(amountInput, USDC_SEPOLIA.decimals);
const slippageBps = Number(slippageBpsInput);

if (Number.isNaN(slippageBps) || slippageBps < 0 || slippageBps > 5_000) {
  throw new Error('Invalid slippage bps. Use a value between 0 and 5000.');
}

const account = privateKeyToAccount(privateKey);
const recipient = parseArg('recipient') ?? account.address;

const rpcUrl = process.env.SEPOLIA_RPC_URL;
const transport = rpcUrl ? http(rpcUrl) : http();

const publicClient = createPublicClient({
  chain: sepolia,
  transport,
});

const walletClient = createWalletClient({
  chain: sepolia,
  transport,
  account,
});

const main = async () => {
  console.log('--- USDC -> JPYC swap (Sepolia) ---');
  console.log(`Account: ${account.address}`);
  console.log(`Recipient: ${recipient}`);
  console.log(`Amount In (USDC): ${amountInput}`);
  console.log(`Slippage (bps): ${slippageBps}`);

  const chainId = await publicClient.getChainId();
  if (chainId !== sepolia.id) {
    throw new Error(`Unexpected chain id ${chainId}. Expected ${sepolia.id}.`);
  }

  const usdcBalanceBefore = await publicClient.readContract({
    address: USDC_SEPOLIA.contractAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  });

  if (usdcBalanceBefore < amountIn) {
    throw new Error(
      `Insufficient USDC balance. Have ${formatUnits(usdcBalanceBefore, USDC_SEPOLIA.decimals)} but need ${amountInput}.`,
    );
  }

  const jpycBalanceBefore = await publicClient.readContract({
    address: JPYC_SEPOLIA.contractAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [recipient],
  });

  const quote = await getBestUniswapQuote(
    publicClient,
    USDC_SEPOLIA.contractAddress,
    JPYC_SEPOLIA.contractAddress,
    amountIn,
  );

  if (!quote) {
    throw new Error(
      'No Uniswap quote found. Pool may not exist or has no liquidity.',
    );
  }

  const amountOutMinimum =
    (quote.amountOut * BigInt(10_000 - slippageBps)) / BigInt(10_000);

  console.log(
    `Best quote fee tier: ${quote.fee} | expected out: ${formatUnits(quote.amountOut, JPYC_SEPOLIA.decimals)} JPYC`,
  );
  console.log(
    `Min out after slippage: ${formatUnits(amountOutMinimum, JPYC_SEPOLIA.decimals)} JPYC`,
  );

  console.log('Approving Uniswap router for USDC...');
  const approveTxHash = await walletClient.writeContract({
    account,
    address: USDC_SEPOLIA.contractAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [UNISWAP_V3_SWAP_ROUTER, amountIn],
  });

  await publicClient.waitForTransactionReceipt({
    hash: approveTxHash,
  });
  console.log(`Approve tx confirmed: ${approveTxHash}`);

  const swapCall = getUniswapSwapCallData(
    USDC_SEPOLIA.contractAddress,
    JPYC_SEPOLIA.contractAddress,
    recipient,
    amountIn,
    amountOutMinimum,
    quote.fee,
  );

  console.log('Sending swap transaction...');
  const swapTxHash = await walletClient.sendTransaction({
    account,
    to: swapCall.to,
    data: swapCall.data,
    value: swapCall.value,
    chain: sepolia,
  });

  console.log(`Swap tx sent: ${swapTxHash}`);
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: swapTxHash,
  });
  console.log(`Swap tx confirmed in block ${receipt.blockNumber}`);

  const usdcBalanceAfter = await publicClient.readContract({
    address: USDC_SEPOLIA.contractAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  });
  const jpycBalanceAfter = await publicClient.readContract({
    address: JPYC_SEPOLIA.contractAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [recipient],
  });

  console.log(
    `USDC: ${formatUnits(usdcBalanceBefore, USDC_SEPOLIA.decimals)} -> ${formatUnits(usdcBalanceAfter, USDC_SEPOLIA.decimals)}`,
  );
  console.log(
    `JPYC: ${formatUnits(jpycBalanceBefore, JPYC_SEPOLIA.decimals)} -> ${formatUnits(jpycBalanceAfter, JPYC_SEPOLIA.decimals)}`,
  );
};

await main();
