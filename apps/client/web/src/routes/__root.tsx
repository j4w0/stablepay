import {
  History,
  Home,
  Info,
  MainLayout,
  Settings,
  SubPageLayout,
  type SubPageLayoutProps,
} from '@stablepay/client-ui';
import {
  ENTRYPOINT,
  KERNEL_VERSION,
  publicClient,
} from '@stablepay/common/config/zerodev';
import { useWalletStore } from '@stablepay/common/stores/wallet';
import {
  createKernelAccount,
  createPasskeyValidatorFromWebAuthnKey,
} from '@stablepay/common/utils/passkey';
import { Toaster } from '@stablepay/ui-base';
import {
  createRootRoute,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { Effect } from 'effect';
import { useEffect } from 'react';
import { AssetsSidebarService } from '../services/AssetsSidebarService';
import { hasWalletSession, isWalletReady } from '../utils/walletConnection';

const RootLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    webAuthnKey,
    status,
    address,
    setStatus,
    setAddress,
    setWebAuthnKey,
  } = useWalletStore();

  useEffect(() => {
    console.log('Wallet status changed:', { address, status });
    if (status === 'connected') {
      console.log(`Connected: ${address}`);
      return;
    }
  }, [address, status]);

  useEffect(() => {
    let isActive = true;

    const restoreEffect = Effect.gen(function* (_) {
      if (!hasWalletSession(webAuthnKey)) {
        return;
      }

      const sessionKey = webAuthnKey;

      if (status === 'connected') {
        return;
      }

      if (status === 'connecting') {
        return;
      }

      yield* _(
        Effect.sync(() => {
          setStatus('connecting');
        })
      );

      const passkeyValidator = yield* _(
        Effect.tryPromise({
          try: () =>
            createPasskeyValidatorFromWebAuthnKey(publicClient, sessionKey),
          catch: (error) => error,
        })
      );

      const account = yield* _(
        Effect.tryPromise({
          try: () =>
            createKernelAccount(publicClient, {
              plugins: {
                sudo: passkeyValidator,
              },
              entryPoint: ENTRYPOINT,
              kernelVersion: KERNEL_VERSION,
              address: address,
            }),
          catch: (error) => error,
        })
      );

      if (!isActive) {
        return;
      }

      const smartWalletAddress = yield* _(
        Effect.tryPromise({
          try: () => account.getAddress(),
          catch: (error) => error,
        })
      );

      if (!isActive) {
        return;
      }

      yield* _(
        Effect.sync(() => {
          setAddress(smartWalletAddress);
          setStatus('connected');

          if (location.pathname === '/onboarding') {
            navigate({ to: '/' });
          }
        })
      );
    }).pipe(
      Effect.catchAll((error) =>
        Effect.sync(() => {
          console.error('Failed to restore session', error);

          if (!isActive) {
            return;
          }

          setAddress(undefined);
          setStatus('idle');
          setWebAuthnKey(undefined);

          if (location.pathname !== '/onboarding') {
            navigate({ to: '/onboarding' });
          }
        })
      )
    );

    Effect.runPromise(restoreEffect);

    return () => {
      isActive = false;
    };
  }, [
    address,
    location.pathname,
    navigate,
    setWebAuthnKey,
    setAddress,
    setStatus,
    status,
    webAuthnKey,
  ]);

  const navItems = [
    {
      key: 'home',
      label: 'Home',
      icon: Home,
      active: location.pathname === '/',
      onClick: () => navigate({ to: '/' }),
    },
    {
      key: 'history',
      label: 'History',
      icon: History,
      active: location.pathname === '/history',
      onClick: () => navigate({ to: '/history' }),
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
        {/* <TanStackRouterDevtools /> */}
        <Toaster />
      </div>
    );
  }

  const subPageConfig: Record<string, Omit<SubPageLayoutProps, 'children'>> = {
    '/settings': { title: 'Settings' },
    '/scan': { title: 'Scan QR Code' },
    '/send': { title: 'Send / Receive' },
  };

  const currentSubPage =
    subPageConfig[location.pathname] ||
    (location.pathname.startsWith('/pay/')
      ? { title: 'Confirm Payment' }
      : null);

  if (currentSubPage) {
    return (
      <SubPageLayout
        title={currentSubPage.title}
        onBack={() => navigate({ to: '/' })}
      >
        <Outlet />
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
      rightSidebarSlot={<AssetsSidebarService />}
    >
      <Outlet />
      <Toaster />
    </MainLayout>
  );
};

export const Route = createRootRoute({
  component: RootLayout,
  beforeLoad: ({ location }) => {
    const { status, webAuthnKey } = useWalletStore.getState();
    const isAllowed = isWalletReady(status, webAuthnKey);

    if (!isAllowed && location.pathname !== '/onboarding') {
      throw redirect({
        to: '/onboarding',
      });
    }
  },
});
