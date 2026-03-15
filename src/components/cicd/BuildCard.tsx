import {
  BranchesOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  RedoOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Button, Tag } from 'antd';
import { ChevronDown, Package } from 'lucide-react';
import { useState } from 'react';
import type { Build, BuildStep } from '../../data';
import { Avatar, ElapsedTimer, StepIcon, TerminalLog } from './shared';

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
  const [open, setOpen] = useState(build.status === 'running');
  const [activeStep, setActiveStep] = useState<number | null>(
    build.status === 'running' && runningIndex >= 0 ? runningIndex : null,
  );
  const [headerHovered, setHeaderHovered] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const buildTag = BUILD_TAG[build.status];

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #E5E6EB',
        borderLeft: `3px solid ${CARD_BORDER[build.status]}`,
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
          background: headerHovered ? '#FAFAFA' : 'transparent',
        }}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        onClick={() => setOpen((value) => !value)}
      >
        <div style={{ marginTop: 2, flexShrink: 0 }}>
          {build.status === 'success' && <CheckCircleFilled style={{ color: '#00B42A', fontSize: 18 }} />}
          {build.status === 'failed' && <CloseCircleFilled style={{ color: '#F53F3F', fontSize: 18 }} />}
          {build.status === 'running' && <SyncOutlined spin style={{ color: '#1664FF', fontSize: 18 }} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
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
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginTop: 2 }}>
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
          <ChevronDown
            size={14}
            color="#86909C"
            style={{ transition: 'transform 0.2s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          />
        </div>
      </div>

      {open && steps.length > 0 && (
        <div style={{ borderTop: '1px solid #F2F3F5' }}>
          <div style={{ padding: '12px 20px' }}>
            {steps.map((step, index) => {
              const hasDetail = Boolean(step.log?.length);
              const isActive = activeStep === index;
              const isHovered = hoveredStep === index && !isActive;

              return (
                <div key={`${build.id}-${step.name}-${index}`}>
                  <Button
                    type="text"
                    block
                    onClick={() => {
                      if (!hasDetail) {
                        return;
                      }
                      setActiveStep(isActive ? null : index);
                    }}
                    onMouseEnter={() => setHoveredStep(index)}
                    onMouseLeave={() => setHoveredStep(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      cursor: hasDetail ? 'pointer' : 'default',
                      height: 'auto',
                      padding: '8px 12px',
                      borderRadius: 8,
                      textAlign: 'left',
                      background: isActive ? '#F2F3F5' : isHovered && hasDetail ? '#FAFAFA' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                      <StepIcon status={step.status} />
                      <span
                        style={{
                          fontSize: 13,
                          color:
                            step.status === 'pending' || step.status === 'skipped' ? '#C9CDD4' : '#1D2129',
                          fontWeight: step.status === 'running' ? 500 : 400,
                        }}
                      >
                        {step.name}
                      </span>
                      {step.status === 'skipped' && (
                        <span style={{ color: '#C9CDD4', fontSize: 11 }}>已跳过</span>
                      )}

                      <div style={{ flex: 1 }} />

                      {step.duration && <span style={{ color: '#86909C', fontSize: 12 }}>{step.duration}</span>}
                      {step.status === 'running' && <ElapsedTimer running />}
                      {hasDetail && (
                        <ChevronDown
                          size={11}
                          color="#C9CDD4"
                          style={{
                            transition: 'transform 0.2s',
                            transform: isActive ? 'rotate(0deg)' : 'rotate(-90deg)',
                          }}
                        />
                      )}
                    </div>
                  </Button>

                  {isActive && step.log && (
                    <div style={{ margin: '0 12px 8px' }}>
                      <TerminalLog lines={step.log} animate={step.status === 'running'} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {build.imageRef && (
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
          )}
        </div>
      )}
    </div>
  );
}
