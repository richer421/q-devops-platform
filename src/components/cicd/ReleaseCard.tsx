import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  RefreshCw,
  RotateCcw,
  Tag,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PodEntry, PodPhase, Release, ReleaseStage, RolloutData } from '../../data';
import { getEnvMeta, getReleaseStatusMeta } from '../../lib/status';

type ReleaseCardProps = {
  release: Release;
  stages: ReleaseStage[];
};

const releaseBorderColor: Record<Release['status'], string> = {
  success: '#00B42A',
  failed: '#F53F3F',
  deploying: '#1664FF',
  rolled_back: '#FF7D00',
};

const podPhaseStyle: Record<
  PodPhase,
  { color: string; bg: string; border: string; label: string; pulse: boolean }
> = {
  Running: {
    color: '#00B42A',
    bg: '#E8FFEA',
    border: '#b7f0c2',
    label: 'Running',
    pulse: false,
  },
  Terminating: {
    color: '#FF7D00',
    bg: '#FFF7E8',
    border: '#ffd591',
    label: 'Terminating',
    pulse: true,
  },
  ContainerCreating: {
    color: '#1664FF',
    bg: '#E8F3FF',
    border: '#91caff',
    label: 'ContainerCreating',
    pulse: true,
  },
  Pending: {
    color: '#86909C',
    bg: '#F2F3F5',
    border: '#E5E6EB',
    label: 'Pending',
    pulse: false,
  },
};

function StageIcon({ status }: { status: ReleaseStage['status'] }) {
  if (status === 'success') {
    return <CheckCircle2 size={15} className="text-[#00B42A]" />;
  }

  if (status === 'failed') {
    return <XCircle size={15} className="text-[#F53F3F]" />;
  }

  if (status === 'running') {
    return <RefreshCw size={15} className="animate-spin text-[#1664FF]" />;
  }

  return <Circle size={15} className="text-[#C9CDD4]" />;
}

function ElapsedTimer({ running }: { running: boolean }) {
  const [seconds, setSeconds] = useState(182);

  useEffect(() => {
    if (!running) {
      return;
    }

    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  if (!running) {
    return null;
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return (
    <span className="flex items-center gap-1 text-[#1664FF]" style={{ fontSize: 12 }}>
      <Clock size={11} />
      {minutes}m {String(remaining).padStart(2, '0')}s
    </span>
  );
}

function ReleaseStatusBadge({ status }: { status: Release['status'] }) {
  const meta = getReleaseStatusMeta(status);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{ fontSize: 11, fontWeight: 500, background: meta.bg, color: meta.text }}
    >
      <div
        className={`h-1.5 w-1.5 rounded-full ${status === 'deploying' ? 'animate-pulse bg-[#1664FF]' : ''}`}
        style={
          status === 'success'
            ? { background: '#00B42A' }
            : status === 'failed'
              ? { background: '#F53F3F' }
              : status === 'rolled_back'
                ? { background: '#FF7D00' }
                : undefined
        }
      />
      {meta.label}
    </span>
  );
}

function PodSquare({ pod }: { pod: PodEntry }) {
  const phase = podPhaseStyle[pod.phase];
  const suffix = pod.name.split('-').slice(-1)[0];

  return (
    <div className="group relative flex-shrink-0">
      <div
        className={`h-5 w-5 rounded transition-all duration-700 ${phase.pulse ? 'animate-pulse' : ''}`}
        style={{
          background: pod.phase === 'Terminating' ? `${phase.color}55` : `${phase.color}BB`,
          border: `1.5px solid ${phase.color}`,
          opacity: pod.phase === 'Pending' ? 0.35 : 1,
        }}
      />
      <div
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 rounded-md bg-[#1D2129] px-2 py-1 text-[11px] shadow-lg group-hover:block"
      >
        <span className="font-mono text-[#C9D1D9]">{suffix}</span>
        <span className="ml-2 font-semibold" style={{ color: phase.color }}>
          {phase.label}
        </span>
      </div>
    </div>
  );
}

function PodStatusLegend({ pods }: { pods: PodEntry[] }) {
  const order: PodPhase[] = ['Running', 'ContainerCreating', 'Terminating', 'Pending'];
  const counts = pods.reduce<Partial<Record<PodPhase, number>>>((acc, pod) => {
    acc[pod.phase] = (acc[pod.phase] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mt-2 flex flex-wrap gap-3">
      {order
        .filter((phase) => counts[phase])
        .map((phase) => {
          const meta = podPhaseStyle[phase];

          return (
            <span key={phase} className="flex items-center gap-1" style={{ fontSize: 11 }}>
              <div
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: `${meta.color}BB`, border: `1.5px solid ${meta.color}` }}
              />
              <span style={{ color: meta.color, fontWeight: 600 }}>{counts[phase]}</span>
              <span className="text-[#86909C]">{meta.label}</span>
            </span>
          );
        })}
    </div>
  );
}

function PodGrid({ pods }: { pods: PodEntry[] }) {
  const order: PodPhase[] = ['Running', 'ContainerCreating', 'Pending', 'Terminating'];
  const sorted = [...pods].sort((left, right) => order.indexOf(left.phase) - order.indexOf(right.phase));

  return (
    <div className="flex flex-wrap gap-1">
      {sorted.map((pod) => (
        <PodSquare key={pod.id} pod={pod} />
      ))}
    </div>
  );
}

function PodReadiness({ total, initial }: { total: number; initial: number }) {
  const [ready, setReady] = useState(initial);

  useEffect(() => {
    if (ready >= total) {
      return;
    }

    const timer = window.setTimeout(() => setReady((value) => Math.min(value + 1, total)), 3000);
    return () => window.clearTimeout(timer);
  }, [ready, total]);

  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={`pod-${index}`}
          className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${
            index < ready ? 'bg-[#00B42A]' : 'animate-pulse bg-[#E5E6EB]'
          }`}
        />
      ))}
      <span className="text-[#4E5969]" style={{ fontSize: 12 }}>
        {ready}/{total} Pods Ready
      </span>
    </div>
  );
}

function PodRollout({ data }: { data: RolloutData }) {
  const [pods, setPods] = useState<PodEntry[]>(data.pods);

  useEffect(() => {
    if (!data.animate) {
      return;
    }

    const timer1 = window.setTimeout(() => {
      setPods((prev) =>
        prev.map((pod) =>
          pod.phase === 'ContainerCreating' ? { ...pod, phase: 'Running' as PodPhase } : pod,
        ),
      );
    }, 3000);
    const timer2 = window.setTimeout(() => {
      let updated = false;
      setPods((prev) =>
        prev.map((pod) => {
          if (!updated && pod.version === 'old' && pod.phase === 'Running') {
            updated = true;
            return { ...pod, phase: 'Terminating' as PodPhase };
          }
          return pod;
        }),
      );
    }, 5500);
    const timer3 = window.setTimeout(() => {
      setPods((prev) => prev.filter((pod) => pod.phase !== 'Terminating'));
    }, 9000);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      window.clearTimeout(timer3);
    };
  }, [data.animate]);

  if (data.type === 'canary') {
    const stablePods = pods.filter((pod) => pod.version === 'old');
    const canaryPods = pods.filter((pod) => pod.version === 'new');
    const weight = data.canaryWeight ?? 0;

    return (
      <div className="space-y-4 rounded-xl border border-[#E5E6EB] bg-[#FAFAFA] p-4">
        <div>
          <div className="mb-1.5 flex justify-between" style={{ fontSize: 11 }}>
            <span className="text-[#86909C]">
              Stable <span style={{ fontWeight: 600, color: '#4E5969' }}>{100 - weight}%</span>
            </span>
            <span className="text-[#86909C]">
              Canary <span style={{ fontWeight: 600, color: '#7B61FF' }}>{weight}%</span>
            </span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-[#E5E6EB]">
            <div className="transition-all duration-700" style={{ width: `${100 - weight}%`, background: '#4E5969' }} />
            <div className="transition-all duration-700" style={{ width: `${weight}%`, background: '#7B61FF' }} />
          </div>
        </div>

        {data.metrics && (
          <div className="flex gap-6" style={{ fontSize: 12 }}>
            <span className="text-[#86909C]">
              p99 延迟 <span style={{ color: '#1D2129', fontWeight: 600 }}>{data.metrics.p99}ms</span>
            </span>
            <span className="text-[#86909C]">
              错误率{' '}
              <span
                style={{
                  color: data.metrics.errorRate < 0.1 ? '#00B42A' : '#F53F3F',
                  fontWeight: 600,
                }}
              >
                {data.metrics.errorRate.toFixed(2)}%
              </span>
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-5">
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-[#4E5969]" />
              <span className="text-[#86909C]" style={{ fontSize: 11, fontWeight: 500 }}>
                Stable · {data.oldVersion}
              </span>
              <span className="text-[#C9CDD4]" style={{ fontSize: 11 }}>
                {stablePods.length} pods
              </span>
            </div>
            <PodGrid pods={stablePods} />
            <PodStatusLegend pods={stablePods} />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-[#7B61FF]" />
              <span className="text-[#7B61FF]" style={{ fontSize: 11, fontWeight: 500 }}>
                Canary · {data.newVersion}
              </span>
              <span className="text-[#C9CDD4]" style={{ fontSize: 11 }}>
                {canaryPods.length} pods
              </span>
            </div>
            <PodGrid pods={canaryPods} />
            <PodStatusLegend pods={canaryPods} />
          </div>
        </div>
      </div>
    );
  }

  const oldPods = pods.filter((pod) => pod.version === 'old');
  const newPods = pods.filter((pod) => pod.version === 'new');
  const totalNew = data.pods.filter((pod) => pod.version === 'new').length;
  const readyNew = newPods.filter((pod) => pod.phase === 'Running').length;
  const hasOld = data.pods.some((pod) => pod.version === 'old');

  return (
    <div className="space-y-4 rounded-xl border border-[#E5E6EB] bg-[#FAFAFA] p-4">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[#86909C]" style={{ fontSize: 11 }}>
            滚动进度
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: readyNew >= totalNew ? '#00B42A' : '#1664FF',
            }}
          >
            {readyNew} / {totalNew} 就绪
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#E5E6EB]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(readyNew / totalNew) * 100}%`,
              background: readyNew >= totalNew ? '#00B42A' : '#1664FF',
            }}
          />
        </div>
      </div>

      <PodReadiness total={totalNew} initial={readyNew} />

      <div className={`grid gap-5 ${hasOld ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {hasOld && (
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-[#C9CDD4]" />
              <span className="text-[#86909C]" style={{ fontSize: 11, fontWeight: 500 }}>
                旧版本 · {data.oldVersion}
              </span>
              {oldPods.length > 0 ? (
                <span className="text-[#FF7D00]" style={{ fontSize: 11 }}>
                  {oldPods.length} 删除中
                </span>
              ) : (
                <span className="text-[#00B42A]" style={{ fontSize: 11 }}>
                  全部已移除 ✓
                </span>
              )}
            </div>
            {oldPods.length > 0 ? (
              <>
                <PodGrid pods={oldPods} />
                <PodStatusLegend pods={oldPods} />
              </>
            ) : (
              <div className="text-[#C9CDD4]" style={{ fontSize: 11 }}>
                —
              </div>
            )}
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[#1664FF]" />
            <span className="text-[#1664FF]" style={{ fontSize: 11, fontWeight: 500 }}>
              新版本 · {data.newVersion}
            </span>
            <span className="text-[#C9CDD4]" style={{ fontSize: 11 }}>
              {newPods.length} pods
            </span>
          </div>
          <PodGrid pods={newPods} />
          <PodStatusLegend pods={newPods} />
        </div>
      </div>
    </div>
  );
}

function LogPanel({ lines }: { lines: string[] }) {
  return (
    <div
      className="max-h-44 overflow-y-auto rounded-lg p-3 font-mono"
      style={{ background: '#0D1117', fontSize: 11, lineHeight: 1.7 }}
    >
      {lines.map((line, index) => (
        <div key={`${line}-${index}`} className="flex gap-2">
          <span style={{ color: '#444D56', userSelect: 'none', flexShrink: 0 }}>
            {String(index + 1).padStart(2, ' ')}
          </span>
          <span style={{ color: line.startsWith('$') ? '#79C0FF' : '#C9D1D9', whiteSpace: 'pre-wrap' }}>
            {line}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ReleaseCard({ release, stages }: ReleaseCardProps) {
  const [open, setOpen] = useState(release.status === 'deploying');
  const [activeStage, setActiveStage] = useState<number | null>(
    release.status === 'deploying' ? 2 : null,
  );
  const env = getEnvMeta(release.env);

  return (
    <div
      className="overflow-hidden rounded-xl border border-[#E5E6EB] bg-white"
      style={{ borderLeft: `3px solid ${releaseBorderColor[release.status]}` }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[#FAFAFA]"
      >
        <div className="mt-0.5 flex-shrink-0">
          <StageIcon status={release.status === 'deploying' ? 'running' : release.status === 'rolled_back' ? 'failed' : release.status} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="text-[#1D2129]" style={{ fontSize: 14, fontWeight: 600 }}>
              {release.buName}
            </span>
            <span style={{ color: '#C9CDD4' }}>→</span>
            <span
              className="inline-flex rounded-full px-2 py-0.5"
              style={{ fontSize: 11, fontWeight: 600, background: env.bg, color: env.text }}
            >
              {release.env.toUpperCase()}
            </span>
            <ReleaseStatusBadge status={release.status} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <Tag size={10} className="text-[#86909C]" />
              <code className="text-[#4E5969]" style={{ fontSize: 12 }}>
                {release.version}
              </code>
            </div>
            <span className="text-[#86909C]" style={{ fontSize: 12 }}>
              产物{' '}
              <code
                className="rounded bg-[#F2F3F5] px-1.5 py-0.5 text-[#86909C]"
                style={{ fontSize: 11 }}
              >
                {release.artifactId}
              </code>
            </span>
            <span
              className="rounded px-2 py-0.5"
              style={{ fontSize: 11, fontWeight: 500, background: '#E8F3FF', color: '#1664FF' }}
            >
              {release.releaseMode}
            </span>
            <span className="text-[#C9CDD4]" style={{ fontSize: 12 }}>
              #{release.id}
            </span>
          </div>
        </div>

        <div className="mt-0.5 flex flex-shrink-0 items-center gap-3">
          {release.status === 'deploying' ? (
            <ElapsedTimer running />
          ) : (
            <span className="text-[#86909C]" style={{ fontSize: 12 }}>
              {release.startTime}
            </span>
          )}
          {(release.status === 'success' || release.status === 'failed') && (
            <span
              className="flex items-center gap-1 rounded-lg border border-[#E5E6EB] px-2.5 py-1 text-[#FF7D00]"
              style={{ fontSize: 12 }}
            >
              <RotateCcw size={11} />
              回滚
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-[#86909C] transition-transform ${open ? '' : '-rotate-90'}`}
          />
        </div>
      </button>

      {open && stages.length > 0 && (
        <div className="border-t border-[#F2F3F5]">
          <div className="space-y-0.5 px-5 py-3">
            {stages.map((stage, index) => {
              const hasDetail = Boolean(stage.log?.length || stage.rollout);
              const stageOpen = activeStage === index;

              return (
                <div key={`${release.id}-${stage.name}`}>
                  <button
                    type="button"
                    onClick={() => hasDetail && setActiveStage(stageOpen ? null : index)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      stageOpen ? 'bg-[#F2F3F5]' : hasDetail ? 'hover:bg-[#FAFAFA]' : ''
                    }`}
                  >
                    <StageIcon status={stage.status} />
                    <span
                      style={{
                        fontSize: 13,
                        color:
                          stage.status === 'pending' || stage.status === 'skipped'
                            ? '#C9CDD4'
                            : '#1D2129',
                        fontWeight: stage.status === 'running' ? 500 : 400,
                      }}
                    >
                      {stage.name}
                    </span>
                    <div className="flex-1" />
                    {stage.duration && (
                      <span className="text-[#86909C]" style={{ fontSize: 12 }}>
                        {stage.duration}
                      </span>
                    )}
                    {stage.status === 'running' && <ElapsedTimer running />}
                    {hasDetail && (
                      <ChevronDown
                        size={11}
                        className={`text-[#C9CDD4] transition-transform ${stageOpen ? '' : '-rotate-90'}`}
                      />
                    )}
                  </button>

                  {stageOpen && (
                    <div className="mx-3 mb-2">
                      {stage.rollout ? <PodRollout data={stage.rollout} /> : stage.log && <LogPanel lines={stage.log} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
