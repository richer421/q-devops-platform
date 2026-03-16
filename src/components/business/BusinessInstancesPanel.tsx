import { Alert, Button, Card, Empty, Flex, Form, Input, InputNumber, List, Modal, Select, Table, Tag, Tabs, Typography } from 'antd';
import type { TableProps } from 'antd';
import { FileText, Terminal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { parse, stringify } from 'yaml';
import type { Instance, InstancePod } from '../../mock';
import { getInstanceStatusMeta } from '../../lib/status';
import { EnvTag } from '../common/EnvTag';

type BusinessInstancesPanelProps = {
  instances: ReadonlyArray<Instance>;
};

type DetailTab = 'pods' | 'config' | 'yaml';

type InstanceDraft = {
  id: string;
  buId: string;
  name: string;
  env: string;
  type: string;
  instanceType: 'deployment' | 'statefulset' | 'job' | 'cronjob' | 'pod';
  replicas: number;
  readyReplicas: number;
  cpu: string;
  memory: string;
  cpuLimit: string;
  memoryLimit: string;
  status: Instance['status'];
  containerName: string;
  image: string;
  ports: number[];
  envVars: Array<{ name: string; value: string }>;
  configMaps: string[];
  secrets: string[];
  services: string[];
  yaml: string;
};

type ParsedYamlDocument = {
  name?: string;
  env?: string;
  instance_type?: InstanceDraft['instanceType'];
  spec?: {
    deployment?: {
      replicas?: number;
      template?: {
        spec?: {
          containers?: Array<{
            name?: string;
            image?: string;
            ports?: Array<{ containerPort?: number }>;
            env?: Array<{ name?: string; value?: string }>;
            resources?: {
              requests?: {
                cpu?: string;
                memory?: string;
              };
              limits?: {
                cpu?: string;
                memory?: string;
              };
            };
          }>;
        };
      };
    };
  };
  attach_resources?: {
    configMaps?: Record<string, unknown>;
    secrets?: Record<string, unknown>;
    services?: Record<string, unknown>;
  };
};

type PodDialogKind = 'events' | 'logs' | 'terminal' | 'yaml';

type PodDialogState = {
  kind: PodDialogKind;
  title: string;
  content: string;
} | null;

type ColumnsType<T extends object = object> = TableProps<T>['columns'];
type PaginationRow = { key: string };

type PodTableRow = {
  key: string;
  pod: InstancePod;
  restartCount: number;
};

type ContainerListRow = {
  key: string;
  name: string;
  image: string;
  isPrimary: boolean;
  status: InstancePod['containers'][number]['status'];
  restartCount: number;
  cpuLimit: string;
  memoryLimit: string;
  branch?: string;
  commit?: string;
};

const instanceTypeOptions = [
  { label: 'deployment', value: 'deployment' },
  { label: 'statefulset', value: 'statefulset' },
  { label: 'job', value: 'job' },
  { label: 'cronjob', value: 'cronjob' },
  { label: 'pod', value: 'pod' },
] as const;

const sectionGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 16,
} satisfies React.CSSProperties;

const defaultContainerLimitLookup: Record<string, { cpuLimit: string; memoryLimit: string }> = {
  'api-server': { cpuLimit: '1000m', memoryLimit: '1Gi' },
  'istio-proxy': { cpuLimit: '200m', memoryLimit: '256Mi' },
  'web-app': { cpuLimit: '1000m', memoryLimit: '1Gi' },
  'nginx-sidecar': { cpuLimit: '150m', memoryLimit: '192Mi' },
  worker: { cpuLimit: '2000m', memoryLimit: '2Gi' },
  'log-agent': { cpuLimit: '200m', memoryLimit: '256Mi' },
};

const podTableGrid = {
  name: 210,
  status: 80,
  restart: 80,
  podIP: 100,
  node: 120,
  actions: 120,
} as const;

const containerDetailGrid = {
  name: 120,
  image: 180,
  branchCommit: 140,
  cpu: 80,
  memory: 80,
  restart: 90,
  actions: 132,
  total: 822,
} as const;

function toResourceNames(values?: Record<string, unknown>) {
  return Object.keys(values ?? {});
}

function cloneDraft(draft: InstanceDraft): InstanceDraft {
  return {
    ...draft,
    ports: [...draft.ports],
    envVars: draft.envVars.map((item) => ({ ...item })),
    configMaps: [...draft.configMaps],
    secrets: [...draft.secrets],
    services: [...draft.services],
  };
}

function createNameMap(names: string[]) {
  return names.reduce<Record<string, { metadata: { name: string } }>>((accumulator, name) => {
    if (!name) {
      return accumulator;
    }

    accumulator[name] = {
      metadata: { name },
    };
    return accumulator;
  }, {});
}

function serializeDraft(draft: InstanceDraft) {
  return stringify(
    {
      name: draft.name,
      env: draft.env,
      instance_type: draft.instanceType,
      spec: {
        deployment: {
          replicas: draft.replicas,
          template: {
            spec: {
              containers: [
                {
                  name: draft.containerName,
                  image: draft.image,
                  ports: draft.ports.map((containerPort) => ({ containerPort })),
                  env: draft.envVars,
                  resources: {
                    requests: {
                      cpu: draft.cpu,
                      memory: draft.memory,
                    },
                    limits: {
                      cpu: draft.cpuLimit || undefined,
                      memory: draft.memoryLimit || undefined,
                    },
                  },
                },
              ],
            },
          },
        },
      },
      attach_resources: {
        configMaps: createNameMap(draft.configMaps),
        secrets: createNameMap(draft.secrets),
        services: createNameMap(draft.services),
      },
    },
    { lineWidth: 0 },
  ).trim();
}

function buildDraft(instance: Instance): InstanceDraft {
  const deployment = instance.spec?.deployment;
  const container = deployment?.template?.spec?.containers?.[0];
  const resources = container?.resources;

  const draft: InstanceDraft = {
    id: instance.id,
    buId: instance.buId,
    name: instance.name,
    env: instance.env,
    type: instance.type,
    instanceType: instance.instanceType ?? 'deployment',
    replicas: deployment?.replicas ?? instance.replicas,
    readyReplicas: instance.readyReplicas,
    cpu: resources?.requests?.cpu ?? instance.cpu,
    memory: resources?.requests?.memory ?? instance.memory,
    cpuLimit: resources?.limits?.cpu ?? '',
    memoryLimit: resources?.limits?.memory ?? '',
    status: instance.status,
    containerName: container?.name ?? instance.name,
    image: container?.image ?? '',
    ports: (container?.ports ?? [])
      .map((port) => port.containerPort)
      .filter((port): port is number => Number.isFinite(port)),
    envVars: (container?.env ?? []).map((item) => ({ name: item.name, value: item.value })),
    configMaps: toResourceNames(instance.attachResources?.configMaps),
    secrets: toResourceNames(instance.attachResources?.secrets),
    services: toResourceNames(instance.attachResources?.services),
    yaml: '',
  };

  return {
    ...draft,
    yaml: instance.yaml?.trim() || serializeDraft(draft),
  };
}

function parseLineValues(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringifyLineValues(values: string[]) {
  return values.join('\n');
}

function stringifyEnvVars(values: InstanceDraft['envVars']) {
  return values.map((item) => `${item.name}=${item.value}`).join('\n');
}

function parseEnvVars(value: string) {
  return parseLineValues(value).map((line) => {
    const [name, ...rest] = line.split('=');
    return {
      name: name?.trim() ?? '',
      value: rest.join('=').trim(),
    };
  });
}

function stringifyPorts(ports: number[]) {
  return ports.join(', ');
}

function parsePorts(value: string) {
  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item): item is number => Number.isFinite(item));
}

function parseDraftYaml(yaml: string, fallback: InstanceDraft): InstanceDraft {
  const document = parse(yaml) as ParsedYamlDocument | null;
  const deployment = document?.spec?.deployment;
  const container = deployment?.template?.spec?.containers?.[0];
  const resources = container?.resources;
  const attachResources = document?.attach_resources;

  const nextDraft: InstanceDraft = {
    ...fallback,
    name: document?.name ?? fallback.name,
    env: document?.env ?? fallback.env,
    instanceType: document?.instance_type ?? fallback.instanceType,
    replicas: Number(deployment?.replicas ?? fallback.replicas),
    cpu: resources?.requests?.cpu ?? fallback.cpu,
    memory: resources?.requests?.memory ?? fallback.memory,
    cpuLimit: resources?.limits?.cpu ?? fallback.cpuLimit,
    memoryLimit: resources?.limits?.memory ?? fallback.memoryLimit,
    containerName: container?.name ?? fallback.containerName,
    image: container?.image ?? fallback.image,
    ports: (container?.ports ?? [])
      .map((port: { containerPort?: number }) => Number(port?.containerPort))
      .filter((port: number): port is number => Number.isFinite(port)),
    envVars: Array.isArray(container?.env)
      ? container.env.map((item: { name?: string; value?: string }) => ({
          name: item?.name ?? '',
          value: item?.value ?? '',
        }))
      : fallback.envVars,
    configMaps: toResourceNames(attachResources?.configMaps),
    secrets: toResourceNames(attachResources?.secrets),
    services: toResourceNames(attachResources?.services),
    yaml: yaml.trim(),
  };

  return {
    ...nextDraft,
    replicas: Number.isFinite(nextDraft.replicas) ? nextDraft.replicas : fallback.replicas,
  };
}

function ReadonlyField({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <Typography.Text type="secondary">{label}</Typography.Text>
      <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600, color: '#1D2129' }}>{value}</div>
    </div>
  );
}

function ResourceTagGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div
      style={{
        border: '1px solid #E5E6EB',
        borderRadius: 12,
        padding: 16,
        background: '#FAFAFA',
      }}
    >
      <Typography.Text style={{ fontSize: 12, color: '#86909C' }}>{title}</Typography.Text>
      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.length > 0 ? (
          items.map((name) => (
            <Tag key={name} style={{ margin: 0, borderRadius: 999, paddingInline: 10, paddingBlock: 4 }}>
              {name}
            </Tag>
          ))
        ) : (
          <Typography.Text type="secondary">暂无</Typography.Text>
        )}
      </div>
    </div>
  );
}

function PreviewConfig({ draft }: { draft: InstanceDraft }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="Deployment 规格" styles={{ body: { padding: 16 } }}>
        <div style={sectionGridStyle}>
          <ReadonlyField label="实例名称" value={draft.name} />
          <ReadonlyField label="环境" value={draft.env} />
          <ReadonlyField label="实例类型" value={draft.instanceType} />
          <ReadonlyField label="副本数" value={draft.replicas} />
          <ReadonlyField label="容器名称" value={draft.containerName || '未配置'} />
          <ReadonlyField label="容器镜像" value={draft.image || '未配置'} />
          <ReadonlyField label="端口列表" value={draft.ports.length > 0 ? draft.ports.join(', ') : '未配置'} />
        </div>
      </Card>

      <Card title="资源配额" styles={{ body: { padding: 16 } }}>
        <div style={sectionGridStyle}>
          <ReadonlyField label="CPU Requests" value={draft.cpu || '未配置'} />
          <ReadonlyField label="Memory Requests" value={draft.memory || '未配置'} />
          <ReadonlyField label="CPU Limits" value={draft.cpuLimit || '未配置'} />
          <ReadonlyField label="Memory Limits" value={draft.memoryLimit || '未配置'} />
        </div>
      </Card>

      <Card title="环境变量" styles={{ body: { padding: 16 } }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {draft.envVars.length > 0 ? (
            draft.envVars.map((item) => (
              <div
                key={`${item.name}-${item.value}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#F7F8FA',
                }}
              >
                <Typography.Text code>{item.name}</Typography.Text>
                <Typography.Text>{item.value}</Typography.Text>
              </div>
            ))
          ) : (
            <Typography.Text type="secondary">暂无环境变量</Typography.Text>
          )}
        </div>
      </Card>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <ResourceTagGroup title="ConfigMaps" items={draft.configMaps} />
        <ResourceTagGroup title="Secrets" items={draft.secrets} />
        <ResourceTagGroup title="Services" items={draft.services} />
      </div>
    </div>
  );
}

function ResourceTextArea({
  title,
  value,
  placeholder,
  onChange,
}: {
  title: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <Card title={title} styles={{ body: { padding: 16 } }}>
      <Input.TextArea
        autoSize={{ minRows: 4, maxRows: 8 }}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Card>
  );
}

function EditConfig({
  draft,
  onPatch,
}: {
  draft: InstanceDraft;
  onPatch: (patch: Partial<InstanceDraft>) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="Deployment 规格" styles={{ body: { padding: 16 } }}>
        <Form layout="vertical">
          <div style={sectionGridStyle}>
            <Form.Item label="实例名称" style={{ marginBottom: 0 }}>
              <Input placeholder="实例名称" value={draft.name} onChange={(event) => onPatch({ name: event.target.value })} />
            </Form.Item>
            <Form.Item label="环境" style={{ marginBottom: 0 }}>
              <Input placeholder="环境" value={draft.env} onChange={(event) => onPatch({ env: event.target.value })} />
            </Form.Item>
            <Form.Item label="实例类型" style={{ marginBottom: 0 }}>
              <Select options={[...instanceTypeOptions]} value={draft.instanceType} onChange={(value) => onPatch({ instanceType: value })} />
            </Form.Item>
            <Form.Item label="副本数" style={{ marginBottom: 0 }}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="副本数" value={draft.replicas} onChange={(value) => onPatch({ replicas: value ?? 0 })} />
            </Form.Item>
            <Form.Item label="容器名称" style={{ marginBottom: 0 }}>
              <Input placeholder="容器名称" value={draft.containerName} onChange={(event) => onPatch({ containerName: event.target.value })} />
            </Form.Item>
            <Form.Item label="容器镜像" style={{ marginBottom: 0 }}>
              <Input placeholder="容器镜像" value={draft.image} onChange={(event) => onPatch({ image: event.target.value })} />
            </Form.Item>
            <Form.Item label="端口列表" style={{ marginBottom: 0 }}>
              <Input placeholder="端口列表" value={stringifyPorts(draft.ports)} onChange={(event) => onPatch({ ports: parsePorts(event.target.value) })} />
            </Form.Item>
          </div>
        </Form>
      </Card>

      <Card title="资源配额" styles={{ body: { padding: 16 } }}>
        <Form layout="vertical">
          <div style={sectionGridStyle}>
            <Form.Item label="CPU Requests" style={{ marginBottom: 0 }}>
              <Input placeholder="CPU Requests" value={draft.cpu} onChange={(event) => onPatch({ cpu: event.target.value })} />
            </Form.Item>
            <Form.Item label="Memory Requests" style={{ marginBottom: 0 }}>
              <Input placeholder="Memory Requests" value={draft.memory} onChange={(event) => onPatch({ memory: event.target.value })} />
            </Form.Item>
            <Form.Item label="CPU Limits" style={{ marginBottom: 0 }}>
              <Input placeholder="CPU Limits" value={draft.cpuLimit} onChange={(event) => onPatch({ cpuLimit: event.target.value })} />
            </Form.Item>
            <Form.Item label="Memory Limits" style={{ marginBottom: 0 }}>
              <Input placeholder="Memory Limits" value={draft.memoryLimit} onChange={(event) => onPatch({ memoryLimit: event.target.value })} />
            </Form.Item>
          </div>
        </Form>
      </Card>

      <Card title="环境变量" styles={{ body: { padding: 16 } }}>
        <Input.TextArea
          autoSize={{ minRows: 4, maxRows: 8 }}
          placeholder="每行一个环境变量，格式 KEY=VALUE"
          value={stringifyEnvVars(draft.envVars)}
          onChange={(event) => onPatch({ envVars: parseEnvVars(event.target.value) })}
        />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <ResourceTextArea title="ConfigMaps" placeholder="每行一个 ConfigMap 名称" value={stringifyLineValues(draft.configMaps)} onChange={(value) => onPatch({ configMaps: parseLineValues(value) })} />
        <ResourceTextArea title="Secrets" placeholder="每行一个 Secret 名称" value={stringifyLineValues(draft.secrets)} onChange={(value) => onPatch({ secrets: parseLineValues(value) })} />
        <ResourceTextArea title="Services" placeholder="每行一个 Service 名称" value={stringifyLineValues(draft.services)} onChange={(value) => onPatch({ services: parseLineValues(value) })} />
      </div>
    </div>
  );
}

function PreviewYaml({ value }: { value: string }) {
  return (
    <Card title="YAML 配置" styles={{ body: { padding: 0 } }}>
      <pre
        style={{
          margin: 0,
          padding: 16,
          background: '#0D1117',
          color: '#C9D1D9',
          fontSize: 12,
          lineHeight: 1.7,
          overflowX: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}
      >
        {value}
      </pre>
    </Card>
  );
}

function EditYaml({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Card title="YAML 配置" styles={{ body: { padding: 16 } }}>
      <Flex vertical gap={12}>
        {error ? <Alert type="warning" showIcon message="YAML 解析失败，已保留文本修改" description={error} /> : null}
        <Input.TextArea
          autoSize={{ minRows: 18, maxRows: 26 }}
          placeholder="编辑 YAML 配置"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
        />
      </Flex>
    </Card>
  );
}

function PodStatusTag({ status }: { status: InstancePod['status'] }) {
  const color = status === 'Running' ? 'success' : status === 'Pending' ? 'processing' : status === 'CrashLoopBackOff' ? 'error' : 'default';
  return <Tag color={color}>{status}</Tag>;
}

function TerminalViewer({ value }: { value: string }) {
  return (
    <div
      data-testid="pod-log-terminal"
      style={{
        overflow: 'hidden',
        borderRadius: 14,
        border: '1px solid #111827',
        background: '#0B1220',
        boxShadow: '0 18px 48px rgba(15, 23, 42, 0.24)',
      }}
    >
      <Flex
        align="center"
        justify="space-between"
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.96))',
        }}
      >
        <Flex gap={8} align="center">
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FB7185' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FBBF24' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ADE80' }} />
        </Flex>
        <Typography.Text style={{ color: '#94A3B8', fontSize: 11, letterSpacing: '0.12em' }}>TERMINAL</Typography.Text>
      </Flex>
      <SyntaxHighlighter
        language="bash"
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          minHeight: 320,
          maxHeight: 520,
          overflow: 'auto',
          padding: 16,
          background: '#0B1220',
          fontSize: 12,
          lineHeight: 1.75,
        }}
        wrapLongLines
        showLineNumbers
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

function YamlViewer({ value }: { value: string }) {
  return (
    <div
      data-testid="pod-yaml-viewer"
      style={{
        overflow: 'hidden',
        borderRadius: 14,
        border: '1px solid #E5E6EB',
        background: '#FFFFFF',
      }}
    >
      <Flex
        align="center"
        justify="space-between"
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid #F2F3F5',
          background: '#F7F8FA',
        }}
      >
        <Typography.Text strong style={{ fontSize: 12, color: '#1D2129' }}>
          YAML
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Kubernetes Manifest
        </Typography.Text>
      </Flex>
      <SyntaxHighlighter
        language="yaml"
        style={oneLight}
        customStyle={{
          margin: 0,
          minHeight: 320,
          maxHeight: 520,
          overflow: 'auto',
          padding: 16,
          fontSize: 12,
          lineHeight: 1.75,
          background: '#FFFFFF',
        }}
        wrapLongLines
        showLineNumbers
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

function TextViewer({ value }: { value: string }) {
  return (
    <div
      style={{
        overflow: 'auto',
        maxHeight: 520,
        borderRadius: 12,
        border: '1px solid #E5E6EB',
        background: '#F7F8FA',
        padding: 16,
      }}
    >
      <pre
        style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 12,
          lineHeight: 1.7,
          color: '#1D2129',
        }}
      >
        {value}
      </pre>
    </div>
  );
}

function formatCpuLimit(value: string) {
  if (value === '-' || value.trim() === '') {
    return '-';
  }

  if (value.endsWith('m')) {
    const raw = Number(value.slice(0, -1));
    if (!Number.isFinite(raw)) {
      return value;
    }

    const cores = raw / 1000;
    const formatted = Number.isInteger(cores) ? `${cores}` : cores.toFixed(1).replace(/\.0$/, '');
    return `${formatted}核`;
  }

  return `${value}核`;
}

function formatMemoryLimit(value: string) {
  if (value === '-' || value.trim() === '') {
    return '-';
  }

  if (value.endsWith('Gi')) {
    return `${value.slice(0, -2)}G`;
  }

  if (value.endsWith('Mi')) {
    const raw = Number(value.slice(0, -2));
    if (!Number.isFinite(raw)) {
      return value;
    }

    const gb = raw / 1024;
    const formatted = gb < 1 ? gb.toFixed(1) : gb.toFixed(1).replace(/\.0$/, '');
    return `${formatted}G`;
  }

  return value;
}

function ContainerStatusList({
  pod,
  containerLimitLookup,
  onOpenDialog,
}: {
  pod: InstancePod;
  containerLimitLookup: Record<string, { cpuLimit?: string; memoryLimit?: string }>;
  onOpenDialog: (kind: PodDialogKind, title: string, content: string) => void;
}) {
  const dataSource = useMemo<ContainerListRow[]>(
    () =>
      pod.containers.map((container, index) => {
        const limit = containerLimitLookup[container.name];
        const fallbackLimit = defaultContainerLimitLookup[container.name];

        return {
          key: container.name,
          name: container.name,
          image: container.image,
          isPrimary: Boolean(limit) || index === 0,
          status: container.status,
          restartCount: container.restartCount,
          cpuLimit: container.cpuLimit ?? limit?.cpuLimit ?? fallbackLimit?.cpuLimit ?? '-',
          memoryLimit: container.memoryLimit ?? limit?.memoryLimit ?? fallbackLimit?.memoryLimit ?? '-',
          branch: container.branch,
          commit: container.commit,
        };
      }),
    [containerLimitLookup, pod.containers],
  );

  const columns = useMemo<ColumnsType<ContainerListRow>>(
    () => [
      {
        title: '容器名称',
        dataIndex: 'name',
        key: 'name',
        width: containerDetailGrid.name,
        render: (value) => <Typography.Text>{value}</Typography.Text>,
      },
      {
        title: '镜像',
        dataIndex: 'image',
        key: 'image',
        width: containerDetailGrid.image,
        render: (value: string) => <Typography.Text ellipsis={{ tooltip: value }}>{value}</Typography.Text>,
      },
      {
        title: '分支@commit',
        key: 'branchCommit',
        width: containerDetailGrid.branchCommit,
        align: 'center',
        render: (_, record) =>
          record.isPrimary && record.branch && record.commit ? (
            <Tag style={{ margin: 0, fontSize: 11 }}>{`${record.branch}@${record.commit}`}</Tag>
          ) : null,
      },
      {
        title: 'CPU',
        dataIndex: 'cpuLimit',
        key: 'cpuLimit',
        width: containerDetailGrid.cpu,
        align: 'center',
        render: (value: string) => formatCpuLimit(value),
      },
      {
        title: '内存',
        dataIndex: 'memoryLimit',
        key: 'memoryLimit',
        width: containerDetailGrid.memory,
        align: 'center',
        render: (value: string) => formatMemoryLimit(value),
      },
      {
        title: '重启次数',
        dataIndex: 'restartCount',
        key: 'restartCount',
        width: containerDetailGrid.restart,
        align: 'center',
        render: (value: number) => <Typography.Text style={{ color: value > 0 ? '#f5222d' : '#666' }}>{value}</Typography.Text>,
      },
      {
        title: '操作',
        key: 'actions',
        width: containerDetailGrid.actions,
        fixed: 'right',
        align: 'center',
        render: (_, record) => (
          <Flex align="center" justify="center" gap={6} wrap={false}>
            <Button
              size="small"
              type="link"
              icon={<FileText size={12} />}
              onClick={() => onOpenDialog('logs', `${pod.name}/${record.name} 日志`, `[${record.name}]\n${pod.logs}`)}
              style={{ paddingInline: 0, height: 20, fontSize: 12, gap: 0 }}
            >
              日志
            </Button>
            <Button
              size="small"
              type="link"
              icon={<Terminal size={12} />}
              onClick={() =>
                onOpenDialog(
                  'terminal',
                  `${pod.name}/${record.name} Terminal`,
                  `/ # kubectl exec -it ${pod.name} -c ${record.name} -- sh\nconnected to ${record.name}`,
                )
              }
              style={{ paddingInline: 0, height: 20, fontSize: 12, gap: 0 }}
            >
              Terminal
            </Button>
          </Flex>
        ),
      },
    ],
    [onOpenDialog, pod.logs, pod.name],
  );

  return (
    <div data-pod-container-panel="true" data-testid="pod-container-panel">
      <div data-testid="pod-container-table-wrap" data-pod-container-table="true">
        <Table<ContainerListRow>
          data-testid="pod-container-table"
          size="small"
          tableLayout="fixed"
          rowKey="key"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          scroll={{ x: containerDetailGrid.total }}
          style={{ width: '100%' }}
        />
      </div>
      <style>
        {`
          [data-pod-container-table='true'] .ant-table-thead > tr > th {
            background: #f5f6f7 !important;
            color: #4e5969;
            font-weight: 600;
            border-bottom: 1px solid #e5e6eb;
          }

          [data-pod-container-table='true'] .ant-btn {
            gap: 0 !important;
          }

          [data-pod-container-table='true'] .ant-btn > .ant-btn-icon + span {
            margin-inline-start: 0 !important;
          }

          [data-pod-container-table='true'] .ant-table-wrapper {
            width: 100%;
          }
        `}
      </style>
    </div>
  );
}

function PodsView({
  pods,
  containerLimitLookup,
  onOpenDialog,
}: {
  pods: InstancePod[];
  containerLimitLookup: Record<string, { cpuLimit?: string; memoryLimit?: string }>;
  onOpenDialog: (kind: PodDialogKind, title: string, content: string) => void;
}) {
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    setExpandedRowKeys((current) => current.filter((key) => pods.some((pod) => pod.name === key)));
  }, [pods]);

  const dataSource = useMemo<PodTableRow[]>(
    () =>
      pods.map((pod) => {
        const restartCount = pod.containers.reduce((total, container) => total + container.restartCount, 0);

        return {
          key: pod.name,
          pod,
          restartCount,
        };
      }),
    [pods],
  );

  const toggleRowExpanded = (rowKey: string) => {
    setExpandedRowKeys((current) => (current.includes(rowKey) ? current.filter((key) => key !== rowKey) : [...current, rowKey]));
  };

  const columns = useMemo<ColumnsType<PodTableRow>>(
    () => [
      {
        title: 'Pod 名称',
        dataIndex: 'pod',
        key: 'name',
        width: podTableGrid.name,
        ellipsis: { showTitle: false },
        render: (_, record) => {
          const expanded = expandedRowKeys.includes(record.key);
          const canExpand = record.pod.containers.length > 0;

          return (
            <Flex align="center" gap={6} style={{ minWidth: 0 }}>
              <Button
                size="small"
                type="text"
                disabled={!canExpand}
                aria-label={expanded ? '收起容器' : '展开容器'}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!canExpand) {
                    return;
                  }

                  toggleRowExpanded(record.key);
                }}
                style={{
                  width: 18,
                  minWidth: 18,
                  height: 18,
                  padding: 0,
                  lineHeight: '18px',
                  borderRadius: 4,
                  fontWeight: 600,
                }}
              >
                {expanded ? '-' : '+'}
              </Button>
              <Typography.Text ellipsis={{ tooltip: record.pod.name }} style={{ display: 'block', maxWidth: 220 }}>
                {record.pod.name}
              </Typography.Text>
            </Flex>
          );
        },
      },
      {
        title: '状态',
        dataIndex: 'pod',
        key: 'status',
        width: podTableGrid.status,
        align: 'left',
        render: (_, record) => <PodStatusTag status={record.pod.status} />,
      },
      {
        title: '重启',
        dataIndex: 'restartCount',
        key: 'restartCount',
        width: podTableGrid.restart,
        align: 'left',
      },
      {
        title: 'Pod IP',
        dataIndex: 'pod',
        key: 'podIP',
        width: podTableGrid.podIP,
        ellipsis: { showTitle: false },
        render: (_, record) => (
          <Typography.Text ellipsis={{ tooltip: record.pod.podIP }} style={{ display: 'block', maxWidth: 64 }}>
            {record.pod.podIP}
          </Typography.Text>
        ),
      },
      {
        title: '节点',
        dataIndex: 'pod',
        key: 'node',
        width: podTableGrid.node,
        render: (_, record) => (
          <div style={{ minWidth: 0, maxWidth: 84 }}>
            <Typography.Text ellipsis={{ tooltip: record.pod.node }} style={{ display: 'block' }}>
              {record.pod.node}
            </Typography.Text>
            <Typography.Text type="secondary" ellipsis={{ tooltip: record.pod.nodeIP ?? '-' }} style={{ display: 'block', fontSize: 12 }}>
              {record.pod.nodeIP ?? '-'}
            </Typography.Text>
          </div>
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: podTableGrid.actions,
        align: 'left',
        render: (_, record) => (
          <Flex justify="left" align="left" gap={8}>
            <Button
              size="small"
              type="link"
              onClick={() => onOpenDialog('events', `${record.pod.name} 事件`, record.pod.events.join('\n'))}
              style={{ paddingInline: 0 }}
            >
              事件
            </Button>
            <Button size="small" type="link" onClick={() => onOpenDialog('yaml', `${record.pod.name} YAML`, record.pod.yaml)} style={{ paddingInline: 0 }}>
              yaml
            </Button>
          </Flex>
        ),
      },
    ],
    [expandedRowKeys, onOpenDialog],
  );

  return (
    <Card styles={{ body: { padding: 0 } }}>
      <div data-pod-table="true">
        <Table<PodTableRow>
          size="small"
          rowKey="key"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          scroll={{ x: 822 }}
          locale={{ emptyText: <Empty description="暂无 Pod" /> }}
          expandable={{
            expandedRowKeys,
            onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
            showExpandColumn: false,
            expandIcon: () => null,
            rowExpandable: (record) => record.pod.containers.length > 0,
            expandedRowRender: (record) => (
              <div style={{ padding: 0 }}>
                <ContainerStatusList pod={record.pod} containerLimitLookup={containerLimitLookup} onOpenDialog={onOpenDialog} />
              </div>
            ),
          }}
        />
        <style>
          {`
          [data-pod-table='true'] .ant-table-thead > tr > th {
            font-weight: 600;
            white-space: nowrap;
          }

          [data-pod-table='true'] .ant-table-tbody > tr > td {
            padding-top: 10px;
            padding-bottom: 10px;
          }

          [data-pod-table='true'] .ant-table-expanded-row > td {
            background: #fff;
            padding: 8px 12px !important;
          }

          [data-pod-table='true'] .ant-table-expanded-row-fixed {
            margin: 0 !important;
            padding: 0 !important;
          }

          `}
        </style>
      </div>
    </Card>
  );
}

function TableBottomPagination({
  current,
  pageSize,
  total,
  pageSizeOptions,
  onChange,
}: {
  current: number;
  pageSize: number;
  total: number;
  pageSizeOptions: number[];
  onChange: (page: number, nextPageSize: number) => void;
}) {
  const columns = useMemo<ColumnsType<PaginationRow>>(
    () => [
      {
        key: 'placeholder',
        dataIndex: 'key',
        render: () => null,
      },
    ],
    [],
  );

  return (
    <div data-bottom-pagination="true" style={{ marginTop: 'auto' }}>
      <Table<PaginationRow>
        rowKey="key"
        columns={columns}
        dataSource={[{ key: 'pagination-only' }]}
        showHeader={false}
        pagination={{
          current,
          pageSize,
          total,
          size: 'small',
          showSizeChanger: true,
          pageSizeOptions,
          position: ['bottomCenter'],
          onChange,
        }}
        locale={{ emptyText: null }}
      />
      <style>
        {`
          [data-bottom-pagination='true'] .ant-table {
            display: none;
          }

          [data-bottom-pagination='true'] .ant-table-wrapper,
          [data-bottom-pagination='true'] .ant-spin-nested-loading,
          [data-bottom-pagination='true'] .ant-spin-container {
            display: flex;
            flex-direction: column;
          }

          [data-bottom-pagination='true'] .ant-table-pagination.ant-pagination {
            margin-block-start: auto;
          }

          [data-bottom-pagination='true'] .ant-pagination-item,
          [data-bottom-pagination='true'] .ant-pagination-prev,
          [data-bottom-pagination='true'] .ant-pagination-next {
            min-width: 24px;
            height: 24px;
            line-height: 22px;
          }

          [data-bottom-pagination='true'] .ant-pagination-prev .ant-pagination-item-link,
          [data-bottom-pagination='true'] .ant-pagination-next .ant-pagination-item-link {
            width: 24px;
            height: 24px;
            line-height: 22px;
          }
        `}
      </style>
    </div>
  );
}

export function BusinessInstancesPanel({ instances }: BusinessInstancesPanelProps) {
  const paginationOptions = [10, 25, 50, 100];
  const [activeId, setActiveId] = useState(instances[0]?.id);
  const [detailTab, setDetailTab] = useState<DetailTab>('pods');
  const [instancePagination, setInstancePagination] = useState({ current: 1, pageSize: 10 });
  const [podPagination, setPodPagination] = useState({ current: 1, pageSize: 10 });
  const [savedDrafts, setSavedDrafts] = useState<Record<string, InstanceDraft>>(() =>
    Object.fromEntries(instances.map((item) => [item.id, buildDraft(item)])),
  );
  const [editDrafts, setEditDrafts] = useState<Record<string, InstanceDraft>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [yamlErrors, setYamlErrors] = useState<Record<string, string | undefined>>({});
  const [podDialog, setPodDialog] = useState<PodDialogState>(null);

  const activeInstance = useMemo(
    () => instances.find((item) => item.id === activeId) ?? instances[0],
    [activeId, instances],
  );

  const activeSavedDraft = activeInstance ? savedDrafts[activeInstance.id] : undefined;
  const pagedInstances = useMemo(
    () =>
      instances.slice(
        (instancePagination.current - 1) * instancePagination.pageSize,
        instancePagination.current * instancePagination.pageSize,
      ),
    [instancePagination, instances],
  );
  const allPods = useMemo(() => activeInstance?.pods ?? [], [activeInstance]);
  const pagedPods = useMemo(
    () =>
      allPods.slice(
        (podPagination.current - 1) * podPagination.pageSize,
        podPagination.current * podPagination.pageSize,
      ),
    [allPods, podPagination],
  );
  const containerLimitLookup = useMemo(
    () =>
      (activeInstance?.spec?.deployment?.template?.spec?.containers ?? []).reduce<Record<string, { cpuLimit?: string; memoryLimit?: string }>>((accumulator, container) => {
        accumulator[container.name] = {
          cpuLimit: container.resources?.limits?.cpu,
          memoryLimit: container.resources?.limits?.memory,
        };
        return accumulator;
      }, {}),
    [activeInstance],
  );

  if (instances.length === 0 || !activeInstance || !activeSavedDraft) {
    return <Empty description="暂无业务实例" />;
  }

  const isEditing = editingId === activeInstance.id;
  const activeDraft = isEditing ? editDrafts[activeInstance.id] ?? activeSavedDraft : activeSavedDraft;

  const patchEditDraft = (patch: Partial<InstanceDraft>) => {
    if (!isEditing) {
      return;
    }

    setEditDrafts((current) => {
      const previous = current[activeInstance.id] ?? cloneDraft(activeSavedDraft);
      const next = { ...previous, ...patch };
      return {
        ...current,
        [activeInstance.id]: {
          ...next,
          yaml: serializeDraft(next),
        },
      };
    });
    setYamlErrors((current) => ({
      ...current,
      [activeInstance.id]: undefined,
    }));
  };

  const startEdit = () => {
    setEditingId(activeInstance.id);
    setEditDrafts((current) => ({
      ...current,
      [activeInstance.id]: cloneDraft(activeSavedDraft),
    }));
    setYamlErrors((current) => ({
      ...current,
      [activeInstance.id]: undefined,
    }));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDrafts((current) => {
      const next = { ...current };
      delete next[activeInstance.id];
      return next;
    });
    setYamlErrors((current) => ({
      ...current,
      [activeInstance.id]: undefined,
    }));
  };

  const saveEdit = () => {
    const draft = editDrafts[activeInstance.id];
    if (!draft) {
      setEditingId(null);
      return;
    }

    setSavedDrafts((current) => ({
      ...current,
      [activeInstance.id]: {
        ...cloneDraft(draft),
        yaml: draft.yaml.trim() || serializeDraft(draft),
      },
    }));
    setEditingId(null);
    setEditDrafts((current) => {
      const next = { ...current };
      delete next[activeInstance.id];
      return next;
    });
    setYamlErrors((current) => ({
      ...current,
      [activeInstance.id]: undefined,
    }));
  };

  const updateYaml = (yaml: string) => {
    if (!isEditing) {
      return;
    }

    setEditDrafts((current) => ({
      ...current,
      [activeInstance.id]: {
        ...(current[activeInstance.id] ?? cloneDraft(activeSavedDraft)),
        yaml,
      },
    }));

    try {
      setEditDrafts((current) => ({
        ...current,
        [activeInstance.id]: parseDraftYaml(yaml, current[activeInstance.id] ?? cloneDraft(activeSavedDraft)),
      }));
      setYamlErrors((current) => ({
        ...current,
        [activeInstance.id]: undefined,
      }));
    } catch (error) {
      setYamlErrors((current) => ({
        ...current,
        [activeInstance.id]: error instanceof Error ? error.message : '未知解析错误',
      }));
    }
  };

  const handleSwitchInstance = (instanceId: string) => {
    setActiveId(instanceId);
    setEditingId(null);
    setDetailTab('pods');
    setPodPagination((current) => ({ ...current, current: 1 }));
  };

  const canEdit = detailTab === 'config' || detailTab === 'yaml';

  return (
    <>
      <div
        style={{
          height: '100%',
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '320px minmax(0, 1fr)',
          gap: 2,
          padding: 2,
          background: '#F2F3F5',
          boxSizing: 'border-box',
        }}
      >
        <Card
          title="业务实例"
          styles={{
            header: { paddingInline: 16 },
            body: { padding: 8, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' },
          }}
          style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <List
              dataSource={[...pagedInstances]}
              renderItem={(instance) => {
                const statusMeta = getInstanceStatusMeta(instance.status);
                const selected = activeInstance.id === instance.id;

                return (
                  <List.Item style={{ padding: 0, border: 'none' }}>
                    <div
                      role="button"
                      aria-label={`选择实例 ${instance.name}`}
                      tabIndex={0}
                      onClick={() => handleSwitchInstance(instance.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleSwitchInstance(instance.id);
                        }
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        border: 'none',
                        background: selected ? '#F7FAFF' : '#fff',
                        padding: 16,
                        cursor: 'pointer',
                        borderBottom: '1px solid #F2F3F5',
                      }}
                    >
                      <Flex align="center" justify="space-between" gap={12}>
                        <div style={{ minWidth: 0 }}>
                          <Typography.Text strong ellipsis style={{ display: 'block' }}>
                            {instance.name}
                          </Typography.Text>
                          <Flex align="center" gap={8} wrap={false} style={{ marginTop: 8 }}>
                            <EnvTag env={instance.env} />
                            <Tag style={{ margin: 0, border: 'none', borderRadius: 999, background: '#F2F3F5', color: '#4E5969' }}>
                              {instance.type}
                            </Tag>
                            <Tag
                              style={{
                                margin: 0,
                                border: 'none',
                                borderRadius: 999,
                                background: statusMeta.badgeClass.includes('#') ? '#E8FFEA' : undefined,
                              }}
                              color={instance.status === 'running' ? 'success' : instance.status === 'degraded' ? 'warning' : 'default'}
                            >
                              {statusMeta.label}
                            </Tag>
                          </Flex>
                        </div>
                      </Flex>
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>
          <TableBottomPagination
            current={instancePagination.current}
            pageSize={instancePagination.pageSize}
            total={instances.length}
            pageSizeOptions={paginationOptions}
            onChange={(page, pageSize) => setInstancePagination({ current: page, pageSize })}
          />
        </Card>

        <Card
          title={
            <Flex align="center" gap={8}>
              <Typography.Text strong>{activeDraft.name}</Typography.Text>
              <EnvTag env={activeDraft.env} />
            </Flex>
          }
          extra={
            <Flex align="center" gap={8}>
              {canEdit ? (
                isEditing ? (
                  <>
                    <Button size="small" onClick={cancelEdit}>
                      取消
                    </Button>
                    <Button size="small" type="primary" onClick={saveEdit}>
                      保存
                    </Button>
                  </>
                ) : (
                  <Button size="small" type="primary" onClick={startEdit}>
                    编辑
                  </Button>
                )
              ) : null}
            </Flex>
          }
          styles={{ body: { padding: 8, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' } }}
          style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Tabs
              activeKey={detailTab}
              onChange={(next) => setDetailTab(next as DetailTab)}
              items={[
                { key: 'pods', label: 'Pod' },
                { key: 'config', label: '配置' },
                { key: 'yaml', label: 'YAML' },
              ]}
            />

            {detailTab === 'pods' ? (
              <PodsView
                pods={pagedPods}
                containerLimitLookup={containerLimitLookup}
                onOpenDialog={(kind, title, content) => setPodDialog({ kind, title, content })}
              />
            ) : null}
            {detailTab === 'config' ? (isEditing ? <EditConfig draft={activeDraft} onPatch={patchEditDraft} /> : <PreviewConfig draft={activeDraft} />) : null}
            {detailTab === 'yaml' ? (isEditing ? <EditYaml value={activeDraft.yaml} error={yamlErrors[activeInstance.id]} onChange={updateYaml} /> : <PreviewYaml value={activeDraft.yaml} />) : null}
          </div>
          {detailTab === 'pods' ? (
            <TableBottomPagination
              current={podPagination.current}
              pageSize={podPagination.pageSize}
              total={allPods.length}
              pageSizeOptions={paginationOptions}
              onChange={(page, pageSize) => setPodPagination({ current: page, pageSize })}
            />
          ) : null}
        </Card>
      </div>

      <Modal
        open={podDialog !== null}
        title={podDialog?.title}
        footer={null}
        onCancel={() => setPodDialog(null)}
        width={720}
      >
        {podDialog?.kind === 'logs' ? <TextViewer value={podDialog.content} /> : null}
        {podDialog?.kind === 'terminal' ? <TerminalViewer value={podDialog.content} /> : null}
        {podDialog?.kind === 'yaml' ? <YamlViewer value={podDialog.content} /> : null}
        {podDialog?.kind === 'events' ? <TextViewer value={podDialog.content} /> : null}
      </Modal>
    </>
  );
}
