import { createFileRoute } from '@tanstack/react-router';
import { TransactionHistoryService } from '../services/TransactionHistoryService';

export const Route = createFileRoute('/history')({
  component: TransactionHistoryService,
});
