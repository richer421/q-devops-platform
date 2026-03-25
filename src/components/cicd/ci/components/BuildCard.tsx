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
import { CicdEntryCard, ElapsedTimer } from '@/components/cicd/shared';
import { BuildStageList } from './BuildStageList';
import { getCurrentBuildStage } from './buildStagePresentation';

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

const STATUS_ICON_STYLE: Record<BuildRecord['status'], { color: string; fontSize: number }> = {
  pending: { color: '#FF7D00', fontSize: 18 },
  success: { color: '#00B42A', fontSize: 18 },
  failed: { color: '#F53F3F', fontSize: 18 },
  running: { color: '#1664FF', fontSize: 18 },
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
  tagText: { fontSize: 11 },
  roundedTagText: { borderRadius: 12, fontSize: 11 },
  headerMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  refBadge: {
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
  },
  refBadgePrefix: { display: 'inline-flex', alignItems: 'center', gap: 4 },
  refBadgeDivider: { width: 1, alignSelf: 'stretch', background: '#BFD4FF' },
  monoText: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  secondaryText: { color: '#86909C', fontSize: 12 },
  idText: { color: '#C9CDD4', fontSize: 12 },
  bodyContainer: { padding: '12px 20px', display: 'grid', gap: 12 },
  bodySection: { display: 'grid', gap: 10 },
  bodyItem: { display: 'grid', gap: 4 },
  bodyLabel: { fontSize: 12 },
  errorText: { color: '#F53F3F', fontSize: 12, lineHeight: 1.6 },
} as const;

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
          {build.status === 'pending' && (
            <ClockCircleOutlined style={STATUS_ICON_STYLE.pending} />
          )}
          {build.status === 'success' && (
            <CheckCircleFilled style={STATUS_ICON_STYLE.success} />
          )}
          {build.status === 'failed' && (
            <CloseCircleFilled style={STATUS_ICON_STYLE.failed} />
          )}
          {build.status === 'running' && (
            <SyncOutlined spin style={STATUS_ICON_STYLE.running} />
          )}
        </>
      }
      headerContent={
        <>
          <div style={STYLES.headerTitleRow}>
            <span style={STYLES.titleText}>{build.name}</span>
            <Tag color={buildTag.color} style={STYLES.roundedTagText}>
              {buildTag.label}
            </Tag>
            <Tag color="geekblue" style={STYLES.tagText}>
              部署计划 #{build.deployPlanID}
            </Tag>
          </div>

          <div style={STYLES.headerMetaRow}>
            <div style={STYLES.refBadge}>
              <span style={STYLES.refBadgePrefix}>
                <BranchesOutlined />
                <span>{formatRefLabel(build)}</span>
              </span>
              <span style={STYLES.refBadgeDivider} />
              <span style={STYLES.monoText}>
                commit {commitLabel}
              </span>
            </div>
            <span style={STYLES.secondaryText}>
              当前阶段 {currentStage?.title ?? '未开始'}
            </span>
            <span style={STYLES.secondaryText}>
              业务单元 #{build.businessUnitID}
            </span>
            <span style={STYLES.idText}>#{build.id}</span>
          </div>
        </>
      }
      headerExtra={
        <>
          {build.status === 'running' ? (
            <ElapsedTimer running startedAt={build.buildStartedAt} finishedAt={build.buildFinishedAt} />
          ) : (
            <span style={STYLES.secondaryText}>{startedAt}</span>
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
      <div style={STYLES.bodyContainer}>
        <BuildStageList build={build} />

        <div style={STYLES.bodySection}>
          <div style={STYLES.bodyItem}>
            <Text type="secondary" style={STYLES.bodyLabel}>
              镜像摘要
            </Text>
            <code>{build.imageDigest || '-'}</code>
          </div>
          {build.errorMessage ? (
            <div style={STYLES.bodyItem}>
              <Text type="secondary" style={STYLES.bodyLabel}>
                错误信息
              </Text>
              <span style={STYLES.errorText}>
                {build.errorMessage}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </CicdEntryCard>
  );
}
