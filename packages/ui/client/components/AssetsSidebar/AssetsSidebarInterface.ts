import { type StableCoinInfo } from '@stablepay/common/config/stablepay';

export interface AssetBalanceItem {
  token: StableCoinInfo;
  formattedBalance: string;
}

export interface AssetsSidebarViewProps {
  isLoading?: boolean;
  isConnected?: boolean;
  denominationCurrency: string;
  totalAmountFormatted: string;
  assets: AssetBalanceItem[];
  lastUpdatedAt?: number | null;
  onRefresh?: () => void;
}
