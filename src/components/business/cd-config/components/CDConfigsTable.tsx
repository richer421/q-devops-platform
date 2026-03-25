import { Button, Empty, Input, Select, Space, Table, Tooltip, Typography } from 'antd';
import type { TableProps } from 'antd';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { TablePanelShell } from '@/components/common/table-shell';
import type { CDConfig } from '@/mock';
import { EnvTag } from '@/components/common/env';
import { formatDateTimeYMDHM } from '@/utils/format/date-time';

type ColumnsType<T extends object = object> = TableProps<T>['columns'];

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
  const isEmpty = configs.length === 0;

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
    [onDelete, onDetail, onEdit],
  );

  return (
    <TablePanelShell
      isEmpty={isEmpty}
      scopeAttrName="data-cd-configs-table"
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
      )}
    >
      <Table<CDConfig>
        rowKey={(record) => record.id}
        columns={columns}
        dataSource={configs}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          hideOnSinglePage: false,
          showSizeChanger: true,
          pageSizeOptions: [10, 25, 50, 100],
          position: ['bottomCenter'],
        }}
        scroll={isEmpty ? { x: 960, y: '100%' } : { x: 960 }}
        size="middle"
        locale={{ emptyText: <Empty description="暂无 CD 配置" /> }}
        onChange={(pagination) => onPageChange(pagination.current ?? 1, pagination.pageSize ?? 10)}
      />
    </TablePanelShell>
  );
}
