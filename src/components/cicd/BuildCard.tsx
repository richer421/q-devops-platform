import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  GitBranch,
  Package,
  RefreshCw,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Build, BuildStep } from '../../data';
import { getBuildStatusMeta } from '../../lib/status';

type BuildCardProps = {
  build: Build;
  steps: BuildStep[];
};

const cardBorderColor: Record<Build['status'], string> = {
  success: '#00B42A',
  failed: '#F53F3F',
  running: '#1664FF',
};

const authorColorMap: Record<string, string> = {
  zhangwei: '#1664FF',
  liuyang: '#7B61FF',
  chenxi: '#00B42A',
};

function BuildStatusIcon({ status }: { status: Build['status'] }) {
  if (status === 'success') {
    return <CheckCircle2 size={18} className="text-[#00B42A]" />;
  }

  if (status === 'failed') {
    return <XCircle size={18} className="text-[#F53F3F]" />;
  }

  return <RefreshCw size={18} className="animate-spin text-[#1664FF]" />;
}

function StepIcon({ status }: { status: BuildStep['status'] }) {
  if (status === 'success') {
    return <CheckCircle2 size={14} className="flex-shrink-0 text-[#00B42A]" />;
  }

  if (status === 'failed') {
    return <XCircle size={14} className="flex-shrink-0 text-[#F53F3F]" />;
  }

  if (status === 'running') {
    return <RefreshCw size={14} className="flex-shrink-0 animate-spin text-[#1664FF]" />;
  }

  return <Circle size={14} className="flex-shrink-0 text-[#C9CDD4]" />;
}

function AuthorAvatar({ name }: { name: string }) {
  const color = authorColorMap[name] ?? '#86909C';

  return (
    <div
      className="flex h-5 w-5 items-center justify-center rounded-full"
      style={{ background: `${color}22`, border: `1px solid ${color}44` }}
    >
      <span style={{ fontSize: 9, fontWeight: 700, color }}>{name[0].toUpperCase()}</span>
    </div>
  );
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

function TerminalLog({ lines, animate }: { lines: string[]; animate: boolean }) {
  const [visibleCount, setVisibleCount] = useState(animate ? 0 : lines.length);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!animate) {
      setVisibleCount(lines.length);
      return;
    }

    setVisibleCount(0);
    let index = 0;

    const timer = window.setInterval(() => {
      index += 1;
      setVisibleCount(index);
      if (index >= lines.length) {
        window.clearInterval(timer);
      }
    }, 120);

    return () => window.clearInterval(timer);
  }, [animate, lines]);

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [visibleCount]);

  return (
    <div
      className="max-h-44 overflow-y-auto rounded-lg p-3 font-mono"
      style={{ background: '#0D1117', fontSize: 11, lineHeight: 1.7 }}
    >
      {lines.slice(0, visibleCount).map((line, index) => (
        <div key={`${line}-${index}`} className="flex gap-2">
          <span style={{ color: '#444D56', userSelect: 'none', flexShrink: 0 }}>
            {String(index + 1).padStart(2, ' ')}
          </span>
          <span
            style={{
              color:
                line.startsWith('✘') || line.includes('error') || line.includes('Error')
                  ? '#FF6B6B'
                  : line.startsWith('$')
                    ? '#79C0FF'
                    : line.startsWith('>')
                      ? '#FFA657'
                      : line.startsWith('Successfully')
                        ? '#56D364'
                        : '#C9D1D9',
              whiteSpace: 'pre-wrap',
            }}
          >
            {line}
          </span>
        </div>
      ))}
      {animate && visibleCount < lines.length && (
        <div className="flex gap-2">
          <span style={{ color: '#444D56' }}> </span>
          <span className="inline-block h-3 w-2 animate-pulse bg-[#58A6FF]" />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

export function BuildCard({ build, steps }: BuildCardProps) {
  const [open, setOpen] = useState(build.status === 'running');
  const [activeStep, setActiveStep] = useState<number | null>(build.status === 'running' ? 3 : null);
  const status = getBuildStatusMeta(build.status);

  return (
    <div
      className="overflow-hidden rounded-xl border border-[#E5E6EB] bg-white"
      style={{ borderLeft: `3px solid ${cardBorderColor[build.status]}` }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[#FAFAFA]"
      >
        <div className="mt-0.5 flex-shrink-0">
          <BuildStatusIcon status={build.status} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="text-[#1D2129]" style={{ fontSize: 14, fontWeight: 600 }}>
              {build.commitMsg}
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{ fontSize: 11, fontWeight: 500, background: status.bg, color: status.text }}
            >
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  build.status === 'running' ? 'animate-pulse bg-[#1664FF]' : ''
                }`}
                style={
                  build.status === 'success'
                    ? { background: '#00B42A' }
                    : build.status === 'failed'
                      ? { background: '#F53F3F' }
                      : undefined
                }
              />
              {status.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-1 rounded px-2 py-0.5"
              style={{ fontSize: 11, background: '#E8F3FF', color: '#1664FF' }}
            >
              <GitBranch size={10} />
              {build.branch}
            </span>
            <code
              className="rounded px-1.5 py-0.5 text-[#86909C]"
              style={{ fontSize: 11, background: '#F2F3F5' }}
            >
              {build.commit}
            </code>
            <div className="flex items-center gap-1 text-[#86909C]">
              <AuthorAvatar name={build.author} />
              <span style={{ fontSize: 12 }}>{build.author}</span>
            </div>
            <span className="text-[#86909C]" style={{ fontSize: 12 }}>
              {build.buName}
            </span>
            <span className="text-[#C9CDD4]" style={{ fontSize: 12 }}>
              #{build.id}
            </span>
          </div>
        </div>

        <div className="mt-0.5 flex flex-shrink-0 items-center gap-3">
          {build.status === 'running' ? (
            <ElapsedTimer running />
          ) : (
            <div className="flex items-center gap-1 text-[#86909C]" style={{ fontSize: 12 }}>
              <Clock size={11} />
              {build.duration}
            </div>
          )}
          <span className="text-[#C9CDD4]" style={{ fontSize: 12 }}>
            {build.startTime}
          </span>
          <span
            className="flex items-center gap-1 rounded-lg border border-[#E5E6EB] px-2.5 py-1 text-[#4E5969]"
            style={{ fontSize: 12 }}
          >
            <RotateCcw size={11} />
            重建
          </span>
          <ChevronDown
            size={14}
            className={`text-[#86909C] transition-transform ${open ? '' : '-rotate-90'}`}
          />
        </div>
      </button>

      {open && steps.length > 0 && (
        <div className="border-t border-[#F2F3F5]">
          <div className="space-y-0.5 px-5 py-3">
            {steps.map((step, index) => {
              const hasLog = Boolean(step.log?.length);
              const stepOpen = activeStep === index;

              return (
                <div key={step.name}>
                  <button
                    type="button"
                    onClick={() => setActiveStep(stepOpen ? null : index)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      stepOpen ? 'bg-[#F2F3F5]' : 'hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <StepIcon status={step.status} />
                    <span
                      style={{
                        fontSize: 13,
                        color:
                          step.status === 'pending' || step.status === 'skipped'
                            ? '#C9CDD4'
                            : '#1D2129',
                        fontWeight: step.status === 'running' ? 500 : 400,
                      }}
                    >
                      {step.name}
                    </span>
                    {step.status === 'skipped' && (
                      <span className="text-[#C9CDD4]" style={{ fontSize: 11 }}>
                        已跳过
                      </span>
                    )}
                    <div className="flex-1" />
                    {step.duration && (
                      <span className="text-[#86909C]" style={{ fontSize: 12 }}>
                        {step.duration}
                      </span>
                    )}
                    {step.status === 'running' && <ElapsedTimer running />}
                    {hasLog && (
                      <ChevronDown
                        size={11}
                        className={`text-[#C9CDD4] transition-transform ${stepOpen ? '' : '-rotate-90'}`}
                      />
                    )}
                  </button>

                  {stepOpen && step.log && (
                    <div className="mx-3 mb-2">
                      <TerminalLog lines={step.log} animate={step.status === 'running'} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {build.imageRef && (
            <div className="mx-5 mb-4 flex items-center gap-2 rounded-lg border border-[#E5E6EB] bg-[#F7F8FA] px-3 py-2">
              <Package size={13} className="flex-shrink-0 text-[#7B61FF]" />
              <span className="text-[#86909C]" style={{ fontSize: 12, flexShrink: 0 }}>
                构建产物
              </span>
              <code className="truncate text-[#4E5969]" style={{ fontSize: 11 }}>
                {build.imageRef}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
