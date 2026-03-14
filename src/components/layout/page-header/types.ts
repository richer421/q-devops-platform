import type { ReactNode } from 'react';

export type PageHeaderBreadcrumb = {
  label: string;
  onClick?: () => void;
};

export type PageHeaderProps = {
  breadcrumbs: ReadonlyArray<PageHeaderBreadcrumb>;
  title: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
};

export type PageHeaderTabItem<T extends string> = {
  id: T;
  label: string;
  count?: number;
  icon?: ReactNode;
};

export type PageHeaderTabsProps<T extends string> = {
  items: ReadonlyArray<PageHeaderTabItem<T>>;
  value: T;
  onChange: (id: T) => void;
  right?: ReactNode;
};
