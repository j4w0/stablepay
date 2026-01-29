import type {
  PaymentDTO,
  PaymentStatus,
} from '@stablepay/common/interfaces/Payment';

export interface PaymentsTableViewProps {
  payments: PaymentDTO[];
  isLoading: boolean;
  error?: string;
  selectedRefs: string[];
  currentPage: number;
  totalPages: number;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  onUpdateStatus: (paymentRef: string, status: PaymentStatus) => void;
  onDeletePayment: (paymentRef: string) => void;
  onToggleSelect: (paymentRef: string) => void;
  onToggleSelectAll: () => void;
  onBulkDelete: () => void;
}
