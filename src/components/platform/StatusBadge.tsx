import { Tag } from 'antd';
import React from 'react';

type StatusBadgeTone =
  | 'success'
  | 'danger'
  | 'warning'
  | 'primary'
  | 'purple'
  | 'neutral';

type StatusBadgeProps = {
  label: React.ReactNode;
  tone?: StatusBadgeTone;
  pill?: boolean;
};

const toneStyles: Record<StatusBadgeTone, { bg: string; color: string }> = {
  success: { bg: '#E8FFEA', color: '#00B42A' },
  danger: { bg: '#FFECE8', color: '#F53F3F' },
  warning: { bg: '#FFF7E8', color: '#FF7D00' },
  primary: { bg: '#E8F3FF', color: '#1664FF' },
  purple: { bg: '#F0ECFF', color: '#7B61FF' },
  neutral: { bg: '#F2F3F5', color: '#4E5969' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  tone = 'neutral',
  pill = true,
}) => {
  const styles = toneStyles[tone];

  return (
    <Tag
      bordered={false}
      style={{
        marginInlineEnd: 0,
        paddingInline: 8,
        paddingBlock: 2,
        borderRadius: pill ? 999 : 6,
        background: styles.bg,
        color: styles.color,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: '16px',
      }}
    >
      {label}
    </Tag>
  );
};

export default StatusBadge;
