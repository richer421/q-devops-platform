import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  MinusCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import type { BuildStep } from '../../mock';

export type StepStatus = BuildStep['status'];

const AVATAR_COLORS: Record<string, string> = {
  zhangwei: '#1664FF',
  liuyang: '#7B61FF',
  chenxi: '#00B42A',
};

export function CicdAnimationStyles() {
  return (
    <style>
      {'@keyframes cicdPulse {0%{opacity:.35}50%{opacity:1}100%{opacity:.35}}'}
    </style>
  );
}

export function Avatar({ name }: { name: string }) {
  const color = AVATAR_COLORS[name] ?? '#86909C';
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${color}22`,
        border: `1px solid ${color}44`,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 700, color }}>{name[0]?.toUpperCase()}</span>
    </div>
  );
}

export function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'success') {
    return <CheckCircleFilled style={{ color: '#00B42A', fontSize: 14 }} />;
  }
  if (status === 'failed') {
    return <CloseCircleFilled style={{ color: '#F53F3F', fontSize: 14 }} />;
  }
  if (status === 'running') {
    return <SyncOutlined spin style={{ color: '#1664FF', fontSize: 14 }} />;
  }
  return <MinusCircleOutlined style={{ color: '#C9CDD4', fontSize: 14 }} />;
}

export function TerminalLog({ lines, animate }: { lines: string[]; animate: boolean }) {
  const [visible, setVisible] = useState(animate ? 0 : lines.length);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!animate) {
      setVisible(lines.length);
      return;
    }

    setVisible(0);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisible(index);
      if (index >= lines.length) {
        window.clearInterval(timer);
      }
    }, 120);

    return () => window.clearInterval(timer);
  }, [animate, lines]);

  useEffect(() => {
    if (bottomRef.current && typeof bottomRef.current.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [visible]);

  return (
    <div
      style={{
        background: '#0D1117',
        borderRadius: 8,
        padding: 12,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
        lineHeight: 1.7,
        maxHeight: 176,
        overflowY: 'auto',
      }}
    >
      {lines.slice(0, visible).map((line, index) => {
        const color =
          line.startsWith('✘') || line.includes('error') || line.includes('Error')
            ? '#FF6B6B'
            : line.startsWith('$')
              ? '#79C0FF'
              : line.startsWith('>')
                ? '#FFA657'
                : line.startsWith('Successfully')
                  ? '#56D364'
                  : '#C9D1D9';

        return (
          <div key={`${line}-${index}`} style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: '#444D56', userSelect: 'none', flexShrink: 0 }}>
              {String(index + 1).padStart(2, ' ')}
            </span>
            <span style={{ color, whiteSpace: 'pre-wrap' }}>{line}</span>
          </div>
        );
      })}

      {animate && visible < lines.length && (
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: '#444D56' }}> </span>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 12,
              background: '#58A6FF',
              animation: 'cicdPulse 1.1s ease-in-out infinite',
            }}
          />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

export function ElapsedTimer({ running }: { running: boolean }) {
  const [secs, setSecs] = useState(182);

  useEffect(() => {
    if (!running) {
      return;
    }
    const timer = window.setInterval(() => setSecs((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  if (!running) {
    return null;
  }

  const minutes = Math.floor(secs / 60);
  const seconds = secs % 60;

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1664FF', fontSize: 12 }}>
      <ClockCircleOutlined style={{ fontSize: 11 }} />
      {minutes}m {String(seconds).padStart(2, '0')}s
    </span>
  );
}
