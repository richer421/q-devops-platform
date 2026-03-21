import { message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { formatDateTimeYMDHM } from '../../lib/date-time';
import { listBusinessUnits } from '../../lib/metahub-business-unit';
import { listBusinessUnitDeployPlans } from '../../lib/metahub-deploy-plan';
import {
  listBuilds,
  triggerBuild,
  type BuildRecord,
  type TriggerBuildPayload,
} from '../../lib/q-ci-build';

type SelectOption = {
  value: number;
  label: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export function useBuildWorkspace() {
  const [businessUnitOptions, setBusinessUnitOptions] = useState<SelectOption[]>([]);
  const [deployPlanOptions, setDeployPlanOptions] = useState<SelectOption[]>([]);
  const [selectedBusinessUnitID, setSelectedBusinessUnitID] = useState<number>();
  const [selectedDeployPlanID, setSelectedDeployPlanID] = useState<number>();
  const [builds, setBuilds] = useState<BuildRecord[]>([]);
  const [buildTotal, setBuildTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [optionLoading, setOptionLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setOptionLoading(true);

    void listBusinessUnits({ page: 1, pageSize: 200 })
      .then((page) => {
        if (cancelled) {
          return;
        }

        const nextOptions = page.items.map((item) => ({
          value: item.id,
          label: item.name,
        }));
        setBusinessUnitOptions(nextOptions);
        setSelectedBusinessUnitID((current) => current ?? nextOptions[0]?.value);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.error(error);
        void message.error(getErrorMessage(error, '业务单元加载失败'));
        setBusinessUnitOptions([]);
      })
      .finally(() => {
        if (!cancelled) {
          setOptionLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedBusinessUnitID) {
      setDeployPlanOptions([]);
      setSelectedDeployPlanID(undefined);
      return;
    }

    let cancelled = false;
    setOptionLoading(true);

    void listBusinessUnitDeployPlans(selectedBusinessUnitID, { page: 1, pageSize: 200 })
      .then((page) => {
        if (cancelled) {
          return;
        }

        const nextOptions = page.items.map((item) => ({
          value: Number(item.id),
          label: item.name,
        }));
        setDeployPlanOptions(nextOptions);
        setSelectedDeployPlanID((current) =>
          current && nextOptions.some((item) => item.value === current)
            ? current
            : undefined,
        );
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.error(error);
        void message.error(getErrorMessage(error, '部署计划加载失败'));
        setDeployPlanOptions([]);
        setSelectedDeployPlanID(undefined);
      })
      .finally(() => {
        if (!cancelled) {
          setOptionLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedBusinessUnitID]);

  useEffect(() => {
    if (!selectedBusinessUnitID && !selectedDeployPlanID) {
      setBuilds([]);
      setBuildTotal(0);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void listBuilds({
      businessUnitID: selectedBusinessUnitID,
      deployPlanID: selectedDeployPlanID,
      page: 1,
      pageSize: 20,
    })
      .then((page) => {
        if (cancelled) {
          return;
        }
        setBuilds(page.items);
        setBuildTotal(page.total);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.error(error);
        void message.error(getErrorMessage(error, '构建记录加载失败'));
        setBuilds([]);
        setBuildTotal(0);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken, selectedBusinessUnitID, selectedDeployPlanID]);

  const selectedBusinessUnitLabel = useMemo(
    () => businessUnitOptions.find((item) => item.value === selectedBusinessUnitID)?.label ?? '',
    [businessUnitOptions, selectedBusinessUnitID],
  );

  const selectedDeployPlanLabel = useMemo(
    () => deployPlanOptions.find((item) => item.value === selectedDeployPlanID)?.label ?? '',
    [deployPlanOptions, selectedDeployPlanID],
  );

  const refreshBuilds = () => {
    setReloadToken((token) => token + 1);
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
    businessUnitOptions,
    deployPlanOptions,
    selectedBusinessUnitID,
    selectedBusinessUnitLabel,
    selectedDeployPlanID,
    selectedDeployPlanLabel,
    builds,
    buildTotal,
    loading,
    optionLoading,
    triggering,
    setSelectedBusinessUnitID,
    setSelectedDeployPlanID,
    refreshBuilds,
    submitTrigger,
    formatDateTime: formatDateTimeYMDHM,
  };
}
