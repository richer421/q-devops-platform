import { PlayCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useMemo, useState } from 'react';
import { TriggerBuildModal } from '@/components/cicd/ci';
import { ExecuteReleaseModal } from '@/components/cicd/cd';
import { CicdAnimationStyles } from '@/components/cicd/shared';
import { BasePage } from '@/components/layout/page-container';
import {
  PageHeaderTabs,
  type PageHeaderTabItem,
} from '@/components/layout/page-header';
import {
  CicdBuildSection,
  useBuildWorkspace,
  useTriggerBuildModal,
} from './ci';
import { CicdReleaseSection } from './cd';

type TabKey = 'ci' | 'cd';

export function CicdPage() {
  const [tab, setTab] = useState<TabKey>('ci');
  const [buildModalOpen, setBuildModalOpen] = useState(false);
  const [showRelease, setShowRelease] = useState(false);
  const buildWorkspace = useBuildWorkspace();

  const tabItems: ReadonlyArray<PageHeaderTabItem<TabKey>> = useMemo(
    () => [
      { id: 'ci', label: '自动构建', icon: <PlayCircleOutlined /> },
      { id: 'cd', label: '交付上线', icon: <RocketOutlined /> },
    ],
    [],
  );

  const triggerBuildModal = useTriggerBuildModal({
    open: buildModalOpen,
    selectedBusinessUnitID: buildWorkspace.selectedBusinessUnitID,
    selectedBusinessUnitLabel: buildWorkspace.selectedBusinessUnitLabel,
    selectedDeployPlanID: buildWorkspace.selectedDeployPlanID,
    selectedDeployPlanLabel: buildWorkspace.selectedDeployPlanLabel,
    submitting: buildWorkspace.triggering,
    onSubmit: buildWorkspace.submitTrigger,
  });

  return (
    <>
      <CicdAnimationStyles />

      <BasePage
        breadcrumbs={[{ label: 'Q DevOps' }, { label: '业务交付' }]}
        title="业务交付"
        description="触发 Jenkins 构建、查看 Harbor 产物，并通过官方四步骤追踪构建进度和结果"
        action={
          tab === 'ci' ? (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => setBuildModalOpen(true)}
            >
              触发构建
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<RocketOutlined />}
              onClick={() => setShowRelease(true)}
            >
              执行发布
            </Button>
          )
        }
        extension={
          <PageHeaderTabs items={tabItems} value={tab} onChange={setTab} />
        }
        contentStyle={{ padding: '2px', overflow: 'auto' }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            minHeight: 0,
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {tab === 'ci' ? <CicdBuildSection workspace={buildWorkspace} /> : null}
          {tab === 'cd' ? <CicdReleaseSection /> : null}
        </div>
      </BasePage>

      <TriggerBuildModal
        open={buildModalOpen}
        onClose={() => setBuildModalOpen(false)}
        businessUnitOptions={triggerBuildModal.businessUnitOptions}
        deployPlanOptions={triggerBuildModal.deployPlanOptions}
        initialBusinessUnitID={triggerBuildModal.businessUnitID}
        initialDeployPlanID={triggerBuildModal.deployPlanID}
        businessUnitOptionLoading={triggerBuildModal.businessUnitOptionLoading}
        deployPlanOptionLoading={triggerBuildModal.deployPlanOptionLoading}
        submitting={triggerBuildModal.submitting}
        onBusinessUnitChange={triggerBuildModal.setBusinessUnitID}
        onDeployPlanChange={triggerBuildModal.setDeployPlanID}
        onBusinessUnitSearch={triggerBuildModal.searchBusinessUnits}
        onDeployPlanSearch={triggerBuildModal.searchDeployPlans}
        onBusinessUnitLoadMore={triggerBuildModal.loadMoreBusinessUnits}
        onDeployPlanLoadMore={triggerBuildModal.loadMoreDeployPlans}
        onSubmit={triggerBuildModal.submit}
      />
      <ExecuteReleaseModal
        open={showRelease}
        onClose={() => setShowRelease(false)}
      />
    </>
  );
}
