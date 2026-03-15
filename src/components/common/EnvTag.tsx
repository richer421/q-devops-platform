import { Tag } from 'antd';

type Environment = 'dev' | 'test' | 'gray' | 'prod';

type EnvTagMeta = {
  label: string;
  bg: string;
  text: string;
  border: string;
};

const ENV_TAG_META: Record<Environment, EnvTagMeta> = {
  dev: { label: 'DEV', bg: '#E6F7FF', text: '#1890FF', border: '#BAE7FF' },
  test: { label: 'TEST', bg: '#F6FFED', text: '#52C41A', border: '#B7EB8F' },
  gray: { label: 'GRAY', bg: '#F9F0FF', text: '#722ED1', border: '#D3ADF7' },
  prod: { label: 'PROD', bg: '#FFF2E8', text: '#FA8C16', border: '#FFD8BF' },
};

const DEFAULT_ENV_TAG_META: EnvTagMeta = {
  label: 'UNKNOWN',
  bg: '#F2F3F5',
  text: '#86909C',
  border: '#E5E6EB',
};

function resolveEnvTagMeta(env: string): EnvTagMeta {
  const normalized = env.toLowerCase() as Environment;
  return ENV_TAG_META[normalized] ?? {
    ...DEFAULT_ENV_TAG_META,
    label: env.toUpperCase(),
  };
}

type EnvTagProps = {
  env: string;
};

export function EnvTag({ env }: EnvTagProps) {
  const meta = resolveEnvTagMeta(env);

  return (
    <Tag
      style={{
        marginInlineEnd: 0,
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: '16px',
        padding: '2px 8px',
        background: meta.bg,
        color: meta.text,
        border: `1px solid ${meta.border}`,
      }}
    >
      {meta.label}
    </Tag>
  );
}
