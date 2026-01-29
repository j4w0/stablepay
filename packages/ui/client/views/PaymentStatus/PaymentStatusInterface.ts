import type { PaymentStatus } from '@stablepay/common/interfaces/Payment';

export interface PaymentStatusProps {
  status: PaymentStatus;
  amount: string;
  currency: string;
  txHash?: string;
  chainId?: number;
  merchantName?: string;
  updatedAt?: string;
  onRefresh?: () => void;
}
