import {
  BranchesOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  LinkOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Button, Tag, Typography } from 'antd';
import { formatDateTimeYMDHM } from '@/utils/format/date-time';
import type { BuildRecord } from '@/utils/api/q-ci/build';
import { BuildStageList } from './BuildStageList';
import { getCurrentBuildStage } from './buildStagePresentation';
import { CicdEntryCard } from './CicdEntryCard';
import { ElapsedTimer } from './shared';

type BuildCardProps = {
  build: BuildRecord;
};

const { Text } = Typography;

const CARD_BORDER: Record<BuildRecord['status'], string> = {
  pending: '#FF7D00',
  success: '#00B42A',
  failed: '#F53F3F',
  running: '#1664FF',
};

const BUILD_TAG: Record<
  BuildRecord['status'],
  { color: string; label: string }
> = {
  pending: { color: 'warning', label: '排队中' },
  success: { color: 'success', label: '成功' },
  failed: { color: 'error', label: '失败' },
  running: { color: 'processing', label: '构建中' },
};

function formatRefTypeLabel(refType: BuildRecord['buildSource']['refType']) {
  switch (refType) {
    case 'branch':
      return 'Branch';
    case 'tag':
      return 'Tag';
    case 'commit':
      return 'Commit';
  }
}

function formatCommitLabel(build: BuildRecord) {
  const commitID = build.buildSource.commitID.trim();
  if (commitID) {
    return commitID.slice(0, 8);
  }
  if (build.buildSource.refType === 'commit') {
    return build.buildSource.refValue.slice(0, 8);
  }
  return '-';
}

function formatRefLabel(build: BuildRecord) {
  const refType = formatRefTypeLabel(build.buildSource.refType);
  return `${refType}: ${build.buildSource.refValue}`;
}

export function BuildCard({ build }: BuildCardProps) {
  const buildTag = BUILD_TAG[build.status];
  const currentStage = getCurrentBuildStage(build);
  const commitLabel = formatCommitLabel(build);
  const startedAt = formatDateTimeYMDHM(build.buildStartedAt || build.createdAt);

  return (
    <CicdEntryCard
      accentColor={CARD_BORDER[build.status]}
      defaultOpen={build.status === 'running'}
      headerLeading={
        <>
          {build.status === 'pending' && <ClockCircleOutlined style={{ color: '#FF7D00', fontSize: 18 }} />}
          {build.status === 'success' && <CheckCircleFilled style={{ color: '#00B42A', fontSize: 18 }} />}
          {build.status === 'failed' && <CloseCircleFilled style={{ color: '#F53F3F', fontSize: 18 }} />}
          {build.status === 'running' && <SyncOutlined spin style={{ color: '#1664FF', fontSize: 18 }} />}
        </>
      }
      headerContent={
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1D2129' }}>{build.name}</span>
            <Tag color={buildTag.color} style={{ borderRadius: 12, fontSize: 11 }}>
              {buildTag.label}
            </Tag>
            <Tag color="geekblue" style={{ fontSize: 11 }}>
              部署计划 #{build.deployPlanID}
            </Tag>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '3px 10px',
                borderRadius: 8,
                border: '1px solid #91C3FF',
                background: '#F2F8FF',
                color: '#1664FF',
                fontSize: 11,
                lineHeight: 1,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <BranchesOutlined />
                <span>{formatRefLabel(build)}</span>
              </span>
              <span style={{ width: 1, alignSelf: 'stretch', background: '#BFD4FF' }} />
              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                commit {commitLabel}
              </span>
            </div>
            <span style={{ color: '#86909C', fontSize: 12 }}>
              当前阶段 {currentStage?.title ?? '未开始'}
            </span>
            <span style={{ color: '#86909C', fontSize: 12 }}>业务单元 #{build.businessUnitID}</span>
            <span style={{ color: '#C9CDD4', fontSize: 12 }}>#{build.id}</span>
          </div>
        </>
      }
      headerExtra={
        <>
          {build.status === 'running' ? (
            <ElapsedTimer running startedAt={build.buildStartedAt} finishedAt={build.buildFinishedAt} />
          ) : (
            <span style={{ color: '#86909C', fontSize: 12 }}>{startedAt}</span>
          )}
          {build.jenkinsBuildURL ? (
            <Button
              size="small"
              type="link"
              href={build.jenkinsBuildURL}
              target="_blank"
              rel="noreferrer"
              icon={<LinkOutlined />}
              onClick={(event) => event.stopPropagation()}
            >
              Jenkins #{build.jenkinsBuildNumber || build.id}
            </Button>
          ) : null}
        </>
      }
    >
      <div style={{ padding: '12px 20px', display: 'grid', gap: 12 }}>
        <BuildStageList build={build} />

        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              镜像摘要
            </Text>
            <code>{build.imageDigest || '-'}</code>
          </div>
          {build.errorMessage ? (
            <div style={{ display: 'grid', gap: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                错误信息
              </Text>
              <span style={{ color: '#F53F3F', fontSize: 12, lineHeight: 1.6 }}>
                {build.errorMessage}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </CicdEntryCard>
  );
}
