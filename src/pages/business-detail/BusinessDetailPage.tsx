import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BusinessSummary } from '../../components/business/BusinessSummary';
import { ConfigTables } from '../../components/business/ConfigTables';
import { DeployPlansTable } from '../../components/business/DeployPlansTable';
import { businesses, cdConfigs, ciConfigs, deployPlans, instances } from '../../data';

type DetailTab = 'plans' | 'ci' | 'cd' | 'instances';

export function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>('plans');

  const business = useMemo(() => businesses.find((item) => item.id === id), [id]);

  if (!business) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-[#86909C]" style={{ fontSize: 14 }}>
          未找到该业务单元
        </p>
        <button
          type="button"
          onClick={() => navigate('/business')}
          className="flex items-center gap-1.5 text-[#1664FF] hover:underline"
          style={{ fontSize: 13 }}
        >
          <ArrowLeft size={14} />
          返回业务中心
        </button>
      </div>
    );
  }

  const businessPlans = deployPlans.filter((item) => item.buId === business.id);
  const businessCiConfigs = ciConfigs.filter((item) => item.buId === business.id);
  const businessCdConfigs = cdConfigs.filter((item) => item.buId === business.id);
  const businessInstances = instances.filter((item) => item.buId === business.id);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F2F3F5]">
      <div className="bg-white px-6 pt-4 pb-0">
        <button
          type="button"
          onClick={() => navigate('/business')}
          className="flex items-center gap-1 text-[#86909C] transition-colors hover:text-[#1664FF]"
          style={{ fontSize: 12 }}
        >
          <ArrowLeft size={12} />
          业务中心
        </button>
      </div>
      <BusinessSummary
        business={business}
        counts={{
          deployPlans: businessPlans.length,
          ciConfigs: businessCiConfigs.length,
          cdConfigs: businessCdConfigs.length,
          instances: businessInstances.length,
        }}
      />
      <div className="border-b border-[#E5E6EB] bg-white px-6">
        <div className="flex items-center gap-1">
          {[
            { id: 'plans' as const, label: '部署计划', count: businessPlans.length },
            { id: 'ci' as const, label: 'CI 配置', count: businessCiConfigs.length },
            { id: 'cd' as const, label: 'CD 配置', count: businessCdConfigs.length },
            { id: 'instances' as const, label: '实例', count: businessInstances.length },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`border-b-2 px-4 py-2.5 transition-colors ${
                activeTab === item.id
                  ? 'border-[#1664FF] text-[#1664FF]'
                  : 'border-transparent text-[#4E5969] hover:text-[#1D2129]'
              }`}
              style={{ fontSize: 13, fontWeight: activeTab === item.id ? 500 : 400 }}
            >
              {item.label}
              <span
                className="ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5"
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  height: 16,
                  background: activeTab === item.id ? '#E8F3FF' : '#F2F3F5',
                  color: activeTab === item.id ? '#1664FF' : '#86909C',
                }}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-auto px-6 py-4">
        {activeTab === 'plans' && <DeployPlansTable plans={businessPlans} />}
        {activeTab === 'ci' && (
          <ConfigTables ciConfigs={businessCiConfigs} cdConfigs={[]} instances={[]} />
        )}
        {activeTab === 'cd' && (
          <ConfigTables ciConfigs={[]} cdConfigs={businessCdConfigs} instances={[]} />
        )}
        {activeTab === 'instances' && (
          <ConfigTables ciConfigs={[]} cdConfigs={[]} instances={businessInstances} />
        )}
      </div>
    </div>
  );
}
