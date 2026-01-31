import type { Address } from 'viem';
import { arbitrum, polygon, sepolia } from 'viem/chains';

export const stablepayConfig = {
  clientBaseUrl: 'http://localhost:5173',
};

export interface StableCoinInfo {
  displaySymbol: string;
  displayName: string;
  contractAddress: Address;
  decimals: number;
  chainId: number;
  currency: string;
  iconURL?: string;
}

export const supportedStablecoins: StableCoinInfo[] = [
  {
    displaySymbol: 'USDC',
    displayName: 'USD Coin',
    contractAddress: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    decimals: 6,
    chainId: arbitrum.id,
    currency: 'USD',
  },
  {
    displaySymbol: 'USDC',
    displayName: 'USD Coin',
    contractAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
    decimals: 6,
    chainId: polygon.id,
    currency: 'USD',
  },
  {
    displaySymbol: 'JPYC',
    displayName: 'JPY Coin',
    contractAddress: '0xe7c3d8c9a439fede00d2600032d5db0be71c3c29',
    decimals: 18,
    currency: 'JPY',
    chainId: polygon.id,
  },
];

export const supportedTestnetStablecoins: StableCoinInfo[] = [
  {
    displaySymbol: 'JPYC (sepolia)',
    displayName: 'JPY Coin (sepolia)',
    contractAddress: '0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29',
    decimals: 18,
    chainId: sepolia.id,
    currency: 'JPY',
  },
  {
    displayName: 'USDC Coin (sepolia)',
    displaySymbol: 'USDC (sepolia)',
    contractAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    decimals: 6,
    currency: 'USD',
    chainId: sepolia.id,
  },
  {
    displayName: 'EUR Coin (sepolia)',
    displaySymbol: 'EURC (sepolia)',
    contractAddress: '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4',
    decimals: 6,
    currency: 'EUR',
    chainId: sepolia.id,
  },
];
