import {
  BranchesOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  SyncOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { Button, Tag, Typography } from 'antd';
import { Package } from 'lucide-react';
import { formatDateTimeYMDHM } from '../../lib/date-time';
import type { BuildRecord } from '../../lib/q-ci-build';
import { BuildStageList } from './BuildStageList';
import { CicdEntryCard } from './CicdEntryCard';
import { ElapsedTimer } from './shared';

type BuildCardProps = {
  build: BuildRecord;
};

const { Text, Link } = Typography;

const CARD_BORDER: Record<BuildRecord['status'], string> = {
  pending: '#FF7D00',
  success: '#00B42A',
  failed: '#F53F3F',
  running: '#1664FF',
};

const BUILD_TAG: Record<BuildRecord['status'], { color: string; label: string }> = {
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

function formatDuration(build: BuildRecord) {
  if (!build.buildStartedAt || !build.buildFinishedAt) {
    return '—';
  }

  const startedAt = Date.parse(build.buildStartedAt);
  const finishedAt = Date.parse(build.buildFinishedAt);
  if (Number.isNaN(startedAt) || Number.isNaN(finishedAt) || finishedAt < startedAt) {
    return '—';
  }

  const durationSeconds = Math.round((finishedAt - startedAt) / 1000);
  if (durationSeconds < 60) {
    return `${durationSeconds}s`;
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}分${seconds}秒`;
}

export function BuildCard({ build }: BuildCardProps) {
  const buildTag = BUILD_TAG[build.status];
  const commitLabel = formatCommitLabel(build);
  const startedAt = formatDateTimeYMDHM(build.buildStartedAt || build.createdAt);
  const finishedAt = formatDateTimeYMDHM(build.buildFinishedAt);

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
            <Tag icon={<BranchesOutlined />} color="blue" style={{ fontSize: 11 }}>
              {formatRefTypeLabel(build.buildSource.refType)} · {build.buildSource.refValue}
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
              {commitLabel}
            </code>
            <span style={{ color: '#86909C', fontSize: 12 }}>业务单元 #{build.businessUnitID}</span>
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
              {formatDuration(build)}
            </span>
          )}
          <span style={{ color: '#C9CDD4', fontSize: 12 }}>{startedAt}</span>
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
      <div style={{ padding: '12px 20px' }}>
        <BuildStageList build={build} />
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              仓库地址
            </Text>
            <code>{build.buildSource.repoURL || '-'}</code>
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              结束时间
            </Text>
            <span>{finishedAt}</span>
          </div>
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
          <Text type="secondary" style={{ fontSize: 12 }}>
            阶段状态由 Jenkins 模板回调驱动；排障和日志仍以 Jenkins 构建详情为准。
          </Text>
          {build.jenkinsBuildURL ? (
            <Link href={build.jenkinsBuildURL} target="_blank" rel="noreferrer">
              打开 Jenkins 构建详情
            </Link>
          ) : null}
        </div>
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
