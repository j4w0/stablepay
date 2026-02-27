export interface WalletOverviewProps {
  balance: number;
  onScan: () => void;
  onSend: () => void;
  onRefreshBalance?: () => void;
  isRefreshingBalance?: boolean;
  canRefreshBalance?: boolean;
  onCreateTestTransaction?: () => void;
  onReset?: () => void;
  address?: string;
}
