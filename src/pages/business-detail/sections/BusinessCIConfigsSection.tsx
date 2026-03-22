import { Alert, Modal, Typography } from 'antd';
import { CIConfigDetailDrawer } from '../../../components/business/ci-config/CIConfigDetailDrawer';
import { CIConfigFormModal } from '../../../components/business/ci-config/CIConfigFormModal';
import { CIConfigTablePanel } from '../../../components/business/ci-config/CIConfigTablePanel';
import { CIConfigsTable } from '../../../components/business/ConfigTables';
import type { CIConfig } from '../../../mock';
import { useCIConfigTab } from '../useCIConfigTab';

type BusinessCIConfigsSectionProps = {
  businessUnitID: number | null;
  localConfigs: ReadonlyArray<CIConfig>;
};

export function BusinessCIConfigsSection({
  businessUnitID,
  localConfigs,
}: BusinessCIConfigsSectionProps) {
  const ciConfigTab = useCIConfigTab({
    businessUnitID,
    enabled: businessUnitID != null,
  });

  if (!businessUnitID) {
    return <CIConfigsTable configs={localConfigs} />;
  }

  return (
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
          确定要删除 CI 配置{' '}
          <Typography.Text strong>{ciConfigTab.deleteTarget?.name}</Typography.Text>{' '}
          吗？该操作不可撤销。
        </Typography.Paragraph>
        {ciConfigTab.deleteError ? (
          <Alert type="error" message={ciConfigTab.deleteError} showIcon />
        ) : null}
      </Modal>
    </>
  );
}
