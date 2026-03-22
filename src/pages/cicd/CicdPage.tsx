import { PlayCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { Button, Empty, Select, Space, Spin, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { BuildCard } from '../../components/cicd/BuildCard';
import { ExecuteReleaseModal } from '../../components/cicd/ExecuteReleaseModal';
import { ReleaseCard } from '../../components/cicd/ReleaseCard';
import { TriggerBuildModal } from '../../components/cicd/TriggerBuildModal';
import { CicdAnimationStyles } from '../../components/cicd/shared';
import { BasePage } from '../../components/layout/page-container';
import {
  PageHeaderTabs,
  type PageHeaderTabItem,
} from '../../components/layout/page-header';
import { listBusinessUnitDeployPlans } from '../../lib/metahub-deploy-plan';
import { releaseStages, releases } from '../../mock';
import { useBuildWorkspace } from './useBuildWorkspace';

type TabKey = 'ci' | 'release';

const { Text } = Typography;

export function CicdPage() {
  const [tab, setTab] = useState<TabKey>('ci');
  const [showBuild, setShowBuild] = useState(false);
  const [showRelease, setShowRelease] = useState(false);
  const buildWorkspace = useBuildWorkspace();
  const [modalBusinessUnitID, setModalBusinessUnitID] = useState<number>();
  const [modalDeployPlanID, setModalDeployPlanID] = useState<number>();
  const [modalDeployPlanOptions, setModalDeployPlanOptions] = useState<
    Array<{ value: number; label: string }>
  >([]);
  const [modalOptionLoading, setModalOptionLoading] = useState(false);

  const tabItems: ReadonlyArray<PageHeaderTabItem<TabKey>> = useMemo(
    () => [
      { id: 'ci', label: '自动构建', icon: <PlayCircleOutlined /> },
      { id: 'release', label: '交付上线', icon: <RocketOutlined /> },
    ],
    [],
  );

  useEffect(() => {
    if (!showBuild) {
      return;
    }

    setModalBusinessUnitID(buildWorkspace.selectedBusinessUnitID);
    setModalDeployPlanID(buildWorkspace.selectedDeployPlanID);
  }, [buildWorkspace.selectedBusinessUnitID, buildWorkspace.selectedDeployPlanID, showBuild]);

  useEffect(() => {
    if (!showBuild) {
      return;
    }
    if (!modalBusinessUnitID) {
      setModalDeployPlanOptions([]);
      setModalDeployPlanID(undefined);
      return;
    }

    let cancelled = false;
    setModalOptionLoading(true);

    void listBusinessUnitDeployPlans(modalBusinessUnitID, { page: 1, pageSize: 200 })
      .then((page) => {
        if (cancelled) {
          return;
        }

        const nextOptions = page.items.map((item) => ({
          value: Number(item.id),
          label: item.name,
        }));
        setModalDeployPlanOptions(nextOptions);
        setModalDeployPlanID((current) =>
          current && nextOptions.some((item) => item.value === current)
            ? current
            : nextOptions[0]?.value,
        );
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.error(error);
        void message.error(error instanceof Error ? error.message : '部署计划加载失败');
        setModalDeployPlanOptions([]);
        setModalDeployPlanID(undefined);
      })
      .finally(() => {
        if (!cancelled) {
          setModalOptionLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [modalBusinessUnitID, showBuild]);

  return (
    <>
      <CicdAnimationStyles />

      <BasePage
        breadcrumbs={[{ label: 'Q DevOps' }, { label: '业务交付' }]}
        title="业务交付"
        description="触发 Jenkins 构建、查看 Harbor 产物，并通过官方四步骤追踪构建进度和结果"
        action={
          tab === 'ci' ? (
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => setShowBuild(true)}>
              触发构建
            </Button>
          ) : (
            <Button type="primary" icon={<RocketOutlined />} onClick={() => setShowRelease(true)}>
              执行发布
            </Button>
          )
        }
        extension={
          <PageHeaderTabs
            items={tabItems}
            value={tab}
            onChange={setTab}
          />
        }
        contentStyle={{ padding: '2px', overflow: 'auto' }}
      >
        <Space direction="vertical" size={2} style={{ display: 'flex' }}>
          {tab === 'ci' ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  padding: '18px 20px',
                  background: '#F7F8FA',
                  border: '1px solid #E5E6EB',
                  borderRadius: 16,
                }}
              >
                <div style={{ display: 'grid', gap: 6 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    业务单元
                  </Text>
                  <Select
                    value={buildWorkspace.selectedBusinessUnitID}
                    options={buildWorkspace.businessUnitOptions}
                    loading={buildWorkspace.optionLoading}
                    placeholder="请选择业务单元"
                    onChange={(value) => buildWorkspace.setSelectedBusinessUnitID(value)}
                  />
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    部署计划
                  </Text>
                  <Select
                    allowClear
                    value={buildWorkspace.selectedDeployPlanID}
                    options={buildWorkspace.deployPlanOptions}
                    loading={buildWorkspace.optionLoading}
                    placeholder="按部署计划筛选"
                    onChange={(value) => buildWorkspace.setSelectedDeployPlanID(value)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
                  <Button onClick={buildWorkspace.refreshBuilds}>刷新列表</Button>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    共 {buildWorkspace.buildTotal} 条
                  </Text>
                </div>
              </div>

              {buildWorkspace.loading ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 240,
                    background: '#FFFFFF',
                    borderRadius: 16,
                  }}
                >
                  <Spin />
                </div>
              ) : buildWorkspace.builds.length > 0 ? (
                buildWorkspace.builds.map((build) => <BuildCard key={build.id} build={build} />)
              ) : (
                <div
                  style={{
                    padding: '48px 24px',
                    background: '#FFFFFF',
                    borderRadius: 16,
                    border: '1px solid #F2F3F5',
                  }}
                >
                  <Empty
                    description={
                      buildWorkspace.selectedDeployPlanID
                        ? '当前部署计划还没有构建记录'
                        : '当前业务单元还没有构建记录'
                    }
                  />
                </div>
              )}
            </>
          ) : null}
          {tab === 'release' &&
            releases.map((release) => (
              <ReleaseCard key={release.id} release={release} stages={releaseStages[release.id] ?? []} />
            ))}
        </Space>
      </BasePage>

      <TriggerBuildModal
        open={showBuild}
        onClose={() => setShowBuild(false)}
        businessUnitOptions={buildWorkspace.businessUnitOptions}
        deployPlanOptions={modalDeployPlanOptions}
        businessUnitID={modalBusinessUnitID}
        deployPlanID={modalDeployPlanID}
        optionLoading={buildWorkspace.optionLoading || modalOptionLoading}
        submitting={buildWorkspace.triggering}
        onBusinessUnitChange={setModalBusinessUnitID}
        onDeployPlanChange={setModalDeployPlanID}
        onSubmit={async (payload) => {
          buildWorkspace.setSelectedBusinessUnitID(modalBusinessUnitID);
          buildWorkspace.setSelectedDeployPlanID(payload.deployPlanID);
          await buildWorkspace.submitTrigger(payload);
        }}
      />
      <ExecuteReleaseModal open={showRelease} onClose={() => setShowRelease(false)} />
    </>
  );
}
