import {
  CheckCircleFilled,
  CloseCircleFilled,
  RollbackOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Button, Tag } from 'antd';
import { Tag as TagIcon } from 'lucide-react';
import type { Release, ReleaseStage } from '@/mock';
import { EnvTag } from '@/components/common/env';
import {
  CicdEntryCard,
  CicdStepContainer,
  ElapsedTimer,
  TerminalLog,
} from '@/components/cicd/shared';
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

const STATUS_ICON_STYLE: Record<Release['status'], { color: string; fontSize: number }> = {
  success: { color: '#00B42A', fontSize: 18 },
  failed: { color: '#F53F3F', fontSize: 18 },
  deploying: { color: '#1664FF', fontSize: 18 },
  rolled_back: { color: '#FF7D00', fontSize: 18 },
};

const STYLES = {
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  titleText: { fontSize: 14, fontWeight: 600, color: '#1D2129' },
  roundedTagText: { borderRadius: 12, fontSize: 11 },
  headerMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  versionContainer: { display: 'flex', alignItems: 'center', gap: 4 },
  versionCode: { color: '#4E5969', fontSize: 12 },
  secondaryText: { color: '#86909C', fontSize: 12 },
  artifactCode: {
    color: '#86909C',
    background: '#F2F3F5',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 11,
  },
  idText: { color: '#C9CDD4', fontSize: 12 },
  rollbackButton: { color: '#FF7D00', borderColor: '#FF7D00' },
  bodyContainer: { padding: '12px 20px' },
} as const;

export function ReleaseCard({ release, stages }: ReleaseCardProps) {
  const runningIndex = stages.findIndex((stage) => stage.status === 'running');
  const releaseTag = RELEASE_TAG[release.status];

  return (
    <CicdEntryCard
      accentColor={RELEASE_BORDER[release.status]}
      defaultOpen={release.status === 'deploying'}
      headerLeading={
        <>
          {release.status === 'success' && (
            <CheckCircleFilled style={STATUS_ICON_STYLE.success} />
          )}
          {release.status === 'failed' && (
            <CloseCircleFilled style={STATUS_ICON_STYLE.failed} />
          )}
          {release.status === 'deploying' && (
            <SyncOutlined spin style={STATUS_ICON_STYLE.deploying} />
          )}
          {release.status === 'rolled_back' && (
            <RollbackOutlined style={STATUS_ICON_STYLE.rolled_back} />
          )}
        </>
      }
      headerContent={
        <>
          <div style={STYLES.headerTitleRow}>
            <span style={STYLES.titleText}>{release.buName}</span>
            <span style={STYLES.idText}>→</span>
            <EnvTag env={release.env} />
            <Tag color={releaseTag.color} style={STYLES.roundedTagText}>
              {releaseTag.label}
            </Tag>
          </div>

          <div style={STYLES.headerMetaRow}>
            <span style={STYLES.versionContainer}>
              <TagIcon size={10} color="#86909C" />
              <code style={STYLES.versionCode}>{release.version}</code>
            </span>
            <span style={STYLES.secondaryText}>
              产物{' '}
              <code style={STYLES.artifactCode}>
                {release.artifactId}
              </code>
            </span>
            <Tag color="blue" style={STYLES.roundedTagText}>
              {release.releaseMode}
            </Tag>
            <span style={STYLES.idText}>#{release.id}</span>
          </div>
        </>
      }
      headerExtra={
        <>
          {release.status === 'deploying' ? (
            <ElapsedTimer running />
          ) : (
            <span style={STYLES.secondaryText}>{release.startTime}</span>
          )}

          {(release.status === 'success' || release.status === 'failed') && (
            <Button
              size="small"
              icon={<RollbackOutlined />}
              onClick={(event) => event.stopPropagation()}
              style={STYLES.rollbackButton}
            >
              回滚
            </Button>
          )}
        </>
      }
    >
      <div style={STYLES.bodyContainer}>
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
