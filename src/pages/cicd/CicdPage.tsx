import { PlayCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import { useMemo, useState } from 'react';
import { BuildCard } from '../../components/cicd/BuildCard';
import { ExecuteReleaseModal } from '../../components/cicd/ExecuteReleaseModal';
import { ReleaseCard } from '../../components/cicd/ReleaseCard';
import { TriggerBuildModal } from '../../components/cicd/TriggerBuildModal';
import { CicdAnimationStyles } from '../../components/cicd/shared';
import {
  PageHeader,
  PageHeaderTabs,
  type PageHeaderTabItem,
} from '../../components/layout/page-header';
import { buildSteps, builds, releaseStages, releases } from '../../data';

type TabKey = 'ci' | 'release';

export function CicdPage() {
  const [tab, setTab] = useState<TabKey>('ci');
  const [showBuild, setShowBuild] = useState(false);
  const [showRelease, setShowRelease] = useState(false);

  const tabItems: ReadonlyArray<PageHeaderTabItem<TabKey>> = useMemo(
    () => [
      { id: 'ci', label: 'CI 工作台', icon: <PlayCircleOutlined /> },
      { id: 'release', label: '发布工作台', icon: <RocketOutlined /> },
    ],
    [],
  );

  return (
    <Space direction="vertical" size={0} style={{ display: 'flex', height: '100%', background: '#F2F3F5' }}>
      <CicdAnimationStyles />

      <PageHeader
        breadcrumbs={[{ label: 'Q DevOps Platform' }, { label: 'CI&CD 工作台' }]}
        title="CI&CD 工作台"
        description="触发构建、执行发布并实时追踪进度"
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
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
        <Space direction="vertical" size={12} style={{ display: 'flex' }}>
          {tab === 'ci' &&
            builds.map((build) => <BuildCard key={build.id} build={build} steps={buildSteps[build.id] ?? []} />)}
          {tab === 'release' &&
            releases.map((release) => (
              <ReleaseCard key={release.id} release={release} stages={releaseStages[release.id] ?? []} />
            ))}
        </Space>
      </div>

      <TriggerBuildModal open={showBuild} onClose={() => setShowBuild(false)} />
      <ExecuteReleaseModal open={showRelease} onClose={() => setShowRelease(false)} />
    </Space>
  );
}
