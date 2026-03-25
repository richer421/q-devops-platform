import { message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { BusinessUnit, CDConfig, DeployPlan } from '@/mock';
import {
  createBusinessUnitCDConfig,
  deleteCDConfig,
  getCDConfig,
  listBusinessUnitCDConfigs,
  updateCDConfig,
  type CDConfigFormValue,
} from '@/utils/api/metahub/cd-config';
import type { CDConfigDrawerMode } from '@/utils/types/business/cd-config';

type UseCDConfigTabOptions = {
  businessKey?: string;
  business?: BusinessUnit;
  metahubBusinessUnitID: number | null;
  localConfigs: ReadonlyArray<CDConfig>;
  localDeployPlans: ReadonlyArray<DeployPlan>;
  enabled: boolean;
};

const DEFAULT_CD_PAGE_SIZE = 10;

function buildCDStrategySummary(value: CDConfigFormValue) {
  if (value.deploymentMode !== '金丝雀发布') {
    return '按默认批次滚动发布';
  }

  const ratios =
    value.trafficRatioList?.map((item) => `${item}%`).join(',') ?? '-';
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
    trafficBatchCount:
      value.deploymentMode === '金丝雀发布'
        ? value.trafficBatchCount
        : undefined,
    trafficRatioList:
      value.deploymentMode === '金丝雀发布'
        ? value.trafficRatioList
        : undefined,
    manualAdjust:
      value.deploymentMode === '金丝雀发布' ? value.manualAdjust : undefined,
    adjustTimeoutSeconds:
      value.deploymentMode === '金丝雀发布'
        ? value.adjustTimeoutSeconds
        : undefined,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };
}

function getLocalCDConfigPage(
  items: ReadonlyArray<CDConfig>,
  page: number,
  pageSize: number,
) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function useCDConfigTab({
  businessKey,
  business,
  metahubBusinessUnitID,
  localConfigs,
  localDeployPlans,
  enabled,
}: UseCDConfigTabOptions) {
  const [cdList, setCdList] = useState<CDConfig[]>([...localConfigs]);
  const [cdTotal, setCdTotal] = useState(0);
  const [cdPage, setCdPage] = useState(1);
  const [cdPageSize, setCdPageSize] = useState(DEFAULT_CD_PAGE_SIZE);
  const [cdKeyword, setCdKeyword] = useState('');
  const [cdReleaseRegion, setCdReleaseRegion] = useState('全部');
  const [cdReleaseEnv, setCdReleaseEnv] = useState('全部');
  const [cdDeploymentMode, setCdDeploymentMode] = useState('全部');
  const [cdLoading, setCdLoading] = useState(false);
  const [cdDrawerOpen, setCdDrawerOpen] = useState(false);
  const [cdDrawerMode, setCdDrawerMode] =
    useState<CDConfigDrawerMode>('detail');
  const [cdDrawerConfig, setCdDrawerConfig] = useState<CDConfig | null>(null);
  const [cdDrawerLoading, setCdDrawerLoading] = useState(false);
  const [cdDrawerSubmitting, setCdDrawerSubmitting] = useState(false);
  const [cdDeleteTarget, setCdDeleteTarget] = useState<CDConfig | null>(null);
  const [cdDeleteError, setCdDeleteError] = useState('');
  const [cdDeleting, setCdDeleting] = useState(false);
  const listRequestIDRef = useRef(0);
  const drawerRequestIDRef = useRef(0);
  const reloadCDConfigsRef = useRef<
    (query?: {
      page?: number;
      pageSize?: number;
      keyword?: string;
      releaseRegion?: string;
      releaseEnv?: string;
      deploymentMode?: string;
    }) => Promise<Awaited<ReturnType<typeof listBusinessUnitCDConfigs>> | null>
  >(async () => null);

  const localFilteredCDConfigs = useMemo(() => {
    const normalizedKeyword = cdKeyword.trim().toLowerCase();

    return cdList.filter((item) => {
      if (cdReleaseRegion !== '全部' && item.releaseRegion !== cdReleaseRegion) {
        return false;
      }
      if (cdReleaseEnv !== '全部' && item.releaseEnv !== cdReleaseEnv) {
        return false;
      }
      if (
        cdDeploymentMode !== '全部' &&
        item.deploymentMode !== cdDeploymentMode
      ) {
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
      ].some((value) =>
        String(value).toLowerCase().includes(normalizedKeyword),
      );
    });
  }, [
    cdDeploymentMode,
    cdKeyword,
    cdList,
    cdReleaseEnv,
    cdReleaseRegion,
  ]);

  const localPagedCDConfigs = useMemo(
    () => getLocalCDConfigPage(localFilteredCDConfigs, cdPage, cdPageSize),
    [cdPage, cdPageSize, localFilteredCDConfigs],
  );

  reloadCDConfigsRef.current = async (query) => {
    if (!metahubBusinessUnitID) {
      return null;
    }

    const requestID = listRequestIDRef.current + 1;
    listRequestIDRef.current = requestID;
    setCdLoading(true);

    try {
      const result = await listBusinessUnitCDConfigs(metahubBusinessUnitID, {
        page: query?.page ?? cdPage,
        pageSize: query?.pageSize ?? cdPageSize,
        keyword: query?.keyword ?? cdKeyword,
        releaseRegion: query?.releaseRegion ?? cdReleaseRegion,
        releaseEnv: query?.releaseEnv ?? cdReleaseEnv,
        deploymentMode: query?.deploymentMode ?? cdDeploymentMode,
      });

      if (requestID !== listRequestIDRef.current) {
        return null;
      }

      setCdList(result.items);
      setCdTotal(result.total);
      if (result.page !== cdPage) {
        setCdPage(result.page);
      }
      if (result.pageSize !== cdPageSize) {
        setCdPageSize(result.pageSize);
      }
      return result;
    } catch (error) {
      if (requestID !== listRequestIDRef.current) {
        return null;
      }

      console.error(error);
      void message.error('metahub CD 配置加载失败');
      setCdList([]);
      setCdTotal(0);
      return null;
    } finally {
      if (requestID === listRequestIDRef.current) {
        setCdLoading(false);
      }
    }
  };

  useEffect(() => {
    setCdList([...localConfigs]);
  }, [localConfigs]);

  useEffect(() => {
    setCdList([...localConfigs]);
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
    setCdDeleteTarget(null);
    setCdDeleteError('');
    setCdDeleting(false);
    listRequestIDRef.current += 1;
    drawerRequestIDRef.current += 1;
  }, [businessKey, localConfigs]);

  useEffect(() => {
    if (!metahubBusinessUnitID) {
      return;
    }
    if (!enabled) {
      return;
    }

    void reloadCDConfigsRef.current();
  }, [
    cdDeploymentMode,
    cdKeyword,
    cdPage,
    cdPageSize,
    cdReleaseEnv,
    cdReleaseRegion,
    enabled,
    metahubBusinessUnitID,
  ]);

  useEffect(() => {
    if (metahubBusinessUnitID) {
      return;
    }

    const maxPage = Math.max(
      1,
      Math.ceil(localFilteredCDConfigs.length / cdPageSize),
    );
    if (cdPage > maxPage) {
      setCdPage(maxPage);
    }
  }, [cdPage, cdPageSize, localFilteredCDConfigs.length, metahubBusinessUnitID]);

  const openDetailDrawer = async (
    mode: Exclude<CDConfigDrawerMode, 'create'>,
    config: CDConfig,
  ) => {
    setCdDrawerMode(mode);
    setCdDrawerConfig(config);
    setCdDrawerOpen(true);

    if (!metahubBusinessUnitID || !/^\d+$/.test(config.id)) {
      return;
    }

    const requestID = drawerRequestIDRef.current + 1;
    drawerRequestIDRef.current = requestID;

    try {
      setCdDrawerLoading(true);
      const latest = await getCDConfig(Number(config.id));
      if (requestID !== drawerRequestIDRef.current) {
        return;
      }
      setCdDrawerConfig(latest);
    } catch (error) {
      if (requestID !== drawerRequestIDRef.current) {
        return;
      }
      console.error(error);
      void message.error(
        mode === 'detail' ? 'CD 配置详情加载失败' : 'CD 配置加载失败',
      );
    } finally {
      if (requestID === drawerRequestIDRef.current) {
        setCdDrawerLoading(false);
      }
    }
  };

  const closeDrawer = () => {
    drawerRequestIDRef.current += 1;
    setCdDrawerOpen(false);
    setCdDrawerConfig(null);
    setCdDrawerLoading(false);
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
          if (cdPage === 1) {
            await reloadCDConfigsRef.current({ page: 1 });
          } else {
            setCdPage(1);
          }
        } else if (cdDrawerConfig && /^\d+$/.test(cdDrawerConfig.id)) {
          await updateCDConfig(Number(cdDrawerConfig.id), value);
          await reloadCDConfigsRef.current({ page: cdPage });
        }
      } else if (cdDrawerMode === 'create') {
        const created = buildLocalCDConfig(business.id, value);
        setCdList((current) => [created, ...current]);
        setCdPage(1);
      } else if (cdDrawerConfig) {
        const updated = buildLocalCDConfig(business.id, value, cdDrawerConfig);
        setCdList((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        setCdDrawerConfig(updated);
      }

      setCdDrawerOpen(false);
      setCdDrawerConfig(null);
    } catch (error) {
      console.error(error);
      void message.error(
        error instanceof Error ? error.message : '保存 CD 配置失败',
      );
    } finally {
      setCdDrawerSubmitting(false);
    }
  };

  const requestDeleteCDConfig = (config: CDConfig) => {
    setCdDeleteTarget(config);
    setCdDeleteError('');
  };

  const closeDeleteCDConfig = () => {
    setCdDeleteTarget(null);
    setCdDeleteError('');
    setCdDeleting(false);
  };

  const confirmDeleteCDConfig = async () => {
    if (!cdDeleteTarget) {
      return;
    }

    const config = cdDeleteTarget;
    setCdDeleting(true);

    try {
      if (metahubBusinessUnitID && /^\d+$/.test(config.id)) {
        await deleteCDConfig(Number(config.id));
        const willEmptyPage = cdList.length <= 1 && cdPage > 1;
        const nextPage = willEmptyPage ? cdPage - 1 : cdPage;

        if (willEmptyPage) {
          setCdPage(nextPage);
        } else {
          await reloadCDConfigsRef.current({ page: nextPage });
        }
      } else {
        const referenced = localDeployPlans.some(
          (item) => item.buId === business?.id && item.cdConfig === config.name,
        );
        if (referenced) {
          throw new Error('该 CD 配置已被发布计划引用，禁止删除');
        }

        setCdList((current) => current.filter((item) => item.id !== config.id));
      }

      if (cdDrawerConfig?.id === config.id) {
        setCdDrawerOpen(false);
        setCdDrawerConfig(null);
      }

      setCdDeleteTarget(null);
      setCdDeleteError('');
      void message.success('CD 配置删除成功');
    } catch (error) {
      console.error(error);
      setCdDeleteError(
        error instanceof Error ? error.message : '删除 CD 配置失败',
      );
    } finally {
      setCdDeleting(false);
    }
  };

  return {
    configs: metahubBusinessUnitID ? cdList : localPagedCDConfigs,
    total: metahubBusinessUnitID ? cdTotal : localFilteredCDConfigs.length,
    loading: metahubBusinessUnitID ? cdLoading : false,
    keyword: cdKeyword,
    releaseRegion: cdReleaseRegion,
    releaseEnv: cdReleaseEnv,
    deploymentMode: cdDeploymentMode,
    page: cdPage,
    pageSize: cdPageSize,
    drawerOpen: cdDrawerOpen,
    drawerMode: cdDrawerMode,
    drawerConfig: cdDrawerConfig,
    drawerLoading: cdDrawerLoading,
    drawerSubmitting: cdDrawerSubmitting,
    deleteTarget: cdDeleteTarget,
    deleteError: cdDeleteError,
    deleting: cdDeleting,
    onKeywordChange: (value: string) => {
      setCdKeyword(value);
      setCdPage(1);
    },
    onReleaseRegionChange: (value: string) => {
      setCdReleaseRegion(value);
      setCdPage(1);
    },
    onReleaseEnvChange: (value: string) => {
      setCdReleaseEnv(value);
      setCdPage(1);
    },
    onDeploymentModeChange: (value: string) => {
      setCdDeploymentMode(value);
      setCdPage(1);
    },
    onPageChange: (page: number, pageSize: number) => {
      setCdPage(page);
      setCdPageSize(pageSize);
    },
    onCreate: handleCreateCDConfig,
    onDetail: (config: CDConfig) => {
      void openDetailDrawer('detail', config);
    },
    onEdit: (config: CDConfig) => {
      void openDetailDrawer('edit', config);
    },
    onDelete: requestDeleteCDConfig,
    closeDelete: closeDeleteCDConfig,
    confirmDelete: confirmDeleteCDConfig,
    closeDrawer,
    submitDrawer: handleSubmitCDConfig,
  };
}

export type UseCDConfigTabResult = ReturnType<typeof useCDConfigTab>;
