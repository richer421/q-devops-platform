import { Tag } from 'antd';

type Environment = 'dev' | 'test' | 'gray' | 'prod';

type EnvTagMeta = {
  label: string;
  bg: string;
  text: string;
  border: string;
};

const ENV_TAG_META: Record<Environment, EnvTagMeta> = {
  dev: { label: '开发', bg: '#F6FFED', text: '#389E0D', border: '#B7EB8F' },
  test: { label: '测试', bg: '#E6F7FF', text: '#1677FF', border: '#91CAFF' },
  gray: { label: '灰度', bg: '#F2F3F5', text: '#4E5969', border: '#D9DDE3' },
  prod: { label: '生产', bg: '#FFF1F0', text: '#CF1322', border: '#FFA39E' },
};

const DEFAULT_ENV_TAG_META: EnvTagMeta = {
  label: '未知',
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
        borderRadius: '8px',
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
