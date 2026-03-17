import { DeleteOutlined, PlusOutlined, QuestionCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Collapse, Empty, Flex, Form, Input, InputNumber, List, Modal, Radio, Select, Table, Tag, Tooltip, Typography } from 'antd';
import type { TableProps } from 'antd';
import { FileText, Terminal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { stringify } from 'yaml';
import type { Instance, InstancePod } from '../../mock';
import { getInstanceStatusMeta } from '../../lib/status';
import { EnvTag } from '../common/EnvTag';
import { PageHeaderTabs, type PageHeaderTabItem } from '../layout/page-header';

type BusinessInstancesPanelProps = {
  instances: ReadonlyArray<Instance>;
  onCreateInstance?: (instance: Instance) => Promise<Instance | void> | Instance | void;
  onSaveInstance?: (instance: Instance) => Promise<Instance | void> | Instance | void;
};

type DetailTab = 'pods' | 'config';
type ConfigView = 'visual' | 'yaml';

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
  startupCommand: string;
  networkMode: 'k8s-service' | 'apisix';
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

type PodDialogKind = 'events' | 'logs' | 'terminal' | 'yaml';

type CreateTemplate = 'blank' | 'web' | 'worker';

type CreateInstanceFormValues = {
  name: string;
  env: string;
  template: CreateTemplate;
};

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

const formGroupStyle = {
  border: '1px solid #E5E6EB',
  borderRadius: 8,
  background: '#FAFAFA',
  padding: 12,
} satisfies React.CSSProperties;

const formGroupTitleStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: '#4E5969',
  marginBottom: 10,
  display: 'block',
} satisfies React.CSSProperties;

const reservedLayerStyle = {
  border: '1px dashed #D9DDE3',
  borderRadius: 8,
  background: '#FAFAFA',
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
} satisfies React.CSSProperties;

const memoryUnitOptions = [
  { label: 'Mi', value: 'Mi' },
  { label: 'Gi', value: 'Gi' },
] as const;

const cpuUnitOptions = [
  { label: 'm', value: 'm' },
  { label: 'c', value: 'c' },
] as const;

const networkModeOptions = [
  { label: 'k8s service', value: 'k8s-service' },
  { label: 'apisix', value: 'apisix', disabled: true },
] as const;

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

function normalizeYamlImagePlaceholder(yaml: string) {
  return yaml.replace(/^(\s*image:\s*).+$/gm, '$1IMAGE');
}

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
  return normalizeYamlImagePlaceholder(
    stringify(
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
                  image: 'IMAGE',
                  command: draft.startupCommand.trim() ? ['/bin/sh', '-c', draft.startupCommand.trim()] : undefined,
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
    ).trim(),
  );
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
    startupCommand: parseStartupCommand(
      (container as { command?: string | string[] } | undefined)?.command,
      (container as { args?: string | string[] } | undefined)?.args,
    ),
    networkMode: 'k8s-service',
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
    yaml: normalizeYamlImagePlaceholder(instance.yaml?.trim() || serializeDraft(draft)),
  };
}

function toPortSelectValues(ports: number[]) {
  return ports.map((port) => String(port));
}

function parsePortSelectValues(values: string[]) {
  return values
    .map((item) => Number(item.trim()))
    .filter((item): item is number => Number.isFinite(item));
}

function parseNumeric(value: string) {
  const match = value.trim().match(/(\d+(\.\d+)?)/);
  if (!match) {
    return undefined;
  }

  const next = Number(match[1]);
  return Number.isFinite(next) ? next : undefined;
}

function normalizeCommandParts(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
}

function parseStartupCommand(command: unknown, args: unknown) {
  const commandParts = normalizeCommandParts(command);
  const argParts = normalizeCommandParts(args);

  if (commandParts.length === 0 && argParts.length === 0) {
    return '';
  }

  const shellExecutors = new Set(['/bin/sh', 'sh', '/bin/bash', 'bash']);
  if (commandParts.length >= 3 && shellExecutors.has(commandParts[0]) && commandParts[1] === '-c') {
    return commandParts.slice(2).join(' ');
  }

  return [...commandParts, ...argParts].join(' ');
}

function parseMemoryValue(value: string): { amount: number | undefined; unit: 'Mi' | 'Gi' } {
  const trimmed = value.trim();
  const amount = parseNumeric(trimmed);

  if (trimmed.endsWith('Gi')) {
    return { amount, unit: 'Gi' };
  }

  if (trimmed.endsWith('Mi')) {
    return { amount, unit: 'Mi' };
  }

  return { amount, unit: 'Mi' };
}

function parseCpuValue(value: string): { amount: number | undefined; unit: 'm' | 'c' } {
  const trimmed = value.trim();
  const amount = parseNumeric(trimmed);

  if (trimmed.endsWith('c')) {
    return { amount, unit: 'c' };
  }

  if (trimmed.endsWith('m')) {
    return { amount, unit: 'm' };
  }

  return { amount, unit: 'm' };
}

function draftToInstance(draft: InstanceDraft, previous?: Instance): Instance {
  return {
    id: draft.id,
    buId: draft.buId,
    name: draft.name,
    env: draft.env,
    type: draft.type,
    instanceType: draft.instanceType,
    replicas: draft.replicas,
    readyReplicas: previous?.readyReplicas ?? Math.min(draft.readyReplicas, draft.replicas),
    cpu: draft.cpu,
    memory: draft.memory,
    yaml: normalizeYamlImagePlaceholder(draft.yaml.trim() || serializeDraft(draft)),
    spec: {
      deployment: {
        replicas: draft.replicas,
        template: {
          spec: {
            containers: [
              {
                name: draft.containerName,
                image: draft.image || 'IMAGE',
                ports: draft.ports.map((port) => ({ containerPort: port })),
                env: draft.envVars.map((item) => ({ name: item.name, value: item.value })),
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
    attachResources: {
      configMaps: createNameMap(draft.configMaps),
      secrets: createNameMap(draft.secrets),
      services: createNameMap(draft.services),
    },
    pods: previous?.pods ?? [],
    status: previous?.status ?? 'stopped',
  };
}

function buildTemplateDraft({
  id,
  buId,
  name,
  env,
  template,
}: {
  id: string;
  buId: string;
  name: string;
  env: string;
  template: CreateTemplate;
}): InstanceDraft {
  const normalizedTemplate = template;
  const isWeb = normalizedTemplate === 'web';
  const isWorker = normalizedTemplate === 'worker';

  const draft: InstanceDraft = {
    id,
    buId,
    name,
    env,
    type: 'Deployment',
    instanceType: 'deployment',
    replicas: 1,
    readyReplicas: 0,
    cpu: isWorker ? '500m' : '250m',
    memory: isWorker ? '512Mi' : '256Mi',
    cpuLimit: isWorker ? '1000m' : '500m',
    memoryLimit: isWorker ? '1Gi' : '512Mi',
    startupCommand: isWorker ? 'python worker.py' : isWeb ? 'npm run start' : '',
    networkMode: 'k8s-service',
    status: 'stopped',
    containerName: isWorker ? 'worker' : 'app',
    image: 'IMAGE',
    ports: isWeb ? [8080] : [],
    envVars: [{ name: 'APP_ENV', value: env }],
    configMaps: [],
    secrets: [],
    services: isWeb ? [name] : [],
    yaml: '',
  };

  return {
    ...draft,
    yaml: serializeDraft(draft),
  };
}

function PreviewConfig({ draft }: { draft: InstanceDraft }) {
  return <EditConfig draft={draft} readOnly />;
}

function BaseConfigLayer({
  draft,
  readOnly,
  patchDraft,
}: {
  draft: InstanceDraft;
  readOnly: boolean;
  patchDraft: (patch: Partial<InstanceDraft>) => void;
}) {
  const inlineFormStyle = {
    labelCol: { flex: '110px' },
    wrapperCol: { flex: 'auto' },
    labelAlign: 'left' as const,
    colon: false,
    layout: 'horizontal' as const,
  };

  const renderHelpLabel = (title: string, help: string) => (
    <Flex align="center" gap={4}>
      <span>{title}</span>
      <Tooltip title={help}>
        <QuestionCircleOutlined style={{ color: '#86909C', fontSize: 12, cursor: 'help' }} />
      </Tooltip>
    </Flex>
  );

  const cpuRequest = parseCpuValue(draft.cpu);
  const cpuLimit = parseCpuValue(draft.cpuLimit);
  const memoryRequest = parseMemoryValue(draft.memory);
  const memoryLimit = parseMemoryValue(draft.memoryLimit);

  const envDataSource = draft.envVars.map((item, index) => ({
    key: `env-${index}`,
    index,
    name: item.name,
    value: item.value,
  }));

  const updateEnvVar = (index: number, patch: Partial<InstanceDraft['envVars'][number]>) => {
    const next = draft.envVars.map((item, current) => (current === index ? { ...item, ...patch } : item));
    patchDraft({ envVars: next });
  };

  const appendEnvVar = () => {
    patchDraft({ envVars: [...draft.envVars, { name: '', value: '' }] });
  };

  const removeEnvVar = (index: number) => {
    patchDraft({ envVars: draft.envVars.filter((_, current) => current !== index) });
  };

  const envColumns: ColumnsType<{ key: string; index: number; name: string; value: string }> = [
    {
      title: 'KEY',
      dataIndex: 'name',
      key: 'name',
      render: (_value, record) => (
        <Input
          value={record.name}
          placeholder="变量名"
          disabled={readOnly}
          onChange={(event) => updateEnvVar(record.index, { name: event.target.value })}
        />
      ),
    },
    {
      title: 'VALUE',
      dataIndex: 'value',
      key: 'value',
      render: (_value, record) => (
        <Input
          value={record.value}
          placeholder="变量值"
          disabled={readOnly}
          onChange={(event) => updateEnvVar(record.index, { value: event.target.value })}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 68,
      align: 'center',
      render: (_, record) => (
        <Button
          size="small"
          type="text"
          danger={!readOnly}
          disabled={readOnly}
          icon={<DeleteOutlined />}
          aria-label={`删除环境变量-${record.index}`}
          onClick={() => removeEnvVar(record.index)}
        />
      ),
    },
  ];

  return (
    <Flex vertical gap={12}>
      <div style={formGroupStyle}>
        <Typography.Text style={formGroupTitleStyle}>部署与启动</Typography.Text>
        <Form {...inlineFormStyle}>
          <Form.Item label="副本数" style={{ marginBottom: 8 }}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="副本数"
              value={draft.replicas}
              disabled={readOnly}
              onChange={(value) => patchDraft({ replicas: value ?? 0 })}
            />
          </Form.Item>
          <Form.Item label="启动命令" style={{ marginBottom: 0 }}>
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 8 }}
              placeholder="例如: java -Xms512m -Xmx1024m -jar app.jar"
              disabled={readOnly}
              value={draft.startupCommand}
              style={{ width: '100%' }}
              onChange={(event) => patchDraft({ startupCommand: event.target.value })}
            />
          </Form.Item>
        </Form>
      </div>

      <div style={formGroupStyle}>
        <Typography.Text style={formGroupTitleStyle}>资源配额</Typography.Text>
        <Form {...inlineFormStyle}>
          <Form.Item label={renderHelpLabel('CPU 配额', '请求值用于调度预留，限制值用于限制容器 CPU 上限。')} style={{ marginBottom: 8 }}>
            <Flex align="center" gap={8}>
              <Typography.Text type="secondary" style={{ width: 28 }}>
                请求
              </Typography.Text>
              <InputNumber
                style={{ width: 140 }}
                min={0}
                controls={false}
                placeholder="数字"
                value={cpuRequest.amount}
                disabled={readOnly}
                onChange={(value) => patchDraft({ cpu: value === null ? '' : `${value}${cpuRequest.unit}` })}
              />
              <Select
                style={{ width: 72 }}
                value={cpuRequest.unit}
                options={[...cpuUnitOptions]}
                disabled={readOnly}
                onChange={(unit: 'm' | 'c') => {
                  if (cpuRequest.amount === undefined) {
                    patchDraft({ cpu: '' });
                    return;
                  }

                  patchDraft({ cpu: `${cpuRequest.amount}${unit}` });
                }}
              />
              <Typography.Text type="secondary" style={{ width: 28, marginLeft: 8 }}>
                限制
              </Typography.Text>
              <InputNumber
                style={{ width: 140 }}
                min={0}
                controls={false}
                placeholder="数字"
                value={cpuLimit.amount}
                disabled={readOnly}
                onChange={(value) => patchDraft({ cpuLimit: value === null ? '' : `${value}${cpuLimit.unit}` })}
              />
              <Select
                style={{ width: 72 }}
                value={cpuLimit.unit}
                options={[...cpuUnitOptions]}
                disabled={readOnly}
                onChange={(unit: 'm' | 'c') => {
                  if (cpuLimit.amount === undefined) {
                    patchDraft({ cpuLimit: '' });
                    return;
                  }

                  patchDraft({ cpuLimit: `${cpuLimit.amount}${unit}` });
                }}
              />
            </Flex>
          </Form.Item>
          <Form.Item label={renderHelpLabel('内存配额', '仅支持数字，单位从 Mi / Gi 中选择。')} style={{ marginBottom: 0 }}>
            <Flex align="center" gap={8}>
              <Typography.Text type="secondary" style={{ width: 28 }}>
                请求
              </Typography.Text>
              <InputNumber
                style={{ width: 140 }}
                min={0}
                controls={false}
                placeholder="数字"
                value={memoryRequest.amount}
                disabled={readOnly}
                onChange={(value) => patchDraft({ memory: value === null ? '' : `${value}${memoryRequest.unit}` })}
              />
              <Select
                style={{ width: 72 }}
                value={memoryRequest.unit}
                options={[...memoryUnitOptions]}
                disabled={readOnly}
                onChange={(unit: 'Mi' | 'Gi') => {
                  if (memoryRequest.amount === undefined) {
                    patchDraft({ memory: '' });
                    return;
                  }

                  patchDraft({ memory: `${memoryRequest.amount}${unit}` });
                }}
              />
              <Typography.Text type="secondary" style={{ width: 28, marginLeft: 8 }}>
                限制
              </Typography.Text>
              <InputNumber
                style={{ width: 140 }}
                min={0}
                controls={false}
                placeholder="数字"
                value={memoryLimit.amount}
                disabled={readOnly}
                onChange={(value) => patchDraft({ memoryLimit: value === null ? '' : `${value}${memoryLimit.unit}` })}
              />
              <Select
                style={{ width: 72 }}
                value={memoryLimit.unit}
                options={[...memoryUnitOptions]}
                disabled={readOnly}
                onChange={(unit: 'Mi' | 'Gi') => {
                  if (memoryLimit.amount === undefined) {
                    patchDraft({ memoryLimit: '' });
                    return;
                  }

                  patchDraft({ memoryLimit: `${memoryLimit.amount}${unit}` });
                }}
              />
            </Flex>
          </Form.Item>
        </Form>
      </div>

      <div style={formGroupStyle}>
        <Typography.Text style={formGroupTitleStyle}>网络配置</Typography.Text>
        <Form {...inlineFormStyle}>
          <Form.Item label="通信模式" style={{ marginBottom: 8 }}>
            <Radio.Group
              value={draft.networkMode}
              options={[...networkModeOptions]}
              disabled={readOnly}
              onChange={(event) => patchDraft({ networkMode: event.target.value as 'k8s-service' | 'apisix' })}
            />
          </Form.Item>
          <Form.Item label="端口" style={{ marginBottom: 0 }}>
            <Select
              mode="tags"
              disabled={readOnly}
              placeholder="输入端口后回车，可选择多个"
              style={{ width: '100%' }}
              value={toPortSelectValues(draft.ports)}
              tokenSeparators={[',', ' ']}
              open={false}
              onChange={(values) => patchDraft({ ports: parsePortSelectValues(values) })}
            />
          </Form.Item>
        </Form>
      </div>

      <div style={formGroupStyle}>
        <Typography.Text style={formGroupTitleStyle}>环境变量</Typography.Text>
        <div style={{ paddingTop: 2, paddingBottom: 2 }}>
          <Flex vertical gap={8}>
            <div data-env-vars-table="true">
              <Table columns={envColumns} dataSource={envDataSource} size="small" pagination={false} locale={{ emptyText: '暂无环境变量' }} />
            </div>
            {!readOnly ? (
              <Button
                block
                size="small"
                type="dashed"
                icon={<PlusOutlined />}
                aria-label="新增变量"
                onClick={appendEnvVar}
                style={{ height: 30, borderRadius: 6, justifyContent: 'center' }}
              />
            ) : null}
          </Flex>
        </div>
      </div>
    </Flex>
  );
}

function ReservedLayer({ title }: { title: string }) {
  return (
    <div style={reservedLayerStyle}>
      <Typography.Text style={{ fontSize: 13, color: '#4E5969', fontWeight: 600 }}>{title}</Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        当前版本可选填，未填写不影响部署
      </Typography.Text>
    </div>
  );
}

function EditConfig({
  draft,
  onPatch,
  readOnly = false,
}: {
  draft: InstanceDraft;
  onPatch?: (patch: Partial<InstanceDraft>) => void;
  readOnly?: boolean;
}) {
  const patchDraft = (patch: Partial<InstanceDraft>) => {
    if (readOnly) {
      return;
    }

    onPatch?.(patch);
  };

  const [activeLayerKeys, setActiveLayerKeys] = useState<string[]>(['base']);

  return (
    <div data-config-layer-collapse="true">
      <Collapse
        bordered={false}
        expandIconPosition="end"
        activeKey={activeLayerKeys}
        onChange={(keys) => {
          const next = [...(Array.isArray(keys) ? keys : [keys])].map((item) => String(item));
          setActiveLayerKeys(next);
        }}
        items={[
          {
            key: 'base',
            label: '基础配置层',
            children: <BaseConfigLayer draft={draft} readOnly={readOnly} patchDraft={patchDraft} />,
            forceRender: true,
          },
          {
            key: 'extended',
            label: '扩展配置层',
            children: <ReservedLayer title="扩展配置（预留）" />,
            forceRender: true,
          },
          {
            key: 'advanced',
            label: '高级配置层',
            children: <ReservedLayer title="高级配置（预留）" />,
            forceRender: true,
          },
        ]}
      />
      <style>
        {`
          [data-config-layer-collapse='true'] .ant-collapse-item {
            border: 1px solid #e5e6eb !important;
            border-radius: 8px !important;
            overflow: hidden;
            background: #fff;
          }

          [data-config-layer-collapse='true'] .ant-collapse-item + .ant-collapse-item {
            margin-top: 10px;
          }

          [data-config-layer-collapse='true'] .ant-collapse-header {
            min-height: 40px;
            padding: 8px 12px !important;
            align-items: center !important;
          }

          [data-config-layer-collapse='true'] .ant-collapse-header-text {
            font-size: 14px;
            font-weight: 600;
            color: #1d2129;
          }

          [data-config-layer-collapse='true'] .ant-collapse-content {
            border-top: 1px solid #f2f3f5;
          }

          [data-config-layer-collapse='true'] .ant-collapse-content-box {
            padding: 12px !important;
          }
        `}
      </style>
    </div>
  );
}

function PreviewYaml({ value }: { value: string }) {
  return <YamlViewer value={value} />;
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
            onExpandedRowsChange: (keys) => setExpandedRowKeys([...keys]),
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

export function BusinessInstancesPanel({ instances, onCreateInstance, onSaveInstance }: BusinessInstancesPanelProps) {
  const paginationOptions = [10, 25, 50, 100];
  const [instanceItems, setInstanceItems] = useState<Instance[]>(() => [...instances]);
  const [activeId, setActiveId] = useState<string | undefined>(instances[0]?.id);
  const [detailTab, setDetailTab] = useState<DetailTab>('pods');
  const [configView, setConfigView] = useState<ConfigView>('visual');
  const [instancePagination, setInstancePagination] = useState({ current: 1, pageSize: 10 });
  const [podPagination, setPodPagination] = useState({ current: 1, pageSize: 10 });
  const [instanceKeyword, setInstanceKeyword] = useState('');
  const [instanceEnvFilter, setInstanceEnvFilter] = useState<string>('all');
  const [savedDrafts, setSavedDrafts] = useState<Record<string, InstanceDraft>>(() =>
    Object.fromEntries(instances.map((item) => [item.id, buildDraft(item)])),
  );
  const [editDrafts, setEditDrafts] = useState<Record<string, InstanceDraft>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [podDialog, setPodDialog] = useState<PodDialogState>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [saveSubmitting, setSaveSubmitting] = useState(false);
  const [createForm] = Form.useForm<CreateInstanceFormValues>();
  const instancePaginationCurrent = instancePagination.current;
  const instancePaginationPageSize = instancePagination.pageSize;

  const instanceIdsSignature = useMemo(() => instances.map((item) => item.id).join('|'), [instances]);

  useEffect(() => {
    setInstanceItems([...instances]);
    setSavedDrafts(Object.fromEntries(instances.map((item) => [item.id, buildDraft(item)])));
    setEditDrafts({});
    setEditingId(null);
    setActiveId(instances[0]?.id);
    setInstancePagination((current) => ({ ...current, current: 1 }));
    setPodPagination((current) => ({ ...current, current: 1 }));
  }, [instanceIdsSignature, instances]);

  const envFilterOptions = useMemo(() => {
    const knownOrder = ['dev', 'test', 'gray', 'prod'];
    const set = new Set(instanceItems.map((item) => item.env.toLowerCase()));
    const ordered = knownOrder.filter((env) => set.has(env));
    const rest = Array.from(set).filter((env) => !knownOrder.includes(env));
    const values = [...ordered, ...rest];
    return [
      { label: '全部环境', value: 'all' },
      ...values.map((env) => ({ label: env.toUpperCase(), value: env })),
    ];
  }, [instanceItems]);

  const filteredInstances = useMemo(() => {
    const normalizedKeyword = instanceKeyword.trim().toLowerCase();

    return instanceItems.filter((item) => {
      const matchedEnv = instanceEnvFilter === 'all' || item.env.toLowerCase() === instanceEnvFilter.toLowerCase();
      if (!matchedEnv) {
        return false;
      }
      if (!normalizedKeyword) {
        return true;
      }
      return item.name.toLowerCase().includes(normalizedKeyword);
    });
  }, [instanceEnvFilter, instanceItems, instanceKeyword]);

  useEffect(() => {
    if (filteredInstances.length === 0) {
      setActiveId(undefined);
      return;
    }
    if (!activeId || !filteredInstances.some((item) => item.id === activeId)) {
      setActiveId(filteredInstances[0].id);
    }
  }, [activeId, filteredInstances]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredInstances.length / instancePaginationPageSize));
    if (instancePaginationCurrent > maxPage) {
      setInstancePagination((current) => ({ ...current, current: maxPage }));
    }
  }, [filteredInstances.length, instancePaginationCurrent, instancePaginationPageSize]);

  const activeInstance = useMemo(
    () => instanceItems.find((item) => item.id === activeId),
    [activeId, instanceItems],
  );
  const detailTabItems: ReadonlyArray<PageHeaderTabItem<DetailTab>> = useMemo(
    () => [
      { id: 'pods', label: 'Pod' },
      { id: 'config', label: '配置' },
    ],
    [],
  );

  const activeSavedDraft = activeInstance ? savedDrafts[activeInstance.id] : undefined;
  const isEditing = Boolean(activeInstance) && editingId === activeInstance?.id;
  const activeDraft = activeInstance && activeSavedDraft
    ? (isEditing ? editDrafts[activeInstance.id] ?? activeSavedDraft : activeSavedDraft)
    : undefined;
  const pagedInstances = useMemo(
    () =>
      filteredInstances.slice(
        (instancePagination.current - 1) * instancePagination.pageSize,
        instancePagination.current * instancePagination.pageSize,
      ),
    [filteredInstances, instancePagination],
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

  const patchEditDraft = (patch: Partial<InstanceDraft>) => {
    if (!isEditing || !activeInstance || !activeSavedDraft) {
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
  };

  const startEdit = () => {
    if (!activeInstance || !activeSavedDraft) {
      return;
    }
    setEditingId(activeInstance.id);
    setEditDrafts((current) => ({
      ...current,
      [activeInstance.id]: cloneDraft(activeSavedDraft),
    }));
  };

  const cancelEdit = () => {
    if (!activeInstance) {
      return;
    }
    setEditingId(null);
    setEditDrafts((current) => {
      const next = { ...current };
      delete next[activeInstance.id];
      return next;
    });
  };

  const saveEdit = async () => {
    if (!activeInstance) {
      return;
    }

    const draft = editDrafts[activeInstance.id];
    if (!draft) {
      setEditingId(null);
      return;
    }

    const normalizedDraft = {
      ...cloneDraft(draft),
      yaml: normalizeYamlImagePlaceholder(draft.yaml.trim() || serializeDraft(draft)),
    };
    let nextInstance = draftToInstance(normalizedDraft, activeInstance);

    try {
      setSaveSubmitting(true);

      if (onSaveInstance) {
        const remoteInstance = await onSaveInstance(nextInstance);
        if (remoteInstance) {
          nextInstance = remoteInstance;
        }
      }

      setInstanceItems((current) =>
        current.map((item) => (item.id === activeInstance.id ? nextInstance : item)),
      );
      setSavedDrafts((current) => ({
        ...current,
        [activeInstance.id]: buildDraft(nextInstance),
      }));
      setEditingId(null);
      setEditDrafts((current) => {
        const next = { ...current };
        delete next[activeInstance.id];
        return next;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSaveSubmitting(false);
    }
  };

  const handleSwitchInstance = (instanceId: string) => {
    setActiveId(instanceId);
    setEditingId(null);
    setDetailTab('pods');
    setConfigView('visual');
    setPodPagination((current) => ({ ...current, current: 1 }));
  };

  const handleOpenCreateModal = () => {
    createForm.setFieldsValue({
      name: '',
      env: activeInstance?.env ?? 'dev',
      template: 'blank',
    });
    setCreateModalOpen(true);
  };

  const handleCreateInstance = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateSubmitting(true);

      const nextId = `inst-${Date.now()}`;
      const nextDraft = buildTemplateDraft({
        id: nextId,
        buId: activeInstance?.buId ?? instanceItems[0]?.buId ?? '',
        name: values.name.trim(),
        env: values.env,
        template: values.template,
      });
      let nextInstance = draftToInstance(nextDraft);

      if (onCreateInstance) {
        const remoteInstance = await onCreateInstance(nextInstance);
        if (remoteInstance) {
          nextInstance = remoteInstance;
        }
      }

      const persistedDraft = buildDraft(nextInstance);
      setInstanceItems((current) => [nextInstance, ...current]);
      setSavedDrafts((current) => ({
        ...current,
        [nextInstance.id]: persistedDraft,
      }));
      setEditDrafts((current) => ({
        ...current,
        [nextInstance.id]: cloneDraft(persistedDraft),
      }));
      setActiveId(nextInstance.id);
      setEditingId(nextInstance.id);
      setDetailTab('config');
      setConfigView('visual');
      setInstancePagination((current) => ({ ...current, current: 1 }));
      setCreateModalOpen(false);
    } catch (error) {
      const maybeFormError = error as { errorFields?: unknown };
      if (maybeFormError.errorFields) {
        return;
      }
      console.error(error);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const canEdit = detailTab === 'config' && Boolean(activeDraft);

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
          extra={(
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
              创建实例
            </Button>
          )}
          styles={{
            header: { paddingInline: 16 },
            body: { padding: 8, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' },
          }}
          style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ marginBottom: 8 }}>
            <Flex gap={8} align="center">
              <Select
                style={{ width: 118 }}
                value={instanceEnvFilter}
                options={envFilterOptions}
                onChange={(value) => {
                  setInstanceEnvFilter(value);
                  setInstancePagination((current) => ({ ...current, current: 1 }));
                }}
              />
              <Input
                value={instanceKeyword}
                allowClear
                placeholder="名称模糊匹配"
                prefix={<SearchOutlined />}
                onChange={(event) => {
                  setInstanceKeyword(event.target.value);
                  setInstancePagination((current) => ({ ...current, current: 1 }));
                }}
              />
            </Flex>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {filteredInstances.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无匹配实例" />
            ) : (
              <List
                dataSource={[...pagedInstances]}
                renderItem={(instance) => {
                  const statusMeta = getInstanceStatusMeta(instance.status);
                  const selected = activeInstance?.id === instance.id;

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
            )}
          </div>
          <TableBottomPagination
            current={instancePagination.current}
            pageSize={instancePagination.pageSize}
            total={filteredInstances.length}
            pageSizeOptions={paginationOptions}
            onChange={(page, pageSize) => setInstancePagination({ current: page, pageSize })}
          />
        </Card>

        <Card
          title={activeDraft ? (
            <Flex align="center" gap={8}>
              <Typography.Text strong>{activeDraft.name}</Typography.Text>
              <EnvTag env={activeDraft.env} />
            </Flex>
          ) : (
            <Typography.Text strong>实例详情</Typography.Text>
          )}
          extra={activeDraft ? (
            <Flex align="center" gap={8}>
              {canEdit ? (
                isEditing ? (
                  <>
                    <Button size="small" onClick={cancelEdit} disabled={saveSubmitting}>
                      取消
                    </Button>
                    <Button size="small" type="primary" onClick={() => void saveEdit()} loading={saveSubmitting}>
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
          ) : null}
          styles={{ body: { padding: 8, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' } }}
          style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          {!activeDraft ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Empty description={instanceItems.length === 0 ? '暂无业务实例，请先创建' : '当前筛选条件下无可展示实例'} />
            </div>
          ) : (
            <>
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <div style={{ paddingBottom: 6 }}>
                  <PageHeaderTabs items={detailTabItems} value={detailTab} onChange={setDetailTab} right={<span />} />
                </div>

                {detailTab === 'pods' ? (
                  <PodsView
                    pods={pagedPods}
                    containerLimitLookup={containerLimitLookup}
                    onOpenDialog={(kind, title, content) => setPodDialog({ kind, title, content })}
                  />
                ) : null}
                {detailTab === 'config' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Flex align="center" gap={8}>
                      <Button size="small" type={configView === 'visual' ? 'primary' : 'default'} onClick={() => setConfigView('visual')}>
                        可视化配置
                      </Button>
                      <Button size="small" type={configView === 'yaml' ? 'primary' : 'default'} onClick={() => setConfigView('yaml')}>
                        YAML 视图
                      </Button>
                    </Flex>
                    {configView === 'visual' ? (isEditing ? <EditConfig draft={activeDraft} onPatch={patchEditDraft} /> : <PreviewConfig draft={activeDraft} />) : null}
                    {configView === 'yaml' ? <PreviewYaml value={activeDraft.yaml} /> : null}
                  </div>
                ) : null}
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
            </>
          )}
        </Card>
      </div>

      <Modal
        open={createModalOpen}
        title="创建业务实例"
        okText="创建并编辑"
        cancelText="取消"
        onOk={() => void handleCreateInstance()}
        confirmLoading={createSubmitting}
        onCancel={() => setCreateModalOpen(false)}
        destroyOnClose
      >
        <Form<CreateInstanceFormValues>
          form={createForm}
          layout="vertical"
          initialValues={{ env: activeInstance?.env ?? 'dev', template: 'blank' }}
        >
          <Form.Item
            name="name"
            label="实例名称"
            rules={[
              { required: true, message: '请输入实例名称' },
              { min: 2, max: 64, message: '长度需在 2 到 64 之间' },
            ]}
          >
            <Input placeholder="例如：inst-api-dev" />
          </Form.Item>
          <Form.Item name="env" label="环境" rules={[{ required: true, message: '请选择环境' }]}>
            <Select
              options={[
                { label: '开发', value: 'dev' },
                { label: '测试', value: 'test' },
                { label: '灰度', value: 'gray' },
                { label: '生产', value: 'prod' },
              ]}
            />
          </Form.Item>
          <Form.Item name="template" label="初始化模板">
            <Radio.Group
              options={[
                { label: '空白模板', value: 'blank' },
                { label: 'Web 服务模板', value: 'web' },
                { label: 'Worker 模板', value: 'worker' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

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
