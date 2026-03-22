import {
  DeleteOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import {
  Button,
  Collapse,
  Flex,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import type { TableProps } from 'antd';
import { useState } from 'react';
import {
  parseCpuValue,
  parseMemoryValue,
  parsePortSelectValues,
  toPortSelectValues,
} from './draft';
import type { InstanceDraft } from './types';
import { YamlViewer } from './PodViews';

type ColumnsType<T extends object = object> = TableProps<T>['columns'];

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
        <QuestionCircleOutlined
          style={{ color: '#86909C', fontSize: 12, cursor: 'help' }}
        />
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

  const updateEnvVar = (
    index: number,
    patch: Partial<InstanceDraft['envVars'][number]>,
  ) => {
    const next = draft.envVars.map((item, current) =>
      current === index ? { ...item, ...patch } : item,
    );
    patchDraft({ envVars: next });
  };

  const appendEnvVar = () => {
    patchDraft({ envVars: [...draft.envVars, { name: '', value: '' }] });
  };

  const removeEnvVar = (index: number) => {
    patchDraft({ envVars: draft.envVars.filter((_, current) => current !== index) });
  };

  const envColumns: ColumnsType<{
    key: string;
    index: number;
    name: string;
    value: string;
  }> = [
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
          <Form.Item
            label={renderHelpLabel(
              'CPU 配额',
              '请求值用于调度预留，限制值用于限制容器 CPU 上限。',
            )}
            style={{ marginBottom: 8 }}
          >
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
                onChange={(value) =>
                  patchDraft({ cpu: value === null ? '' : `${value}${cpuRequest.unit}` })
                }
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
              <Typography.Text
                type="secondary"
                style={{ width: 28, marginLeft: 8 }}
              >
                限制
              </Typography.Text>
              <InputNumber
                style={{ width: 140 }}
                min={0}
                controls={false}
                placeholder="数字"
                value={cpuLimit.amount}
                disabled={readOnly}
                onChange={(value) =>
                  patchDraft({
                    cpuLimit: value === null ? '' : `${value}${cpuLimit.unit}`,
                  })
                }
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
          <Form.Item
            label={renderHelpLabel('内存配额', '仅支持数字，单位从 Mi / Gi 中选择。')}
            style={{ marginBottom: 0 }}
          >
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
                onChange={(value) =>
                  patchDraft({
                    memory: value === null ? '' : `${value}${memoryRequest.unit}`,
                  })
                }
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
              <Typography.Text
                type="secondary"
                style={{ width: 28, marginLeft: 8 }}
              >
                限制
              </Typography.Text>
              <InputNumber
                style={{ width: 140 }}
                min={0}
                controls={false}
                placeholder="数字"
                value={memoryLimit.amount}
                disabled={readOnly}
                onChange={(value) =>
                  patchDraft({
                    memoryLimit: value === null ? '' : `${value}${memoryLimit.unit}`,
                  })
                }
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
              onChange={(event) =>
                patchDraft({
                  networkMode: event.target.value as 'k8s-service' | 'apisix',
                })
              }
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
              <Table
                columns={envColumns}
                dataSource={envDataSource}
                size="small"
                pagination={false}
                locale={{ emptyText: '暂无环境变量' }}
              />
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
      <Typography.Text
        style={{ fontSize: 13, color: '#4E5969', fontWeight: 600 }}
      >
        {title}
      </Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        当前版本可选填，未填写不影响部署
      </Typography.Text>
    </div>
  );
}

export function EditConfig({
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
          const next = [...(Array.isArray(keys) ? keys : [keys])].map((item) =>
            String(item),
          );
          setActiveLayerKeys(next);
        }}
        items={[
          {
            key: 'base',
            label: '基础配置层',
            children: (
              <BaseConfigLayer
                draft={draft}
                readOnly={readOnly}
                patchDraft={patchDraft}
              />
            ),
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

export function PreviewConfig({ draft }: { draft: InstanceDraft }) {
  return <EditConfig draft={draft} readOnly />;
}

export function PreviewYaml({ value }: { value: string }) {
  return <YamlViewer value={value} />;
}
