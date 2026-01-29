export enum OnboardingStep {
  Intro = 0,
  Connect = 1,
  Deposit = 2,
}

export type PasskeyAction = 'create' | 'login';

export interface FeatureItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface OnboardingProps {
  currentStep: OnboardingStep;
  features: FeatureItem[];
  walletAddress?: string;
  isConnecting?: boolean;
  passkeyAction?: PasskeyAction;

  // Actions
  onNextStep: () => void;
  onSkipStep: () => void; // For deposit
  onSkip?: () => void; // Skip the entire onboarding
  onConnectPasskey: () => void;
  onLoginPasskey?: () => void;
  onConnectExternal?: () => void; // Triggers the modal (disabled for now)
  onFinish: () => void; // Final step done
}
