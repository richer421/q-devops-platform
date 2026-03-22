import { Alert, Modal, Typography } from 'antd';
import { CDConfigDrawer } from '../../../components/business/CDConfigDrawer';
import { CDConfigsTable } from '../../../components/business/ConfigTables';
import type { BusinessUnit, CDConfig, DeployPlan } from '../../../mock';
import { useCDConfigTab } from '../useCDConfigTab';

type BusinessCDConfigsSectionProps = {
  businessKey?: string;
  business: BusinessUnit;
  businessUnitID: number | null;
  localConfigs: ReadonlyArray<CDConfig>;
  localDeployPlans: ReadonlyArray<DeployPlan>;
};

export function BusinessCDConfigsSection({
  businessKey,
  business,
  businessUnitID,
  localConfigs,
  localDeployPlans,
}: BusinessCDConfigsSectionProps) {
  const cdConfigTab = useCDConfigTab({
    businessKey,
    business,
    metahubBusinessUnitID: businessUnitID,
    localConfigs,
    localDeployPlans,
    enabled: true,
  });

  return (
    <>
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
          确定要删除 CD 配置{' '}
          <Typography.Text strong>{cdConfigTab.deleteTarget?.name}</Typography.Text>{' '}
          吗？该操作不可撤销。
        </Typography.Paragraph>
        {cdConfigTab.deleteError ? (
          <Alert type="error" message={cdConfigTab.deleteError} showIcon />
        ) : null}
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
    </>
  );
}
