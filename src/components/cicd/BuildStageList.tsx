import type { BuildRecord } from '../../lib/q-ci-build';
import { CicdStepContainer } from './CicdStepContainer';
import { BuildStageItem } from './BuildStageItem';
import { getCurrentBuildStage } from './buildStagePresentation';

type BuildStageListProps = {
  build: BuildRecord;
};

export function BuildStageList({ build }: BuildStageListProps) {
  const openStageIndex = build.stages.findIndex(
    (stage) => stage.status === 'running' || stage.status === 'failed',
  );
  const currentStage = getCurrentBuildStage(build);

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      {currentStage ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#86909C', fontSize: 12 }}>
          <span>当前阶段</span>
          <span style={{ color: '#1D2129', fontWeight: 600 }}>{currentStage.title}</span>
        </div>
      ) : null}

      {build.stages.length > 0 ? (
        <div style={{ display: 'grid', gap: 4 }}>
          {build.stages.map((stage, index) => (
            <BuildStageItem
              key={`${build.id}-${stage.name}`}
              stage={stage}
              index={index}
              total={build.stages.length}
              defaultOpen={openStageIndex === index}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            borderRadius: 10,
            background: '#FFFFFF',
            border: '1px dashed #D9DDE3',
          }}
        >
          <CicdStepContainer
            title="阶段数据缺失"
            status={build.status === 'pending' ? 'pending' : build.status}
            note={
              <span style={{ color: '#86909C', fontSize: 12 }}>
                旧记录未落阶段数据，请重新触发一次构建。
              </span>
            }
          />
        </div>
      )}
    </section>
  );
}
