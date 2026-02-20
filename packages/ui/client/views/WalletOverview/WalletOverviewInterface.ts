export interface WalletOverviewProps {
  balance: number;
  onScan: () => void;
  onSend: () => void;
  onCreateTestTransaction?: () => void;
  onReset?: () => void;
  address?: string;
}
