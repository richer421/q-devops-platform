import {
  BranchesOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  RedoOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Button, Tag } from 'antd';
import { Package } from 'lucide-react';
import type { Build, BuildStep } from '../../mock';
import { CicdEntryCard } from './CicdEntryCard';
import { CicdStepContainer } from './CicdStepContainer';
import { Avatar, ElapsedTimer, TerminalLog } from './shared';

type BuildCardProps = {
  build: Build;
  steps: BuildStep[];
};

const CARD_BORDER: Record<Build['status'], string> = {
  success: '#00B42A',
  failed: '#F53F3F',
  running: '#1664FF',
};

const BUILD_TAG: Record<Build['status'], { color: string; label: string }> = {
  success: { color: 'success', label: '成功' },
  failed: { color: 'error', label: '失败' },
  running: { color: 'processing', label: '构建中' },
};

export function BuildCard({ build, steps }: BuildCardProps) {
  const runningIndex = steps.findIndex((step) => step.status === 'running');
  const buildTag = BUILD_TAG[build.status];

  return (
    <CicdEntryCard
      accentColor={CARD_BORDER[build.status]}
      defaultOpen={build.status === 'running'}
      headerLeading={
        <>
          {build.status === 'success' && <CheckCircleFilled style={{ color: '#00B42A', fontSize: 18 }} />}
          {build.status === 'failed' && <CloseCircleFilled style={{ color: '#F53F3F', fontSize: 18 }} />}
          {build.status === 'running' && <SyncOutlined spin style={{ color: '#1664FF', fontSize: 18 }} />}
        </>
      }
      headerContent={
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1D2129' }}>{build.commitMsg}</span>
            <Tag color={buildTag.color} style={{ borderRadius: 12, fontSize: 11 }}>
              {buildTag.label}
            </Tag>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Tag icon={<BranchesOutlined />} color="blue" style={{ fontSize: 11 }}>
              {build.branch}
            </Tag>
            <code
              style={{
                fontSize: 11,
                background: '#F2F3F5',
                padding: '2px 6px',
                borderRadius: 4,
                color: '#86909C',
              }}
            >
              {build.commit}
            </code>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#86909C' }}>
              <Avatar name={build.author} />
              <span style={{ fontSize: 12 }}>{build.author}</span>
            </div>
            <span style={{ color: '#86909C', fontSize: 12 }}>{build.buName}</span>
            <span style={{ color: '#C9CDD4', fontSize: 12 }}>#{build.id}</span>
          </div>
        </>
      }
      headerExtra={
        <>
          {build.status === 'running' ? (
            <ElapsedTimer running />
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#86909C', fontSize: 12 }}>
              <ClockCircleOutlined style={{ fontSize: 11 }} />
              {build.duration}
            </span>
          )}
          <span style={{ color: '#C9CDD4', fontSize: 12 }}>{build.startTime}</span>
          <Button size="small" icon={<RedoOutlined />} onClick={(event) => event.stopPropagation()}>
            重建
          </Button>
        </>
      }
    >
      <div style={{ padding: '12px 20px' }}>
        {steps.map((step, index) => (
          <CicdStepContainer
            key={`${build.id}-${step.name}-${index}`}
            title={step.name}
            status={step.status}
            duration={step.duration}
            note={
              step.status === 'skipped' ? (
                <span style={{ color: '#C9CDD4', fontSize: 11 }}>已跳过</span>
              ) : undefined
            }
            defaultOpen={build.status === 'running' && runningIndex === index}
            detailKind={step.log?.length ? 'terminal' : undefined}
            detail={
              step.log?.length ? (
                <TerminalLog lines={step.log} animate={step.status === 'running'} />
              ) : undefined
            }
          />
        ))}
      </div>

      {build.imageRef ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            margin: '0 20px 16px',
            padding: '8px 12px',
            background: '#F7F8FA',
            border: '1px solid #E5E6EB',
            borderRadius: 8,
          }}
        >
          <Package size={13} color="#7B61FF" />
          <span style={{ color: '#86909C', fontSize: 12, flexShrink: 0 }}>构建产物</span>
          <code
            style={{
              color: '#4E5969',
              fontSize: 11,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {build.imageRef}
          </code>
        </div>
      ) : null}
    </CicdEntryCard>
  );
}
