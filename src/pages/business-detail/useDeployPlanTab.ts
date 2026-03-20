import { message } from 'antd';
import { useEffect, useState } from 'react';
import {
  createBusinessUnitDeployPlan,
  deleteDeployPlan,
  deployPlanToFormValue,
  getDeployPlan,
  listBusinessUnitDeployPlans,
  updateDeployPlan,
  type DeployPlanFormValue,
} from '../../lib/metahub-deploy-plan';
import { listBusinessUnitCDConfigs } from '../../lib/metahub-cd-config';
import { listBusinessUnitCIConfigs } from '../../lib/metahub-ci-config';
import { listBusinessUnitInstanceOAMs } from '../../lib/metahub-instance-oam';
import type { DeployPlan } from '../../mock';

type UseDeployPlanTabOptions = {
  businessUnitID: number | null;
  enabled: boolean;
};

type DeployPlanFormMode = 'create' | 'edit';

const DEFAULT_FORM_VALUE: DeployPlanFormValue = {
  name: '',
  description: '',
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export function useDeployPlanTab({ businessUnitID, enabled }: UseDeployPlanTabOptions) {
  const [items, setItems] = useState<DeployPlan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTargetID, setDetailTargetID] = useState<number | null>(null);
  const [detailItem, setDetailItem] = useState<DeployPlan | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<DeployPlanFormMode>('create');
  const [editingPlanID, setEditingPlanID] = useState<number | null>(null);
  const [formInitialValue, setFormInitialValue] = useState<DeployPlanFormValue>(DEFAULT_FORM_VALUE);
  const [submitting, setSubmitting] = useState(false);

  const [optionLoading, setOptionLoading] = useState(false);
  const [ciOptions, setCIOptions] = useState<Array<{ value: number; label: string }>>([]);
  const [cdOptions, setCDOptions] = useState<Array<{ value: number; label: string }>>([]);
  const [instanceOptions, setInstanceOptions] = useState<Array<{ value: number; label: string; env: string; searchLabel: string }>>([]);

  const [deleteTarget, setDeleteTarget] = useState<DeployPlan | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setItems([]);
    setTotal(0);
    setPage(1);
    setPageSize(10);
    setKeyword('');
    setLoading(false);
    setReloadToken(0);
    setDetailOpen(false);
    setDetailTargetID(null);
    setDetailItem(null);
    setDetailLoading(false);
    setDetailError('');
    setFormOpen(false);
    setFormMode('create');
    setEditingPlanID(null);
    setFormInitialValue(DEFAULT_FORM_VALUE);
    setSubmitting(false);
    setOptionLoading(false);
    setCIOptions([]);
    setCDOptions([]);
    setInstanceOptions([]);
    setDeleteTarget(null);
    setDeleteError('');
    setDeleting(false);
  }, [businessUnitID]);

  useEffect(() => {
    if (!businessUnitID || !enabled) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    void listBusinessUnitDeployPlans(businessUnitID, {
      page,
      pageSize,
      keyword,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }
        setItems(result.items);
        setTotal(result.total);
        if (result.page !== page) {
          setPage(result.page);
        }
        if (result.pageSize !== pageSize) {
          setPageSize(result.pageSize);
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.error(error);
        void message.error(getErrorMessage(error, '部署计划加载失败'));
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (cancelled) {
          return;
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [businessUnitID, enabled, keyword, page, pageSize, reloadToken]);

  useEffect(() => {
    if (!businessUnitID || !enabled) {
      return;
    }

    let cancelled = false;
    setOptionLoading(true);

    void Promise.all([
      listBusinessUnitCIConfigs(businessUnitID, { page: 1, pageSize: 200 }),
      listBusinessUnitCDConfigs(businessUnitID, { page: 1, pageSize: 200 }),
      listBusinessUnitInstanceOAMs(businessUnitID, { page: 1, pageSize: 200 }),
    ])
      .then(([ciPage, cdPage, instancePage]) => {
        if (cancelled) {
          return;
        }

        setCIOptions(ciPage.items.map((item) => ({ value: item.id, label: item.name })));
        setCDOptions(cdPage.items.map((item) => ({ value: Number(item.id), label: item.name })));
        setInstanceOptions(instancePage.items.map((item) => ({
          value: Number(item.id),
          label: item.name,
          env: item.env,
          searchLabel: `${item.name} ${item.env}`,
        })));
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.error(error);
        void message.error(getErrorMessage(error, '部署计划选项加载失败'));
        setCIOptions([]);
        setCDOptions([]);
        setInstanceOptions([]);
      })
      .finally(() => {
        if (cancelled) {
          return;
        }
        setOptionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [businessUnitID, enabled]);

  useEffect(() => {
    if (!businessUnitID || !enabled || !detailOpen || detailTargetID == null) {
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetailError('');

    void getDeployPlan(detailTargetID)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setDetailItem(result);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.error(error);
        setDetailError(getErrorMessage(error, '部署计划详情加载失败'));
      })
      .finally(() => {
        if (cancelled) {
          return;
        }
        setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [businessUnitID, detailOpen, detailTargetID, enabled]);

  const openCreateForm = () => {
    setFormMode('create');
    setEditingPlanID(null);
    setFormInitialValue(DEFAULT_FORM_VALUE);
    setFormOpen(true);
  };

  const openEditForm = async (item: DeployPlan) => {
    const deployPlanID = Number(item.id);
    if (!Number.isFinite(deployPlanID)) {
      return;
    }

    setFormMode('edit');
    setEditingPlanID(deployPlanID);
    setFormInitialValue(deployPlanToFormValue(item));
    setFormOpen(true);

    try {
      const latest = await getDeployPlan(deployPlanID);
      setFormInitialValue(deployPlanToFormValue(latest));
      if (detailTargetID === deployPlanID) {
        setDetailItem(latest);
      }
    } catch (error) {
      console.error(error);
      void message.error(getErrorMessage(error, '部署计划详情加载失败'));
    }
  };

  const closeForm = () => {
    setFormOpen(false);
    setSubmitting(false);
  };

  const submitForm = async (value: DeployPlanFormValue) => {
    if (!businessUnitID) {
      return undefined;
    }

    setSubmitting(true);
    try {
      const saved =
        formMode === 'create'
          ? await createBusinessUnitDeployPlan(businessUnitID, value)
          : await updateDeployPlan(editingPlanID ?? 0, value);

      setFormOpen(false);
      if (detailTargetID === Number(saved.id)) {
        setDetailItem(saved);
      }
      if (formMode === 'create') {
        setPage(1);
      }
      setReloadToken((current) => current + 1);
      void message.success(formMode === 'create' ? '部署计划创建成功' : '部署计划更新成功');
      return saved;
    } catch (error) {
      console.error(error);
      void message.error(getErrorMessage(error, formMode === 'create' ? '部署计划创建失败' : '部署计划更新失败'));
      return undefined;
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = (item: DeployPlan) => {
    const deployPlanID = Number(item.id);
    if (!Number.isFinite(deployPlanID)) {
      return;
    }

    setDetailTargetID(deployPlanID);
    setDetailItem(item);
    setDetailError('');
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailTargetID(null);
    setDetailError('');
  };

  const requestDelete = (item: DeployPlan) => {
    setDeleteTarget(item);
    setDeleteError('');
  };

  const closeDelete = () => {
    setDeleteTarget(null);
    setDeleteError('');
    setDeleting(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const deployPlanID = Number(deleteTarget.id);
    if (!Number.isFinite(deployPlanID)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteDeployPlan(deployPlanID);
      if (detailTargetID === deployPlanID) {
        closeDetail();
      }

      const willFallbackToPreviousPage = items.length <= 1 && page > 1;
      if (willFallbackToPreviousPage) {
        setPage(page - 1);
      } else {
        setReloadToken((current) => current + 1);
      }
      setDeleteTarget(null);
      setDeleteError('');
      void message.success('部署计划删除成功');
    } catch (error) {
      console.error(error);
      setDeleteError(getErrorMessage(error, '部署计划删除失败'));
    } finally {
      setDeleting(false);
    }
  };

  return {
    items,
    total,
    page,
    pageSize,
    keyword,
    loading,
    onKeywordChange: (value: string) => {
      setKeyword(value);
      setPage(1);
    },
    onPageChange: (nextPage: number, nextPageSize: number) => {
      setPage(nextPage);
      setPageSize(nextPageSize);
    },

    detailOpen,
    detailItem,
    detailLoading,
    detailError,
    openDetail,
    closeDetail,

    formOpen,
    formMode,
    formInitialValue,
    submitting,
    optionLoading,
    ciOptions,
    cdOptions,
    instanceOptions,
    openCreateForm,
    openEditForm,
    closeForm,
    submitForm,

    deleteTarget,
    deleteError,
    deleting,
    requestDelete,
    closeDelete,
    confirmDelete,
  };
}

export type UseDeployPlanTabResult = ReturnType<typeof useDeployPlanTab>;
