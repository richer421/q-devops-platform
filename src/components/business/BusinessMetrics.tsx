import { businesses, cdConfigs, ciConfigs, deployPlans, instances } from '../../data';

const metricItems = [
  { label: '业务单元', value: businesses.length, color: '#1664FF' },
  { label: '部署计划', value: deployPlans.length, color: '#00B42A' },
  { label: 'CI 配置', value: ciConfigs.length, color: '#7B61FF' },
  { label: '实例', value: instances.length, color: '#FF7D00' },
  { label: 'CD 配置', value: cdConfigs.length, color: '#00B42A' },
];

export function BusinessMetrics() {
  return (
    <div className="grid grid-cols-5 gap-4">
      {metricItems.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-[#E5E6EB] bg-white px-4 py-3"
        >
          <div style={{ color: item.color, fontSize: 22, fontWeight: 700 }}>{item.value}</div>
          <div className="text-[#86909C]" style={{ fontSize: 12 }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
