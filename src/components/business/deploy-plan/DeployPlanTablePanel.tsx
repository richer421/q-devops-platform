import { Button, Empty, Input, Space, Table, Tooltip, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig, TableProps } from 'antd/es/table';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import type { DeployPlan } from '../../../mock';
import { formatDateTimeYMDHM } from '../../../lib/date-time';
import { EnvTag } from '../../common/EnvTag';

type DeployPlanTablePanelProps = {
  items: ReadonlyArray<DeployPlan>;
  total: number;
  page: number;
  pageSize: number;
  keyword: string;
  loading: boolean;
  onKeywordChange: (value: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onCreate: () => void;
  onView: (item: DeployPlan) => void;
  onEdit: (item: DeployPlan) => void;
  onDelete: (item: DeployPlan) => void;
};

export function DeployPlanTablePanel({
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
}: DeployPlanTablePanelProps) {
  const isEmpty = items.length === 0;

  const columns = useMemo<ColumnsType<DeployPlan>>(
    () => [
      {
        title: '计划名称',
        dataIndex: 'name',
        key: 'name',
        width: 180,
        ellipsis: { showTitle: false },
        render: (value: string) => (
          <Typography.Text ellipsis={{ tooltip: value }} style={{ maxWidth: 220 }}>
            {value}
          </Typography.Text>
        ),
      },
      {
        title: '环境',
        dataIndex: 'env',
        key: 'env',
        align: 'center',
        width: 96,
        render: (value: string) => <EnvTag env={value} />,
      },
      {
        title: 'CI 配置',
        dataIndex: 'ciConfig',
        key: 'ciConfig',
        width: 160,
        ellipsis: { showTitle: false },
        render: (value: string) => (
          <Typography.Text ellipsis={{ tooltip: value }} style={{ maxWidth: 200 }}>
            {value}
          </Typography.Text>
        ),
      },
      {
        title: 'CD 配置',
        dataIndex: 'cdConfig',
        key: 'cdConfig',
        width: 160,
        ellipsis: { showTitle: false },
        render: (value: string) => (
          <Typography.Text ellipsis={{ tooltip: value }} style={{ maxWidth: 200 }}>
            {value}
          </Typography.Text>
        ),
      },
      {
        title: '实例配置',
        dataIndex: 'instance',
        key: 'instance',
        width: 160,
        ellipsis: { showTitle: false },
        render: (value: string) => (
          <Typography.Text ellipsis={{ tooltip: value }} style={{ maxWidth: 200 }}>
            {value}
          </Typography.Text>
        ),
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 140,
        render: (value: string | undefined) => formatDateTimeYMDHM(value),
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

  const handleTableChange: TableProps<DeployPlan>['onChange'] = (nextPagination) => {
    onPageChange(nextPagination.current ?? 1, nextPagination.pageSize ?? 10);
  };

  return (
    <div
      data-deploy-plan-panel="true"
      data-empty={isEmpty ? 'true' : 'false'}
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
        <Input
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="搜索部署计划名称"
          prefix={<Search size={14} />}
          style={{ width: 280 }}
          allowClear
        />
        <Button type="primary" icon={<Plus size={14} />} onClick={onCreate}>
          新建部署计划
        </Button>
      </div>

      <div style={{ flex: 1, minHeight: 0, boxSizing: 'border-box', overflow: 'hidden' }}>
        <Table<DeployPlan>
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={[...items]}
          pagination={pagination}
          loading={loading}
          tableLayout="fixed"
          scroll={isEmpty ? { x: 1080, y: '100%' } : { x: 1080 }}
          size="middle"
          locale={{
            emptyText: <Empty description="暂无部署计划" />,
          }}
          onChange={handleTableChange}
        />
      </div>

      <style>{`
        [data-deploy-plan-panel='true'] .ant-table-wrapper,
        [data-deploy-plan-panel='true'] .ant-spin-nested-loading,
        [data-deploy-plan-panel='true'] .ant-spin-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        [data-deploy-plan-panel='true'] .ant-table,
        [data-deploy-plan-panel='true'] .ant-table-container,
        [data-deploy-plan-panel='true'] .ant-table-content {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        [data-deploy-plan-panel='true'] .ant-table-body {
          flex: 1;
          min-height: 0;
        }
        [data-deploy-plan-panel='true'][data-empty='true'] .ant-table,
        [data-deploy-plan-panel='true'][data-empty='true'] .ant-table-container,
        [data-deploy-plan-panel='true'][data-empty='true'] .ant-table-content,
        [data-deploy-plan-panel='true'][data-empty='true'] .ant-table-body {
          height: 100%;
        }
        [data-deploy-plan-panel='true'][data-empty='true'] .ant-table-content > table,
        [data-deploy-plan-panel='true'][data-empty='true'] .ant-table-body > table {
          height: 100%;
        }
        [data-deploy-plan-panel='true'][data-empty='true'] .ant-table-content > table > tbody,
        [data-deploy-plan-panel='true'][data-empty='true'] .ant-table-body > table > tbody,
        [data-deploy-plan-panel='true'][data-empty='true'] .ant-table-tbody,
        [data-deploy-plan-panel='true'][data-empty='true'] .ant-table-tbody > tr.ant-table-placeholder,
        [data-deploy-plan-panel='true'][data-empty='true'] .ant-table-tbody > tr.ant-table-placeholder > td,
        [data-deploy-plan-panel='true'][data-empty='true'] .ant-table-tbody > tr.ant-table-placeholder .ant-empty {
          height: 100%;
        }
        [data-deploy-plan-panel='true'] .ant-table-tbody > tr.ant-table-placeholder > td {
          padding: 0 !important;
        }
        [data-deploy-plan-panel='true'] .ant-table-tbody > tr.ant-table-placeholder .ant-empty {
          margin: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        [data-deploy-plan-panel='true'] .ant-table-pagination.ant-pagination {
          margin-block-start: auto;
          margin-block-end: 8px;
        }
      `}</style>
    </div>
  );
}
