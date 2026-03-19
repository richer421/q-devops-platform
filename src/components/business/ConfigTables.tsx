import { Button, Empty, Input, Select, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { GetProp, TableProps } from 'antd';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { CDConfig, CIConfig, Instance } from '../../mock';
import { formatDateTimeYMDHM } from '../../lib/date-time';
import { getInstanceStatusMeta } from '../../lib/status';
import { EnvTag } from '../common/EnvTag';

type ColumnsType<T extends object = object> = TableProps<T>['columns'];
type TablePaginationConfig = Exclude<GetProp<TableProps, 'pagination'>, boolean>;

type CIConfigsTableProps = {
  configs: ReadonlyArray<CIConfig>;
};

type CDConfigsTableProps = {
  configs: ReadonlyArray<CDConfig>;
  keyword: string;
  releaseRegion: string;
  releaseEnv: string;
  deploymentMode: string;
  page: number;
  pageSize: number;
  total: number;
  loading?: boolean;
  onKeywordChange: (value: string) => void;
  onReleaseRegionChange: (value: string) => void;
  onReleaseEnvChange: (value: string) => void;
  onDeploymentModeChange: (value: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onCreate: () => void;
  onDetail: (config: CDConfig) => void;
  onEdit: (config: CDConfig) => void;
  onDelete: (config: CDConfig) => void;
};

type InstancesTableProps = {
  instances: ReadonlyArray<Instance>;
};

type LocalTableParams = {
  pagination?: TablePaginationConfig;
};

const DEFAULT_PAGE_SIZE = 10;

function getPagedItems<T>(items: ReadonlyArray<T>, params: LocalTableParams) {
  const current = params.pagination?.current ?? 1;
  const pageSize = params.pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const start = (current - 1) * pageSize;

  return items.slice(start, start + pageSize);
}

function createDefaultTableParams(): LocalTableParams {
  return {
    pagination: {
      current: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      showSizeChanger: true,
      pageSizeOptions: [10, 25, 50, 100],
      position: ['bottomCenter'],
    },
  };
}

function createTableChangeHandler<T>(
  total: number,
  setTableParams: (params: LocalTableParams) => void,
): TableProps<T>['onChange'] {
  return (pagination) => {
    setTableParams({
      pagination: {
        ...pagination,
        total,
        showSizeChanger: true,
        pageSizeOptions: [10, 25, 50, 100],
        position: ['bottomCenter'],
      },
    });
  };
}

export function CIConfigsTable({ configs }: CIConfigsTableProps) {
  const [keyword, setKeyword] = useState('');
  const [tableParams, setTableParams] = useState<LocalTableParams>(createDefaultTableParams);

  const filteredConfigs = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return [...configs];
    }

    return configs.filter((config) =>
      [
        config.name,
        config.registry,
        config.repo,
        config.tagRule,
        config.buildType,
      ].some((value) => String(value).toLowerCase().includes(normalizedKeyword)),
    );
  }, [configs, keyword]);

  const dataSource = useMemo(
    () => getPagedItems(filteredConfigs, tableParams),
    [filteredConfigs, tableParams],
  );

  useEffect(() => {
    setTableParams((current) => ({
      ...current,
      pagination: {
        ...current.pagination,
        current: 1,
        total: filteredConfigs.length,
      },
    }));
  }, [filteredConfigs.length, keyword]);

  const columns: ColumnsType<CIConfig> = useMemo(
    () => [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        ellipsis: { showTitle: false },
        render: (value) => (
          <Typography.Text ellipsis={{ tooltip: String(value) }} style={{ maxWidth: 220 }}>
            {String(value)}
          </Typography.Text>
        ),
      },
      {
        title: '镜像仓库',
        key: 'repo',
        width: 300,
        ellipsis: { showTitle: false },
        render: (_, record) => (
          <Typography.Text
            ellipsis={{ tooltip: `${record.registry}/${record.repo}` }}
            style={{ maxWidth: 300 }}
          >
            {record.registry}/{record.repo}
          </Typography.Text>
        ),
      },
      {
        title: 'Tag 规则',
        dataIndex: 'tagRule',
        key: 'tagRule',
        width: 220,
        ellipsis: { showTitle: false },
        render: (value) => (
          <Typography.Text ellipsis={{ tooltip: String(value) }} style={{ maxWidth: 220 }}>
            {String(value)}
          </Typography.Text>
        ),
      },
      {
        title: '构建类型',
        dataIndex: 'buildType',
        key: 'buildType',
        align: 'center',
        width: 108,
        render: (value) => (value === 'dockerfile' ? 'Dockerfile' : 'Makefile'),
      },
    ],
    [],
  );

  return (
    <div
      data-ci-configs-table="true"
      style={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: 16, borderBottom: '1px solid #e5e6eb', flexShrink: 0 }}>
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索 CI 配置"
          prefix={<Search size={14} />}
          style={{ width: 280 }}
          allowClear
        />
      </div>
      <div style={{ flex: 1, minHeight: 0, boxSizing: 'border-box', overflow: 'auto' }}>
        <Table<CIConfig>
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={dataSource}
          pagination={tableParams.pagination}
          scroll={{ x: 960 }}
          size="middle"
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 CI 配置" /> }}
          onChange={createTableChangeHandler<CIConfig>(filteredConfigs.length, setTableParams)}
        />
      </div>
      <style>{`
        [data-ci-configs-table='true'] .ant-table-wrapper,
        [data-ci-configs-table='true'] .ant-spin-nested-loading,
        [data-ci-configs-table='true'] .ant-spin-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        [data-ci-configs-table='true'] .ant-table-pagination.ant-pagination {
          margin-block-start: auto;
          padding-block-start: 10px;
          padding-block-end: 6px;
        }
      `}</style>
    </div>
  );
}

export function CDConfigsTable({
  configs,
  keyword,
  releaseRegion,
  releaseEnv,
  deploymentMode,
  page,
  pageSize,
  total,
  loading = false,
  onKeywordChange,
  onReleaseRegionChange,
  onReleaseEnvChange,
  onDeploymentModeChange,
  onPageChange,
  onCreate,
  onDetail,
  onEdit,
  onDelete,
}: CDConfigsTableProps) {
  const columns: ColumnsType<CDConfig> = useMemo(
    () => [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        ellipsis: { showTitle: false },
        width: 120,
        render: (value) => (
          <Typography.Text ellipsis={{ tooltip: String(value) }} style={{ width: 120 }}>
            {String(value)}
          </Typography.Text>
        ),
      },
      { title: '发布区域', dataIndex: 'releaseRegion', key: 'releaseRegion', width: 120 },
      {
        title: '发布环境',
        dataIndex: 'releaseEnv',
        key: 'releaseEnv',
        width: 120,
        render: (value: string) => <EnvTag env={value} />,
      },
      { title: '发布策略', dataIndex: 'deploymentMode', key: 'deploymentMode', width: 120 },
      {
        title: '策略摘要',
        dataIndex: 'strategySummary',
        key: 'strategySummary',
        width: 260,
        ellipsis: { showTitle: false },
        render: (value) => (
          <Typography.Text ellipsis={{ tooltip: String(value) }} style={{ maxWidth: 260 }}>
            {String(value)}
          </Typography.Text>
        ),
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 100,
        render: (value: string | undefined) => formatDateTimeYMDHM(value),
      },
      {
        title: '操作',
        key: 'action',
        align: 'center',
        width: 184,
        fixed: 'right',
        render: (_, record) => (
          <Space size={4}>
            <Button type="link" onClick={() => onDetail(record)}>
              详情
            </Button>
            <Tooltip title="编辑">
              <Button type="text" aria-label={`编辑 ${record.name}`} icon={<Pencil size={14} />} onClick={() => onEdit(record)} />
            </Tooltip>
            <Tooltip title="删除">
              <Button type="text" danger aria-label={`删除 ${record.name}`} icon={<Trash2 size={14} />} onClick={() => onDelete(record)} />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [onDelete, onDetail, onEdit],
  );

  return (
    <div
      data-cd-configs-table="true"
      style={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: '1px solid #e5e6eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        <Space wrap size={12}>
          <Input
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="搜索 CD 配置"
            prefix={<Search size={14} />}
            style={{ width: 240 }}
            allowClear
          />
          <Select
            value={releaseRegion}
            onChange={onReleaseRegionChange}
            style={{ width: 140 }}
            options={[
              { value: '全部', label: '全部区域' },
              { value: '华东', label: '华东' },
              { value: '华北', label: '华北' },
              { value: '新加坡', label: '新加坡' },
            ]}
          />
          <Select
            value={releaseEnv}
            onChange={onReleaseEnvChange}
            style={{ width: 140 }}
            options={[
              { value: '全部', label: '全部环境' },
              { value: '开发', label: '开发' },
              { value: '测试', label: '测试' },
              { value: '灰度', label: '灰度' },
              { value: '生产', label: '生产' },
            ]}
          />
          <Select
            value={deploymentMode}
            onChange={onDeploymentModeChange}
            style={{ width: 140 }}
            options={[
              { value: '全部', label: '全部策略' },
              { value: '滚动发布', label: '滚动发布' },
              { value: '金丝雀发布', label: '金丝雀发布' },
            ]}
          />
        </Space>
        <Button type="primary" icon={<Plus size={14} />} onClick={onCreate}>
          新建 CD 配置
        </Button>
      </div>
      <div style={{ flex: 1, minHeight: 0, boxSizing: 'border-box', overflow: 'auto' }}>
        <Table<CDConfig>
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={configs}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 25, 50, 100],
            position: ['bottomCenter'],
          }}
          scroll={{ x: 960 }}
          size="middle"
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 CD 配置" /> }}
          onChange={(pagination) => onPageChange(pagination.current ?? 1, pagination.pageSize ?? 10)}
        />
      </div>
      <style>{`
        [data-cd-configs-table='true'] .ant-table-wrapper,
        [data-cd-configs-table='true'] .ant-spin-nested-loading,
        [data-cd-configs-table='true'] .ant-spin-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        [data-cd-configs-table='true'] .ant-table-pagination.ant-pagination {
          margin-block-start: auto;
          padding-block-start: 10px;
          padding-block-end: 6px;
        }
      `}</style>
    </div>
  );
}

export function InstancesTable({ instances }: InstancesTableProps) {
  const [keyword, setKeyword] = useState('');
  const [tableParams, setTableParams] = useState<LocalTableParams>(createDefaultTableParams);

  const filteredInstances = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return [...instances];
    }

    return instances.filter((instance) =>
      [
        instance.name,
        instance.env,
        instance.type,
        instance.cpu,
        instance.memory,
        instance.status,
      ].some((value) => String(value).toLowerCase().includes(normalizedKeyword)),
    );
  }, [instances, keyword]);

  const dataSource = useMemo(
    () => getPagedItems(filteredInstances, tableParams),
    [filteredInstances, tableParams],
  );

  useEffect(() => {
    setTableParams((current) => ({
      ...current,
      pagination: {
        ...current.pagination,
        current: 1,
        total: filteredInstances.length,
      },
    }));
  }, [filteredInstances.length, keyword]);

  const columns: ColumnsType<Instance> = useMemo(
    () => [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        ellipsis: { showTitle: false },
        render: (value) => (
          <Typography.Text ellipsis={{ tooltip: String(value) }} style={{ maxWidth: 220 }}>
            {String(value)}
          </Typography.Text>
        ),
      },
      {
        title: '环境',
        dataIndex: 'env',
        key: 'env',
        align: 'center',
        width: 96,
        render: (value) => <EnvTag env={value as Instance['env']} />,
      },
      { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
      {
        title: '就绪',
        key: 'ready',
        align: 'right',
        width: 96,
        render: (_, record) => `${record.readyReplicas}/${record.replicas}`,
      },
      { title: 'CPU', dataIndex: 'cpu', key: 'cpu', align: 'right', width: 100 },
      { title: '内存', dataIndex: 'memory', key: 'memory', align: 'right', width: 100 },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        width: 96,
        render: (value) => {
          const status = getInstanceStatusMeta(value as Instance['status']);

          return (
            <Tag color={value === 'running' ? 'success' : value === 'degraded' ? 'warning' : 'default'}>
              {status.label}
            </Tag>
          );
        },
      },
    ],
    [],
  );

  return (
    <div
      data-instances-table="true"
      style={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: 16, borderBottom: '1px solid #e5e6eb', flexShrink: 0 }}>
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索实例"
          prefix={<Search size={14} />}
          style={{ width: 280 }}
          allowClear
        />
      </div>
      <div style={{ flex: 1, minHeight: 0, boxSizing: 'border-box', overflow: 'auto' }}>
        <Table<Instance>
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={dataSource}
          pagination={tableParams.pagination}
          scroll={{ x: 1040 }}
          size="middle"
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无实例" /> }}
          onChange={createTableChangeHandler<Instance>(filteredInstances.length, setTableParams)}
        />
      </div>
      <style>{`
        [data-instances-table='true'] .ant-table-wrapper,
        [data-instances-table='true'] .ant-spin-nested-loading,
        [data-instances-table='true'] .ant-spin-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        [data-instances-table='true'] .ant-table-pagination.ant-pagination {
          margin-block-start: auto;
        }
      `}</style>
    </div>
  );
}
