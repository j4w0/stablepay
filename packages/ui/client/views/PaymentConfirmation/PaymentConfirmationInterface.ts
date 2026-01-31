export interface BalanceBreakdownItem {
  symbol: string;
  amount: number;
  formattedAmount: string;
  currency: string;
  chainName: string;
  chainId: number;
}

export interface UnifiedBalanceInfo {
  amount: number;
  formattedAmount: string;
  currency: string;
  hasEnoughBalance: boolean;
  breakdown: BalanceBreakdownItem[];
}

export interface PaymentConfirmationProps {
  merchantAddress: string;
  merchantName?: string;
  amount?: string;
  currency?: string;
  networks?: string;
  isLoading?: boolean;
  onConfirm?: () => void;
  onAmountChange?: (amount: string) => void;
  unifiedBalance?: UnifiedBalanceInfo;
}
