import { Alert, Empty, Modal, Space, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { DeployPlanDetailDrawer } from '../../components/business/deploy-plan/DeployPlanDetailDrawer';
import { DeployPlanFormModal } from '../../components/business/deploy-plan/DeployPlanFormModal';
import { DeployPlanTablePanel } from '../../components/business/deploy-plan/DeployPlanTablePanel';
import { CIConfigDetailDrawer } from '../../components/business/ci-config/CIConfigDetailDrawer';
import { CIConfigFormModal } from '../../components/business/ci-config/CIConfigFormModal';
import { CIConfigTablePanel } from '../../components/business/ci-config/CIConfigTablePanel';
import { BusinessInstancesPanel } from '../../components/business/BusinessInstancesPanel';
import { CDConfigDrawer } from '../../components/business/CDConfigDrawer';
import { BusinessSummary } from '../../components/business/BusinessSummary';
import { CDConfigsTable, CIConfigsTable } from '../../components/business/ConfigTables';
import { DeployPlansTable } from '../../components/business/DeployPlansTable';
import { BasePage } from '../../components/layout/page-container';
import { PageHeaderTabs, type PageHeaderTabItem } from '../../components/layout/page-header';
import type { BusinessUnit } from '../../mock';
import { businessInstanceConfigs, businesses, cdConfigs, ciConfigs, deployPlans } from '../../mock';
import { useBusinessInstancesTab } from './useBusinessInstancesTab';
import { useCDConfigTab } from './useCDConfigTab';
import { useCIConfigTab } from './useCIConfigTab';
import { useDeployPlanTab } from './useDeployPlanTab';

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

  const businessPlans = useMemo(
    () => (business ? deployPlans.filter((item) => item.buId === business.id) : []),
    [business],
  );
  const businessCiConfigs = useMemo(
    () => (business ? ciConfigs.filter((item) => item.buId === business.id) : []),
    [business],
  );

  const ciConfigTab = useCIConfigTab({
    businessUnitID: metahubBusinessUnitID,
    enabled: activeTab === 'ci',
  });
  const deployPlanTab = useDeployPlanTab({
    businessUnitID: metahubBusinessUnitID,
    enabled: activeTab === 'plans',
  });

  const instancesTab = useBusinessInstancesTab({
    businessKey: id,
    metahubBusinessUnitID,
    localInstances: mockInstances,
  });

  const cdConfigTab = useCDConfigTab({
    businessKey: id,
    business,
    metahubBusinessUnitID,
    localConfigs: mockCDConfigs,
    localDeployPlans: businessPlans,
    enabled: activeTab === 'cd',
  });

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
        <BusinessInstancesPanel
          instances={instancesTab.instances}
          total={instancesTab.total}
          page={instancesTab.page}
          pageSize={instancesTab.pageSize}
          keyword={instancesTab.keyword}
          envFilter={instancesTab.envFilter}
          loading={instancesTab.loading}
          templates={instancesTab.templates}
          onPageChange={instancesTab.onPageChange}
          onKeywordChange={instancesTab.onKeywordChange}
          onEnvFilterChange={instancesTab.onEnvFilterChange}
          onCreateInstance={instancesTab.onCreateInstance}
          onSaveInstance={instancesTab.onSaveInstance}
          onDeleteInstance={instancesTab.onDeleteInstance}
        />
      )}
      {activeTab === 'plans' &&
        (metahubBusinessUnitID ? (
          <>
            <DeployPlanTablePanel
              items={deployPlanTab.items}
              total={deployPlanTab.total}
              page={deployPlanTab.page}
              pageSize={deployPlanTab.pageSize}
              keyword={deployPlanTab.keyword}
              loading={deployPlanTab.loading}
              onKeywordChange={deployPlanTab.onKeywordChange}
              onPageChange={deployPlanTab.onPageChange}
              onCreate={deployPlanTab.openCreateForm}
              onView={deployPlanTab.openDetail}
              onEdit={(item) => {
                void deployPlanTab.openEditForm(item);
              }}
              onDelete={deployPlanTab.requestDelete}
            />

            <DeployPlanDetailDrawer
              open={deployPlanTab.detailOpen}
              loading={deployPlanTab.detailLoading}
              error={deployPlanTab.detailError}
              item={deployPlanTab.detailItem}
              onClose={deployPlanTab.closeDetail}
              onEdit={(item) => {
                void deployPlanTab.openEditForm(item);
              }}
            />

            <DeployPlanFormModal
              open={deployPlanTab.formOpen}
              mode={deployPlanTab.formMode}
              initialValue={deployPlanTab.formInitialValue}
              submitting={deployPlanTab.submitting}
              optionLoading={deployPlanTab.optionLoading}
              ciOptions={deployPlanTab.ciOptions}
              cdOptions={deployPlanTab.cdOptions}
              instanceOptions={deployPlanTab.instanceOptions}
              onSubmit={(value) => {
                void deployPlanTab.submitForm(value);
              }}
              onClose={deployPlanTab.closeForm}
            />

            <Modal
              open={deployPlanTab.deleteTarget != null}
              title="确认删除部署计划"
              okText="确认删除"
              cancelText="取消"
              okButtonProps={{ danger: true, loading: deployPlanTab.deleting }}
              onOk={() => {
                void deployPlanTab.confirmDelete();
              }}
              onCancel={deployPlanTab.closeDelete}
              destroyOnHidden
            >
              <Typography.Paragraph>
                确定要删除部署计划 <Typography.Text strong>{deployPlanTab.deleteTarget?.name}</Typography.Text> 吗？该操作不可撤销。
              </Typography.Paragraph>
              {deployPlanTab.deleteError ? <Alert type="error" message={deployPlanTab.deleteError} showIcon /> : null}
            </Modal>
          </>
        ) : (
          <DeployPlansTable plans={businessPlans} />
        ))}
      {activeTab === 'ci' &&
        (metahubBusinessUnitID ? (
          <>
            <CIConfigTablePanel
              items={ciConfigTab.items}
              total={ciConfigTab.total}
              page={ciConfigTab.page}
              pageSize={ciConfigTab.pageSize}
              keyword={ciConfigTab.keyword}
              loading={ciConfigTab.loading}
              onKeywordChange={ciConfigTab.onKeywordChange}
              onPageChange={ciConfigTab.onPageChange}
              onCreate={ciConfigTab.openCreateForm}
              onView={ciConfigTab.openDetail}
              onEdit={ciConfigTab.openEditForm}
              onDelete={ciConfigTab.requestDelete}
            />

            <CIConfigDetailDrawer
              open={ciConfigTab.detailOpen}
              loading={ciConfigTab.detailLoading}
              error={ciConfigTab.detailError}
              item={ciConfigTab.detailItem}
              onClose={ciConfigTab.closeDetail}
              onEdit={ciConfigTab.openEditForm}
            />

            <CIConfigFormModal
              open={ciConfigTab.formOpen}
              mode={ciConfigTab.formMode}
              initialValue={ciConfigTab.formInitialValue}
              submitting={ciConfigTab.submitting}
              onSubmit={(value) => {
                void ciConfigTab.submitForm(value);
              }}
              onClose={ciConfigTab.closeForm}
            />

            <Modal
              open={ciConfigTab.deleteTarget != null}
              title="确认删除 CI 配置"
              okText="确认删除"
              cancelText="取消"
              okButtonProps={{ danger: true, loading: ciConfigTab.deleting }}
              onOk={() => {
                void ciConfigTab.confirmDelete();
              }}
              onCancel={ciConfigTab.closeDelete}
              destroyOnHidden
            >
              <Typography.Paragraph>
                确定要删除 CI 配置 <Typography.Text strong>{ciConfigTab.deleteTarget?.name}</Typography.Text> 吗？该操作不可撤销。
              </Typography.Paragraph>
              {ciConfigTab.deleteError ? <Alert type="error" message={ciConfigTab.deleteError} showIcon /> : null}
            </Modal>
          </>
        ) : (
          <CIConfigsTable configs={businessCiConfigs} />
        ))}
      {activeTab === 'cd' && (
        <CDConfigsTable
          configs={cdConfigTab.configs}
          keyword={cdConfigTab.keyword}
          releaseRegion={cdConfigTab.releaseRegion}
          releaseEnv={cdConfigTab.releaseEnv}
          deploymentMode={cdConfigTab.deploymentMode}
          page={cdConfigTab.page}
          pageSize={cdConfigTab.pageSize}
          total={cdConfigTab.total}
          loading={cdConfigTab.loading}
          onKeywordChange={cdConfigTab.onKeywordChange}
          onReleaseRegionChange={cdConfigTab.onReleaseRegionChange}
          onReleaseEnvChange={cdConfigTab.onReleaseEnvChange}
          onDeploymentModeChange={cdConfigTab.onDeploymentModeChange}
          onPageChange={cdConfigTab.onPageChange}
          onCreate={cdConfigTab.onCreate}
          onDetail={cdConfigTab.onDetail}
          onEdit={cdConfigTab.onEdit}
          onDelete={cdConfigTab.onDelete}
        />
      )}
      <Modal
        open={cdConfigTab.deleteTarget != null}
        title="确认删除 CD 配置"
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: cdConfigTab.deleting }}
        onOk={() => {
          void cdConfigTab.confirmDelete();
        }}
        onCancel={cdConfigTab.closeDelete}
        destroyOnHidden
      >
        <Typography.Paragraph>
          确定要删除 CD 配置 <Typography.Text strong>{cdConfigTab.deleteTarget?.name}</Typography.Text> 吗？该操作不可撤销。
        </Typography.Paragraph>
        {cdConfigTab.deleteError ? <Alert type="error" message={cdConfigTab.deleteError} showIcon /> : null}
      </Modal>
      <CDConfigDrawer
        open={cdConfigTab.drawerOpen}
        mode={cdConfigTab.drawerMode}
        config={cdConfigTab.drawerConfig}
        loading={cdConfigTab.drawerLoading}
        submitting={cdConfigTab.drawerSubmitting}
        onClose={cdConfigTab.closeDrawer}
        onSubmit={(value) => {
          void cdConfigTab.submitDrawer(value);
        }}
      />
    </BasePage>
  );
}
