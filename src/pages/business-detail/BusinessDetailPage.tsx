import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BusinessSummary } from '../../components/business/BusinessSummary';
import { ConfigTables } from '../../components/business/ConfigTables';
import { DeployPlansTable } from '../../components/business/DeployPlansTable';
import { PageHeader, PageHeaderTabs, type PageHeaderTabItem } from '../../components/layout/page-header';
import { businesses, cdConfigs, ciConfigs, deployPlans, instances } from '../../data';

type DetailTab = 'plans' | 'ci' | 'cd' | 'instances';

export function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>('plans');

  const business = useMemo(() => businesses.find((item) => item.id === id), [id]);

  if (!business) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-[#F2F3F5]">
        <PageHeader
          breadcrumbs={[
            { label: 'Q DevOps Platform' },
            { label: '我的业务', onClick: () => navigate('/business') },
            { label: '业务详情' },
          ]}
          title="业务详情"
          description="未找到该业务单元，请检查链接后重试"
          action={(
            <button
              type="button"
              onClick={() => navigate('/business')}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E6EB] bg-white px-4 text-[#4E5969] transition-colors hover:border-[#1664FF] hover:text-[#1664FF]"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              <ArrowLeft size={14} />
              返回我的业务
            </button>
          )}
        />
        <div className="flex min-h-[50vh] flex-1 items-center justify-center px-4 text-center">
          <p className="text-[#86909C]" style={{ fontSize: 14 }}>
            未找到该业务单元
          </p>
        </div>
      </div>
    );
  }

  const businessPlans = deployPlans.filter((item) => item.buId === business.id);
  const businessCiConfigs = ciConfigs.filter((item) => item.buId === business.id);
  const businessCdConfigs = cdConfigs.filter((item) => item.buId === business.id);
  const businessInstances = instances.filter((item) => item.buId === business.id);
  const tabItems: ReadonlyArray<PageHeaderTabItem<DetailTab>> = [
    { id: 'plans', label: '部署计划', count: businessPlans.length },
    { id: 'ci', label: 'CI 配置', count: businessCiConfigs.length },
    { id: 'cd', label: 'CD 配置', count: businessCdConfigs.length },
    { id: 'instances', label: '实例', count: businessInstances.length },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F2F3F5]">
      <PageHeader
        breadcrumbs={[
          { label: 'Q DevOps Platform' },
          { label: '我的业务', onClick: () => navigate('/business') },
          { label: business.name },
        ]}
        title="业务详情"
        description="查看业务单元的部署计划、CI/CD 配置与实例状态"
        action={(
          <button
            type="button"
            onClick={() => navigate('/business')}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E6EB] bg-white px-4 text-[#4E5969] transition-colors hover:border-[#1664FF] hover:text-[#1664FF]"
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            <ArrowLeft size={14} />
            返回我的业务
          </button>
        )}
        footer={(
          <PageHeaderTabs
            items={tabItems}
            value={activeTab}
            onChange={setActiveTab}
          />
        )}
      />
      <BusinessSummary
        business={business}
        counts={{
          deployPlans: businessPlans.length,
          ciConfigs: businessCiConfigs.length,
          cdConfigs: businessCdConfigs.length,
          instances: businessInstances.length,
        }}
      />
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
