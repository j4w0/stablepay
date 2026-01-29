import { createFileRoute } from '@tanstack/react-router';
import { PaymentStatusService } from '../../services/PaymentStatusService';

export const Route = createFileRoute('/payment/$ref')({
  component: PaymentStatusService,
});
