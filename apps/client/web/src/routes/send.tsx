import { createFileRoute } from '@tanstack/react-router';
import { SendImpl } from '../services/SendService';

export const Route = createFileRoute('/send')({
  component: SendImpl,
});
