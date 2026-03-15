import {
  CheckCircleFilled,
  CloseCircleFilled,
  RollbackOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Button, Tag } from 'antd';
import { Tag as TagIcon } from 'lucide-react';
import type { Release, ReleaseStage } from '../../data';
import { EnvTag } from '../common/EnvTag';
import { CicdEntryCard } from './CicdEntryCard';
import { CicdStepContainer } from './CicdStepContainer';
import { ElapsedTimer, TerminalLog } from './shared';
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
  const releaseTag = RELEASE_TAG[release.status];

  return (
    <CicdEntryCard
      accentColor={RELEASE_BORDER[release.status]}
      defaultOpen={release.status === 'deploying'}
      headerLeading={
        <>
          {release.status === 'success' && <CheckCircleFilled style={{ color: '#00B42A', fontSize: 18 }} />}
          {release.status === 'failed' && <CloseCircleFilled style={{ color: '#F53F3F', fontSize: 18 }} />}
          {release.status === 'deploying' && <SyncOutlined spin style={{ color: '#1664FF', fontSize: 18 }} />}
          {release.status === 'rolled_back' && (
            <RollbackOutlined style={{ color: '#FF7D00', fontSize: 18 }} />
          )}
        </>
      }
      headerContent={
        <>
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
        </>
      }
      headerExtra={
        <>
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
        </>
      }
    >
      <div style={{ padding: '12px 20px' }}>
        {stages.map((stage, index) => (
          <CicdStepContainer
            key={`${release.id}-${stage.name}-${index}`}
            title={stage.name}
            status={stage.status}
            duration={stage.duration}
            defaultOpen={release.status === 'deploying' && runningIndex === index}
            detailKind={stage.rollout ? 'rollout' : stage.log ? 'terminal' : undefined}
            detail={
              stage.rollout ? (
                <PodRollout data={stage.rollout} />
              ) : stage.log ? (
                <TerminalLog lines={stage.log} animate={stage.status === 'running'} />
              ) : undefined
            }
          />
        ))}
      </div>
    </CicdEntryCard>
  );
}
