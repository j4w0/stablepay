import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { PaymentConfirmationService } from '../../services/PaymentConfirmationService';

// interface PaymentSearchParams {
//   amount?: string;
//   currency?: string;
//   networks?: string;
// }

const paymentSearchSchema = z.object({
  amount: z.number().positive(),
  currency: z.string(),
  networks: z.array(z.number()).optional(),
});

export const Route = createFileRoute('/pay/$address')({
  component: PaymentConfirmationService,
  validateSearch: paymentSearchSchema,
});
