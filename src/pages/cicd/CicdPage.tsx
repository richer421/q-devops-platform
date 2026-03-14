import { Hammer, Play, Rocket } from 'lucide-react';
import { useState } from 'react';
import { BuildCard } from '../../components/cicd/BuildCard';
import { ReleaseCard } from '../../components/cicd/ReleaseCard';
import { buildSteps, builds, releaseStages, releases } from '../../data';

type Tab = 'ci' | 'release';

export function CicdPage() {
  const [tab, setTab] = useState<Tab>('ci');

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-[#E5E6EB] bg-white px-6 py-4">
        <div className="mb-2 flex items-center gap-1">
          <span className="text-[#C9CDD4]" style={{ fontSize: 12 }}>
            AppDelivery
          </span>
          <span className="text-[#C9CDD4]" style={{ fontSize: 12 }}>
            /
          </span>
          <span className="text-[#86909C]" style={{ fontSize: 12 }}>
            CI&CD 工作台
          </span>
        </div>
        <h2 className="m-0 text-[#1D2129]" style={{ fontSize: 18, fontWeight: 600 }}>
          CI&CD 工作台
        </h2>
        <p className="m-0 mt-0.5 text-[#86909C]" style={{ fontSize: 13 }}>
          触发构建、执行发布并实时追踪进度
        </p>
      </div>
      <div className="border-b border-[#E5E6EB] bg-white px-6">
        <div className="flex items-center gap-1">
          {[
            { id: 'ci' as const, label: 'CI 工作台', count: builds.length, icon: <Hammer size={13} /> },
            {
              id: 'release' as const,
              label: '发布工作台',
              count: releases.length,
              icon: <Rocket size={13} />,
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`border-b-2 px-4 py-2.5 transition-colors ${
                tab === item.id
                  ? 'border-[#1664FF] text-[#1664FF]'
                  : 'border-transparent text-[#4E5969] hover:text-[#1D2129]'
              }`}
              style={{ fontSize: 13, fontWeight: tab === item.id ? 500 : 400 }}
            >
              <span className="mr-1.5 inline-flex">{item.icon}</span>
              {item.label}
              <span
                className="ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5"
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  height: 16,
                  background: tab === item.id ? '#E8F3FF' : '#F2F3F5',
                  color: tab === item.id ? '#1664FF' : '#86909C',
                }}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-[#F2F3F5] px-6 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="m-0 text-[#86909C]" style={{ fontSize: 13 }}>
            {tab === 'ci' ? `共 ${builds.length} 次构建` : `共 ${releases.length} 次发布`}
          </p>
          <button
            type="button"
            className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1664FF] px-4 text-white transition-colors hover:bg-[#0E50D3]"
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            {tab === 'ci' ? <Play size={14} /> : <Rocket size={14} />}
            {tab === 'ci' ? '触发构建' : '执行发布'}
          </button>
        </div>
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
