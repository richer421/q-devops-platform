import { message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDateTimeYMDHM } from '../../lib/date-time';
import { listBusinessUnits } from '../../lib/metahub-business-unit';
import { listBusinessUnitDeployPlans } from '../../lib/metahub-deploy-plan';
import {
  listBuilds,
  triggerBuild,
  type BuildRecord,
  type TriggerBuildPayload,
} from '../../lib/q-ci-build';
import { usePagedSelectOptions } from './usePagedSelectOptions';

const BUILD_PAGE_SIZE = 20;

function mergeBuilds(current: BuildRecord[], incoming: BuildRecord[]) {
  const seen = new Set<number>();
  const merged: BuildRecord[] = [];

  for (const item of [...current, ...incoming]) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    merged.push(item);
  }

  return merged;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export function useBuildWorkspace() {
  const [selectedBusinessUnitID, setSelectedBusinessUnitID] =
    useState<number>();
  const [selectedDeployPlanID, setSelectedDeployPlanID] = useState<number>();
  const [builds, setBuilds] = useState<BuildRecord[]>([]);
  const [buildTotal, setBuildTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMoreBuilds, setLoadingMoreBuilds] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const selectedBusinessUnitIDRef = useRef<number | undefined>(undefined);
  const selectedDeployPlanIDRef = useRef<number | undefined>(undefined);
  const buildRequestIDRef = useRef(0);
  const buildPageRef = useRef(0);
  const buildTotalRef = useRef(0);
  const buildsRef = useRef<BuildRecord[]>([]);
  const loadingMoreBuildsRef = useRef(false);

  const businessUnitOptionsSource = usePagedSelectOptions({
    errorMessage: '业务单元加载失败',
    loadPage: async ({ page, pageSize, keyword }) => {
      const result = await listBusinessUnits({ page, pageSize, keyword });
      return {
        items: result.items.map((item) => ({
          value: item.id,
          label: item.name,
        })),
        total: result.total,
      };
    },
  });

  const deployPlanOptionsSource = usePagedSelectOptions({
    enabled: Boolean(selectedBusinessUnitID),
    errorMessage: '部署计划加载失败',
    loadPage: async ({ page, pageSize, keyword }) => {
      if (!selectedBusinessUnitIDRef.current) {
        return { items: [], total: 0 };
      }

      const result = await listBusinessUnitDeployPlans(
        selectedBusinessUnitIDRef.current,
        {
          page,
          pageSize,
          keyword,
        },
      );

      return {
        items: result.items.map((item) => ({
          value: Number(item.id),
          label: item.name,
        })),
        total: result.total,
      };
    },
  });

  useEffect(() => {
    selectedBusinessUnitIDRef.current = selectedBusinessUnitID;
  }, [selectedBusinessUnitID]);

  useEffect(() => {
    selectedDeployPlanIDRef.current = selectedDeployPlanID;
  }, [selectedDeployPlanID]);

  useEffect(() => {
    if (!selectedBusinessUnitID) {
      setSelectedDeployPlanID(undefined);
      return;
    }

    const hasMatchedOption = deployPlanOptionsSource.options.some(
      (item) => item.value === selectedDeployPlanID,
    );

    if (!hasMatchedOption) {
      setSelectedDeployPlanID(undefined);
    }
  }, [
    deployPlanOptionsSource.options,
    selectedBusinessUnitID,
    selectedDeployPlanID,
  ]);

  const runBuildPageLoad = async (params: {
    page: number;
    mode: 'replace' | 'append';
    businessUnitID?: number;
    deployPlanID?: number;
  }) => {
    const requestID = buildRequestIDRef.current + 1;
    buildRequestIDRef.current = requestID;

    if (params.mode === 'replace') {
      loadingMoreBuildsRef.current = false;
      setLoading(true);
      setLoadingMoreBuilds(false);
    } else {
      loadingMoreBuildsRef.current = true;
      setLoadingMoreBuilds(true);
    }

    try {
      const page = await listBuilds({
        businessUnitID: params.businessUnitID,
        deployPlanID: params.deployPlanID,
        page: params.page,
        pageSize: BUILD_PAGE_SIZE,
      });

      if (requestID !== buildRequestIDRef.current) {
        return;
      }

      const nextBuilds =
        params.mode === 'replace'
          ? page.items
          : mergeBuilds(buildsRef.current, page.items);

      buildPageRef.current = params.page;
      buildTotalRef.current = page.total;
      buildsRef.current = nextBuilds;
      setBuilds(nextBuilds);
      setBuildTotal(page.total);
    } catch (error) {
      if (requestID !== buildRequestIDRef.current) {
        return;
      }

      console.error(error);
      void message.error(getErrorMessage(error, '构建记录加载失败'));

      if (params.mode === 'replace') {
        buildPageRef.current = 0;
        buildTotalRef.current = 0;
        buildsRef.current = [];
        setBuilds([]);
        setBuildTotal(0);
      }
    } finally {
      if (requestID !== buildRequestIDRef.current) {
        return;
      }

      loadingMoreBuildsRef.current = false;
      setLoading(false);
      setLoadingMoreBuilds(false);
    }
  };

  useEffect(() => {
    void runBuildPageLoad({
      page: 1,
      mode: 'replace',
      businessUnitID: selectedBusinessUnitID,
      deployPlanID: selectedDeployPlanID,
    });
  }, [reloadToken, selectedBusinessUnitID, selectedDeployPlanID]);

  const selectedBusinessUnitLabel = useMemo(
    () =>
      businessUnitOptionsSource.options.find(
        (item) => item.value === selectedBusinessUnitID,
      )?.label ?? '',
    [businessUnitOptionsSource.options, selectedBusinessUnitID],
  );

  const selectedDeployPlanLabel = useMemo(
    () =>
      deployPlanOptionsSource.options.find(
        (item) => item.value === selectedDeployPlanID,
      )?.label ?? '',
    [deployPlanOptionsSource.options, selectedDeployPlanID],
  );

  const refreshBuilds = () => {
    setReloadToken((token) => token + 1);
  };

  const loadMoreBuilds = () => {
    if (
      loading ||
      loadingMoreBuildsRef.current ||
      buildsRef.current.length >= buildTotalRef.current ||
      buildPageRef.current === 0
    ) {
      return;
    }

    void runBuildPageLoad({
      page: buildPageRef.current + 1,
      mode: 'append',
      businessUnitID: selectedBusinessUnitIDRef.current,
      deployPlanID: selectedDeployPlanIDRef.current,
    });
  };

  const handleBusinessUnitChange = (value: number | undefined) => {
    selectedBusinessUnitIDRef.current = value;
    setSelectedBusinessUnitID(value);
    setSelectedDeployPlanID(undefined);
    deployPlanOptionsSource.reset();
  };

  const submitTrigger = async (payload: TriggerBuildPayload) => {
    setTriggering(true);
    try {
      await triggerBuild(payload);
      setSelectedDeployPlanID(payload.deployPlanID);
      refreshBuilds();
      void message.success('构建已触发，Jenkins 正在接管执行');
    } catch (error) {
      console.error(error);
      void message.error(getErrorMessage(error, '触发构建失败'));
      throw error;
    } finally {
      setTriggering(false);
    }
  };

  return {
    businessUnitOptions: businessUnitOptionsSource.options,
    deployPlanOptions: deployPlanOptionsSource.options,
    businessUnitOptionLoading: businessUnitOptionsSource.loading,
    deployPlanOptionLoading: deployPlanOptionsSource.loading,
    selectedBusinessUnitID,
    selectedBusinessUnitLabel,
    selectedDeployPlanID,
    selectedDeployPlanLabel,
    builds,
    buildTotal,
    loading,
    loadingMoreBuilds,
    hasMoreBuilds: builds.length < buildTotal,
    optionLoading:
      businessUnitOptionsSource.loading || deployPlanOptionsSource.loading,
    triggering,
    setSelectedBusinessUnitID: handleBusinessUnitChange,
    setSelectedDeployPlanID,
    searchBusinessUnits: businessUnitOptionsSource.search,
    searchDeployPlans: deployPlanOptionsSource.search,
    loadMoreBusinessUnits: businessUnitOptionsSource.loadMore,
    loadMoreDeployPlans: deployPlanOptionsSource.loadMore,
    loadMoreBuilds,
    refreshBuilds,
    submitTrigger,
    formatDateTime: formatDateTimeYMDHM,
  };
}
