import { Button, Empty, Space } from 'antd';
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
      <Space
        direction="vertical"
        size={0}
        style={{ display: 'flex', height: '100%', background: '#f2f3f5' }}
      >
        <PageHeader
          breadcrumbs={[
            { label: 'Q DevOps Platform' },
            { label: '我的业务', onClick: () => navigate('/business') },
            { label: '业务详情' },
          ]}
          title="业务详情"
          description="未找到该业务单元，请检查链接后重试"
          action={(
            <Button onClick={() => navigate('/business')} icon={<ArrowLeft size={14} />}>
              返回我的业务
            </Button>
          )}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description="未找到该业务单元" />
        </div>
      </Space>
    );
  }

  const businessPlans = deployPlans.filter((item) => item.buId === business.id);
  const businessCiConfigs = ciConfigs.filter((item) => item.buId === business.id);
  const businessCdConfigs = cdConfigs.filter((item) => item.buId === business.id);
  const businessInstances = instances.filter((item) => item.buId === business.id);
  const tabItems: ReadonlyArray<PageHeaderTabItem<DetailTab>> = [
    { id: 'plans', label: '部署计划' },
    { id: 'ci', label: 'CI 配置' },
    { id: 'cd', label: 'CD 配置' },
    { id: 'instances', label: '实例' },
  ];

  return (
    <Space
      direction="vertical"
      size={0}
      style={{ display: 'flex', height: '100%', background: '#f2f3f5' }}
    >
      <PageHeader
        breadcrumbs={[
          { label: 'Q DevOps Platform' },
          { label: '我的业务', onClick: () => navigate('/business') },
          { label: business.name },
        ]}
        title="业务详情"
        description="查看业务单元的部署计划、CI/CD 配置与实例状态"
        action={(
          <Button onClick={() => navigate('/business')} icon={<ArrowLeft size={14} />}>
            返回我的业务
          </Button>
        )}
        extension={(
          <Space direction="vertical" size={12} style={{ display: 'flex' }}>
            <BusinessSummary business={business} />
            <PageHeaderTabs items={tabItems} value={activeTab} onChange={setActiveTab} />
          </Space>
        )}
      />
      <div style={{ paddingInline: 24, paddingBottom: 16, paddingTop: 16 }}>
        {activeTab === 'plans' && <DeployPlansTable plans={businessPlans} />}
        {activeTab === 'ci' && <ConfigTables ciConfigs={businessCiConfigs} cdConfigs={[]} instances={[]} />}
        {activeTab === 'cd' && <ConfigTables ciConfigs={[]} cdConfigs={businessCdConfigs} instances={[]} />}
        {activeTab === 'instances' && <ConfigTables ciConfigs={[]} cdConfigs={[]} instances={businessInstances} />}
      </div>
    </Space>
  );
}
