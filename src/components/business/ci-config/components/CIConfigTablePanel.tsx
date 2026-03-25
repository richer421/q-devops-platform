import { Button, Empty, Input, Space, Table, Tooltip, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig, TableProps } from 'antd/es/table';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { TablePanelShell } from '@/components/common/table-shell';
import type { CIConfigItem } from '@/utils/api/metahub/ci-config';

type CIConfigTablePanelProps = {
  items: ReadonlyArray<CIConfigItem>;
  total: number;
  page: number;
  pageSize: number;
  keyword: string;
  loading: boolean;
  onKeywordChange: (value: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onCreate: () => void;
  onView: (item: CIConfigItem) => void;
  onEdit: (item: CIConfigItem) => void;
  onDelete: (item: CIConfigItem) => void;
};

function formatDateTime(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

export function CIConfigTablePanel({
  items,
  total,
  page,
  pageSize,
  keyword,
  loading,
  onKeywordChange,
  onPageChange,
  onCreate,
  onView,
  onEdit,
  onDelete,
}: CIConfigTablePanelProps) {
  const isEmpty = items.length === 0;

  const columns = useMemo<ColumnsType<CIConfigItem>>(
    () => [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        onHeaderCell: () => ({ style: { minWidth: 260 } }),
        onCell: () => ({ style: { minWidth: 260 } }),
        ellipsis: { showTitle: false },
        render: (value: string) => (
          <Typography.Text ellipsis={{ tooltip: value }} style={{ maxWidth: 260 }}>
            {value}
          </Typography.Text>
        ),
      },
      {
        title: 'Tag 模板',
        dataIndex: 'tagRuleLabel',
        key: 'tagRuleLabel',
        width: 180,
        ellipsis: { showTitle: false },
        render: (value: string) => (
          <Typography.Text ellipsis={{ tooltip: value }} style={{ maxWidth: 320 }}>
            {value}
          </Typography.Text>
        ),
      },
      {
        title: 'Makefile',
        key: 'makefilePath',
        width: 140,
        ellipsis: { showTitle: false },
        render: (_, record) => (
          <Typography.Text ellipsis={{ tooltip: record.buildSpec.makefilePath }} style={{ maxWidth: 180 }}>
            {record.buildSpec.makefilePath}
          </Typography.Text>
        ),
      },
      {
        title: 'Dockerfile',
        key: 'dockerfilePath',
        width: 140,
        ellipsis: { showTitle: false },
        render: (_, record) => (
          <Typography.Text ellipsis={{ tooltip: record.buildSpec.dockerfilePath }} style={{ maxWidth: 180 }}>
            {record.buildSpec.dockerfilePath}
          </Typography.Text>
        ),
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 100,
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '操作',
        key: 'actions',
        align: 'center',
        width: 180,
        fixed: 'right',
        render: (_, record) => (
          <Space size={4}>
            <Button type="link" onClick={() => onView(record)}>
              详情
            </Button>
            <Tooltip title="编辑">
              <Button
                type="text"
                aria-label={`编辑 ${record.name}`}
                icon={<Pencil size={14} />}
                onClick={() => onEdit(record)}
              />
            </Tooltip>
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                aria-label={`删除 ${record.name}`}
                icon={<Trash2 size={14} />}
                onClick={() => onDelete(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [onDelete, onEdit, onView],
  );

  const pagination = useMemo<TablePaginationConfig>(
    () => ({
      current: page,
      pageSize,
      total,
      hideOnSinglePage: false,
      showSizeChanger: true,
      pageSizeOptions: [10, 25, 50, 100],
      position: ['bottomCenter'],
    }),
    [page, pageSize, total],
  );

  const handleTableChange: TableProps<CIConfigItem>['onChange'] = (nextPagination) => {
    onPageChange(nextPagination.current ?? 1, nextPagination.pageSize ?? 10);
  };

  return (
    <TablePanelShell
      isEmpty={isEmpty}
      scopeAttrName="data-ci-config-panel"
      header={(
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
          <Input
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="搜索 CI 配置名称"
            prefix={<Search size={14} />}
            style={{ width: 280 }}
            allowClear
          />
          <Button type="primary" icon={<Plus size={14} />} onClick={onCreate}>
            新建 CI 配置
          </Button>
        </div>
      )}
    >
      <Table<CIConfigItem>
        rowKey={(record) => record.id}
        columns={columns}
        dataSource={[...items]}
        pagination={pagination}
        loading={loading}
        tableLayout="fixed"
        scroll={isEmpty ? { x: 1220, y: '100%' } : { x: 1220 }}
        size="middle"
        locale={{
          emptyText: <Empty description="暂无 CI 配置" />,
        }}
        onChange={handleTableChange}
      />
    </TablePanelShell>
  );
}
