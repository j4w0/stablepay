import {
  type FeatureItem,
  Globe,
  OnboardingStep,
  OnboardingView,
  ShieldCheck,
  Zap,
} from '@stablepay/client-ui';
import {
  ENTRYPOINT,
  KERNEL_VERSION,
  PASSKEY_SERVER_URL,
  publicClient,
} from '@stablepay/common/config/zerodev';
import { useWalletStore } from '@stablepay/common/stores/wallet';
import {
  createKernelAccount,
  createPasskeyValidator,
  serializeWebAuthnKey,
} from '@stablepay/common/utils/passkey';
import { useNavigate } from '@tanstack/react-router';
import { Effect } from 'effect';
import React, { useState } from 'react';

// Feature list data
const features: FeatureItem[] = [
  {
    title: 'Fast Payments',
    description: 'Send and receive stablecoins instantly with low fees.',
    icon: Zap,
  },
  {
    title: 'Secure & Recovery',
    description:
      'Your funds are protected by account abstraction and social recovery.',
    icon: ShieldCheck,
  },
  {
    title: 'Universal Access',
    description:
      'Pay anywhere, on any chain, without worrying about gas tokens.',
    icon: Globe,
  },
];

export const OnboardingImpl: React.FC = () => {
  const navigate = useNavigate();
  const setWebAuthnKey = useWalletStore((state) => state.setWebAuthnKey);
  const setStatus = useWalletStore((state) => state.setStatus);
  const setAddress = useWalletStore((state) => state.setAddress);
  const { address } = useWalletStore();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    OnboardingStep.Intro
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const walletAddress = address;
  const [passkeyAction, setPasskeyAction] = useState<'create' | 'login'>(
    'create'
  );

  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleSkipStep = () => {
    // If we are at deposit step, we can just finish
    if (currentStep === OnboardingStep.Deposit) {
      handleFinish();
    } else {
      handleNextStep();
    }
  };

  const handleConnectPasskey = () => {
    const connectEffect = Effect.gen(function* (_) {
      yield* _(
        Effect.sync(() => {
          setPasskeyAction('create');
          setIsConnecting(true);
        })
      );

      const { passkeyValidator, webAuthnKey } = yield* _(
        Effect.tryPromise({
          try: () =>
            createPasskeyValidator({
              client: publicClient,
              passkeyName: 'StablePay Wallet',
              passkeyServerUrl: PASSKEY_SERVER_URL,
              mode: 'register',
            }),
          catch: (error) => error,
        })
      );

      yield* _(
        Effect.sync(() => {
          setWebAuthnKey(serializeWebAuthnKey(webAuthnKey));
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
            }),
          catch: (error) => error,
        })
      );

      const smartWalletAddress = yield* _(
        Effect.tryPromise({
          try: () => account.getAddress(),
          catch: (error) => error,
        })
      );

      yield* _(
        Effect.sync(() => {
          setStatus('connected');
          setAddress(smartWalletAddress);
          setCurrentStep(OnboardingStep.Deposit);
        })
      );
    }).pipe(
      Effect.catchAll((error) =>
        Effect.sync(() => {
          console.error('Failed to create wallet with passkey', error);
        })
      ),
      Effect.ensuring(
        Effect.sync(() => {
          setIsConnecting(false);
        })
      )
    );

    return Effect.runPromise(connectEffect);
  };

  const handleLoginPasskey = () => {
    const loginEffect = Effect.gen(function* (_) {
      yield* _(
        Effect.sync(() => {
          setPasskeyAction('login');
          setIsConnecting(true);
        })
      );

      const { passkeyValidator, webAuthnKey } = yield* _(
        Effect.tryPromise({
          try: () =>
            createPasskeyValidator({
              client: publicClient,
              passkeyName: 'StablePay Wallet',
              passkeyServerUrl: PASSKEY_SERVER_URL,
              mode: 'login',
            }),
          catch: (error) => error,
        })
      );

      yield* _(
        Effect.sync(() => {
          setWebAuthnKey(serializeWebAuthnKey(webAuthnKey));
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
            }),
          catch: (error) => error,
        })
      );

      const smartWalletAddress = yield* _(
        Effect.tryPromise({
          try: () => account.getAddress(),
          catch: (error) => error,
        })
      );

      yield* _(
        Effect.sync(() => {
          setAddress(smartWalletAddress);
          setStatus('connected');
          setCurrentStep(OnboardingStep.Deposit);
        })
      );
    }).pipe(
      Effect.catchAll((error) =>
        Effect.sync(() => {
          console.error('Failed to login with passkey', error);
        })
      ),
      Effect.ensuring(
        Effect.sync(() => {
          setIsConnecting(false);
        })
      )
    );

    return Effect.runPromise(loginEffect);
  };

  const handleFinish = () => {
    // Navigate to main/home route
    navigate({ to: '/' });
  };

  return (
    <OnboardingView
      currentStep={currentStep}
      features={features}
      walletAddress={walletAddress}
      isConnecting={isConnecting}
      passkeyAction={passkeyAction}
      onNextStep={handleNextStep}
      onSkipStep={handleSkipStep}
      // Onboarding skip is not supported without wallet
      // onSkip={handleSkip}
      onConnectPasskey={handleConnectPasskey}
      onLoginPasskey={handleLoginPasskey}
      // External wallet onboarding intentionally hidden for now.
      // onConnectExternal={handleConnectExternal}
      onFinish={handleFinish}
    />
  );
};
