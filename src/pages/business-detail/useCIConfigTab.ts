import { message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import {
  createBusinessUnitCIConfig,
  ciConfigToFormValue,
  deleteCIConfig,
  getCIConfig,
  listBusinessUnitCIConfigs,
  updateCIConfig,
  type CIConfigFormValue,
  type CIConfigItem,
} from '../../lib/metahub-ci-config';

type UseCIConfigTabOptions = {
  businessUnitID: number | null;
  enabled: boolean;
};

type CIConfigFormMode = 'create' | 'edit';

const DEFAULT_FORM_VALUE: CIConfigFormValue = {
  name: '',
  imageTagRuleType: 'branch',
  imageTagTemplate: '',
  withTimestamp: true,
  withCommit: false,
  makefilePath: './Makefile',
  makeCommand: 'make build',
  dockerfilePath: './Dockerfile',
};

function normalizeCIErrorMessage(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return normalized;
  }

  const referencedMatch = normalized.match(/^ci config is referenced by (\d+) deploy plans and cannot be deleted$/i);
  if (referencedMatch) {
    return `该 CI 配置已被 ${referencedMatch[1]} 个部署计划引用，禁止删除`;
  }
  if (/^ci config not found$/i.test(normalized)) {
    return 'CI 配置不存在';
  }

  return normalized;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return normalizeCIErrorMessage(error.message);
  }
  return fallback;
}

export function useCIConfigTab({ businessUnitID, enabled }: UseCIConfigTabOptions) {
  const [items, setItems] = useState<CIConfigItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTargetID, setDetailTargetID] = useState<number | null>(null);
  const [detailItem, setDetailItem] = useState<CIConfigItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<CIConfigFormMode>('create');
  const [editingConfigID, setEditingConfigID] = useState<number | null>(null);
  const [formInitialValue, setFormInitialValue] = useState<CIConfigFormValue>(DEFAULT_FORM_VALUE);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<CIConfigItem | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const detailRequestIDRef = useRef(0);

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
    setEditingConfigID(null);
    setFormInitialValue(DEFAULT_FORM_VALUE);
    setSubmitting(false);
    setDeleteTarget(null);
    setDeleteError('');
    setDeleting(false);
    detailRequestIDRef.current += 1;
  }, [businessUnitID]);

  useEffect(() => {
    if (!businessUnitID || !enabled) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    void listBusinessUnitCIConfigs(businessUnitID, {
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
        void message.error(getErrorMessage(error, 'CI 配置加载失败'));
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
    if (!businessUnitID || !enabled || !detailOpen || detailTargetID == null) {
      return;
    }

    const requestID = detailRequestIDRef.current + 1;
    detailRequestIDRef.current = requestID;
    setDetailLoading(true);
    setDetailError('');

    void getCIConfig(detailTargetID)
      .then((result) => {
        if (requestID !== detailRequestIDRef.current) {
          return;
        }
        setDetailItem(result);
      })
      .catch((error) => {
        if (requestID !== detailRequestIDRef.current) {
          return;
        }
        console.error(error);
        setDetailError(getErrorMessage(error, 'CI 配置详情加载失败'));
      })
      .finally(() => {
        if (requestID === detailRequestIDRef.current) {
          setDetailLoading(false);
        }
      });
  }, [businessUnitID, detailOpen, detailTargetID, enabled]);

  const openCreateForm = () => {
    setFormMode('create');
    setEditingConfigID(null);
    setFormInitialValue(DEFAULT_FORM_VALUE);
    setFormOpen(true);
  };

  const openEditForm = (item: CIConfigItem) => {
    setFormMode('edit');
    setEditingConfigID(item.id);
    setFormInitialValue(ciConfigToFormValue(item));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setSubmitting(false);
  };

  const submitForm = async (value: CIConfigFormValue) => {
    if (!businessUnitID) {
      return undefined;
    }

    setSubmitting(true);
    try {
      const saved =
        formMode === 'create'
          ? await createBusinessUnitCIConfig(businessUnitID, value)
          : await updateCIConfig(editingConfigID ?? 0, value);

      setFormOpen(false);
      if (detailTargetID === saved.id) {
        setDetailItem(saved);
      }
      if (formMode === 'create') {
        setPage(1);
      }
      setReloadToken((current) => current + 1);
      void message.success(formMode === 'create' ? 'CI 配置创建成功' : 'CI 配置更新成功');
      return saved;
    } catch (error) {
      console.error(error);
      void message.error(getErrorMessage(error, formMode === 'create' ? 'CI 配置创建失败' : 'CI 配置更新失败'));
      return undefined;
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = (item: CIConfigItem) => {
    setDetailTargetID(item.id);
    setDetailItem(item);
    setDetailError('');
    setDetailOpen(true);
  };

  const closeDetail = () => {
    detailRequestIDRef.current += 1;
    setDetailOpen(false);
    setDetailTargetID(null);
    setDetailError('');
  };

  const requestDelete = (item: CIConfigItem) => {
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

    setDeleting(true);
    try {
      await deleteCIConfig(deleteTarget.id);
      if (detailTargetID === deleteTarget.id) {
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
      void message.success('CI 配置删除成功');
    } catch (error) {
      console.error(error);
      setDeleteError(getErrorMessage(error, 'CI 配置删除失败'));
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

export type UseCIConfigTabResult = ReturnType<typeof useCIConfigTab>;
