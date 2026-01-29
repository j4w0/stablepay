import type { MerchantInfoDataV1_0 } from '@stablepay/common/interfaces/Merchant';

export interface MerchantListViewProps {
  merchants: MerchantInfoDataV1_0[];
  isLoading: boolean;
  error?: string;
  limit: number;
  offset: number;
  onLoadMore: () => void;
  onRefresh: () => void;
  hasMore: boolean;
}
