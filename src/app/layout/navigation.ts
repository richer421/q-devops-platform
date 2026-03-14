import type { LucideIcon } from 'lucide-react';
import { Box, Zap } from 'lucide-react';

export type NavigationItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
  { label: '业务中心', path: '/business', icon: Box },
  { label: 'CI&CD 工作台', path: '/cicd', icon: Zap },
];
