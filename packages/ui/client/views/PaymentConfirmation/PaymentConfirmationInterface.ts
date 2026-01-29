export interface UnifiedBalanceInfo {
  amount: number;
  formattedAmount: string;
  currency: string;
  hasEnoughBalance: boolean;
}

export interface SwapRouteInfo {
  fromTokenSymbol: string;
  fromAmount: string;
  fromChainId: number;
  toTokenSymbol: string;
  toAmount: string;
  toChainId: number;
}

export interface PaymentConfirmationProps {
  merchantAddress: string;
  merchantName?: string;
  amount?: string;
  currency?: string;
  networks?: string;
  isLoading?: boolean;
  onConfirm?: () => void;
  unifiedBalance?: UnifiedBalanceInfo;
  routeInfo?: SwapRouteInfo | null;
  isCalculatingRoute?: boolean;
}
