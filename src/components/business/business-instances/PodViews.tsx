import { Button, Card, Empty, Flex, Table, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';
import { FileText, Terminal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { InstancePod } from '../../../mock';
import type { PodDialogKind } from './types';

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

const defaultContainerLimitLookup: Record<
  string,
  { cpuLimit: string; memoryLimit: string }
> = {
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

function PodStatusTag({ status }: { status: InstancePod['status'] }) {
  const color =
    status === 'Running'
      ? 'success'
      : status === 'Pending'
        ? 'processing'
        : status === 'CrashLoopBackOff'
          ? 'error'
          : 'default';
  return <Tag color={color}>{status}</Tag>;
}

export function TerminalViewer({ value }: { value: string }) {
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
          background:
            'linear-gradient(180deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.96))',
        }}
      >
        <Flex gap={8} align="center">
          <span
            style={{ width: 10, height: 10, borderRadius: '50%', background: '#FB7185' }}
          />
          <span
            style={{ width: 10, height: 10, borderRadius: '50%', background: '#FBBF24' }}
          />
          <span
            style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ADE80' }}
          />
        </Flex>
        <Typography.Text
          style={{ color: '#94A3B8', fontSize: 11, letterSpacing: '0.12em' }}
        >
          TERMINAL
        </Typography.Text>
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

export function YamlViewer({ value }: { value: string }) {
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

export function TextViewer({ value }: { value: string }) {
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
    const formatted = Number.isInteger(cores)
      ? `${cores}`
      : cores.toFixed(1).replace(/\.0$/, '');
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
          memoryLimit:
            container.memoryLimit ?? limit?.memoryLimit ?? fallbackLimit?.memoryLimit ?? '-',
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
        render: (value: string) => (
          <Typography.Text ellipsis={{ tooltip: value }}>{value}</Typography.Text>
        ),
      },
      {
        title: '分支@commit',
        key: 'branchCommit',
        width: containerDetailGrid.branchCommit,
        align: 'center',
        render: (_, record) =>
          record.isPrimary && record.branch && record.commit ? (
            <Tag style={{ margin: 0, fontSize: 11 }}>
              {`${record.branch}@${record.commit}`}
            </Tag>
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
        render: (value: number) => (
          <Typography.Text style={{ color: value > 0 ? '#f5222d' : '#666' }}>
            {value}
          </Typography.Text>
        ),
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
              onClick={() =>
                onOpenDialog('logs', `${pod.name}/${record.name} 日志`, `[${record.name}]\n${pod.logs}`)
              }
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

export function PodsView({
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
    setExpandedRowKeys((current) =>
      current.filter((key) => pods.some((pod) => pod.name === key)),
    );
  }, [pods]);

  const dataSource = useMemo<PodTableRow[]>(
    () =>
      pods.map((pod) => {
        const restartCount = pod.containers.reduce(
          (total, container) => total + container.restartCount,
          0,
        );

        return {
          key: pod.name,
          pod,
          restartCount,
        };
      }),
    [pods],
  );

  const toggleRowExpanded = (rowKey: string) => {
    setExpandedRowKeys((current) =>
      current.includes(rowKey)
        ? current.filter((key) => key !== rowKey)
        : [...current, rowKey],
    );
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
              <Typography.Text
                ellipsis={{ tooltip: record.pod.name }}
                style={{ display: 'block', maxWidth: 220 }}
              >
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
          <Typography.Text
            ellipsis={{ tooltip: record.pod.podIP }}
            style={{ display: 'block', maxWidth: 64 }}
          >
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
            <Typography.Text
              ellipsis={{ tooltip: record.pod.node }}
              style={{ display: 'block' }}
            >
              {record.pod.node}
            </Typography.Text>
            <Typography.Text
              type="secondary"
              ellipsis={{ tooltip: record.pod.nodeIP ?? '-' }}
              style={{ display: 'block', fontSize: 12 }}
            >
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
              onClick={() =>
                onOpenDialog('events', `${record.pod.name} 事件`, record.pod.events.join('\n'))
              }
              style={{ paddingInline: 0 }}
            >
              事件
            </Button>
            <Button
              size="small"
              type="link"
              onClick={() => onOpenDialog('yaml', `${record.pod.name} YAML`, record.pod.yaml)}
              style={{ paddingInline: 0 }}
            >
              yaml
            </Button>
          </Flex>
        ),
      },
    ],
    [expandedRowKeys, onOpenDialog],
  );

  return (
    <Card
      styles={{
        body: {
          padding: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        },
      }}
      style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
    >
      <div
        data-pod-table="true"
        data-empty={dataSource.length === 0 ? 'true' : 'false'}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      >
        <Table<PodTableRow>
          size="small"
          rowKey="key"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          scroll={dataSource.length === 0 ? { x: 822, y: '100%' } : { x: 822 }}
          locale={{ emptyText: <Empty description="暂无 Pod" /> }}
          expandable={{
            expandedRowKeys,
            onExpandedRowsChange: (keys) => setExpandedRowKeys([...keys]),
            showExpandColumn: false,
            expandIcon: () => null,
            rowExpandable: (record) => record.pod.containers.length > 0,
            expandedRowRender: (record) => (
              <div style={{ padding: 0 }}>
                <ContainerStatusList
                  pod={record.pod}
                  containerLimitLookup={containerLimitLookup}
                  onOpenDialog={onOpenDialog}
                />
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

          [data-pod-table='true'][data-empty='true'] .ant-table-tbody {
            height: 100%;
          }

          [data-pod-table='true'][data-empty='true'] .ant-table-tbody > tr.ant-table-placeholder {
            height: 100%;
          }

          [data-pod-table='true'][data-empty='true'] .ant-table-tbody > tr.ant-table-placeholder > td {
            padding: 0 !important;
            height: 100%;
            vertical-align: middle;
          }

          [data-pod-table='true'][data-empty='true'] .ant-table-tbody > tr.ant-table-placeholder .ant-empty {
            margin: 0;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          [data-pod-table='true'] .ant-table-expanded-row > td {
            background: #fff;
            padding: 8px 12px !important;
          }

          [data-pod-table='true'] .ant-table-expanded-row-fixed {
            margin: 0 !important;
            padding: 0 !important;
          }

          [data-pod-table='true'] .ant-table-wrapper,
          [data-pod-table='true'] .ant-spin-nested-loading,
          [data-pod-table='true'] .ant-spin-container,
          [data-pod-table='true'] .ant-table,
          [data-pod-table='true'] .ant-table-container,
          [data-pod-table='true'] .ant-table-content,
          [data-pod-table='true'] .ant-table-body {
            display: flex;
            flex-direction: column;
            min-height: 0;
            flex: 1;
          }

          [data-pod-table='true'][data-empty='true'] .ant-table,
          [data-pod-table='true'][data-empty='true'] .ant-table-container,
          [data-pod-table='true'][data-empty='true'] .ant-table-content,
          [data-pod-table='true'][data-empty='true'] .ant-table-body,
          [data-pod-table='true'][data-empty='true'] .ant-table-content > table,
          [data-pod-table='true'][data-empty='true'] .ant-table-body > table {
            height: 100%;
          }

          [data-pod-table='true'][data-empty='true'] .ant-table-content > table > tbody,
          [data-pod-table='true'][data-empty='true'] .ant-table-body > table > tbody {
            height: 100%;
          }

          [data-pod-table='true'] .ant-table-body {
            flex: 1;
          }
          `}
        </style>
      </div>
    </Card>
  );
}

export function TableBottomPagination({
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
    <div data-bottom-pagination="true" style={{ marginTop: 'auto', paddingTop: 10 }}>
      <Table<PaginationRow>
        rowKey="key"
        columns={columns}
        dataSource={[]}
        showHeader={false}
        size="middle"
        pagination={{
          current,
          pageSize,
          total,
          hideOnSinglePage: false,
          showSizeChanger: true,
          pageSizeOptions,
          position: ['bottomCenter'],
          onChange,
        }}
        locale={{ emptyText: null }}
      />
      <style>
        {`
          [data-bottom-pagination='true'] {
            display: flex;
            flex-direction: column;
          }

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
            margin-block-end: 8px;
          }
        `}
      </style>
    </div>
  );
}
