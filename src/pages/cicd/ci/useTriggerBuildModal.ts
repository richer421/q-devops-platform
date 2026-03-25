import { useEffect, useMemo, useRef, useState } from 'react';
import { listBusinessUnits } from '@/utils/api/metahub/business-unit';
import { listBusinessUnitDeployPlans } from '@/utils/api/metahub/deploy-plan';
import type { TriggerBuildPayload } from '@/utils/api/q-ci/build';
import { usePagedSelectOptions } from './usePagedSelectOptions';
import { withSelectedOption } from './utils';

type UseTriggerBuildModalParams = {
  open: boolean;
  selectedBusinessUnitID?: number;
  selectedBusinessUnitLabel?: string;
  selectedDeployPlanID?: number;
  selectedDeployPlanLabel?: string;
  submitting?: boolean;
  onSubmit: (payload: TriggerBuildPayload) => Promise<void>;
};

export function useTriggerBuildModal({
  open,
  selectedBusinessUnitID,
  selectedBusinessUnitLabel,
  selectedDeployPlanID,
  selectedDeployPlanLabel,
  submitting = false,
  onSubmit,
}: UseTriggerBuildModalParams) {
  const [businessUnitID, setBusinessUnitID] = useState<number>();
  const [deployPlanID, setDeployPlanID] = useState<number>();
  const businessUnitIDRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      return;
    }

    setBusinessUnitID(selectedBusinessUnitID);
    setDeployPlanID(selectedDeployPlanID);
  }, [open, selectedBusinessUnitID, selectedDeployPlanID]);

  useEffect(() => {
    businessUnitIDRef.current = businessUnitID;
  }, [businessUnitID]);

  const businessUnitOptionsSource = usePagedSelectOptions({
    enabled: open,
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
    enabled: open && Boolean(businessUnitID),
    errorMessage: '部署计划加载失败',
    loadPage: async ({ page, pageSize, keyword }) => {
      if (!businessUnitIDRef.current) {
        return { items: [], total: 0 };
      }

      const result = await listBusinessUnitDeployPlans(businessUnitIDRef.current, {
        page,
        pageSize,
        keyword,
      });

      return {
        items: result.items.map((item) => ({
          value: Number(item.id),
          label: item.name,
        })),
        total: result.total,
      };
    },
  });

  const businessUnitOptions = useMemo(
    () =>
      withSelectedOption(
        businessUnitOptionsSource.options,
        businessUnitID,
        businessUnitID === selectedBusinessUnitID ? selectedBusinessUnitLabel : '',
      ),
    [
      businessUnitOptionsSource.options,
      businessUnitID,
      selectedBusinessUnitID,
      selectedBusinessUnitLabel,
    ],
  );

  const deployPlanOptions = useMemo(
    () =>
      withSelectedOption(
        deployPlanOptionsSource.options,
        deployPlanID,
        businessUnitID === selectedBusinessUnitID && deployPlanID === selectedDeployPlanID
          ? selectedDeployPlanLabel
          : '',
      ),
    [
      businessUnitID,
      deployPlanOptionsSource.options,
      deployPlanID,
      selectedBusinessUnitID,
      selectedDeployPlanID,
      selectedDeployPlanLabel,
    ],
  );

  const handleBusinessUnitChange = (value: number | undefined) => {
    businessUnitIDRef.current = value;
    setBusinessUnitID(value);
    setDeployPlanID(undefined);
    businessUnitOptionsSource.search('');
    deployPlanOptionsSource.reset();
  };

  const handleDeployPlanChange = (value: number | undefined) => {
    setDeployPlanID(value);
  };

  const handleSubmit = async (payload: TriggerBuildPayload) => {
    await onSubmit(payload);
  };

  return {
    businessUnitID,
    deployPlanID,
    businessUnitOptions,
    deployPlanOptions,
    businessUnitOptionLoading: businessUnitOptionsSource.loading,
    deployPlanOptionLoading: deployPlanOptionsSource.loading,
    submitting,
    setBusinessUnitID: handleBusinessUnitChange,
    setDeployPlanID: handleDeployPlanChange,
    searchBusinessUnits: businessUnitOptionsSource.search,
    searchDeployPlans: deployPlanOptionsSource.search,
    loadMoreBusinessUnits: businessUnitOptionsSource.loadMore,
    loadMoreDeployPlans: deployPlanOptionsSource.loadMore,
    submit: handleSubmit,
  };
}
