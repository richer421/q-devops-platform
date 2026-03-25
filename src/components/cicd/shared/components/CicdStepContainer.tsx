import { Collapse } from 'antd';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import type { StepStatus } from './shared';
import { ElapsedTimer, StepIcon } from './shared';

export type CicdStepDetailKind = 'terminal' | 'rollout' | 'panel';

type CicdStepContainerProps = {
  title: string;
  status: StepStatus;
  duration?: string | null;
  startedAt?: string;
  finishedAt?: string;
  note?: ReactNode;
  defaultOpen?: boolean;
  detailKind?: CicdStepDetailKind;
  detail?: ReactNode;
};

export function CicdStepContainer({
  title,
  status,
  duration,
  startedAt,
  finishedAt,
  note,
  defaultOpen = false,
  detailKind,
  detail,
}: CicdStepContainerProps) {
  const hasDetail = Boolean(detail && detailKind);
  const isMuted = status === 'pending' || status === 'skipped';
  const header = (
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
      {status === 'running' && !duration ? (
        <ElapsedTimer running startedAt={startedAt} finishedAt={finishedAt} />
      ) : null}
    </div>
  );

  if (!hasDetail) {
    return (
      <div data-cicd-step-container="true">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '8px 12px',
            borderRadius: 8,
            background: 'transparent',
          }}
        >
          {header}
        </div>
      </div>
    );
  }

  return (
    <div data-cicd-step-container="true">
      <Collapse
        bordered={false}
        ghost
        defaultActiveKey={defaultOpen ? ['detail'] : []}
        expandIconPosition="end"
        expandIcon={({ isActive }) => (
          <ChevronDown
            size={11}
            color="#C9CDD4"
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
              <div data-cicd-step-detail={detailKind} style={{ margin: '0 12px 8px' }}>
                {detail}
              </div>
            ),
            style: { border: 'none', background: 'transparent' },
          },
        ]}
        style={{ background: 'transparent' }}
      />
    </div>
  );
}
