import { message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createBusinessUnitInstanceOAM,
  deleteInstanceOAM,
  listBusinessUnitInstanceOAMs,
  listInstanceOAMTemplates,
  updateInstanceOAM,
  type CreateInstanceFromTemplatePayload,
  type InstanceTemplate,
} from '../../lib/metahub-instance-oam';
import type { Instance } from '../../mock';

type UseBusinessInstancesTabOptions = {
  businessKey?: string;
  metahubBusinessUnitID: number | null;
  localInstances: ReadonlyArray<Instance>;
};

function getLocalInstancePage(items: ReadonlyArray<Instance>, page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function useBusinessInstancesTab({
  businessKey,
  metahubBusinessUnitID,
  localInstances,
}: UseBusinessInstancesTabOptions) {
  const [instancePage, setInstancePage] = useState(1);
  const [instancePageSize, setInstancePageSize] = useState(10);
  const [instanceKeyword, setInstanceKeyword] = useState('');
  const [instanceEnvFilter, setInstanceEnvFilter] = useState('all');
  const [instanceTemplates, setInstanceTemplates] = useState<InstanceTemplate[]>([]);
  const [businessInstances, setBusinessInstances] = useState<Instance[]>([]);
  const [instanceTotal, setInstanceTotal] = useState(0);
  const [instancesLoading, setInstancesLoading] = useState(false);
  const instanceListRequestIDRef = useRef(0);
  const instanceTemplateRequestIDRef = useRef(0);
  const reloadInstancesRef = useRef<
    (query?: {
      page?: number;
      pageSize?: number;
      keyword?: string;
      env?: string;
    }) => Promise<Awaited<ReturnType<typeof listBusinessUnitInstanceOAMs>> | null>
  >(async () => null);

  const localFilteredInstances = useMemo(() => {
    const normalizedKeyword = instanceKeyword.trim().toLowerCase();

    return localInstances.filter((item) => {
      const matchedEnv =
        instanceEnvFilter === 'all' ||
        item.env.toLowerCase() === instanceEnvFilter.toLowerCase();
      if (!matchedEnv) {
        return false;
      }
      if (!normalizedKeyword) {
        return true;
      }
      return item.name.toLowerCase().includes(normalizedKeyword);
    });
  }, [instanceEnvFilter, instanceKeyword, localInstances]);

  const localPagedInstances = useMemo(
    () => getLocalInstancePage(localFilteredInstances, instancePage, instancePageSize),
    [instancePage, instancePageSize, localFilteredInstances],
  );

  reloadInstancesRef.current = async (query) => {
    if (!metahubBusinessUnitID) {
      return null;
    }

    const requestID = instanceListRequestIDRef.current + 1;
    instanceListRequestIDRef.current = requestID;
    setInstancesLoading(true);

    try {
      const result = await listBusinessUnitInstanceOAMs(metahubBusinessUnitID, {
        page: query?.page ?? instancePage,
        pageSize: query?.pageSize ?? instancePageSize,
        env: query?.env ?? instanceEnvFilter,
        keyword: query?.keyword ?? instanceKeyword,
      });

      if (requestID !== instanceListRequestIDRef.current) {
        return null;
      }

      setBusinessInstances(result.items);
      setInstanceTotal(result.total);
      if (result.page !== instancePage) {
        setInstancePage(result.page);
      }
      if (result.pageSize !== instancePageSize) {
        setInstancePageSize(result.pageSize);
      }
      return result;
    } catch (error) {
      if (requestID !== instanceListRequestIDRef.current) {
        return null;
      }

      console.error(error);
      void message.error('metahub 实例加载失败');
      setBusinessInstances([]);
      setInstanceTotal(0);
      return null;
    } finally {
      if (requestID === instanceListRequestIDRef.current) {
        setInstancesLoading(false);
      }
    }
  };

  useEffect(() => {
    setInstancePage(1);
    setInstancePageSize(10);
    setInstanceKeyword('');
    setInstanceEnvFilter('all');
    setInstanceTemplates([]);
    setBusinessInstances([]);
    setInstanceTotal(0);
    setInstancesLoading(false);
    instanceListRequestIDRef.current += 1;
    instanceTemplateRequestIDRef.current += 1;
  }, [businessKey]);

  useEffect(() => {
    if (!metahubBusinessUnitID) {
      return;
    }

    const requestID = instanceTemplateRequestIDRef.current + 1;
    instanceTemplateRequestIDRef.current = requestID;

    void listInstanceOAMTemplates()
      .then((rows) => {
        if (requestID !== instanceTemplateRequestIDRef.current) {
          return;
        }
        setInstanceTemplates(rows);
      })
      .catch((error) => {
        if (requestID !== instanceTemplateRequestIDRef.current) {
          return;
        }
        console.error(error);
        void message.error('实例模板加载失败');
        setInstanceTemplates([]);
      });
  }, [metahubBusinessUnitID]);

  useEffect(() => {
    if (!metahubBusinessUnitID) {
      return;
    }

    void reloadInstancesRef.current();
  }, [
    instanceEnvFilter,
    instanceKeyword,
    instancePage,
    instancePageSize,
    metahubBusinessUnitID,
  ]);

  useEffect(() => {
    if (metahubBusinessUnitID) {
      return;
    }

    const maxPage = Math.max(
      1,
      Math.ceil(localFilteredInstances.length / instancePageSize),
    );
    if (instancePage > maxPage) {
      setInstancePage(maxPage);
    }
  }, [
    instancePage,
    instancePageSize,
    localFilteredInstances.length,
    metahubBusinessUnitID,
  ]);

  const handleCreateInstance = async (
    payload: CreateInstanceFromTemplatePayload,
  ) => {
    if (!metahubBusinessUnitID) {
      return undefined;
    }

    try {
      const created = await createBusinessUnitInstanceOAM(
        metahubBusinessUnitID,
        payload,
      );
      const nextEnv = created.env;
      const shouldRefreshDirectly =
        instancePage === 1 &&
        instanceKeyword === '' &&
        instanceEnvFilter === nextEnv;

      setInstanceKeyword('');
      setInstanceEnvFilter(nextEnv);
      setInstancePage(1);

      if (shouldRefreshDirectly) {
        void reloadInstancesRef.current({
          page: 1,
          pageSize: instancePageSize,
          env: nextEnv,
          keyword: '',
        });
      }

      return created;
    } catch (error) {
      console.error(error);
      void message.error('创建业务实例失败');
      return undefined;
    }
  };

  const handleSaveInstance = async (instance: Instance) => {
    if (!metahubBusinessUnitID) {
      return instance;
    }

    try {
      const updated = await updateInstanceOAM(instance);
      const nextEnv =
        instanceEnvFilter !== 'all' && instanceEnvFilter !== updated.env
          ? updated.env
          : instanceEnvFilter;
      const nextKeyword =
        instanceKeyword.trim() &&
        !updated.name
          .toLowerCase()
          .includes(instanceKeyword.trim().toLowerCase())
          ? ''
          : instanceKeyword;
      const needsQueryStateChange =
        nextEnv !== instanceEnvFilter || nextKeyword !== instanceKeyword;

      if (nextEnv !== instanceEnvFilter) {
        setInstanceEnvFilter(nextEnv);
      }
      if (nextKeyword !== instanceKeyword) {
        setInstanceKeyword(nextKeyword);
      }

      if (!needsQueryStateChange) {
        void reloadInstancesRef.current({
          page: instancePage,
          pageSize: instancePageSize,
          env: nextEnv,
          keyword: nextKeyword,
        });
      }

      return updated;
    } catch (error) {
      console.error(error);
      void message.error('更新业务实例失败');
      return undefined;
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
        setInstancePage(instancePage - 1);
      } else {
        void reloadInstancesRef.current({
          page: instancePage,
          pageSize: instancePageSize,
        });
      }
    } catch (error) {
      console.error(error);
      void message.error('删除业务实例失败');
    }
  };

  return {
    instances: metahubBusinessUnitID ? businessInstances : localPagedInstances,
    total: metahubBusinessUnitID ? instanceTotal : localFilteredInstances.length,
    templates: metahubBusinessUnitID ? instanceTemplates : [],
    loading: metahubBusinessUnitID ? instancesLoading : false,
    page: instancePage,
    pageSize: instancePageSize,
    keyword: instanceKeyword,
    envFilter: instanceEnvFilter,
    onPageChange: (page: number, pageSize: number) => {
      setInstancePage(page);
      setInstancePageSize(pageSize);
    },
    onKeywordChange: (value: string) => {
      setInstanceKeyword(value);
      setInstancePage(1);
    },
    onEnvFilterChange: (value: string) => {
      setInstanceEnvFilter(value);
      setInstancePage(1);
    },
    onCreateInstance: metahubBusinessUnitID ? handleCreateInstance : undefined,
    onSaveInstance: metahubBusinessUnitID ? handleSaveInstance : undefined,
    onDeleteInstance: metahubBusinessUnitID ? handleDeleteInstance : undefined,
  };
}

export type UseBusinessInstancesTabResult = ReturnType<
  typeof useBusinessInstancesTab
>;
