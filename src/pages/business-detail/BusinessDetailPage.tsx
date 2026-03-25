import { Empty, Space } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BusinessSummary } from '@/components/business/business-unit';
import { BasePage } from '../../components/layout/page-container';
import { PageHeaderTabs, type PageHeaderTabItem } from '../../components/layout/page-header';
import type { BusinessUnit } from '@/mock';
import { businessInstanceConfigs, businesses, cdConfigs, ciConfigs, deployPlans } from '@/mock';
import { BusinessCDConfigsSection } from './sections/BusinessCDConfigsSection';
import { BusinessCIConfigsSection } from './sections/BusinessCIConfigsSection';
import { BusinessInstancesSection } from './sections/BusinessInstancesSection';
import { BusinessPlansSection } from './sections/BusinessPlansSection';

type DetailTab = 'plans' | 'ci' | 'cd' | 'instances';

function parseDetailTab(search: string): DetailTab {
  const value = new URLSearchParams(search).get('tab');
  if (value === 'plans' || value === 'ci' || value === 'cd' || value === 'instances') {
    return value;
  }
  return 'instances';
}

export function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>(() => parseDetailTab(location.search));

  const metahubBusinessUnitID = useMemo(() => {
    if (!id || !/^\d+$/.test(id)) {
      return null;
    }

    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : null;
  }, [id]);

  const locationState = location.state as
    | {
        businessName?: string;
        businessDescription?: string;
        projectId?: number;
      }
    | undefined;

  useEffect(() => {
    const nextTab = parseDetailTab(location.search);
    setActiveTab((current) => (current === nextTab ? current : nextTab));
  }, [location.search]);

  const mockBusiness = useMemo(() => businesses.find((item) => item.id === id), [id]);
  const mockCDConfigs = useMemo(
    () => (mockBusiness ? cdConfigs.filter((item) => item.buId === mockBusiness.id) : []),
    [mockBusiness],
  );
  const mockInstances = useMemo(
    () => (mockBusiness ? businessInstanceConfigs.filter((item) => item.buId === mockBusiness.id) : []),
    [mockBusiness],
  );

  const business = useMemo<BusinessUnit | undefined>(() => {
    if (mockBusiness) {
      return mockBusiness;
    }
    if (metahubBusinessUnitID) {
      return {
        id: String(metahubBusinessUnitID),
        name: locationState?.businessName ?? `业务单元 #${metahubBusinessUnitID}`,
        desc: locationState?.businessDescription ?? '来自 metahub',
        repoUrl: '-',
        status: 'active',
      };
    }
    return undefined;
  }, [locationState?.businessDescription, locationState?.businessName, metahubBusinessUnitID, mockBusiness]);

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

  const tabItems: ReadonlyArray<PageHeaderTabItem<DetailTab>> = [
    { id: 'instances', label: '业务实例' },
    { id: 'plans', label: '部署计划' },
    { id: 'ci', label: 'CI 配置' },
    { id: 'cd', label: 'CD 配置' },
  ];

  const handleTabChange = (nextTab: DetailTab) => {
    setActiveTab(nextTab);

    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', nextTab);

    navigate(
      {
        pathname: location.pathname,
        search: `?${searchParams.toString()}`,
      },
      {
        replace: true,
        state: location.state,
      },
    );
  };

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
          <PageHeaderTabs items={tabItems} value={activeTab} onChange={handleTabChange} />
        </Space>
      )}
      contentStyle={{ padding: 0 }}
    >
      {activeTab === 'instances' && (
        <BusinessInstancesSection
          businessKey={id}
          metahubBusinessUnitID={metahubBusinessUnitID}
          localInstances={mockInstances}
        />
      )}
      {activeTab === 'plans' && (
        <BusinessPlansSection
          businessUnitID={metahubBusinessUnitID}
          localPlans={businessPlans}
        />
      )}
      {activeTab === 'ci' && (
        <BusinessCIConfigsSection
          businessUnitID={metahubBusinessUnitID}
          localConfigs={businessCiConfigs}
        />
      )}
      {activeTab === 'cd' && (
        <BusinessCDConfigsSection
          businessKey={id}
          business={business}
          businessUnitID={metahubBusinessUnitID}
          localConfigs={mockCDConfigs}
          localDeployPlans={businessPlans}
        />
      )}
    </BasePage>
  );
}
