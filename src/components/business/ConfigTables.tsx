import type { CDConfig, CIConfig, Instance } from '../../data';
import { getEnvMeta, getInstanceStatusMeta } from '../../lib/status';

type ConfigTablesProps = {
  ciConfigs: CIConfig[];
  cdConfigs: CDConfig[];
  instances: Instance[];
};

export function ConfigTables({ ciConfigs, cdConfigs, instances }: ConfigTablesProps) {
  if (ciConfigs.length === 0 && cdConfigs.length === 0 && instances.length === 0) {
    return (
      <div className="rounded-xl border border-[#E5E6EB] bg-white px-5 py-12 text-center text-[#86909C]" style={{ fontSize: 13 }}>
        暂无配置数据
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ciConfigs.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[#E5E6EB] bg-white">
          <div className="border-b border-[#F2F3F5] bg-[#FAFAFA] px-5 py-3 text-[#86909C]" style={{ fontSize: 12, fontWeight: 500 }}>
            CI 配置
          </div>
          <div className="divide-y divide-[#F2F3F5]">
            {ciConfigs.map((config) => (
              <div key={config.id} className="grid grid-cols-[180px_1fr_180px_120px] gap-4 px-5 py-3.5">
                <div className="text-[#1D2129]" style={{ fontSize: 13, fontWeight: 500 }}>
                  {config.name}
                </div>
                <div className="text-[#4E5969]" style={{ fontSize: 12 }}>
                  {config.registry}/{config.repo}
                </div>
                <code className="rounded bg-[#F0ECFF] px-2 py-0.5 text-[#7B61FF]" style={{ fontSize: 11 }}>
                  {config.tagRule}
                </code>
                <span className="rounded bg-[#F2F3F5] px-2 py-0.5 text-[#4E5969]" style={{ fontSize: 11 }}>
                  {config.buildType === 'dockerfile' ? 'Dockerfile' : 'Makefile'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cdConfigs.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[#E5E6EB] bg-white">
          <div className="border-b border-[#F2F3F5] bg-[#FAFAFA] px-5 py-3 text-[#86909C]" style={{ fontSize: 12, fontWeight: 500 }}>
            CD 配置
          </div>
          <div className="divide-y divide-[#F2F3F5]">
            {cdConfigs.map((config) => (
              <div key={config.id} className="grid grid-cols-[220px_120px_120px_1fr] gap-4 px-5 py-3.5">
                <div className="text-[#1D2129]" style={{ fontSize: 13, fontWeight: 500 }}>
                  {config.name}
                </div>
                <span className="rounded bg-[#F0ECFF] px-2 py-0.5 text-[#7B61FF]" style={{ fontSize: 11, fontWeight: 500 }}>
                  {config.renderEngine}
                </span>
                <span className="rounded bg-[#E8F3FF] px-2 py-0.5 text-[#1664FF]" style={{ fontSize: 11, fontWeight: 500 }}>
                  {config.releaseMode}
                </span>
                <span className="text-[#1664FF]" style={{ fontSize: 12 }}>
                  {config.gitOpsRepo}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {instances.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[#E5E6EB] bg-white">
          <div className="border-b border-[#F2F3F5] bg-[#FAFAFA] px-5 py-3 text-[#86909C]" style={{ fontSize: 12, fontWeight: 500 }}>
            实例
          </div>
          <div className="divide-y divide-[#F2F3F5]">
            {instances.map((instance) => {
              const env = getEnvMeta(instance.env);
              const status = getInstanceStatusMeta(instance.status);

              return (
                <div key={instance.id} className="grid grid-cols-[180px_80px_120px_80px_80px_80px_100px] gap-4 px-5 py-3.5">
                  <div className="text-[#1D2129]" style={{ fontSize: 13, fontWeight: 500 }}>
                    {instance.name}
                  </div>
                  <span className="rounded-full px-2 py-0.5" style={{ fontSize: 11, fontWeight: 500, background: env.bg, color: env.text }}>
                    {instance.env.toUpperCase()}
                  </span>
                  <span className="rounded bg-[#E8F3FF] px-2 py-0.5 text-[#1664FF]" style={{ fontSize: 11 }}>
                    {instance.type}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#00B42A' }}>
                    {instance.readyReplicas}/{instance.replicas}
                  </span>
                  <span className="text-[#4E5969]" style={{ fontSize: 12 }}>
                    {instance.cpu}
                  </span>
                  <span className="text-[#4E5969]" style={{ fontSize: 12 }}>
                    {instance.memory}
                  </span>
                  <span className="rounded-full px-2 py-0.5" style={{ fontSize: 11, fontWeight: 500, background: status.bg, color: status.text }}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
