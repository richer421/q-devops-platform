import type { BuildRecord, BuildStageStatus } from '../../lib/q-ci-build';

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

export function formatElapsedDuration(
  startedAt?: string,
  finishedAt?: string,
  nowMs = Date.now(),
) {
  if (!startedAt) {
    return null;
  }

  const startedMs = Date.parse(startedAt);
  if (Number.isNaN(startedMs)) {
    return null;
  }

  const finishedMs = finishedAt ? Date.parse(finishedAt) : nowMs;
  if (Number.isNaN(finishedMs) || finishedMs < startedMs) {
    return null;
  }

  const durationSeconds = Math.round((finishedMs - startedMs) / 1000);
  if (durationSeconds < 60) {
    return `${durationSeconds}s`;
  }

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }

  return `${minutes}分${String(seconds).padStart(2, '0')}秒`;
}
