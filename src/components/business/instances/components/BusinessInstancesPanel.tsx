import { Form, Input, Modal, Radio, Select, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { BusinessInstanceDetailPanel } from './DetailPanel';
import {
  buildDraft,
  cloneDraft,
  draftToInstance,
  normalizeYamlImagePlaceholder,
  serializeDraft,
} from './draft';
import { BusinessInstancesSidebar } from './Sidebar';
import type {
  BusinessInstancesPanelProps,
  ConfigView,
  CreateInstanceFormValues,
  DetailTab,
  InstanceDraft,
  PodDialogState,
} from './types';
import { TerminalViewer, TextViewer, YamlViewer } from './PodViews';
import type { Instance } from '@/mock';

const paginationOptions = [10, 25, 50, 100];
const instanceEnvOptions = [
  { label: '开发', value: 'dev' },
  { label: '测试', value: 'test' },
  { label: '灰度', value: 'gray' },
  { label: '生产', value: 'prod' },
];

export function BusinessInstancesPanel({
  instances,
  total = instances.length,
  page = 1,
  pageSize = 10,
  keyword = '',
  envFilter = 'all',
  loading = false,
  templates = [],
  onPageChange,
  onKeywordChange,
  onEnvFilterChange,
  onCreateInstance,
  onSaveInstance,
  onDeleteInstance,
}: BusinessInstancesPanelProps) {
  const [activeId, setActiveId] = useState<string | undefined>(instances[0]?.id);
  const [detailTab, setDetailTab] = useState<DetailTab>('pods');
  const [configView, setConfigView] = useState<ConfigView>('visual');
  const [podPagination, setPodPagination] = useState({ current: 1, pageSize: 10 });
  const [savedDrafts, setSavedDrafts] = useState<Record<string, InstanceDraft>>(() =>
    Object.fromEntries(instances.map((item) => [item.id, buildDraft(item)])),
  );
  const [editDrafts, setEditDrafts] = useState<Record<string, InstanceDraft>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [podDialog, setPodDialog] = useState<PodDialogState>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [saveSubmitting, setSaveSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [createForm] = Form.useForm<CreateInstanceFormValues>();

  useEffect(() => {
    const nextSavedDrafts = Object.fromEntries(instances.map((item) => [item.id, buildDraft(item)]));
    setSavedDrafts(nextSavedDrafts);
    setEditDrafts((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([instanceID]) => nextSavedDrafts[instanceID]),
      ),
    );
    setEditingId((current) => (current && nextSavedDrafts[current] ? current : null));
    setActiveId((current) => {
      if (current && nextSavedDrafts[current]) {
        return current;
      }
      return instances[0]?.id;
    });
  }, [instances]);

  useEffect(() => {
    if (instances.length === 0) {
      setActiveId(undefined);
      return;
    }
    if (!activeId || !instances.some((item) => item.id === activeId)) {
      setActiveId(instances[0].id);
    }
  }, [activeId, instances]);

  const activeInstance = useMemo(
    () => instances.find((item) => item.id === activeId),
    [activeId, instances],
  );

  const activeSavedDraft = activeInstance ? savedDrafts[activeInstance.id] : undefined;
  const isEditing = Boolean(activeInstance) && editingId === activeInstance?.id;
  const activeDraft =
    activeInstance && activeSavedDraft
      ? isEditing
        ? editDrafts[activeInstance.id] ?? activeSavedDraft
        : activeSavedDraft
      : undefined;

  const allPods = useMemo(() => activeInstance?.pods ?? [], [activeInstance]);
  const pagedPods = useMemo(
    () =>
      allPods.slice(
        (podPagination.current - 1) * podPagination.pageSize,
        podPagination.current * podPagination.pageSize,
      ),
    [allPods, podPagination],
  );
  const containerLimitLookup = useMemo(
    () =>
      (activeInstance?.spec?.deployment?.template?.spec?.containers ?? []).reduce<
        Record<string, { cpuLimit?: string; memoryLimit?: string }>
      >((accumulator, container) => {
        accumulator[container.name] = {
          cpuLimit: container.resources?.limits?.cpu,
          memoryLimit: container.resources?.limits?.memory,
        };
        return accumulator;
      }, {}),
    [activeInstance],
  );

  const patchEditDraft = (patch: Partial<InstanceDraft>) => {
    if (!isEditing || !activeInstance || !activeSavedDraft) {
      return;
    }

    setEditDrafts((current) => {
      const previous = current[activeInstance.id] ?? cloneDraft(activeSavedDraft);
      const next = { ...previous, ...patch };
      return {
        ...current,
        [activeInstance.id]: {
          ...next,
          yaml: serializeDraft(next),
        },
      };
    });
  };

  const resetInstanceFocus = (instanceID?: string) => {
    setActiveId(instanceID);
    setEditingId(null);
    setDetailTab('pods');
    setConfigView('visual');
    setPodPagination((current) => ({ ...current, current: 1 }));
  };

  const startEdit = () => {
    if (!activeInstance || !activeSavedDraft) {
      return;
    }

    setEditingId(activeInstance.id);
    setEditDrafts((current) => ({
      ...current,
      [activeInstance.id]: cloneDraft(activeSavedDraft),
    }));
  };

  const cancelEdit = () => {
    if (!activeInstance) {
      return;
    }

    setEditingId(null);
    setEditDrafts((current) => {
      const next = { ...current };
      delete next[activeInstance.id];
      return next;
    });
  };

  const saveEdit = async () => {
    if (!activeInstance) {
      return;
    }

    const draft = editDrafts[activeInstance.id];
    if (!draft) {
      setEditingId(null);
      return;
    }

    const normalizedDraft = {
      ...cloneDraft(draft),
      yaml: normalizeYamlImagePlaceholder(draft.yaml.trim() || serializeDraft(draft)),
    };
    let nextInstance = draftToInstance(normalizedDraft, activeInstance);

    try {
      setSaveSubmitting(true);

      if (onSaveInstance) {
        const remoteInstance = await onSaveInstance(nextInstance);
        if (remoteInstance) {
          nextInstance = remoteInstance;
        }
      }

      setSavedDrafts((current) => ({
        ...current,
        [activeInstance.id]: buildDraft(nextInstance),
      }));
      setEditingId(null);
      setEditDrafts((current) => {
        const next = { ...current };
        delete next[activeInstance.id];
        return next;
      });
    } catch {
      return;
    } finally {
      setSaveSubmitting(false);
    }
  };

  const openCreateModal = () => {
    createForm.setFieldsValue({
      name: '',
      env: activeInstance?.env ?? 'dev',
      template: templates[0]?.key ?? '',
    });
    setCreateModalOpen(true);
  };

  const handleCreateInstance = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateSubmitting(true);
      let nextInstance: Instance | undefined;

      if (onCreateInstance) {
        const remoteInstance = await onCreateInstance({
          name: values.name.trim(),
          env: values.env,
          templateKey: values.template,
        });
        if (remoteInstance) {
          nextInstance = remoteInstance;
        }
      }

      if (!nextInstance) {
        setCreateModalOpen(false);
        return;
      }

      const persistedDraft = buildDraft(nextInstance);
      setSavedDrafts((current) => ({
        ...current,
        [nextInstance.id]: persistedDraft,
      }));
      setEditDrafts((current) => ({
        ...current,
        [nextInstance.id]: cloneDraft(persistedDraft),
      }));
      setActiveId(nextInstance.id);
      setEditingId(nextInstance.id);
      setDetailTab('config');
      setConfigView('visual');
      setCreateModalOpen(false);
    } catch (error) {
      const maybeFormError = error as { errorFields?: unknown };
      if (maybeFormError.errorFields) {
        return;
      }
      return;
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDeleteInstance = async () => {
    if (!activeInstance || !onDeleteInstance) {
      setDeleteModalOpen(false);
      return;
    }

    try {
      setDeleteSubmitting(true);
      await onDeleteInstance(activeInstance);
      setDeleteModalOpen(false);
      setEditingId(null);
      setEditDrafts((current) => {
        const next = { ...current };
        delete next[activeInstance.id];
        return next;
      });
      resetInstanceFocus(undefined);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <>
      <div
        style={{
          height: '100%',
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '320px minmax(0, 1fr)',
          gap: 2,
          padding: 2,
          background: '#F2F3F5',
          boxSizing: 'border-box',
        }}
      >
        <BusinessInstancesSidebar
          instances={instances}
          activeInstance={activeInstance}
          total={total}
          page={page}
          pageSize={pageSize}
          keyword={keyword}
          envFilter={envFilter}
          loading={loading}
          canCreate={Boolean(onCreateInstance) && templates.length > 0}
          canDelete={Boolean(onDeleteInstance) && !deleteSubmitting && !saveSubmitting}
          paginationOptions={paginationOptions}
          onPageChange={onPageChange}
          onKeywordChange={onKeywordChange}
          onEnvFilterChange={onEnvFilterChange}
          onSelectInstance={(instanceID) => resetInstanceFocus(instanceID)}
          onOpenCreate={openCreateModal}
          onRequestDelete={(instanceID) => {
            setActiveId(instanceID);
            setDeleteModalOpen(true);
          }}
        />

        <BusinessInstanceDetailPanel
          instances={instances}
          activeDraft={activeDraft}
          detailTab={detailTab}
          configView={configView}
          isEditing={isEditing}
          saveSubmitting={saveSubmitting}
          deleteSubmitting={deleteSubmitting}
          pagedPods={pagedPods}
          allPods={allPods}
          podPagination={podPagination}
          paginationOptions={paginationOptions}
          containerLimitLookup={containerLimitLookup}
          onDetailTabChange={setDetailTab}
          onConfigViewChange={setConfigView}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onSaveEdit={() => {
            void saveEdit();
          }}
          onPatchEditDraft={patchEditDraft}
          onOpenPodDialog={(kind, title, content) => setPodDialog({ kind, title, content })}
          onPodPageChange={(nextPage, nextPageSize) =>
            setPodPagination({ current: nextPage, pageSize: nextPageSize })
          }
        />
      </div>

      <Modal
        open={createModalOpen}
        title="创建业务实例"
        okText="创建并编辑"
        cancelText="取消"
        onOk={() => void handleCreateInstance()}
        confirmLoading={createSubmitting}
        onCancel={() => setCreateModalOpen(false)}
        destroyOnHidden
      >
        <Form<CreateInstanceFormValues>
          form={createForm}
          layout="vertical"
          initialValues={{ env: activeInstance?.env ?? 'dev', template: templates[0]?.key ?? '' }}
        >
          <Form.Item
            name="name"
            label="实例名称"
            rules={[
              { required: true, message: '请输入实例名称' },
              { min: 2, max: 64, message: '长度需在 2 到 64 之间' },
            ]}
          >
            <Input placeholder="例如：inst-api-dev" />
          </Form.Item>
          <Form.Item name="env" label="环境" rules={[{ required: true, message: '请选择环境' }]}>
            <Select options={instanceEnvOptions} />
          </Form.Item>
          <Form.Item name="template" label="初始化模板">
            <Radio.Group
              options={templates.map((item) => ({
                label: item.name,
                value: item.key,
                title: item.description,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={deleteModalOpen}
        title="删除业务实例"
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: deleteSubmitting }}
        onOk={() => void handleDeleteInstance()}
        onCancel={() => setDeleteModalOpen(false)}
        destroyOnHidden
      >
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          确定删除实例 <Typography.Text strong>{activeInstance?.name ?? '-'}</Typography.Text>{' '}
          吗？该操作不可撤销。
        </Typography.Paragraph>
      </Modal>

      <Modal
        open={podDialog !== null}
        title={podDialog?.title}
        footer={null}
        onCancel={() => setPodDialog(null)}
        width={720}
      >
        {podDialog?.kind === 'logs' ? <TextViewer value={podDialog.content} /> : null}
        {podDialog?.kind === 'terminal' ? (
          <TerminalViewer value={podDialog.content} />
        ) : null}
        {podDialog?.kind === 'yaml' ? <YamlViewer value={podDialog.content} /> : null}
        {podDialog?.kind === 'events' ? <TextViewer value={podDialog.content} /> : null}
      </Modal>
    </>
  );
}
