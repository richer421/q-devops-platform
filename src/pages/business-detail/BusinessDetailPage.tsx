import { Alert, Empty, Modal, Space, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CIConfigDetailDrawer } from '../../components/business/ci-config/CIConfigDetailDrawer';
import { CIConfigFormModal } from '../../components/business/ci-config/CIConfigFormModal';
import { CIConfigTablePanel } from '../../components/business/ci-config/CIConfigTablePanel';
import { BusinessInstancesPanel } from '../../components/business/BusinessInstancesPanel';
import { BusinessSummary } from '../../components/business/BusinessSummary';
import { CDConfigsTable, CIConfigsTable } from '../../components/business/ConfigTables';
import { DeployPlansTable } from '../../components/business/DeployPlansTable';
import { BasePage } from '../../components/layout/page-container';
import { PageHeaderTabs, type PageHeaderTabItem } from '../../components/layout/page-header';
import {
  createBusinessUnitInstanceOAM,
  deleteInstanceOAM,
  listBusinessUnitInstanceOAMs,
  listInstanceOAMTemplates,
  updateInstanceOAM,
  type CreateInstanceFromTemplatePayload,
  type InstanceTemplate,
} from '../../lib/metahub-instance-oam';
import type { BusinessUnit, Instance } from '../../mock';
import { businessInstanceConfigs, businesses, cdConfigs, ciConfigs, deployPlans } from '../../mock';
import { useCIConfigTab } from './useCIConfigTab';

type DetailTab = 'plans' | 'ci' | 'cd' | 'instances';

export function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>('instances');
  const [businessInstances, setBusinessInstances] = useState<Instance[]>([]);
  const [instanceTotal, setInstanceTotal] = useState(0);
  const [instancePage, setInstancePage] = useState(1);
  const [instancePageSize, setInstancePageSize] = useState(10);
  const [instanceKeyword, setInstanceKeyword] = useState('');
  const [instanceEnvFilter, setInstanceEnvFilter] = useState('all');
  const [instanceTemplates, setInstanceTemplates] = useState<InstanceTemplate[]>([]);
  const [instancesLoading, setInstancesLoading] = useState(false);

  const metahubBusinessUnitID = useMemo(() => {
    if (!id || !/^\d+$/.test(id)) {
      return null;
    }

    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : null;
  }, [id]);

  const mockBusiness = useMemo(() => businesses.find((item) => item.id === id), [id]);
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
        name: `业务单元 #${metahubBusinessUnitID}`,
        desc: '来自 metahub',
        repoUrl: '-',
        status: 'active',
      };
    }
    return undefined;
  }, [metahubBusinessUnitID, mockBusiness]);

  const localFilteredInstances = useMemo(() => {
    const normalizedKeyword = instanceKeyword.trim().toLowerCase();

    return mockInstances.filter((item) => {
      const matchedEnv = instanceEnvFilter === 'all' || item.env.toLowerCase() === instanceEnvFilter.toLowerCase();
      if (!matchedEnv) {
        return false;
      }
      if (!normalizedKeyword) {
        return true;
      }
      return item.name.toLowerCase().includes(normalizedKeyword);
    });
  }, [instanceEnvFilter, instanceKeyword, mockInstances]);

  const localPagedInstances = useMemo(() => {
    const start = (instancePage - 1) * instancePageSize;
    return localFilteredInstances.slice(start, start + instancePageSize);
  }, [instancePage, instancePageSize, localFilteredInstances]);

  useEffect(() => {
    setInstancePage(1);
    setInstancePageSize(10);
    setInstanceKeyword('');
    setInstanceEnvFilter('all');
    setBusinessInstances([]);
    setInstanceTotal(0);
    setInstanceTemplates([]);
  }, [id]);

  useEffect(() => {
    if (metahubBusinessUnitID) {
      return;
    }

    const maxPage = Math.max(1, Math.ceil(localFilteredInstances.length / instancePageSize));
    if (instancePage > maxPage) {
      setInstancePage(maxPage);
    }
  }, [instancePage, instancePageSize, localFilteredInstances.length, metahubBusinessUnitID]);

  useEffect(() => {
    if (!metahubBusinessUnitID) {
      return;
    }

    let cancelled = false;
    void listInstanceOAMTemplates()
      .then((rows) => {
        if (cancelled) {
          return;
        }
        setInstanceTemplates(rows);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.error(error);
        void message.error('实例模板加载失败');
        setInstanceTemplates([]);
      });

    return () => {
      cancelled = true;
    };
  }, [metahubBusinessUnitID]);

  useEffect(() => {
    if (!metahubBusinessUnitID) {
      return;
    }

    let cancelled = false;
    setInstancesLoading(true);

    void listBusinessUnitInstanceOAMs(metahubBusinessUnitID, {
      page: instancePage,
      pageSize: instancePageSize,
      env: instanceEnvFilter,
      keyword: instanceKeyword,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }
        setBusinessInstances(result.items);
        setInstanceTotal(result.total);
        if (result.page !== instancePage) {
          setInstancePage(result.page);
        }
        if (result.pageSize !== instancePageSize) {
          setInstancePageSize(result.pageSize);
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.error(error);
        void message.error('metahub 实例加载失败');
        setBusinessInstances([]);
        setInstanceTotal(0);
      })
      .finally(() => {
        if (cancelled) {
          return;
        }
        setInstancesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [instanceEnvFilter, instanceKeyword, instancePage, instancePageSize, metahubBusinessUnitID]);

  const ciConfigTab = useCIConfigTab({
    businessUnitID: metahubBusinessUnitID,
    enabled: activeTab === 'ci',
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

  const businessPlans = deployPlans.filter((item) => item.buId === business.id);
  const businessCiConfigs = ciConfigs.filter((item) => item.buId === business.id);
  const businessCdConfigs = cdConfigs.filter((item) => item.buId === business.id);
  const tabItems: ReadonlyArray<PageHeaderTabItem<DetailTab>> = [
    { id: 'instances', label: '业务实例' },
    { id: 'plans', label: '部署计划' },
    { id: 'ci', label: 'CI 配置' },
    { id: 'cd', label: 'CD 配置' },
  ];

  const reloadMetahubInstances = async (query?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    env?: string;
  }) => {
    if (!metahubBusinessUnitID) {
      return null;
    }

    const result = await listBusinessUnitInstanceOAMs(metahubBusinessUnitID, {
      page: query?.page ?? instancePage,
      pageSize: query?.pageSize ?? instancePageSize,
      env: query?.env ?? instanceEnvFilter,
      keyword: query?.keyword ?? instanceKeyword,
    });
    setBusinessInstances(result.items);
    setInstanceTotal(result.total);
    setInstancePage(result.page);
    setInstancePageSize(result.pageSize);
    return result;
  };

  const handleCreateInstance = async (payload: CreateInstanceFromTemplatePayload) => {
    if (!metahubBusinessUnitID) {
      return undefined;
    }

    try {
      const created = await createBusinessUnitInstanceOAM(metahubBusinessUnitID, payload);
      const nextEnv = created.env;
      setInstanceEnvFilter(nextEnv);
      setInstanceKeyword('');
      setInstancePage(1);
      setInstancesLoading(true);
      await reloadMetahubInstances({ page: 1, pageSize: instancePageSize, env: nextEnv, keyword: '' });
      return created;
    } catch (error) {
      console.error(error);
      void message.error('创建业务实例失败');
      return undefined;
    } finally {
      setInstancesLoading(false);
    }
  };

  const handleSaveInstance = async (instance: Instance) => {
    if (!metahubBusinessUnitID) {
      return instance;
    }

    try {
      const updated = await updateInstanceOAM(instance);
      const nextEnv = instanceEnvFilter !== 'all' && instanceEnvFilter !== updated.env ? updated.env : instanceEnvFilter;
      const nextKeyword = instanceKeyword.trim() && !updated.name.toLowerCase().includes(instanceKeyword.trim().toLowerCase()) ? '' : instanceKeyword;
      if (instanceEnvFilter !== 'all' && instanceEnvFilter !== updated.env) {
        setInstanceEnvFilter(nextEnv);
      }
      if (nextKeyword !== instanceKeyword) {
        setInstanceKeyword(nextKeyword);
      }
      setInstancesLoading(true);
      await reloadMetahubInstances({ page: instancePage, pageSize: instancePageSize, env: nextEnv, keyword: nextKeyword });
      return updated;
    } catch (error) {
      console.error(error);
      void message.error('更新业务实例失败');
      return undefined;
    } finally {
      setInstancesLoading(false);
    }
  };

  const handleDeleteInstance = async (instance: Instance) => {
    if (!metahubBusinessUnitID) {
      return;
    }

    try {
      await deleteInstanceOAM(Number(instance.id));
      const willEmptyPage = businessInstances.length <= 1 && instancePage > 1;
      if (willEmptyPage) {
        const nextPage = instancePage - 1;
        setInstancePage(nextPage);
        setInstancesLoading(true);
        await reloadMetahubInstances({ page: nextPage, pageSize: instancePageSize });
      } else {
        setInstancesLoading(true);
        await reloadMetahubInstances({ page: instancePage, pageSize: instancePageSize });
      }
    } catch (error) {
      console.error(error);
      void message.error('删除业务实例失败');
    } finally {
      setInstancesLoading(false);
    }
  };

  const panelInstances = metahubBusinessUnitID ? businessInstances : localPagedInstances;
  const panelTotal = metahubBusinessUnitID ? instanceTotal : localFilteredInstances.length;
  const panelTemplates = metahubBusinessUnitID ? instanceTemplates : [];
  const panelLoading = metahubBusinessUnitID ? instancesLoading : false;

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
          instances={panelInstances}
          total={panelTotal}
          page={instancePage}
          pageSize={instancePageSize}
          keyword={instanceKeyword}
          envFilter={instanceEnvFilter}
          loading={panelLoading}
          templates={panelTemplates}
          onPageChange={(nextPage, nextPageSize) => {
            setInstancePage(nextPage);
            setInstancePageSize(nextPageSize);
          }}
          onKeywordChange={(value) => {
            setInstanceKeyword(value);
            setInstancePage(1);
          }}
          onEnvFilterChange={(value) => {
            setInstanceEnvFilter(value);
            setInstancePage(1);
          }}
          onCreateInstance={metahubBusinessUnitID ? handleCreateInstance : undefined}
          onSaveInstance={metahubBusinessUnitID ? handleSaveInstance : undefined}
          onDeleteInstance={metahubBusinessUnitID ? handleDeleteInstance : undefined}
        />
      )}
      {activeTab === 'plans' && <DeployPlansTable plans={businessPlans} />}
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
      {activeTab === 'cd' && <CDConfigsTable configs={businessCdConfigs} />}
    </BasePage>
  );
}
