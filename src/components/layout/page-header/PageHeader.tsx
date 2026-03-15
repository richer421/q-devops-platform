import { Breadcrumb, Button, Flex, Typography } from 'antd';
import { ChevronRight } from 'lucide-react';
import type { PageHeaderProps } from './types';

export function PageHeader({
  breadcrumbs,
  title,
  description,
  action,
  extension,
  extensionDivider = true,
}: PageHeaderProps) {
  const breadcrumbItems = breadcrumbs.map((item) => ({
    title: item.onClick ? (
      <Button type="link" size="small" onClick={item.onClick} style={{ padding: 0, height: 'auto' }}>
        {item.label}
      </Button>
    ) : (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {item.label}
      </Typography.Text>
    ),
  }));

  return (
    <div
      style={{
        background: '#fff',
        borderBottom: '1px solid #e5e6eb',
        padding: '16px 16px 4px',
      }}
    >
      {breadcrumbs.length > 0 && (
        <Breadcrumb
          style={{ marginBottom: 8 }}
          separator={<ChevronRight size={11} color="#C9CDD4" />}
          items={breadcrumbItems}
        />
      )}

      <Flex align="center" justify="space-between" gap={16}>
        <div>
          <Typography.Title level={2} style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1D2129' }}>
            {title}
          </Typography.Title>
          {description && (
            <Typography.Text type="secondary" style={{ fontSize: 13, marginTop: 2, display: 'inline-block' }}>
              {description}
            </Typography.Text>
          )}
        </div>
        {action}
      </Flex>

      {extension && (
        <div
          style={{
            marginTop: extensionDivider ? 12 : 0,
            borderTop: extensionDivider ? '1px solid #E5E6EB' : undefined,
            paddingTop: extensionDivider ? 12 : 0,
          }}
        >
          {extension}
        </div>
      )}
    </div>
  );
}
