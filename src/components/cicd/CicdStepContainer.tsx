import { Button } from 'antd';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { StepStatus } from './shared';
import { ElapsedTimer, StepIcon } from './shared';

export type CicdStepDetailKind = 'terminal' | 'rollout' | 'panel';

type CicdStepContainerProps = {
  title: string;
  status: StepStatus;
  duration?: string | null;
  note?: ReactNode;
  defaultOpen?: boolean;
  detailKind?: CicdStepDetailKind;
  detail?: ReactNode;
};

export function CicdStepContainer({
  title,
  status,
  duration,
  note,
  defaultOpen = false,
  detailKind,
  detail,
}: CicdStepContainerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [hovered, setHovered] = useState(false);

  const hasDetail = Boolean(detail && detailKind);
  const isMuted = status === 'pending' || status === 'skipped';
  const background = open ? '#F2F3F5' : hovered && hasDetail ? '#FAFAFA' : 'transparent';

  return (
    <div data-cicd-step-container="true">
      <Button
        type="text"
        block
        onClick={() => {
          if (!hasDetail) {
            return;
          }
          setOpen((value) => !value);
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          cursor: hasDetail ? 'pointer' : 'default',
          height: 'auto',
          padding: '8px 12px',
          borderRadius: 8,
          textAlign: 'left',
          background,
          transition: 'background 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
          <StepIcon status={status} />
          <span
            style={{
              fontSize: 13,
              color: isMuted ? '#C9CDD4' : '#1D2129',
              fontWeight: status === 'running' ? 500 : 400,
            }}
          >
            {title}
          </span>
          {note}
          <div style={{ flex: 1 }} />
          {duration ? <span style={{ color: '#86909C', fontSize: 12 }}>{duration}</span> : null}
          {status === 'running' ? <ElapsedTimer running /> : null}
          {hasDetail ? (
            <ChevronDown
              size={11}
              color="#C9CDD4"
              style={{
                transition: 'transform 0.2s',
                transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
              }}
            />
          ) : null}
        </div>
      </Button>

      {open && hasDetail ? (
        <div
          data-cicd-step-detail={detailKind}
          style={{ margin: '0 12px 8px' }}
        >
          {detail}
        </div>
      ) : null}
    </div>
  );
}
