import { Avatar, Space, Tag, Typography } from 'antd';
import { ExternalLink } from 'lucide-react';
import type { BusinessUnit } from '../../data';

type BusinessSummaryProps = {
  business: BusinessUnit;
};

export function BusinessSummary({ business }: BusinessSummaryProps) {
  return (
    <div>
      <Space align="start" size={12}>
        <Avatar shape="square" size={40}>
          {business.name[0].toUpperCase()}
        </Avatar>
        <div>
          <Space size={8} align="center">
            <Typography.Title level={4} style={{ margin: 0 }}>
              {business.name}
            </Typography.Title>
            <Tag color="success">正常</Tag>
          </Space>
          <Typography.Text type="secondary">{business.desc}</Typography.Text>
          <br />
          <a href={business.repoUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ExternalLink size={12} />
            {business.repoUrl.replace('https://', '')}
          </a>
        </div>
      </Space>
    </div>
  );
}
