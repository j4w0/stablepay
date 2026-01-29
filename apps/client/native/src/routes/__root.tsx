import {
  Home,
  Info,
  MainLayout,
  Settings,
  SubPageLayout,
  Toaster,
} from '@stablepay/client-ui';
import { useWalletStore } from '@stablepay/common/stores/wallet';
import {
  createRootRoute,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

const RootLayout = () => {
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
      key: 'about',
      label: 'About',
      icon: Info,
      active: location.pathname === '/about',
      onClick: () => navigate({ to: '/about' }),
    },
  ];

  if (location.pathname === '/onboarding') {
    return (
      <div className='h-screen w-screen bg-background'>
        <Outlet />
        <TanStackRouterDevtools />
        <Toaster />
      </div>
    );
  }

  const isSettings = location.pathname === '/settings';

  if (isSettings) {
    return (
      <SubPageLayout title='Settings' onBack={() => navigate({ to: '/' })}>
        <Outlet />
        <TanStackRouterDevtools />
        <Toaster />
      </SubPageLayout>
    );
  }

  const dropdownItems = [
    {
      key: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: () => navigate({ to: '/settings' }) as unknown as void,
    },
  ];

  return (
    <MainLayout
      navItems={navItems}
      variant='default'
      dropdownItems={dropdownItems}
    >
      <Outlet />
      <TanStackRouterDevtools />
      <Toaster />
    </MainLayout>
  );
};

export const Route = createRootRoute({
  component: RootLayout,
  beforeLoad: ({ location }) => {
    const { status } = useWalletStore.getState();
    const isAllowed = status === 'connected';

    if (!isAllowed && location.pathname !== '/onboarding') {
      throw redirect({
        to: '/onboarding',
      });
    }
  },
});
