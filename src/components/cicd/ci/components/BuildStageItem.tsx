import { Tag } from 'antd';
import type { BuildRecord } from '@/utils/api/q-ci/build';
import { formatDateTimeYMDHM } from '@/utils/format/date-time';
import { CicdStepContainer, formatElapsedDuration } from '@/components/cicd/shared';
import { getStageStatusMeta } from './buildStagePresentation';

type BuildStage = BuildRecord['stages'][number];

type BuildStageItemProps = {
  stage: BuildStage;
  index: number;
  total: number;
  defaultOpen?: boolean;
};

function buildStageDetail(stage: BuildStage) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        border: '1px solid #E5E6EB',
        background: '#FAFAFA',
      }}
    >
      <div style={{ display: 'grid', gap: 4 }}>
        <span style={{ color: '#86909C', fontSize: 12 }}>开始时间</span>
        <span style={{ color: '#1D2129', fontSize: 12 }}>
          {formatDateTimeYMDHM(stage.startedAt)}
        </span>
      </div>
      <div style={{ display: 'grid', gap: 4 }}>
        <span style={{ color: '#86909C', fontSize: 12 }}>结束时间</span>
        <span style={{ color: '#1D2129', fontSize: 12 }}>
          {formatDateTimeYMDHM(stage.finishedAt)}
        </span>
      </div>
      {stage.errorMessage ? (
        <div style={{ display: 'grid', gap: 4 }}>
          <span style={{ color: '#86909C', fontSize: 12 }}>错误信息</span>
          <span style={{ color: '#F53F3F', fontSize: 12, lineHeight: 1.6 }}>
            {stage.errorMessage}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function BuildStageItem({
  stage,
  index,
  total,
  defaultOpen = false,
}: BuildStageItemProps) {
  const meta = getStageStatusMeta(stage.status);
  const duration =
    stage.status === 'running'
      ? null
      : formatElapsedDuration(stage.startedAt, stage.finishedAt);

  return (
    <CicdStepContainer
      title={stage.title}
      status={stage.status}
      duration={duration}
      startedAt={stage.startedAt}
      finishedAt={stage.finishedAt}
      defaultOpen={defaultOpen}
      note={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Tag
            bordered={false}
            style={{
              marginInlineEnd: 0,
              borderRadius: 999,
              background: meta.background,
              color: meta.tone,
              fontSize: 11,
              paddingInline: 10,
            }}
          >
            {index + 1}/{total} · {meta.label}
          </Tag>
          {stage.errorMessage ? (
            <span
              style={{
                color: '#F53F3F',
                fontSize: 12,
                maxWidth: 240,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {stage.errorMessage}
            </span>
          ) : null}
        </div>
      }
      detailKind="panel"
      detail={buildStageDetail(stage)}
    />
  );
}
