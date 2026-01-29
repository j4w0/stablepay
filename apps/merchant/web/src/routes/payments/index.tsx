import { createFileRoute } from '@tanstack/react-router';
import { PaymentsTable } from '../../services/PaymentsTableImpl';

export const Route = createFileRoute('/payments/')({
  component: PaymentsTable,
});
