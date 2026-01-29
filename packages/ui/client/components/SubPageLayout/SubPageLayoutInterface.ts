import React from 'react';

export interface SubPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}
