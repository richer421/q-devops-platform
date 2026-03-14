import { Hammer, Play, Rocket } from 'lucide-react';
import { useState } from 'react';
import { BuildCard } from '../../components/cicd/BuildCard';
import { ReleaseCard } from '../../components/cicd/ReleaseCard';
import { PageHeader, PageHeaderTabs, type PageHeaderTabItem } from '../../components/layout/page-header';
import { buildSteps, builds, releaseStages, releases } from '../../data';

type Tab = 'ci' | 'release';

export function CicdPage() {
  const [tab, setTab] = useState<Tab>('ci');
  const tabItems: ReadonlyArray<PageHeaderTabItem<Tab>> = [
    { id: 'ci', label: 'CI 工作台', count: builds.length, icon: <Hammer size={13} /> },
    { id: 'release', label: '发布工作台', count: releases.length, icon: <Rocket size={13} /> },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        breadcrumbs={[{ label: 'Q DevOps Platform' }, { label: 'CI&CD 工作台' }]}
        title="CI&CD 工作台"
        description="统一查看构建与发布流水线，快速追踪交付状态"
        action={(
          <button
            type="button"
            className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1664FF] px-4 text-white transition-colors hover:bg-[#0E50D3]"
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            {tab === 'ci' ? <Play size={14} /> : <Rocket size={14} />}
            {tab === 'ci' ? '触发构建' : '执行发布'}
          </button>
        )}
        footer={(
          <PageHeaderTabs
            items={tabItems}
            value={tab}
            onChange={setTab}
            right={(
              <span className="text-[#86909C]" style={{ fontSize: 12 }}>
                {tab === 'ci' ? `共 ${builds.length} 次构建` : `共 ${releases.length} 次发布`}
              </span>
            )}
          />
        )}
      />
      <div className="flex-1 overflow-auto bg-[#F2F3F5] px-6 py-4">
        <div className="space-y-3">
          {tab === 'ci' &&
            builds.map((build) => (
              <BuildCard key={build.id} build={build} steps={buildSteps[build.id] ?? []} />
            ))}
          {tab === 'release' &&
            releases.map((release) => (
              <ReleaseCard
                key={release.id}
                release={release}
                stages={releaseStages[release.id] ?? []}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
