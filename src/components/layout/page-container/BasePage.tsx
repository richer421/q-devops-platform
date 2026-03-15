import type { CSSProperties, ReactNode } from 'react';
import { PageHeader } from '../page-header';
import type { PageHeaderProps } from '../page-header';
import { PageContentContainer } from './PageContentContainer';

type BasePageProps = PageHeaderProps & {
  children: ReactNode;
  contentStyle?: CSSProperties;
};

export function BasePage({
  breadcrumbs,
  title,
  description,
  action,
  extension,
  extensionDivider,
  children,
  contentStyle,
}: BasePageProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: '#f2f3f5' }}>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={title}
        description={description}
        action={action}
        extension={extension}
        extensionDivider={extensionDivider}
      />
      <PageContentContainer childrenContentStyle={contentStyle}>
        {children}
      </PageContentContainer>
    </div>
  );
}
