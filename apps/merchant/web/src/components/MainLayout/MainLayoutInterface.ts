import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}

export interface DropdownItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
}

export interface MainLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  bannerSlot?: ReactNode;
  variant?: 'default' | 'settings';
  dropdownItems?: DropdownItem[];
}
