import { Empty, Space } from 'antd';
import { useMemo, useState } from 'react';
import { BusinessInstancesPanel } from '../../components/business/BusinessInstancesPanel';
import { useNavigate, useParams } from 'react-router-dom';
import { BusinessSummary } from '../../components/business/BusinessSummary';
import { CDConfigsTable, CIConfigsTable } from '../../components/business/ConfigTables';
import { DeployPlansTable } from '../../components/business/DeployPlansTable';
import { BasePage } from '../../components/layout/page-container';
import { PageHeaderTabs, type PageHeaderTabItem } from '../../components/layout/page-header';
import { businessInstanceConfigs, businesses, cdConfigs, ciConfigs, deployPlans } from '../../mock';

type DetailTab = 'plans' | 'ci' | 'cd' | 'instances';

export function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>('instances');

  const business = useMemo(() => businesses.find((item) => item.id === id), [id]);

  if (!business) {
    return (
      <BasePage
        breadcrumbs={[
          { label: 'Q DevOps' },
          { label: '我的业务', onClick: () => navigate('/business') },
          { label: '业务详情' },
        ]}
        title="业务详情"
        description="未找到该业务单元，请检查链接后重试"
      >
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description="未找到该业务单元" />
        </div>
      </BasePage>
    );
  }

  const businessPlans = deployPlans.filter((item) => item.buId === business.id);
  const businessCiConfigs = ciConfigs.filter((item) => item.buId === business.id);
  const businessCdConfigs = cdConfigs.filter((item) => item.buId === business.id);
  const businessInstances = businessInstanceConfigs.filter((item) => item.buId === business.id);
  const tabItems: ReadonlyArray<PageHeaderTabItem<DetailTab>> = [
    { id: 'instances', label: '业务实例' },
    { id: 'plans', label: '部署计划' },
    { id: 'ci', label: 'CI 配置' },
    { id: 'cd', label: 'CD 配置' },
  ];

  return (
    <BasePage
      breadcrumbs={[
        { label: 'Q DevOps' },
        { label: '我的业务', onClick: () => navigate('/business') },
        { label: business.name },
      ]}
      extensionDivider={false}
      extension={(
        <Space direction="vertical" size={12} style={{ display: 'flex' }}>
          <BusinessSummary business={business} />
          <PageHeaderTabs items={tabItems} value={activeTab} onChange={setActiveTab} />
        </Space>
      )}
      contentStyle={{ padding: 0 }}
    >
      {activeTab === 'instances' && <BusinessInstancesPanel instances={businessInstances} />}
      {activeTab === 'plans' && <DeployPlansTable plans={businessPlans} />}
      {activeTab === 'ci' && <CIConfigsTable configs={businessCiConfigs} />}
      {activeTab === 'cd' && <CDConfigsTable configs={businessCdConfigs} />}
    </BasePage>
  );
}
