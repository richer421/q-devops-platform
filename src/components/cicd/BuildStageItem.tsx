import type { BuildRecord, BuildStageStatus } from '../../lib/q-ci-build';
import { CicdStepContainer } from './CicdStepContainer';

type BuildStage = BuildRecord['stages'][number];

type BuildStageItemProps = {
  stage: BuildStage;
  buildID: number;
};

function formatStageDuration(stage: BuildStage) {
  if (!stage.startedAt || !stage.finishedAt) {
    return null;
  }

  const startedAt = Date.parse(stage.startedAt);
  const finishedAt = Date.parse(stage.finishedAt);
  if (Number.isNaN(startedAt) || Number.isNaN(finishedAt) || finishedAt < startedAt) {
    return null;
  }

  const durationSeconds = Math.round((finishedAt - startedAt) / 1000);
  if (durationSeconds < 60) {
    return `${durationSeconds}s`;
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}分${seconds}秒`;
}

function stageStatus(stage: BuildStage): BuildStageStatus {
  return stage.status;
}

function stageNote(stage: BuildStage) {
  if (!stage.errorMessage) {
    return null;
  }

  return (
    <span style={{ color: '#F53F3F', fontSize: 12 }}>
      {stage.errorMessage}
    </span>
  );
}

export function BuildStageItem({ stage, buildID }: BuildStageItemProps) {
  return (
    <div
      style={{
        borderRadius: 10,
        background: '#FFFFFF',
        border: '1px solid #F2F3F5',
      }}
    >
      <CicdStepContainer
        key={`${buildID}-${stage.name}`}
        title={stage.title}
        status={stageStatus(stage)}
        duration={stage.status === 'running' ? null : formatStageDuration(stage)}
        note={stageNote(stage)}
      />
    </div>
  );
}
