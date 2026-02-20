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
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { Effect } from 'effect';
import { useEffect } from 'react';
import { hasWalletSession } from '../utils/walletConnection';

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
        }),
      );

      const passkeyValidator = yield* _(
        Effect.tryPromise({
          try: () =>
            createPasskeyValidatorFromWebAuthnKey(publicClient, sessionKey),
          catch: (error) => error,
        }),
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
        }),
      );

      if (!isActive) {
        return;
      }

      const smartWalletAddress = yield* _(
        Effect.tryPromise({
          try: () => account.getAddress(),
          catch: (error) => error,
        }),
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
        }),
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
        }),
      ),
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

  if (location.pathname === '/onboarding') {
    return (
      <div className='h-screen w-screen bg-background'>
        <Outlet />
        {/* <TanStackRouterDevtools /> */}
        <Toaster />
      </div>
    );
  }

  // Simplified layout for demo
  return (
    <div className='h-screen w-screen bg-background flex flex-col overflow-hidden'>
      <div className='flex-1 overflow-y-auto'>
        <Outlet />
      </div>
      <Toaster />
    </div>
  );
};

export const Route = createRootRoute({
  component: RootLayout,
});
