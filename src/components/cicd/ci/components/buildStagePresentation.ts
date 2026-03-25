import type { BuildRecord, BuildStageStatus } from '@/utils/api/q-ci/build';

type BuildStage = BuildRecord['stages'][number];

type StageStatusMeta = {
  label: string;
  tone: string;
  background: string;
  border: string;
};

const STAGE_STATUS_META: Record<BuildStageStatus, StageStatusMeta> = {
  pending: {
    label: '待执行',
    tone: '#86909C',
    background: '#F7F8FA',
    border: '#E5E6EB',
  },
  running: {
    label: '进行中',
    tone: '#1664FF',
    background: '#E8F3FF',
    border: '#91C3FF',
  },
  success: {
    label: '已完成',
    tone: '#00B42A',
    background: '#E8FFEA',
    border: '#7BE188',
  },
  failed: {
    label: '失败',
    tone: '#F53F3F',
    background: '#FFF1F0',
    border: '#FFB5B5',
  },
  skipped: {
    label: '已跳过',
    tone: '#86909C',
    background: '#F2F3F5',
    border: '#D9DDE3',
  },
};

export function getStageStatusMeta(status: BuildStageStatus): StageStatusMeta {
  return STAGE_STATUS_META[status];
}

export function getCurrentBuildStage(build: BuildRecord): BuildStage | null {
  return (
    build.stages.find((stage) => stage.status === 'running') ??
    build.stages.find((stage) => stage.status === 'failed') ??
    build.stages.find((stage) => stage.status === 'pending') ??
    build.stages.at(-1) ??
    null
  );
}
