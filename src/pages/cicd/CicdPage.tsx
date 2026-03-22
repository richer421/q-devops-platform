import { PlayCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Empty, Select, Spin, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState, type UIEvent } from 'react';
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
import { listBusinessUnits } from '../../lib/metahub-business-unit';
import { listBusinessUnitDeployPlans } from '../../lib/metahub-deploy-plan';
import { releaseStages, releases } from '../../mock';
import {
  usePagedSelectOptions,
  type SelectOption,
} from './usePagedSelectOptions';
import { useBuildWorkspace } from './useBuildWorkspace';

type TabKey = 'ci' | 'release';

const { Text } = Typography;

function isNearPopupBottom(event: UIEvent<HTMLDivElement>) {
  const target = event.currentTarget;
  return target.scrollHeight - target.scrollTop - target.clientHeight < 24;
}

function withSelectedOption(
  options: ReadonlyArray<SelectOption>,
  selectedID?: number,
  selectedLabel?: string,
) {
  if (!selectedID || !selectedLabel?.trim()) {
    return [...options];
  }

  if (options.some((item) => item.value === selectedID)) {
    return [...options];
  }

  return [{ value: selectedID, label: selectedLabel }, ...options];
}

export function CicdPage() {
  const [tab, setTab] = useState<TabKey>('ci');
  const [showBuild, setShowBuild] = useState(false);
  const [showRelease, setShowRelease] = useState(false);
  const buildWorkspace = useBuildWorkspace();
  const [modalBusinessUnitID, setModalBusinessUnitID] = useState<number>();
  const [modalDeployPlanID, setModalDeployPlanID] = useState<number>();
  const modalBusinessUnitIDRef = useRef<number | undefined>(undefined);
  const buildListLoadMoreRef = useRef<HTMLDivElement | null>(null);

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
  }, [
    buildWorkspace.selectedBusinessUnitID,
    buildWorkspace.selectedDeployPlanID,
    showBuild,
  ]);

  useEffect(() => {
    modalBusinessUnitIDRef.current = modalBusinessUnitID;
  }, [modalBusinessUnitID]);

  const modalBusinessUnitOptionsSource = usePagedSelectOptions({
    enabled: showBuild,
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

  const modalDeployPlanOptionsSource = usePagedSelectOptions({
    enabled: showBuild && Boolean(modalBusinessUnitID),
    errorMessage: '部署计划加载失败',
    loadPage: async ({ page, pageSize, keyword }) => {
      if (!modalBusinessUnitIDRef.current) {
        return { items: [], total: 0 };
      }

      const result = await listBusinessUnitDeployPlans(
        modalBusinessUnitIDRef.current,
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

  const modalBusinessUnitOptions = useMemo(
    () =>
      withSelectedOption(
        modalBusinessUnitOptionsSource.options,
        modalBusinessUnitID,
        modalBusinessUnitID === buildWorkspace.selectedBusinessUnitID
          ? buildWorkspace.selectedBusinessUnitLabel
          : '',
      ),
    [
      buildWorkspace.selectedBusinessUnitID,
      buildWorkspace.selectedBusinessUnitLabel,
      modalBusinessUnitID,
      modalBusinessUnitOptionsSource.options,
    ],
  );

  const modalDeployPlanOptions = useMemo(
    () =>
      withSelectedOption(
        modalDeployPlanOptionsSource.options,
        modalDeployPlanID,
        modalBusinessUnitID === buildWorkspace.selectedBusinessUnitID &&
          modalDeployPlanID === buildWorkspace.selectedDeployPlanID
          ? buildWorkspace.selectedDeployPlanLabel
          : '',
      ),
    [
      buildWorkspace.selectedBusinessUnitID,
      buildWorkspace.selectedDeployPlanID,
      buildWorkspace.selectedDeployPlanLabel,
      modalBusinessUnitID,
      modalDeployPlanID,
      modalDeployPlanOptionsSource.options,
    ],
  );

  useEffect(() => {
    if (!showBuild || !modalBusinessUnitID) {
      setModalDeployPlanID(undefined);
      return;
    }

    const hasMatchedOption = modalDeployPlanOptionsSource.options.some(
      (item) => item.value === modalDeployPlanID,
    );

    if (!hasMatchedOption) {
      setModalDeployPlanID(undefined);
    }
  }, [
    modalBusinessUnitID,
    modalDeployPlanID,
    modalDeployPlanOptionsSource.options,
    showBuild,
  ]);

  useEffect(() => {
    if (
      tab !== 'ci' ||
      buildWorkspace.loading ||
      buildWorkspace.loadingMoreBuilds ||
      !buildWorkspace.hasMoreBuilds ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    const sentinel = buildListLoadMoreRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          buildWorkspace.loadMoreBuilds();
        }
      },
      {
        root: null,
        rootMargin: '0px 0px 240px 0px',
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [
    buildWorkspace.hasMoreBuilds,
    buildWorkspace.loading,
    buildWorkspace.loadingMoreBuilds,
    buildWorkspace.loadMoreBuilds,
    tab,
  ]);

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
              onClick={() => setShowBuild(true)}
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
          {tab === 'ci' ? (
            <div
              style={{
                display: 'flex',
                flex: 1,
                minHeight: 0,
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <ConfigProvider
                theme={{
                  token: {
                    borderRadius: 4,
                  },
                  components: {
                    Button: {
                      borderRadius: 4,
                    },
                  },
                }}
              >
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
                  <div style={{ display: 'grid' }}>
                    <Select
                      data-testid="build-filter-business-unit"
                      value={buildWorkspace.selectedBusinessUnitID}
                      options={buildWorkspace.businessUnitOptions}
                      loading={buildWorkspace.businessUnitOptionLoading}
                      placeholder="请选择业务单元"
                      showSearch
                      filterOption={false}
                      onSearch={buildWorkspace.searchBusinessUnits}
                      onPopupScroll={(event) => {
                        if (isNearPopupBottom(event)) {
                          buildWorkspace.loadMoreBusinessUnits();
                        }
                      }}
                      onChange={(value) =>
                        buildWorkspace.setSelectedBusinessUnitID(value)
                      }
                    />
                  </div>
                  <div style={{ display: 'grid' }}>
                    <Select
                      data-testid="build-filter-deploy-plan"
                      allowClear
                      disabled={!buildWorkspace.selectedBusinessUnitID}
                      value={buildWorkspace.selectedDeployPlanID}
                      options={buildWorkspace.deployPlanOptions}
                      loading={buildWorkspace.deployPlanOptionLoading}
                      placeholder="按部署计划筛选"
                      showSearch
                      filterOption={false}
                      onSearch={buildWorkspace.searchDeployPlans}
                      onPopupScroll={(event) => {
                        if (isNearPopupBottom(event)) {
                          buildWorkspace.loadMoreDeployPlans();
                        }
                      }}
                      onChange={(value) =>
                        buildWorkspace.setSelectedDeployPlanID(value)
                      }
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
                    <Button onClick={buildWorkspace.refreshBuilds}>
                      刷新列表
                    </Button>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      共 {buildWorkspace.buildTotal} 条
                    </Text>
                  </div>
                </div>
              </ConfigProvider>

              <div
                data-testid="build-list-scroll-container"
                style={{
                  display: 'grid',
                  gap: 16,
                  flex: 1,
                  minHeight: 0,
                  overflow: 'auto',
                  paddingRight: 4,
                }}
              >
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
                  <>
                    {buildWorkspace.builds.map((build) => (
                      <BuildCard key={build.id} build={build} />
                    ))}
                    <div
                      ref={buildListLoadMoreRef}
                      data-testid="build-list-load-more-sentinel"
                      style={{ height: 1 }}
                    />
                    {buildWorkspace.loadingMoreBuilds ? (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          padding: '4px 0 16px',
                        }}
                      >
                        <Spin size="small" />
                      </div>
                    ) : null}
                  </>
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
                          : buildWorkspace.selectedBusinessUnitID
                            ? '当前业务单元还没有构建记录'
                            : '当前还没有构建记录'
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          ) : null}
          {tab === 'release' &&
            releases.map((release) => (
              <ReleaseCard
                key={release.id}
                release={release}
                stages={releaseStages[release.id] ?? []}
              />
            ))}
        </div>
      </BasePage>

      <TriggerBuildModal
        open={showBuild}
        onClose={() => setShowBuild(false)}
        businessUnitOptions={modalBusinessUnitOptions}
        deployPlanOptions={modalDeployPlanOptions}
        businessUnitID={modalBusinessUnitID}
        deployPlanID={modalDeployPlanID}
        businessUnitOptionLoading={modalBusinessUnitOptionsSource.loading}
        deployPlanOptionLoading={modalDeployPlanOptionsSource.loading}
        submitting={buildWorkspace.triggering}
        onBusinessUnitChange={(value) => {
          modalBusinessUnitIDRef.current = value;
          setModalBusinessUnitID(value);
          setModalDeployPlanID(undefined);
          modalBusinessUnitOptionsSource.search('');
          modalDeployPlanOptionsSource.reset();
        }}
        onDeployPlanChange={setModalDeployPlanID}
        onBusinessUnitSearch={modalBusinessUnitOptionsSource.search}
        onDeployPlanSearch={modalDeployPlanOptionsSource.search}
        onBusinessUnitLoadMore={modalBusinessUnitOptionsSource.loadMore}
        onDeployPlanLoadMore={modalDeployPlanOptionsSource.loadMore}
        onSubmit={async (payload) => {
          buildWorkspace.setSelectedBusinessUnitID(modalBusinessUnitID);
          buildWorkspace.setSelectedDeployPlanID(payload.deployPlanID);
          await buildWorkspace.submitTrigger(payload);
        }}
      />
      <ExecuteReleaseModal
        open={showRelease}
        onClose={() => setShowRelease(false)}
      />
    </>
  );
}
