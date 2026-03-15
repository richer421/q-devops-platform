import { Button } from 'antd';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
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
  const [open, setOpen] = useState(defaultOpen);
  const [hovered, setHovered] = useState(false);

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
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
          padding: '16px 20px',
          cursor: 'pointer',
          transition: 'background 0.15s',
          background: hovered ? '#FAFAFA' : 'transparent',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setOpen((value) => !value)}
      >
        <div style={{ marginTop: 2, flexShrink: 0 }}>{headerLeading}</div>
        <div style={{ flex: 1, minWidth: 0 }}>{headerContent}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginTop: 2 }}>
          {headerExtra}
          <Button
            type="text"
            size="small"
            aria-label={open ? '收起条目详情' : '展开条目详情'}
            onClick={(event) => {
              event.stopPropagation();
              setOpen((value) => !value);
            }}
            style={{ paddingInline: 0, color: '#86909C' }}
          >
            <ChevronDown
              size={14}
              color="#86909C"
              style={{
                transition: 'transform 0.2s',
                transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
              }}
            />
          </Button>
        </div>
      </div>

      {open && children ? <div style={{ borderTop: '1px solid #F2F3F5' }}>{children}</div> : null}
    </div>
  );
}
