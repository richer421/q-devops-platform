import { ExternalLink } from 'lucide-react';
import type { BusinessUnit } from '../../data';

type BusinessSummaryProps = {
  business: BusinessUnit;
  counts: {
    deployPlans: number;
    ciConfigs: number;
    cdConfigs: number;
    instances: number;
  };
};

export function BusinessSummary({ business, counts }: BusinessSummaryProps) {
  return (
    <div className="border-b border-[#E5E6EB] bg-white">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F3FF]">
            <span className="text-[#1664FF]" style={{ fontSize: 16, fontWeight: 700 }}>
              {business.name[0].toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="m-0 text-[#1D2129]" style={{ fontSize: 16, fontWeight: 600 }}>
                {business.name}
              </h2>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  background: '#E8FFEA',
                  color: '#00B42A',
                }}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-[#00B42A]" />
                正常
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-3">
              <span className="text-[#86909C]" style={{ fontSize: 12 }}>
                {business.desc}
              </span>
              <a
                href={business.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#1664FF] hover:underline"
                style={{ fontSize: 12 }}
              >
                <ExternalLink size={11} />
                {business.repoUrl.replace('https://', '')}
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          {[
            { label: '部署计划', value: counts.deployPlans, color: '#1664FF' },
            { label: 'CI 配置', value: counts.ciConfigs, color: '#7B61FF' },
            { label: 'CD 配置', value: counts.cdConfigs, color: '#00B42A' },
            { label: '实例', value: counts.instances, color: '#FF7D00' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div style={{ fontSize: 18, fontWeight: 700, color: item.color, lineHeight: '24px' }}>
                {item.value}
              </div>
              <div style={{ fontSize: 11, color: '#86909C' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
