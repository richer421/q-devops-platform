import { Collapse } from 'antd';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

type CicdEntryCardProps = {
  accentColor: string;
  headerLeading: ReactNode;
  headerContent: ReactNode;
  headerExtra?: ReactNode;
  defaultOpen?: boolean;
  children?: ReactNode;
};

export function CicdEntryCard({
  accentColor,
  headerLeading,
  headerContent,
  headerExtra,
  defaultOpen = false,
  children,
}: CicdEntryCardProps) {
  const header = (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        minHeight: 48,
      }}
    >
      <div style={{ marginTop: 2, flexShrink: 0 }}>{headerLeading}</div>
      <div style={{ flex: 1, minWidth: 0 }}>{headerContent}</div>
      {headerExtra ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          {headerExtra}
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      data-cicd-entry-card="true"
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #E5E6EB',
        borderLeft: `3px solid ${accentColor}`,
        overflow: 'hidden',
      }}
    >
      {children ? (
        <Collapse
          bordered={false}
          ghost
          defaultActiveKey={defaultOpen ? ['detail'] : []}
          expandIconPosition="end"
          expandIcon={({ isActive }) => (
            <ChevronDown
              size={14}
              color="#86909C"
              style={{
                transition: 'transform 0.2s',
                transform: isActive ? 'rotate(0deg)' : 'rotate(-90deg)',
              }}
            />
          )}
          items={[
            {
              key: 'detail',
              label: header,
              children: (
                <div style={{ borderTop: '1px solid #F2F3F5' }}>{children}</div>
              ),
              style: { border: 'none', background: 'transparent' },
            },
          ]}
          style={{ background: 'transparent' }}
        />
      ) : (
        <div style={{ padding: '16px 20px' }}>{header}</div>
      )}
    </div>
  );
}
