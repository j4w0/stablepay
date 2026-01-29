import { createFileRoute } from '@tanstack/react-router';
import { WalletOverviewImpl } from '../services/WalletOverviewService';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className='h-full w-full'>
      <WalletOverviewImpl />
    </div>
  );
}
