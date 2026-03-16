import type { LucideIcon } from 'lucide-react';
import { Box, Zap } from 'lucide-react';

export type NavigationItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
  { label: '我的业务', path: '/business', icon: Box },
  { label: '业务交付', path: '/cicd', icon: Zap },
];
