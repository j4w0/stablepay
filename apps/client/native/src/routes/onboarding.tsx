import { createFileRoute } from '@tanstack/react-router';
import { OnboardingImpl } from '../services/OnboardingService';

// Standard view wrapper that takes full height
function OnboardingPage() {
  return (
    <div className='h-full w-full bg-background'>
      <OnboardingImpl />
    </div>
  );
}

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
});
