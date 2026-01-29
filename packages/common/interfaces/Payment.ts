export enum PaymentStatus {
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Expired = 'EXPIRED',
}

export interface PaymentDTO {
  paymentRef: string;
  merchantId: string;
  amount: string; // Representing BigInt as string
  currency: string;
  tokenAddress?: string;
  chainId?: number;
  status: PaymentStatus;
  txHash?: string;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

export interface CreatePaymentRequest {
  merchantId: string;
  amount: string;
  currency: string;
}

export interface UpdatePaymentStatusRequest {
  status: PaymentStatus;
  txHash?: string;
}
