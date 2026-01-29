import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@stablepay/ui-base';
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

import { type MainLayoutProps } from './MainLayoutInterface';

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  navItems,
  bannerSlot,
  rightSidebarSlot,
  variant = 'default',
  dropdownItems = [],
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [rightSidebarMode, setRightSidebarMode] = useState<
    'expanded' | 'collapsed' | 'hidden'
  >('expanded');

  const [leftWidth, setLeftWidth] = useState(256);
  const [rightWidth, setRightWidth] = useState(320);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const startResizingLeft = useCallback(() => setIsResizingLeft(true), []);
  const startResizingRight = useCallback(() => setIsResizingRight(true), []);
  const stopResizing = useCallback(() => {
    setIsResizingLeft(false);
    setIsResizingRight(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = mouseMoveEvent.clientX;
        if (newWidth >= 200 && newWidth <= 600) {
          setLeftWidth(newWidth);
        }
      }
      if (isResizingRight) {
        const newWidth = window.innerWidth - mouseMoveEvent.clientX;
        if (newWidth >= 200 && newWidth <= 600) {
          setRightWidth(newWidth);
        }
      }
    },
    [isResizingLeft, isResizingRight]
  );

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const showSidebar = variant === 'default';
  const showMobileHeader = variant === 'default' || variant === 'settings';
  const showDesktopHeader = variant === 'settings';
  const showBottomNav = variant === 'default';
  const showBanner = variant === 'default' && bannerSlot;
  const showRightSidebar = variant === 'default' && !!rightSidebarSlot;

  return (
    <div className='h-full w-full bg-background flex overflow-hidden'>
      {/* Desktop Sidebar - Hidden on mobile, visible on md and up */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r bg-card relative shrink-0',
          !isResizingLeft && 'transition-all duration-300',
          isCollapsed ? 'w-16' : '',
          !showSidebar && 'hidden md:hidden'
        )}
        style={{ width: isCollapsed ? undefined : leftWidth }}
      >
        {/* Resize Handle */}
        {!isCollapsed && (
          <div
            className='w-1 h-full absolute right-0 top-0 cursor-col-resize hover:bg-primary/20 z-10'
            onMouseDown={(e) => {
              e.preventDefault();
              startResizingLeft();
            }}
          />
        )}
        <div
          className={cn(
            'flex items-center h-16 px-4',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!isCollapsed && <h1 className='text-xl font-bold'>StablePay</h1>}
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
        {/* Right Sidebar Restore Button - Only when fully hidden */}
        {showRightSidebar && rightSidebarMode === 'hidden' && (
          <Button
            variant='secondary'
            size='icon'
            className='hidden md:flex fixed bottom-6 right-6 z-40 h-10 w-10 shadow-lg'
            onClick={() => setRightSidebarMode('expanded')}
            aria-label='Show right sidebar'
          >
            <PanelRightOpen className='h-5 w-5' />
          </Button>
        )}
        {/* Desktop Banner - Top Right */}
        {showBanner && (
          <div className='hidden md:block absolute top-6 right-8 z-30 w-full max-w-sm pointer-events-none'>
            <div className='pointer-events-auto shadow-lg rounded-lg overflow-hidden'>
              {bannerSlot}
            </div>
          </div>
        )}

        {/* Header */}
        {(showMobileHeader || showDesktopHeader) && (
          <header
            className={cn(
              'flex items-center justify-between px-4 h-14 bg-background/80 backdrop-blur-sm shadow-sm z-20 sticky top-0',
              !showDesktopHeader && 'md:hidden'
            )}
          >
            <div className='font-bold text-lg'>
              {variant === 'settings' ? 'Settings' : 'StablePay'}
            </div>
            {variant !== 'settings' && dropdownItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='icon' className='-mr-2'>
                    <Menu className='h-5 w-5' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  {dropdownItems.map((item) => (
                    <DropdownMenuItem key={item.key} onClick={item.onClick}>
                      {item.icon && <item.icon className='mr-2 h-4 w-4' />}
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </header>
        )}

        <div className='flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth flex flex-col'>
          {children}
        </div>

        {/* Mobile Banner - Above Nav */}
        {showBanner && <div className='md:hidden'>{bannerSlot}</div>}

        {/* Mobile Bottom Navigation - Visible on mobile (md:hidden) */}
        {showBottomNav && (
          <div className='md:hidden flex-none border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60'>
            <div className='flex justify-around items-center h-16 px-2'>
              {navItems
                .filter((item) => item.key !== 'settings')
                .map((item) => (
                  <button
                    key={item.key}
                    onClick={item.onClick}
                    className={cn(
                      'flex flex-1 flex-col items-center justify-center h-full rounded-md transition-colors active:scale-95',
                      item.active
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <item.icon className='h-5 w-5 mb-1' />
                    <span className='text-[10px] font-medium'>
                      {item.label}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* Right Sidebar - Hidden on mobile/tablet, visible on lg and up */}
      {showRightSidebar && rightSidebarMode !== 'hidden' && (
        <aside
          className={cn(
            'hidden md:flex flex-col border-l bg-card h-full overflow-hidden relative shrink-0',
            !isResizingRight && 'transition-all duration-300',
            rightSidebarMode === 'collapsed' ? 'w-16' : ''
          )}
          style={{
            width: rightSidebarMode === 'collapsed' ? undefined : rightWidth,
          }}
        >
          {/* Resize Handle */}
          {rightSidebarMode !== 'collapsed' && (
            <div
              className='w-1 h-full absolute left-0 top-0 cursor-col-resize hover:bg-primary/20 z-10'
              onMouseDown={(e) => {
                e.preventDefault();
                startResizingRight();
              }}
            />
          )}

          <div
            className={cn(
              'flex items-center h-16 px-3 border-b',
              rightSidebarMode === 'collapsed'
                ? 'justify-center'
                : 'justify-between'
            )}
          >
            {rightSidebarMode !== 'collapsed' && (
              <div className='text-sm font-medium text-muted-foreground'>
                Details
              </div>
            )}
            <div
              className={cn(
                'flex items-center',
                rightSidebarMode === 'collapsed' ? 'flex-col gap-2' : 'gap-2'
              )}
            >
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8'
                onClick={() =>
                  setRightSidebarMode((mode) =>
                    mode === 'collapsed' ? 'expanded' : 'collapsed'
                  )
                }
                aria-label={
                  rightSidebarMode === 'collapsed'
                    ? 'Expand right sidebar'
                    : 'Collapse right sidebar'
                }
              >
                {rightSidebarMode === 'collapsed' ? (
                  <PanelRightOpen className='h-4 w-4' />
                ) : (
                  <PanelRightClose className='h-4 w-4' />
                )}
              </Button>

              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8'
                onClick={() => setRightSidebarMode('hidden')}
                aria-label='Hide right sidebar'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {rightSidebarMode === 'expanded' && (
            <div className='flex-1 overflow-y-auto p-4'>{rightSidebarSlot}</div>
          )}
        </aside>
      )}
    </div>
  );
};
