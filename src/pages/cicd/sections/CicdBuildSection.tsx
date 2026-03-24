import { Button, ConfigProvider, Empty, Select, Spin, Typography } from 'antd';
import { useEffect, useRef } from 'react';
import { BuildCard } from '../../../components/cicd/BuildCard';
import type { BuildWorkspaceView } from '../useBuildWorkspace';
import { isNearPopupBottom } from '../utils';

const { Text } = Typography;

type CicdBuildSectionProps = {
  workspace: BuildWorkspaceView;
};

export function CicdBuildSection({ workspace }: CicdBuildSectionProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadMoreBuildsRef = useRef(workspace.loadMoreBuilds);

  useEffect(() => {
    loadMoreBuildsRef.current = workspace.loadMoreBuilds;
  }, [workspace.loadMoreBuilds]);

  useEffect(() => {
    if (
      workspace.loading ||
      workspace.loadingMoreBuilds ||
      !workspace.hasMoreBuilds ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    const sentinel = loadMoreRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreBuildsRef.current();
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
  }, [workspace.hasMoreBuilds, workspace.loading, workspace.loadingMoreBuilds]);

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        flexDirection: 'column',
        gap: 2,
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
            borderRadius: 0,
          }}
        >
          <div style={{ display: 'grid' }}>
            <Select
              data-testid="build-filter-business-unit"
              value={workspace.selectedBusinessUnitID}
              options={workspace.businessUnitOptions}
              loading={workspace.businessUnitOptionLoading}
              placeholder="请选择业务单元"
              showSearch
              filterOption={false}
              onSearch={workspace.searchBusinessUnits}
              onPopupScroll={(event) => {
                if (isNearPopupBottom(event)) {
                  workspace.loadMoreBusinessUnits();
                }
              }}
              onChange={workspace.setSelectedBusinessUnitID}
            />
          </div>
          <div style={{ display: 'grid' }}>
            <Select
              data-testid="build-filter-deploy-plan"
              allowClear
              disabled={!workspace.selectedBusinessUnitID}
              value={workspace.selectedDeployPlanID}
              options={workspace.deployPlanOptions}
              loading={workspace.deployPlanOptionLoading}
              placeholder="按部署计划筛选"
              showSearch
              filterOption={false}
              onSearch={workspace.searchDeployPlans}
              onPopupScroll={(event) => {
                if (isNearPopupBottom(event)) {
                  workspace.loadMoreDeployPlans();
                }
              }}
              onChange={workspace.setSelectedDeployPlanID}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
            <Button onClick={workspace.refreshBuilds}>刷新列表</Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              共 {workspace.buildTotal} 条
            </Text>
          </div>
        </div>
      </ConfigProvider>

      <div
        data-testid="build-list-scroll-container"
        style={{
          display: 'grid',
          gap: 2,
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          paddingRight: 4,
        }}
      >
        {workspace.loading ? (
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
        ) : workspace.builds.length > 0 ? (
          <>
            {workspace.builds.map((build) => (
              <BuildCard key={build.id} build={build} />
            ))}
            <div
              ref={loadMoreRef}
              data-testid="build-list-load-more-sentinel"
              style={{ height: 1 }}
            />
            {workspace.loadingMoreBuilds ? (
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
                workspace.selectedDeployPlanID
                  ? '当前部署计划还没有构建记录'
                  : workspace.selectedBusinessUnitID
                    ? '当前业务单元还没有构建记录'
                    : '当前还没有构建记录'
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
