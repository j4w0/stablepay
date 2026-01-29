import { Button } from '@stablepay/ui-base';
import { ArrowLeft } from 'lucide-react';
import React from 'react';
import { type SubPageLayoutProps } from './SubPageLayoutInterface';

export const SubPageLayout: React.FC<SubPageLayoutProps> = ({
  children,
  title,
  onBack,
  action,
}) => {
  return (
    <div className='h-full w-full bg-background flex flex-col overflow-hidden'>
      {/* Header */}
      <header className='flex items-center justify-between px-2 h-14 bg-background/80 backdrop-blur-sm shadow-sm z-20 sticky top-0 border-b'>
        <div className='flex items-center gap-2'>
          {onBack && (
            <Button variant='ghost' size='icon' onClick={onBack}>
              <ArrowLeft className='h-5 w-5' />
            </Button>
          )}
          {title && <h1 className='font-semibold text-lg'>{title}</h1>}
        </div>
        <div>{action}</div>
      </header>

      {/* Main Content */}
      <main className='flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth'>
        {children}
      </main>
    </div>
  );
};
