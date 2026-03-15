import { Empty, Input, Table, Tag, Typography } from 'antd';
import type { GetProp, TableProps } from 'antd';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { DeployPlan } from '../../mock';
import { getReleaseStatusMeta } from '../../lib/status';
import { EnvTag } from '../common/EnvTag';

type ColumnsType<T extends object = object> = TableProps<T>['columns'];
type TablePaginationConfig = Exclude<GetProp<TableProps, 'pagination'>, boolean>;

type DeployPlansTableProps = {
  plans: ReadonlyArray<DeployPlan>;
};

type DeployPlansTableParams = {
  pagination?: TablePaginationConfig;
};

const DEFAULT_PAGE_SIZE = 10;

function getFilteredPlans(items: ReadonlyArray<DeployPlan>, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return [...items];
  }

  return items.filter((plan) =>
    [
      plan.name,
      plan.env,
      plan.ciConfig,
      plan.cdConfig,
      plan.instance,
      plan.lastTime,
    ].some((value) => String(value).toLowerCase().includes(normalizedKeyword)),
  );
}

function getPagedPlans(items: ReadonlyArray<DeployPlan>, params: DeployPlansTableParams) {
  const current = params.pagination?.current ?? 1;
  const pageSize = params.pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const start = (current - 1) * pageSize;

  return items.slice(start, start + pageSize);
}

export function DeployPlansTable({ plans }: DeployPlansTableProps) {
  const [keyword, setKeyword] = useState('');
  const [tableParams, setTableParams] = useState<DeployPlansTableParams>({
    pagination: {
      current: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      showSizeChanger: true,
      pageSizeOptions: [10, 25, 50, 100],
      position: ['bottomCenter'],
    },
  });

  const filteredPlans = useMemo(() => getFilteredPlans(plans, keyword), [plans, keyword]);
  const dataSource = useMemo(() => getPagedPlans(filteredPlans, tableParams), [filteredPlans, tableParams]);

  useEffect(() => {
    setTableParams((current) => ({
      ...current,
      pagination: {
        ...current.pagination,
        current: 1,
        total: filteredPlans.length,
      },
    }));
  }, [keyword, filteredPlans.length]);

  const columns: ColumnsType<DeployPlan> = useMemo(
    () => [
      {
        title: '计划名称',
        dataIndex: 'name',
        key: 'name',
        ellipsis: { showTitle: false },
        render: (value) => (
          <Typography.Text
            ellipsis={{ tooltip: String(value) }}
            style={{ maxWidth: 220 }}
          >
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
        render: (value) => <EnvTag env={value as DeployPlan['env']} />,
      },
      {
        title: 'CI 配置',
        dataIndex: 'ciConfig',
        key: 'ciConfig',
        width: 180,
        ellipsis: { showTitle: false },
        render: (value) => (
          <Typography.Text ellipsis={{ tooltip: String(value) }} style={{ maxWidth: 180 }}>
            {String(value)}
          </Typography.Text>
        ),
      },
      {
        title: 'CD 配置',
        dataIndex: 'cdConfig',
        key: 'cdConfig',
        width: 180,
        ellipsis: { showTitle: false },
        render: (value) => (
          <Typography.Text ellipsis={{ tooltip: String(value) }} style={{ maxWidth: 180 }}>
            {String(value)}
          </Typography.Text>
        ),
      },
      {
        title: '实例配置',
        dataIndex: 'instance',
        key: 'instance',
        width: 160,
        ellipsis: { showTitle: false },
        render: (value) => (
          <Typography.Text ellipsis={{ tooltip: String(value) }} style={{ maxWidth: 160 }}>
            {String(value)}
          </Typography.Text>
        ),
      },
      {
        title: '最近发布',
        dataIndex: 'lastTime',
        key: 'lastTime',
        width: 120,
      },
      {
        title: '状态',
        dataIndex: 'lastStatus',
        key: 'lastStatus',
        align: 'center',
        width: 96,
        render: (value) => {
          const status =
            value === 'running'
              ? { label: '进行中' }
              : getReleaseStatusMeta(value as 'success' | 'failed' | 'deploying');

          return <Tag>{status.label}</Tag>;
        },
      },
    ],
    [],
  );

  const handleTableChange: TableProps<DeployPlan>['onChange'] = (pagination) => {
    setTableParams({
      pagination: {
        ...pagination,
        total: filteredPlans.length,
        showSizeChanger: true,
        pageSizeOptions: [10, 25, 50, 100],
        position: ['bottomCenter'],
      },
    });
  };

  return (
    <div
      data-deploy-plans-table="true"
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
          flexShrink: 0,
        }}
      >
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索部署计划"
          prefix={<Search size={14} />}
          style={{ width: 280 }}
          allowClear
        />
      </div>

      <div style={{ flex: 1, minHeight: 0, boxSizing: 'border-box', overflow: 'auto' }}>
        <Table<DeployPlan>
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={dataSource}
          pagination={tableParams.pagination}
          scroll={{ x: 1080 }}
          size="middle"
          locale={{
            emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无部署计划" />,
          }}
          onChange={handleTableChange}
        />
      </div>

      <style>{`
        [data-deploy-plans-table='true'] .ant-table-wrapper,
        [data-deploy-plans-table='true'] .ant-spin-nested-loading,
        [data-deploy-plans-table='true'] .ant-spin-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        [data-deploy-plans-table='true'] .ant-table-pagination.ant-pagination {
          margin-block-start: auto;
        }
      `}</style>
    </div>
  );
}
