export interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: string;
  currency: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  to?: string;
  from?: string;
}

export interface TransactionHistoryViewProps {
  transactions: Transaction[];
  isLoading: boolean;
}
