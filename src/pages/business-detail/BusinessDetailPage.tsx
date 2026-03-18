import { Empty, Space, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BusinessInstancesPanel } from '../../components/business/BusinessInstancesPanel';
import { CDConfigDrawer, type CDConfigDrawerMode } from '../../components/business/CDConfigDrawer';
import { BusinessSummary } from '../../components/business/BusinessSummary';
import { CDConfigsTable, CIConfigsTable } from '../../components/business/ConfigTables';
import { DeployPlansTable } from '../../components/business/DeployPlansTable';
import { BasePage } from '../../components/layout/page-container';
import { PageHeaderTabs, type PageHeaderTabItem } from '../../components/layout/page-header';
import {
  createBusinessUnitCDConfig,
  deleteCDConfig,
  getCDConfig,
  listBusinessUnitCDConfigs,
  updateCDConfig,
  type CDConfigFormValue,
} from '../../lib/metahub-cd-config';
import {
  createBusinessUnitInstanceOAM,
  deleteInstanceOAM,
  listBusinessUnitInstanceOAMs,
  listInstanceOAMTemplates,
  updateInstanceOAM,
  type CreateInstanceFromTemplatePayload,
  type InstanceTemplate,
} from '../../lib/metahub-instance-oam';
import type { BusinessUnit, CDConfig, Instance } from '../../mock';
import { businessInstanceConfigs, businesses, cdConfigs, ciConfigs, deployPlans } from '../../mock';

type DetailTab = 'plans' | 'ci' | 'cd' | 'instances';

const DEFAULT_CD_PAGE_SIZE = 10;

function buildCDStrategySummary(value: CDConfigFormValue) {
  if (value.deploymentMode !== '金丝雀发布') {
    return '按默认批次滚动发布';
  }

  const ratios = value.trafficRatioList?.map((item) => `${item}%`).join(',') ?? '-';
  return `${value.trafficBatchCount ?? 0} 批次 / ${ratios}`;
}

function buildLocalCDConfig(
  businessID: string,
  value: CDConfigFormValue,
  current?: CDConfig,
): CDConfig {
  const now = new Date().toISOString();

  return {
    id: current?.id ?? `local-cd-${Date.now()}`,
    buId: businessID,
    name: value.name.trim(),
    releaseRegion: value.releaseRegion,
    releaseEnv: value.releaseEnv,
    deploymentMode: value.deploymentMode,
    strategySummary: buildCDStrategySummary(value),
    trafficBatchCount: value.deploymentMode === '金丝雀发布' ? value.trafficBatchCount : undefined,
    trafficRatioList: value.deploymentMode === '金丝雀发布' ? value.trafficRatioList : undefined,
    manualAdjust: value.deploymentMode === '金丝雀发布' ? value.manualAdjust : undefined,
    adjustTimeoutSeconds: value.deploymentMode === '金丝雀发布' ? value.adjustTimeoutSeconds : undefined,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };
}

export function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>('instances');

  const [cdList, setCdList] = useState<CDConfig[]>([]);
  const [cdTotal, setCdTotal] = useState(0);
  const [cdPage, setCdPage] = useState(1);
  const [cdPageSize, setCdPageSize] = useState(DEFAULT_CD_PAGE_SIZE);
  const [cdKeyword, setCdKeyword] = useState('');
  const [cdReleaseRegion, setCdReleaseRegion] = useState('全部');
  const [cdReleaseEnv, setCdReleaseEnv] = useState('全部');
  const [cdDeploymentMode, setCdDeploymentMode] = useState('全部');
  const [cdLoading, setCdLoading] = useState(false);
  const [cdDrawerOpen, setCdDrawerOpen] = useState(false);
  const [cdDrawerMode, setCdDrawerMode] = useState<CDConfigDrawerMode>('detail');
  const [cdDrawerConfig, setCdDrawerConfig] = useState<CDConfig | null>(null);
  const [cdDrawerLoading, setCdDrawerLoading] = useState(false);
  const [cdDrawerSubmitting, setCdDrawerSubmitting] = useState(false);

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

  const localFilteredCDConfigs = useMemo(() => {
    const normalizedKeyword = cdKeyword.trim().toLowerCase();

    return cdList.filter((item) => {
      if (cdReleaseRegion !== '全部' && item.releaseRegion !== cdReleaseRegion) {
        return false;
      }
      if (cdReleaseEnv !== '全部' && item.releaseEnv !== cdReleaseEnv) {
        return false;
      }
      if (cdDeploymentMode !== '全部' && item.deploymentMode !== cdDeploymentMode) {
        return false;
      }
      if (!normalizedKeyword) {
        return true;
      }

      return [
        item.name,
        item.releaseRegion,
        item.releaseEnv,
        item.deploymentMode,
        item.strategySummary,
      ].some((value) => String(value).toLowerCase().includes(normalizedKeyword));
    });
  }, [cdDeploymentMode, cdKeyword, cdList, cdReleaseEnv, cdReleaseRegion]);

  const localPagedCDConfigs = useMemo(() => {
    const start = (cdPage - 1) * cdPageSize;
    return localFilteredCDConfigs.slice(start, start + cdPageSize);
  }, [cdPage, cdPageSize, localFilteredCDConfigs]);

  const localPagedInstances = useMemo(() => {
    const start = (instancePage - 1) * instancePageSize;
    return localFilteredInstances.slice(start, start + instancePageSize);
  }, [instancePage, instancePageSize, localFilteredInstances]);

  useEffect(() => {
    setCdList(mockCDConfigs);
  }, [mockCDConfigs]);

  useEffect(() => {
    setInstancePage(1);
    setInstancePageSize(10);
    setInstanceKeyword('');
    setInstanceEnvFilter('all');
    setBusinessInstances([]);
    setInstanceTotal(0);
    setInstanceTemplates([]);
    setCdList(mockCDConfigs);
    setCdTotal(0);
    setCdPage(1);
    setCdPageSize(DEFAULT_CD_PAGE_SIZE);
    setCdKeyword('');
    setCdReleaseRegion('全部');
    setCdReleaseEnv('全部');
    setCdDeploymentMode('全部');
    setCdLoading(false);
    setCdDrawerOpen(false);
    setCdDrawerMode('detail');
    setCdDrawerConfig(null);
    setCdDrawerLoading(false);
    setCdDrawerSubmitting(false);
  }, [id, mockCDConfigs]);

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
    if (metahubBusinessUnitID) {
      return;
    }

    const maxPage = Math.max(1, Math.ceil(localFilteredCDConfigs.length / cdPageSize));
    if (cdPage > maxPage) {
      setCdPage(maxPage);
    }
  }, [cdPage, cdPageSize, localFilteredCDConfigs.length, metahubBusinessUnitID]);

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

  const reloadMetahubCDConfigs = async (query?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    releaseRegion?: string;
    releaseEnv?: string;
    deploymentMode?: string;
  }) => {
    if (!metahubBusinessUnitID) {
      return null;
    }

    const result = await listBusinessUnitCDConfigs(metahubBusinessUnitID, {
      page: query?.page ?? cdPage,
      pageSize: query?.pageSize ?? cdPageSize,
      keyword: query?.keyword ?? cdKeyword,
      releaseRegion: query?.releaseRegion ?? cdReleaseRegion,
      releaseEnv: query?.releaseEnv ?? cdReleaseEnv,
      deploymentMode: query?.deploymentMode ?? cdDeploymentMode,
    });
    setCdList(result.items);
    setCdTotal(result.total);
    setCdPage(result.page);
    setCdPageSize(result.pageSize);
    return result;
  };

  useEffect(() => {
    if (!metahubBusinessUnitID || activeTab !== 'cd') {
      return;
    }

    let cancelled = false;
    setCdLoading(true);

    void listBusinessUnitCDConfigs(metahubBusinessUnitID, {
      page: cdPage,
      pageSize: cdPageSize,
      keyword: cdKeyword,
      releaseRegion: cdReleaseRegion,
      releaseEnv: cdReleaseEnv,
      deploymentMode: cdDeploymentMode,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }
        setCdList(result.items);
        setCdTotal(result.total);
        if (result.page !== cdPage) {
          setCdPage(result.page);
        }
        if (result.pageSize !== cdPageSize) {
          setCdPageSize(result.pageSize);
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.error(error);
        void message.error('metahub CD 配置加载失败');
        setCdList([]);
        setCdTotal(0);
      })
      .finally(() => {
        if (cancelled) {
          return;
        }
        setCdLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    cdDeploymentMode,
    cdKeyword,
    cdPage,
    cdPageSize,
    cdReleaseEnv,
    cdReleaseRegion,
    metahubBusinessUnitID,
  ]);

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
  const businessCdConfigs = metahubBusinessUnitID ? cdList : localPagedCDConfigs;
  const businessCdTotal = metahubBusinessUnitID ? cdTotal : localFilteredCDConfigs.length;
  const businessCdLoading = metahubBusinessUnitID ? cdLoading : false;
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

  const handleOpenCDDrawer = async (mode: Exclude<CDConfigDrawerMode, 'create'>, config: CDConfig) => {
    setCdDrawerMode(mode);
    setCdDrawerConfig(config);
    setCdDrawerOpen(true);

    if (!metahubBusinessUnitID || !/^\d+$/.test(config.id)) {
      return;
    }

    try {
      setCdDrawerLoading(true);
      const latest = await getCDConfig(Number(config.id));
      setCdDrawerConfig(latest);
    } catch (error) {
      console.error(error);
      void message.error(mode === 'detail' ? 'CD 配置详情加载失败' : 'CD 配置加载失败');
    } finally {
      setCdDrawerLoading(false);
    }
  };

  const handleCreateCDConfig = () => {
    setCdDrawerMode('create');
    setCdDrawerConfig(null);
    setCdDrawerLoading(false);
    setCdDrawerOpen(true);
  };

  const handleSubmitCDConfig = async (value: CDConfigFormValue) => {
    if (!business) {
      return;
    }

    try {
      setCdDrawerSubmitting(true);

      if (metahubBusinessUnitID) {
        if (cdDrawerMode === 'create') {
          await createBusinessUnitCDConfig(metahubBusinessUnitID, value);
          setCdPage(1);
          await reloadMetahubCDConfigs({ page: 1 });
        } else if (cdDrawerConfig && /^\d+$/.test(cdDrawerConfig.id)) {
          await updateCDConfig(Number(cdDrawerConfig.id), value);
          await reloadMetahubCDConfigs({ page: cdPage });
        }
      } else {
        if (cdDrawerMode === 'create') {
          const created = buildLocalCDConfig(business.id, value);
          setCdList((current) => [created, ...current]);
          setCdPage(1);
        } else if (cdDrawerConfig) {
          const updated = buildLocalCDConfig(business.id, value, cdDrawerConfig);
          setCdList((current) => current.map((item) => (item.id === updated.id ? updated : item)));
          setCdDrawerConfig(updated);
        }
      }

      setCdDrawerOpen(false);
      setCdDrawerConfig(null);
    } catch (error) {
      console.error(error);
      void message.error(error instanceof Error ? error.message : '保存 CD 配置失败');
    } finally {
      setCdDrawerSubmitting(false);
    }
  };

  const handleDeleteCDConfig = async (config: CDConfig) => {
    try {
      if (metahubBusinessUnitID && /^\d+$/.test(config.id)) {
        await deleteCDConfig(Number(config.id));
        const willEmptyPage = cdList.length <= 1 && cdPage > 1;
        const nextPage = willEmptyPage ? cdPage - 1 : cdPage;
        if (willEmptyPage) {
          setCdPage(nextPage);
        }
        setCdLoading(true);
        await reloadMetahubCDConfigs({ page: nextPage });
        return;
      }

      const referenced = deployPlans.some((item) => item.buId === business.id && item.cdConfig === config.name);
      if (referenced) {
        throw new Error('该 CD 配置已被发布计划引用，禁止删除');
      }

      setCdList((current) => current.filter((item) => item.id !== config.id));
      if (cdDrawerConfig?.id === config.id) {
        setCdDrawerOpen(false);
        setCdDrawerConfig(null);
      }
    } catch (error) {
      console.error(error);
      void message.error(error instanceof Error ? error.message : '删除 CD 配置失败');
    } finally {
      setCdLoading(false);
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
      {activeTab === 'ci' && <CIConfigsTable configs={businessCiConfigs} />}
      {activeTab === 'cd' && (
        <CDConfigsTable
          configs={businessCdConfigs}
          keyword={cdKeyword}
          releaseRegion={cdReleaseRegion}
          releaseEnv={cdReleaseEnv}
          deploymentMode={cdDeploymentMode}
          page={cdPage}
          pageSize={cdPageSize}
          total={businessCdTotal}
          loading={businessCdLoading}
          onKeywordChange={(value) => {
            setCdKeyword(value);
            setCdPage(1);
          }}
          onReleaseRegionChange={(value) => {
            setCdReleaseRegion(value);
            setCdPage(1);
          }}
          onReleaseEnvChange={(value) => {
            setCdReleaseEnv(value);
            setCdPage(1);
          }}
          onDeploymentModeChange={(value) => {
            setCdDeploymentMode(value);
            setCdPage(1);
          }}
          onPageChange={(page, pageSize) => {
            setCdPage(page);
            setCdPageSize(pageSize);
          }}
          onCreate={handleCreateCDConfig}
          onDetail={(config) => {
            void handleOpenCDDrawer('detail', config);
          }}
          onEdit={(config) => {
            void handleOpenCDDrawer('edit', config);
          }}
          onDelete={(config) => {
            void handleDeleteCDConfig(config);
          }}
        />
      )}
      <CDConfigDrawer
        open={cdDrawerOpen}
        mode={cdDrawerMode}
        config={cdDrawerConfig}
        loading={cdDrawerLoading}
        submitting={cdDrawerSubmitting}
        onClose={() => {
          setCdDrawerOpen(false);
          setCdDrawerConfig(null);
          setCdDrawerLoading(false);
        }}
        onSubmit={(value) => {
          void handleSubmitCDConfig(value);
        }}
      />
    </BasePage>
  );
}
