import { PageContainer } from '@ant-design/pro-components';
import type { CSSProperties, ReactNode } from 'react';

type PageContentContainerProps = {
  children: ReactNode;
  childrenContentStyle?: CSSProperties;
};

export function PageContentContainer({ children, childrenContentStyle }: PageContentContainerProps) {
  return (
    <div
      data-page-content-container="true"
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <PageContainer
        ghost
        pageHeaderRender={false}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        token={{
          paddingBlockPageContainerContent: 0,
          paddingInlinePageContainerContent: 0,
        }}
        childrenContentStyle={{
          padding: 0,
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          ...childrenContentStyle,
        }}
      >
        {children}
      </PageContainer>
      <style>{`
        [data-page-content-container='true'] .ant-pro-grid-content,
        [data-page-content-container='true'] .ant-pro-grid-content-children,
        [data-page-content-container='true'] .ant-pro-page-container-children-container {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}
