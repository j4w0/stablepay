import type { Address } from 'viem';
type UUIDV4 = string;
export enum MerchantQRCodeVersion {
  V1_0 = '1.0',
}

export enum MerchantInfoDataVersion {
  V1_0 = '1.0',
}

export type MerchantQRCodeData = MerchantQRCodeDataV1_0;

export interface MerchantQRCodeDataV1_0 {
  version: MerchantQRCodeVersion.V1_0;
  merchantId: UUIDV4;
  address: Address;
  supportedNetworkIDs: number[];
  paymentRequest?: {
    amount: bigint;
    currency: string; // e.g., 'BTC', 'ETH', 'USD'
  };
}

export interface MerchantInfoDataV1_0 {
  version: MerchantInfoDataVersion.V1_0;
  merchantId: UUIDV4;
  address: Address;
  supportedNetworkIDs: number[];
  supportedCurrencies: string[];
  metadata: {
    name: string;
    physicalAddress?: string;
    description?: string;
    websiteUrl?: string;
    email?: string;
    phoneNumber?: string;
    logoUrl?: string;
    [key: string]: string | undefined;
  };
}
