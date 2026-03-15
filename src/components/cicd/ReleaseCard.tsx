import {
  CheckCircleFilled,
  CloseCircleFilled,
  RollbackOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Button, Tag } from 'antd';
import { ChevronDown, Tag as TagIcon } from 'lucide-react';
import { useState } from 'react';
import type { Release, ReleaseStage } from '../../data';
import { EnvTag } from '../common/EnvTag';
import { ElapsedTimer, StepIcon, TerminalLog } from './shared';
import { PodRollout } from './PodRollout';

type ReleaseCardProps = {
  release: Release;
  stages: ReleaseStage[];
};

const RELEASE_TAG: Record<Release['status'], { color: string; label: string }> = {
  success: { color: 'success', label: '成功' },
  failed: { color: 'error', label: '失败' },
  deploying: { color: 'processing', label: '发布中' },
  rolled_back: { color: 'warning', label: '已回滚' },
};

const RELEASE_BORDER: Record<Release['status'], string> = {
  success: '#00B42A',
  failed: '#F53F3F',
  deploying: '#1664FF',
  rolled_back: '#FF7D00',
};

export function ReleaseCard({ release, stages }: ReleaseCardProps) {
  const runningIndex = stages.findIndex((stage) => stage.status === 'running');
  const [open, setOpen] = useState(release.status === 'deploying');
  const [activeStage, setActiveStage] = useState<number | null>(
    release.status === 'deploying' && runningIndex >= 0 ? runningIndex : null,
  );
  const [headerHovered, setHeaderHovered] = useState(false);
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);

  const releaseTag = RELEASE_TAG[release.status];

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #E5E6EB',
        borderLeft: `3px solid ${RELEASE_BORDER[release.status]}`,
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
          {release.status === 'success' && <CheckCircleFilled style={{ color: '#00B42A', fontSize: 18 }} />}
          {release.status === 'failed' && <CloseCircleFilled style={{ color: '#F53F3F', fontSize: 18 }} />}
          {release.status === 'deploying' && <SyncOutlined spin style={{ color: '#1664FF', fontSize: 18 }} />}
          {release.status === 'rolled_back' && (
            <RollbackOutlined style={{ color: '#FF7D00', fontSize: 18 }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1D2129' }}>{release.buName}</span>
            <span style={{ color: '#C9CDD4' }}>→</span>
            <EnvTag env={release.env} />
            <Tag color={releaseTag.color} style={{ borderRadius: 12, fontSize: 11 }}>
              {releaseTag.label}
            </Tag>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <TagIcon size={10} color="#86909C" />
              <code style={{ color: '#4E5969', fontSize: 12 }}>{release.version}</code>
            </span>
            <span style={{ color: '#86909C', fontSize: 12 }}>
              产物{' '}
              <code
                style={{
                  color: '#86909C',
                  background: '#F2F3F5',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 11,
                }}
              >
                {release.artifactId}
              </code>
            </span>
            <Tag color="blue" style={{ fontSize: 11 }}>
              {release.releaseMode}
            </Tag>
            <span style={{ color: '#C9CDD4', fontSize: 12 }}>#{release.id}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginTop: 2 }}>
          {release.status === 'deploying' ? (
            <ElapsedTimer running />
          ) : (
            <span style={{ color: '#86909C', fontSize: 12 }}>{release.startTime}</span>
          )}

          {(release.status === 'success' || release.status === 'failed') && (
            <Button
              size="small"
              icon={<RollbackOutlined />}
              onClick={(event) => event.stopPropagation()}
              style={{ color: '#FF7D00', borderColor: '#FF7D00' }}
            >
              回滚
            </Button>
          )}

          <ChevronDown
            size={14}
            color="#86909C"
            style={{ transition: 'transform 0.2s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          />
        </div>
      </div>

      {open && stages.length > 0 && (
        <div style={{ borderTop: '1px solid #F2F3F5' }}>
          <div style={{ padding: '12px 20px' }}>
            {stages.map((stage, index) => {
              const hasDetail = Boolean(stage.log || stage.rollout);
              const isActive = activeStage === index;
              const isHovered = hoveredStage === index && !isActive;

              return (
                <div key={`${release.id}-${stage.name}-${index}`}>
                  <Button
                    type="text"
                    block
                    onClick={() => {
                      if (!hasDetail) {
                        return;
                      }
                      setActiveStage(isActive ? null : index);
                    }}
                    onMouseEnter={() => setHoveredStage(index)}
                    onMouseLeave={() => setHoveredStage(null)}
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
                      <StepIcon status={stage.status} />
                      <span
                        style={{
                          fontSize: 13,
                          color:
                            stage.status === 'pending' || stage.status === 'skipped'
                              ? '#C9CDD4'
                              : '#1D2129',
                          fontWeight: stage.status === 'running' ? 500 : 400,
                        }}
                      >
                        {stage.name}
                      </span>
                      <div style={{ flex: 1 }} />
                      {stage.duration && <span style={{ color: '#86909C', fontSize: 12 }}>{stage.duration}</span>}
                      {stage.status === 'running' && <ElapsedTimer running />}
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

                  {isActive && (
                    <div style={{ margin: '0 12px 8px' }}>
                      {stage.rollout ? (
                        <PodRollout data={stage.rollout} />
                      ) : (
                        stage.log && <TerminalLog lines={stage.log} animate={stage.status === 'running'} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
