import React from 'react';

export interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  onClick?: () => void;
}

export interface DropdownItem {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

export interface MainLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  bannerSlot?: React.ReactNode;
  rightSidebarSlot?: React.ReactNode;
  variant?: 'default' | 'settings' | 'onboarding';
  dropdownItems?: DropdownItem[];
}
