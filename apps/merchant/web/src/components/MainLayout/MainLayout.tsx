import { Button, cn } from '@stablepay/ui-base';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import React, { useState } from 'react';

import { type MainLayoutProps } from './MainLayoutInterface';

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  navItems,
  bannerSlot,
  variant = 'default',
  dropdownItems = [],
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const showSidebar = variant === 'default';

  return (
    <div className='h-full w-full bg-background flex overflow-hidden'>
      {/* Desktop Sidebar - Hidden on mobile, visible on md and up */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r bg-card transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          !showSidebar && 'hidden md:hidden'
        )}
      >
        <div
          className={cn(
            'flex items-center h-16 px-4',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!isCollapsed && (
            <h1 className='text-xl font-bold'>StablePay Merchant</h1>
          )}
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <PanelLeftOpen className='h-4 w-4' />
            ) : (
              <PanelLeftClose className='h-4 w-4' />
            )}
          </Button>
        </div>
        <nav className='flex-1 space-y-2 px-2'>
          {navItems.map((item) => (
            <Button
              key={item.key}
              variant={item.active ? 'secondary' : 'ghost'}
              className={cn(
                'w-full',
                item.active && 'bg-secondary',
                isCollapsed ? 'justify-center px-2' : 'justify-start gap-3'
              )}
              onClick={item.onClick}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className='h-5 w-5' />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </nav>

        {/* Sidebar Bottom Actions - Visible on Desktop */}
        {dropdownItems.length > 0 && (
          <div className='p-2 border-t mt-auto space-y-2'>
            {dropdownItems.map((item) => (
              <Button
                key={item.key}
                variant='ghost'
                className={cn(
                  'w-full',
                  isCollapsed ? 'justify-center px-2' : 'justify-start gap-3'
                )}
                onClick={item.onClick}
                title={isCollapsed ? item.label : undefined}
              >
                {item.icon && <item.icon className='h-5 w-5' />}
                {!isCollapsed && <span>{item.label}</span>}
              </Button>
            ))}
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className='flex-1 flex flex-col h-full overflow-hidden relative'>
        {/* Mobile Header */}
        <header className='md:hidden h-14 border-b flex items-center justify-between px-4 bg-card shrink-0 z-10'>
          <div className='flex items-center gap-2'>
            <h1 className='font-semibold'>StablePay Merchant</h1>
          </div>
          {/* Add Mobile Menu Trigger logic if needed, skipping for now */}
        </header>

        {bannerSlot}

        <div className='flex-1 overflow-y-auto p-4 md:p-6'>{children}</div>
      </main>
    </div>
  );
};
