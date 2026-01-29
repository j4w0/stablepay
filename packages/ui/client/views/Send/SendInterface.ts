export interface SendProps {
  onSend?: (address: string, amount: string) => void;
  isLoading?: boolean;
}
