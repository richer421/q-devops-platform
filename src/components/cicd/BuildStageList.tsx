import type { BuildRecord } from '../../lib/q-ci-build';
import { CicdStepContainer } from './CicdStepContainer';
import { BuildStageItem } from './BuildStageItem';

type BuildStageListProps = {
  build: BuildRecord;
};

export function BuildStageList({ build }: BuildStageListProps) {
  return (
    <section
      style={{
        display: 'grid',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        background: '#F7F8FA',
        border: '1px solid #EAEDF1',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#4E5969', letterSpacing: '0.02em' }}>
          构建阶段
        </span>
        <span style={{ fontSize: 12, color: '#86909C' }}>{build.stages.length} steps</span>
      </div>

      {build.stages.length > 0 ? (
        build.stages.map((stage) => (
          <BuildStageItem key={`${build.id}-${stage.name}`} buildID={build.id} stage={stage} />
        ))
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
