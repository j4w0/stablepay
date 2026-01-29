import {
  Outlet,
  createRootRoute,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { CreditCard, Home, List, Plus } from 'lucide-react';
import { Toaster } from 'sonner';
import { MainLayout } from '../components/MainLayout/MainLayout';

const RootComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      key: 'home',
      label: 'Home',
      icon: Home,
      active: location.pathname === '/',
      onClick: () => navigate({ to: '/' }),
    },
    {
      key: 'create-merchant',
      label: 'Create Merchant',
      icon: Plus,
      active: location.pathname === '/merchants/new',
      onClick: () => navigate({ to: '/merchants/new' }),
    },
    {
      key: 'create-payment',
      label: 'Create Payment',
      icon: CreditCard,
      active: location.pathname === '/payments/new',
      onClick: () => navigate({ to: '/payments/new' }),
    },
    {
      key: 'payments',
      label: 'Payments',
      icon: List,
      active: location.pathname === '/payments',
      onClick: () => navigate({ to: '/payments' }),
    },
  ];

  return (
    <MainLayout navItems={navItems}>
      <Outlet />
      <TanStackRouterDevtools />
      <Toaster />
    </MainLayout>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
