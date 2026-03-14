import { Card } from 'antd';
import React from 'react';

type MetricCardProps = {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent: string;
  accentSoft: string;
  subtext?: string;
};

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  accent,
  accentSoft,
  subtext,
}) => {
  return (
    <Card
      className="qw-surface-card"
      styles={{
        body: {
          padding: 16,
        },
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              color: '#86909C',
              fontSize: 12,
              fontWeight: 500,
              lineHeight: '18px',
            }}
          >
            {label}
          </div>
          <div
            style={{
              marginTop: 8,
              color: '#1D2129',
              fontSize: 28,
              fontWeight: 700,
              lineHeight: '32px',
            }}
          >
            {value}
          </div>
          {subtext ? (
            <div
              style={{
                marginTop: 6,
                color: '#86909C',
                fontSize: 11,
                lineHeight: '16px',
              }}
            >
              {subtext}
            </div>
          ) : null}
        </div>
        {icon ? (
          <div
            style={{
              display: 'flex',
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              background: accentSoft,
              color: accent,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export default MetricCard;
