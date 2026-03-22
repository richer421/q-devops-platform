import { Alert, Modal, Typography } from 'antd';
import { DeployPlanDetailDrawer } from '../../../components/business/deploy-plan/DeployPlanDetailDrawer';
import { DeployPlanFormModal } from '../../../components/business/deploy-plan/DeployPlanFormModal';
import { DeployPlanTablePanel } from '../../../components/business/deploy-plan/DeployPlanTablePanel';
import { DeployPlansTable } from '../../../components/business/DeployPlansTable';
import type { DeployPlan } from '../../../mock';
import { useDeployPlanTab } from '../useDeployPlanTab';

type BusinessPlansSectionProps = {
  businessUnitID: number | null;
  localPlans: ReadonlyArray<DeployPlan>;
};

export function BusinessPlansSection({
  businessUnitID,
  localPlans,
}: BusinessPlansSectionProps) {
  const deployPlanTab = useDeployPlanTab({
    businessUnitID,
    enabled: businessUnitID != null,
  });

  if (!businessUnitID) {
    return <DeployPlansTable plans={localPlans} />;
  }

  return (
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
          确定要删除部署计划{' '}
          <Typography.Text strong>{deployPlanTab.deleteTarget?.name}</Typography.Text>{' '}
          吗？该操作不可撤销。
        </Typography.Paragraph>
        {deployPlanTab.deleteError ? (
          <Alert type="error" message={deployPlanTab.deleteError} showIcon />
        ) : null}
      </Modal>
    </>
  );
}
