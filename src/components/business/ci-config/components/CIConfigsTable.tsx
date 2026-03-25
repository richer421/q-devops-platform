import { Empty, Input, Table, Typography } from 'antd';
import type { GetProp, TableProps } from 'antd';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { TablePanelShell } from '@/components/common/table-shell';
import type { CIConfig } from '@/mock';

type ColumnsType<T extends object = object> = TableProps<T>['columns'];
type TablePaginationConfig = Exclude<GetProp<TableProps, 'pagination'>, boolean>;

type CIConfigsTableProps = {
  configs: ReadonlyArray<CIConfig>;
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
      hideOnSinglePage: false,
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
        hideOnSinglePage: false,
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
      [config.name, config.registry, config.repo, config.tagRule, config.buildType].some((value) =>
        String(value).toLowerCase().includes(normalizedKeyword),
      ),
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

  const isEmpty = dataSource.length === 0;

  return (
    <TablePanelShell
      isEmpty={isEmpty}
      scopeAttrName="data-ci-configs-table"
      header={(
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
      )}
    >
      <Table<CIConfig>
        rowKey={(record) => record.id}
        columns={columns}
        dataSource={dataSource}
        pagination={tableParams.pagination}
        scroll={isEmpty ? { x: 960, y: '100%' } : { x: 960 }}
        size="middle"
        locale={{ emptyText: <Empty description="暂无 CI 配置" /> }}
        onChange={createTableChangeHandler<CIConfig>(filteredConfigs.length, setTableParams)}
      />
    </TablePanelShell>
  );
}
