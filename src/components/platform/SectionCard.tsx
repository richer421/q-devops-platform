import { Card } from 'antd';
import React from 'react';

type SectionCardProps = {
  title?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  bodyPadding?: number;
};

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  extra,
  children,
  bodyPadding = 20,
}) => {
  return (
    <Card
      className="qw-surface-card"
      title={title}
      extra={extra}
      styles={{
        header: {
          minHeight: 52,
          color: '#1D2129',
          fontSize: 15,
          fontWeight: 600,
          borderBottom: '1px solid #F2F3F5',
        },
        body: {
          padding: bodyPadding,
        },
      }}
    >
      {children}
    </Card>
  );
};

export default SectionCard;
