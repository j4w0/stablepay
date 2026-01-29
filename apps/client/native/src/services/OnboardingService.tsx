import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import {
  FeatureItem,
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
import React, { useEffect, useState } from 'react';

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
  const setWallet = useWalletStore((state) => state.setWallet);
  const setWebAuthnKey = useWalletStore((state) => state.setWebAuthnKey);
  const setStatus = useWalletStore((state) => state.setStatus);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    OnboardingStep.Intro
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | undefined>(
    undefined
  );

  // Reown AppKit hooks
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  // Effect: Watch for external wallet connection
  useEffect(() => {
    if (isConnected && address && currentStep === OnboardingStep.Connect) {
      setWalletAddress(address);
      setStatus('connected');
      setCurrentStep(OnboardingStep.Deposit);
    }
  }, [isConnected, address, currentStep, setStatus]);

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

  const handleConnectExternal = async () => {
    try {
      setIsConnecting(true);
      await open();
      // The useEffect will handle the state change when connection is successful
    } catch (error) {
      console.error('Failed to open wallet modal', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectPasskey = async () => {
    setIsConnecting(true);
    const { passkeyValidator, webAuthnKey } = await createPasskeyValidator({
      client: publicClient,
      passkeyName: 'StablePay Wallet',
      passkeyServerUrl: PASSKEY_SERVER_URL,
      mode: 'register',
    });

    setWebAuthnKey(serializeWebAuthnKey(webAuthnKey));

    const account = await createKernelAccount(publicClient, {
      plugins: {
        sudo: passkeyValidator,
      },
      entryPoint: ENTRYPOINT,
      kernelVersion: KERNEL_VERSION,
    });

    const smartWalletAddress = await account.getAddress();
    setWallet(account);
    setStatus('connected');
    setWalletAddress(smartWalletAddress);
    setCurrentStep(OnboardingStep.Deposit);
    setIsConnecting(true);
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
      onNextStep={handleNextStep}
      onSkipStep={handleSkipStep}
      // onSkip={handleSkip}
      onConnectPasskey={handleConnectPasskey}
      onConnectExternal={handleConnectExternal}
      onFinish={handleFinish}
    />
  );
};
