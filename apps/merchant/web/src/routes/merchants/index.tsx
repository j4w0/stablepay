import { MerchantList } from '@/services/MerchantListImpl';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/merchants/')({
  component: MerchantList,
});
