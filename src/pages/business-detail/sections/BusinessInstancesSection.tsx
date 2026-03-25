import { BusinessInstancesPanel } from '@/components/business/instances';
import type { Instance } from '@/mock';
import { useBusinessInstancesTab } from '../useBusinessInstancesTab';

type BusinessInstancesSectionProps = {
  businessKey?: string;
  metahubBusinessUnitID: number | null;
  localInstances: ReadonlyArray<Instance>;
};

export function BusinessInstancesSection({
  businessKey,
  metahubBusinessUnitID,
  localInstances,
}: BusinessInstancesSectionProps) {
  const instancesTab = useBusinessInstancesTab({
    businessKey,
    metahubBusinessUnitID,
    localInstances,
  });

  return (
    <BusinessInstancesPanel
      instances={instancesTab.instances}
      total={instancesTab.total}
      page={instancesTab.page}
      pageSize={instancesTab.pageSize}
      keyword={instancesTab.keyword}
      envFilter={instancesTab.envFilter}
      loading={instancesTab.loading}
      templates={instancesTab.templates}
      onPageChange={instancesTab.onPageChange}
      onKeywordChange={instancesTab.onKeywordChange}
      onEnvFilterChange={instancesTab.onEnvFilterChange}
      onCreateInstance={instancesTab.onCreateInstance}
      onSaveInstance={instancesTab.onSaveInstance}
      onDeleteInstance={instancesTab.onDeleteInstance}
    />
  );
}
