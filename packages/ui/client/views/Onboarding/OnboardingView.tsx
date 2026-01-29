import { Button, Card } from '@stablepay/ui-base';
import { ArrowRight, CheckCircle, Copy, Key, Wallet } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import { toast } from 'sonner';

import { type OnboardingProps, OnboardingStep } from './OnboardingInterface';

export const OnboardingView: React.FC<OnboardingProps> = ({
  currentStep,
  features,
  walletAddress,
  isConnecting,
  passkeyAction,
  onNextStep,
  onSkipStep,
  onSkip,
  onConnectPasskey,
  onLoginPasskey,
  onConnectExternal,
  onFinish,
}) => {
  // Step 1: Intro
  if (currentStep === OnboardingStep.Intro) {
    return (
      <div className='flex flex-col h-full items-center justify-center p-6 space-y-8 animate-in fade-in zoom-in duration-500 relative'>
        {onSkip && (
          <Button
            variant='ghost'
            onClick={onSkip}
            className='absolute top-4 right-4'
          >
            Skip
          </Button>
        )}
        <div className='text-center space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight'>
            Welcome to StablePay
          </h1>
          <p className='text-muted-foreground'>
            The easiest way to pay with stablecoins.
          </p>
        </div>

        <div className='grid gap-6 w-full max-w-md'>
          {features.map((feature, index) => (
            <Card
              key={index}
              className='p-4 flex items-start gap-4 border-none shadow-none bg-muted/50'
            >
              <div className='p-2 bg-primary/10 rounded-full text-primary'>
                <feature.icon className='w-6 h-6' />
              </div>
              <div>
                <h3 className='font-semibold'>{feature.title}</h3>
                <p className='text-sm text-muted-foreground'>
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <Button
          size='lg'
          className='w-full max-w-xs gap-2'
          onClick={onNextStep}
        >
          Get Started <ArrowRight className='w-4 h-4' />
        </Button>
      </div>
    );
  }

  // Step 2: Connect Wallet
  if (currentStep === OnboardingStep.Connect) {
    return (
      <div className='flex flex-col h-full items-center justify-center p-6 space-y-8 animate-in slide-in-from-right duration-500 relative'>
        {onSkip && (
          <Button
            variant='ghost'
            onClick={onSkip}
            className='absolute top-4 right-4'
          >
            Skip
          </Button>
        )}
        <div className='text-center space-y-2'>
          <h2 className='text-2xl font-bold'>Access Your Wallet</h2>
          <p className='text-muted-foreground max-w-sm'>
            Use a passkey to create or sign in. It works with Face ID, Touch ID,
            Windows Hello, and security keys.
          </p>
        </div>

        <div className='w-full max-w-sm space-y-4'>
          <Button
            size='lg'
            variant='default'
            className='w-full h-auto py-6 flex flex-col items-center gap-2'
            onClick={onConnectPasskey}
            disabled={isConnecting}
          >
            <div className='flex items-center gap-2'>
              <Key className='w-5 h-5' />
              <span className='font-semibold'>Create with Passkey</span>
            </div>
            <span className='text-xs font-normal opacity-80'>
              Recommended for new users
            </span>
          </Button>

          {onLoginPasskey && (
            <Button
              size='lg'
              variant='outline'
              className='w-full h-auto py-6 flex flex-col items-center gap-2'
              onClick={onLoginPasskey}
              disabled={isConnecting}
            >
              <div className='flex items-center gap-2'>
                <Key className='w-5 h-5' />
                <span className='font-semibold'>Login with Passkey</span>
              </div>
              <span className='text-xs font-normal opacity-80'>
                Use an existing StablePay passkey
              </span>
            </Button>
          )}

          {/* External wallet onboarding intentionally hidden for now.
              Keep the hook here so we can re-enable later by passing onConnectExternal. */}
          {onConnectExternal && (
            <Button
              size='lg'
              variant='outline'
              className='w-full gap-2'
              onClick={onConnectExternal}
              disabled={isConnecting}
            >
              <Wallet className='w-4 h-4' />
              Connect External Wallet
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Step 3: Deposit
  if (currentStep === OnboardingStep.Deposit) {
    const isLogin = passkeyAction === 'login';

    return (
      <div className='flex flex-col h-full items-center justify-center p-6 space-y-8 animate-in slide-in-from-right duration-500'>
        <div className='text-center space-y-2'>
          <div className='mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4'>
            <CheckCircle className='w-6 h-6' />
          </div>
          <h2 className='text-2xl font-bold'>Wallet Ready</h2>
          {isLogin ? (
            <p className='text-muted-foreground max-w-sm'>
              You’re signed in. If you need funds, deposit to your address
              below.
            </p>
          ) : (
            <p className='text-muted-foreground max-w-sm'>
              Your wallet is ready. Deposit some funds to start using StablePay.
            </p>
          )}
        </div>

        {walletAddress && (
          <div className='flex flex-col items-center space-y-6 w-full max-w-sm'>
            <Card className='p-6 bg-white rounded-xl shadow-sm'>
              <QRCodeSVG value={walletAddress} size={180} />
            </Card>

            <div className='w-full space-y-2'>
              <label className='text-xs font-medium text-muted-foreground uppercase'>
                Wallet Address
              </label>
              <div className='flex items-center gap-2 p-3 bg-muted rounded-md border text-sm break-all font-mono relative'>
                <span className='w-full'>{walletAddress}</span>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 shrink-0'
                  onClick={() => {
                    navigator.clipboard.writeText(walletAddress);
                    toast('Wallet address copied to clipboard');
                  }}
                >
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className='flex flex-col w-full max-w-sm gap-3'>
          <Button size='lg' onClick={onFinish} className='w-full'>
            I've Sent Funds
          </Button>
          <Button variant='ghost' onClick={onSkipStep} className='w-full'>
            Skip for Now
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
