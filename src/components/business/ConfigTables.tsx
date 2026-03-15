import { Empty, Input, Table, Tag, Typography } from 'antd';
import type { GetProp, TableProps } from 'antd';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { CDConfig, CIConfig, Instance } from '../../mock';
import { getInstanceStatusMeta } from '../../lib/status';
import { EnvTag } from '../common/EnvTag';

type ColumnsType<T extends object = object> = TableProps<T>['columns'];
type TablePaginationConfig = Exclude<GetProp<TableProps, 'pagination'>, boolean>;

type CIConfigsTableProps = {
  configs: ReadonlyArray<CIConfig>;
};

type CDConfigsTableProps = {
  configs: ReadonlyArray<CDConfig>;
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
        }
      `}</style>
    </div>
  );
}

export function CDConfigsTable({ configs }: CDConfigsTableProps) {
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
        config.renderEngine,
        config.releaseMode,
        config.gitOpsRepo,
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

  const columns: ColumnsType<CDConfig> = useMemo(
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
      { title: '渲染引擎', dataIndex: 'renderEngine', key: 'renderEngine', width: 120 },
      { title: '发布策略', dataIndex: 'releaseMode', key: 'releaseMode', width: 120 },
      {
        title: 'GitOps 仓库',
        dataIndex: 'gitOpsRepo',
        key: 'gitOpsRepo',
        width: 300,
        ellipsis: { showTitle: false },
        render: (value) => (
          <Typography.Text ellipsis={{ tooltip: String(value) }} style={{ maxWidth: 300 }}>
            {String(value)}
          </Typography.Text>
        ),
      },
    ],
    [],
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
      <div style={{ padding: 16, borderBottom: '1px solid #e5e6eb', flexShrink: 0 }}>
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索 CD 配置"
          prefix={<Search size={14} />}
          style={{ width: 280 }}
          allowClear
        />
      </div>
      <div style={{ flex: 1, minHeight: 0, boxSizing: 'border-box', overflow: 'auto' }}>
        <Table<CDConfig>
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={dataSource}
          pagination={tableParams.pagination}
          scroll={{ x: 960 }}
          size="middle"
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 CD 配置" /> }}
          onChange={createTableChangeHandler<CDConfig>(filteredConfigs.length, setTableParams)}
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
