import { Button, Card, Empty, Flex, Typography } from 'antd';
import type { Instance, InstancePod } from '../../../mock';
import { EnvTag } from '../../common/EnvTag';
import { PageHeaderTabs, type PageHeaderTabItem } from '../../layout/page-header';
import { EditConfig, PreviewConfig, PreviewYaml } from './ConfigEditor';
import { PodsView, TableBottomPagination } from './PodViews';
import type { ConfigView, DetailTab, InstanceDraft, PodDialogKind } from './types';

type BusinessInstanceDetailPanelProps = {
  instances: ReadonlyArray<Instance>;
  activeDraft?: InstanceDraft;
  detailTab: DetailTab;
  configView: ConfigView;
  isEditing: boolean;
  saveSubmitting: boolean;
  deleteSubmitting: boolean;
  pagedPods: InstancePod[];
  allPods: InstancePod[];
  podPagination: {
    current: number;
    pageSize: number;
  };
  paginationOptions: number[];
  containerLimitLookup: Record<string, { cpuLimit?: string; memoryLimit?: string }>;
  onDetailTabChange: (tab: DetailTab) => void;
  onConfigViewChange: (view: ConfigView) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onPatchEditDraft: (patch: Partial<InstanceDraft>) => void;
  onOpenPodDialog: (kind: PodDialogKind, title: string, content: string) => void;
  onPodPageChange: (page: number, pageSize: number) => void;
};

const detailTabItems: ReadonlyArray<PageHeaderTabItem<DetailTab>> = [
  { id: 'pods', label: 'Pod' },
  { id: 'config', label: '配置' },
];

export function BusinessInstanceDetailPanel({
  instances,
  activeDraft,
  detailTab,
  configView,
  isEditing,
  saveSubmitting,
  deleteSubmitting,
  pagedPods,
  allPods,
  podPagination,
  paginationOptions,
  containerLimitLookup,
  onDetailTabChange,
  onConfigViewChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onPatchEditDraft,
  onOpenPodDialog,
  onPodPageChange,
}: BusinessInstanceDetailPanelProps) {
  const canEdit = detailTab === 'config' && Boolean(activeDraft);

  return (
    <Card
      title={
        activeDraft ? (
          <Flex align="center" gap={8}>
            <Typography.Text strong>{activeDraft.name}</Typography.Text>
            <EnvTag env={activeDraft.env} />
          </Flex>
        ) : (
          <Typography.Text strong>实例详情</Typography.Text>
        )
      }
      extra={
        activeDraft ? (
          <Flex align="center" gap={8}>
            {canEdit ? (
              isEditing ? (
                <>
                  <Button
                    size="small"
                    onClick={onCancelEdit}
                    disabled={saveSubmitting || deleteSubmitting}
                  >
                    取消
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    onClick={onSaveEdit}
                    loading={saveSubmitting}
                    disabled={deleteSubmitting}
                  >
                    保存
                  </Button>
                </>
              ) : (
                <Button
                  size="small"
                  type="primary"
                  onClick={onStartEdit}
                  disabled={deleteSubmitting}
                >
                  编辑
                </Button>
              )
            ) : null}
          </Flex>
        ) : null
      }
      styles={{
        body: {
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          height: '100%',
        },
      }}
      style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      {!activeDraft ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description={instances.length === 0 ? '暂无业务实例，请先创建' : '当前筛选条件下无可展示实例'} />
        </div>
      ) : (
        <>
          <div style={{ paddingBottom: 6 }}>
            <PageHeaderTabs
              items={detailTabItems}
              value={detailTab}
              onChange={onDetailTabChange}
              right={<span />}
            />
          </div>

          {detailTab === 'pods' ? (
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <PodsView
                pods={pagedPods}
                containerLimitLookup={containerLimitLookup}
                onOpenDialog={onOpenPodDialog}
              />
            </div>
          ) : null}

          {detailTab === 'config' ? (
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Flex align="center" gap={8}>
                  <Button
                    size="small"
                    type={configView === 'visual' ? 'primary' : 'default'}
                    onClick={() => onConfigViewChange('visual')}
                  >
                    可视化配置
                  </Button>
                  <Button
                    size="small"
                    type={configView === 'yaml' ? 'primary' : 'default'}
                    onClick={() => onConfigViewChange('yaml')}
                  >
                    YAML 视图
                  </Button>
                </Flex>
                {configView === 'visual'
                  ? isEditing
                    ? <EditConfig draft={activeDraft} onPatch={onPatchEditDraft} />
                    : <PreviewConfig draft={activeDraft} />
                  : null}
                {configView === 'yaml' ? <PreviewYaml value={activeDraft.yaml} /> : null}
              </div>
            </div>
          ) : null}

          {detailTab === 'pods' ? (
            <TableBottomPagination
              current={podPagination.current}
              pageSize={podPagination.pageSize}
              total={allPods.length}
              pageSizeOptions={paginationOptions}
              onChange={onPodPageChange}
            />
          ) : null}
        </>
      )}
    </Card>
  );
}
