import type { DeployPlan } from '../../data';
import { getEnvMeta, getReleaseStatusMeta } from '../../lib/status';

type DeployPlansTableProps = {
  plans: DeployPlan[];
};

export function DeployPlansTable({ plans }: DeployPlansTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E6EB] bg-white">
      <div
        className="border-b border-[#F2F3F5] bg-[#FAFAFA] px-5 py-3 text-[#1D2129]"
        style={{ fontSize: 13, fontWeight: 600 }}
      >
        部署计划
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#F2F3F5] bg-[#FAFAFA]">
            {['计划名称', '环境', 'CI 配置', 'CD 配置', '实例配置', '最近发布', '状态'].map((header) => (
              <th
                key={header}
                className="px-5 py-3 text-left text-[#86909C]"
                style={{ fontSize: 12, fontWeight: 500 }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F2F3F5]">
          {plans.map((plan) => {
            const env = getEnvMeta(plan.env);
            const status =
              plan.lastStatus === 'running'
                ? { bg: '#E8F3FF', text: '#1664FF', label: '进行中' }
                : getReleaseStatusMeta(plan.lastStatus as 'success' | 'failed' | 'deploying');

            return (
              <tr key={plan.id} className="transition-colors hover:bg-[#FAFAFA]">
                <td className="px-5 py-3.5 text-[#1D2129]" style={{ fontSize: 13, fontWeight: 500 }}>
                  {plan.name}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="inline-flex rounded-full px-2 py-0.5"
                    style={{ fontSize: 11, fontWeight: 500, background: env.bg, color: env.text }}
                  >
                    {plan.env.toUpperCase()}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-[#1664FF]" style={{ fontSize: 12 }}>
                  {plan.ciConfig}
                </td>
                <td className="px-5 py-3.5 text-[#00B42A]" style={{ fontSize: 12 }}>
                  {plan.cdConfig}
                </td>
                <td className="px-5 py-3.5 text-[#7B61FF]" style={{ fontSize: 12 }}>
                  {plan.instance}
                </td>
                <td className="px-5 py-3.5 text-[#86909C]" style={{ fontSize: 12 }}>
                  {plan.lastTime}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="inline-flex rounded-full px-2 py-0.5"
                    style={{ fontSize: 11, fontWeight: 500, background: status.bg, color: status.text }}
                  >
                    {status.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
