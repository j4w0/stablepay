import { Button, Card } from '@stablepay/ui-base';
import React from 'react';

import { type SettingsProps } from './SettingsInterface';

export const SettingsView: React.FC<SettingsProps> = ({ onResetAll }) => {
  return (
    <div className='container mx-auto p-4 space-y-6'>
      <h1 className='text-2xl font-bold'>Settings</h1>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Developer</h2>
        <Card className='p-4'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <h3 className='font-medium'>Reset Application</h3>
              <p className='text-sm text-muted-foreground'>
                Clear all data and restart onboarding
              </p>
            </div>
            <Button
              className='w-full sm:w-auto'
              variant='destructive'
              onClick={onResetAll}
            >
              Reset & Restart
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
