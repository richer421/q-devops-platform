import { Empty, Space } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { BusinessInstancesPanel } from '../../components/business/BusinessInstancesPanel';
import { useNavigate, useParams } from 'react-router-dom';
import { BusinessSummary } from '../../components/business/BusinessSummary';
import { CDConfigsTable, CIConfigsTable } from '../../components/business/ConfigTables';
import { DeployPlansTable } from '../../components/business/DeployPlansTable';
import { BasePage } from '../../components/layout/page-container';
import { PageHeaderTabs, type PageHeaderTabItem } from '../../components/layout/page-header';
import type { BusinessUnit, Instance } from '../../mock';
import { businessInstanceConfigs, businesses, cdConfigs, ciConfigs, deployPlans } from '../../mock';
import { createBusinessUnitInstanceOAM, listBusinessUnitInstanceOAMs, updateInstanceOAM } from '../../lib/metahub-instance-oam';

type DetailTab = 'plans' | 'ci' | 'cd' | 'instances';

export function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>('instances');
  const [businessInstances, setBusinessInstances] = useState<Instance[]>([]);

  const metahubBusinessUnitID = useMemo(() => {
    if (!id || !/^\d+$/.test(id)) {
      return null;
    }

    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : null;
  }, [id]);

  const mockBusiness = useMemo(() => businesses.find((item) => item.id === id), [id]);

  const business = useMemo<BusinessUnit | undefined>(() => {
    if (mockBusiness) {
      return mockBusiness;
    }
    if (metahubBusinessUnitID) {
      return {
        id: String(metahubBusinessUnitID),
        name: `业务单元 #${metahubBusinessUnitID}`,
        desc: '来自 metahub',
        repoUrl: '-',
        status: 'active',
      };
    }
    return undefined;
  }, [metahubBusinessUnitID, mockBusiness]);

  useEffect(() => {
    if (!mockBusiness) {
      setBusinessInstances([]);
      return;
    }
    setBusinessInstances(businessInstanceConfigs.filter((item) => item.buId === mockBusiness.id));
  }, [mockBusiness]);

  useEffect(() => {
    if (!metahubBusinessUnitID) {
      return;
    }

    let cancelled = false;
    void listBusinessUnitInstanceOAMs(metahubBusinessUnitID)
      .then((rows) => {
        if (cancelled) {
          return;
        }
        setBusinessInstances(rows);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        console.warn('metahub 实例加载失败，已回退到本地数据');
      });

    return () => {
      cancelled = true;
    };
  }, [metahubBusinessUnitID]);

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
  const tabItems: ReadonlyArray<PageHeaderTabItem<DetailTab>> = [
    { id: 'instances', label: '业务实例' },
    { id: 'plans', label: '部署计划' },
    { id: 'ci', label: 'CI 配置' },
    { id: 'cd', label: 'CD 配置' },
  ];

  const handleCreateInstance = async (instance: Instance) => {
    if (!metahubBusinessUnitID) {
      return instance;
    }

    const created = await createBusinessUnitInstanceOAM(metahubBusinessUnitID, instance);
    setBusinessInstances((current) => [created, ...current.filter((item) => item.id !== created.id)]);
    return created;
  };

  const handleSaveInstance = async (instance: Instance) => {
    if (!metahubBusinessUnitID) {
      return instance;
    }

    const updated = await updateInstanceOAM(instance);
    setBusinessInstances((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    return updated;
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
          <PageHeaderTabs items={tabItems} value={activeTab} onChange={setActiveTab} />
        </Space>
      )}
      contentStyle={{ padding: 0 }}
    >
      {activeTab === 'instances' && (
        <BusinessInstancesPanel
          instances={businessInstances}
          onCreateInstance={metahubBusinessUnitID ? handleCreateInstance : undefined}
          onSaveInstance={metahubBusinessUnitID ? handleSaveInstance : undefined}
        />
      )}
      {activeTab === 'plans' && <DeployPlansTable plans={businessPlans} />}
      {activeTab === 'ci' && <CIConfigsTable configs={businessCiConfigs} />}
      {activeTab === 'cd' && <CDConfigsTable configs={businessCdConfigs} />}
    </BasePage>
  );
}
