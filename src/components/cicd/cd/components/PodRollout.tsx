import { Tooltip, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { PodEntry, PodPhase, RolloutData } from '@/mock';

const { Text } = Typography;

type PodPhaseStyle = {
  color: string;
  label: string;
  pulse: boolean;
};

const POD_PHASE_STYLE: Record<PodPhase, PodPhaseStyle> = {
  Running: { color: '#00B42A', label: 'Running', pulse: false },
  Terminating: { color: '#FF7D00', label: 'Terminating', pulse: true },
  ContainerCreating: { color: '#1664FF', label: 'ContainerCreating', pulse: true },
  Pending: { color: '#86909C', label: 'Pending', pulse: false },
};

const POD_ORDER_INDEX: Record<PodPhase, number> = {
  Running: 0,
  ContainerCreating: 1,
  Pending: 2,
  Terminating: 3,
};

const STYLES = {
  card: {
    borderRadius: 12,
    border: '1px solid #E5E6EB',
    background: '#FAFAFA',
    padding: 16,
  },
  podSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    transition: 'all 0.7s',
    cursor: 'default',
  },
  legendRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  podGrid: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  canaryWeightRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 6,
    fontSize: 11,
  },
  trafficTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    display: 'flex',
    background: '#E5E6EB',
  },
  metricsRow: { display: 'flex', gap: 24, marginTop: 16, fontSize: 12 },
  columnsTwo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 },
  sectionTitleRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: '50%' },
  lightText11: { fontSize: 11, color: '#C9CDD4' },
  progressHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', background: '#E5E6EB' },
  progressFill: { height: '100%', borderRadius: 3, transition: 'width 0.7s' },
} as const;

function PodSquare({ pod }: { pod: PodEntry }) {
  const style = POD_PHASE_STYLE[pod.phase];
  const suffix = pod.name.split('-').slice(-1)[0] ?? pod.name;

  return (
    <Tooltip
      title={
        <>
          <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{suffix}</span>
          <span style={{ color: style.color, fontWeight: 600, marginLeft: 4 }}>{style.label}</span>
        </>
      }
    >
      <div
        style={{
          ...STYLES.podSquare,
          background: pod.phase === 'Terminating' ? `${style.color}55` : `${style.color}BB`,
          border: `1.5px solid ${style.color}`,
          opacity: pod.phase === 'Pending' ? 0.35 : 1,
          animation: style.pulse ? 'cicdPulse 1.2s ease-in-out infinite' : undefined,
        }}
      />
    </Tooltip>
  );
}

function PodStatusLegend({ pods }: { pods: PodEntry[] }) {
  const order: PodPhase[] = ['Running', 'ContainerCreating', 'Terminating', 'Pending'];
  const counts = pods.reduce<Partial<Record<PodPhase, number>>>((acc, pod) => {
    acc[pod.phase] = (acc[pod.phase] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={STYLES.legendRow}>
      {order
        .filter((phase) => counts[phase])
        .map((phase) => {
          const style = POD_PHASE_STYLE[phase];
          return (
            <span key={phase} style={STYLES.legendItem}>
              <div
                style={{
                  ...STYLES.legendDot,
                  background: `${style.color}BB`,
                  border: `1.5px solid ${style.color}`,
                }}
              />
              <span style={{ color: style.color, fontWeight: 600 }}>{counts[phase]}</span>
              <span style={{ color: '#86909C' }}>{style.label}</span>
            </span>
          );
        })}
    </div>
  );
}

function PodGrid({ pods }: { pods: PodEntry[] }) {
  const sorted = useMemo(
    () => [...pods].sort((a, b) => POD_ORDER_INDEX[a.phase] - POD_ORDER_INDEX[b.phase]),
    [pods],
  );

  return (
    <div style={STYLES.podGrid}>
      {sorted.map((pod) => (
        <PodSquare key={pod.id} pod={pod} />
      ))}
    </div>
  );
}

export function PodRollout({ data }: { data: RolloutData }) {
  const [pods, setPods] = useState<PodEntry[]>(data.pods);

  useEffect(() => {
    if (!data.animate) {
      setPods(data.pods);
      return;
    }

    setPods(data.pods);
    const timer1 = window.setTimeout(() => {
      setPods((prev) =>
        prev.map((pod) =>
          pod.phase === 'ContainerCreating' ? { ...pod, phase: 'Running' as PodPhase } : pod,
        ),
      );
    }, 3000);

    const timer2 = window.setTimeout(() => {
      let switched = false;
      setPods((prev) =>
        prev.map((pod) => {
          if (!switched && pod.version === 'old' && pod.phase === 'Running') {
            switched = true;
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
  }, [data]);

  const oldPods = pods.filter((pod) => pod.version === 'old');
  const newPods = pods.filter((pod) => pod.version === 'new');

  if (data.type === 'canary') {
    const weight = data.canaryWeight ?? 0;
    const stable = pods.filter((pod) => pod.version === 'old');
    const canary = pods.filter((pod) => pod.version === 'new');

    return (
      <div style={STYLES.card}>
        <div>
          <div style={STYLES.canaryWeightRow}>
            <span style={{ color: '#86909C' }}>
              Stable <span style={{ fontWeight: 600, color: '#4E5969' }}>{100 - weight}%</span>
            </span>
            <span style={{ color: '#86909C' }}>
              Canary <span style={{ fontWeight: 600, color: '#7B61FF' }}>{weight}%</span>
            </span>
          </div>
          <div style={STYLES.trafficTrack}>
            <div
              style={{
                height: '100%',
                width: `${100 - weight}%`,
                background: '#4E5969',
                transition: 'width 0.7s',
              }}
            />
            <div
              style={{
                height: '100%',
                width: `${weight}%`,
                background: '#7B61FF',
                transition: 'width 0.7s',
              }}
            />
          </div>
        </div>

        {data.metrics && (
          <div style={STYLES.metricsRow}>
            <span style={{ color: '#86909C' }}>
              p99 延迟 <span style={{ color: '#1D2129', fontWeight: 600 }}>{data.metrics.p99}ms</span>
            </span>
            <span style={{ color: '#86909C' }}>
              错误率{' '}
              <span
                style={{ color: data.metrics.errorRate < 0.1 ? '#00B42A' : '#F53F3F', fontWeight: 600 }}
              >
                {data.metrics.errorRate.toFixed(2)}%
              </span>
            </span>
          </div>
        )}

        <div style={STYLES.columnsTwo}>
          <div>
            <div style={STYLES.sectionTitleRow}>
              <div style={{ ...STYLES.sectionDot, background: '#4E5969' }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: '#86909C' }}>Stable · {data.oldVersion}</span>
              <span style={STYLES.lightText11}>{stable.length} pods</span>
            </div>
            <PodGrid pods={stable} />
            <PodStatusLegend pods={stable} />
          </div>

          <div>
            <div style={STYLES.sectionTitleRow}>
              <div style={{ ...STYLES.sectionDot, background: '#7B61FF' }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: '#7B61FF' }}>Canary · {data.newVersion}</span>
              <span style={STYLES.lightText11}>{canary.length} pods</span>
            </div>
            <PodGrid pods={canary} />
            <PodStatusLegend pods={canary} />
          </div>
        </div>
      </div>
    );
  }

  const readyNew = newPods.filter((pod) => pod.phase === 'Running').length;
  const totalNew = data.pods.filter((pod) => pod.version === 'new').length;
  const hadOld = data.pods.some((pod) => pod.version === 'old');
  const rolloutProgress = totalNew > 0 ? (readyNew / totalNew) * 100 : 0;

  return (
    <div style={STYLES.card}>
      <div>
        <div style={STYLES.progressHead}>
          <span style={{ fontSize: 11, color: '#86909C' }}>滚动进度</span>
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
        <div style={STYLES.progressTrack}>
          <div
            style={{
              ...STYLES.progressFill,
              width: `${rolloutProgress}%`,
              background: readyNew >= totalNew ? '#00B42A' : '#1664FF',
            }}
          />
        </div>
      </div>

      <div
        style={{
          ...STYLES.columnsTwo,
          gridTemplateColumns: hadOld ? '1fr 1fr' : '1fr',
        }}
      >
        {hadOld && (
          <div>
            <div style={STYLES.sectionTitleRow}>
              <div style={{ ...STYLES.sectionDot, background: '#C9CDD4' }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: '#86909C' }}>旧版本 · {data.oldVersion}</span>
              {oldPods.length > 0 ? (
                <span style={{ fontSize: 11, color: '#FF7D00' }}>{oldPods.length} 删除中</span>
              ) : (
                <span style={{ fontSize: 11, color: '#00B42A' }}>全部已移除 ✓</span>
              )}
            </div>
            {oldPods.length > 0 ? (
              <>
                <PodGrid pods={oldPods} />
                <PodStatusLegend pods={oldPods} />
              </>
            ) : (
              <Text type="secondary" style={{ fontSize: 11 }}>
                —
              </Text>
            )}
          </div>
        )}

        <div>
          <div style={STYLES.sectionTitleRow}>
            <div style={{ ...STYLES.sectionDot, background: '#1664FF' }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: '#1664FF' }}>新版本 · {data.newVersion}</span>
            <span style={STYLES.lightText11}>{newPods.length} pods</span>
          </div>
          <PodGrid pods={newPods} />
          <PodStatusLegend pods={newPods} />
        </div>
      </div>
    </div>
  );
}
