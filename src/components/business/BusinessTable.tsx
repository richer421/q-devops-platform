import { Button, Empty, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ExternalLink } from 'lucide-react';
import type { BusinessUnit } from '../../data';

type BusinessTableProps = {
  businesses: BusinessUnit[];
  onOpenDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function BusinessTable({
  businesses,
  onOpenDetail,
  onEdit,
  onDelete,
}: BusinessTableProps) {
  const columns: ColumnsType<BusinessUnit> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      render: (_, business) => (
        <Button
          type="link"
          onClick={() => onOpenDetail(business.id)}
          style={{ fontSize: 13 }}
        >
          {business.name}
        </Button>
      ),
    },
    {
      title: '描述',
      dataIndex: 'desc',
      key: 'desc',
      render: (value: string) => <Typography.Text type="secondary">{value || '—'}</Typography.Text>,
    },
    {
      title: '代码库',
      dataIndex: 'repoUrl',
      key: 'repoUrl',
      render: (repoUrl: string) =>
        repoUrl ? (
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <ExternalLink size={12} />
            <span>{repoUrl.replace('https://', '')}</span>
          </a>
        ) : (
          '—'
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: BusinessUnit['status']) => (
        <Tag
          color={status === 'active' ? 'success' : 'default'}
          style={{ fontSize: 12, lineHeight: '18px', marginInlineEnd: 0 }}
        >
          {status === 'active' ? '正常' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right',
      render: (_, business) => (
        <Space size={8}>
          <Button size="small" style={{ fontSize: 12 }} onClick={() => onOpenDetail(business.id)}>
            详情
          </Button>
          <Button size="small" style={{ fontSize: 12 }} onClick={() => onEdit(business.id)}>
            编辑
          </Button>
          <Button size="small" danger style={{ fontSize: 12 }} onClick={() => onDelete(business.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div data-business-table="true" style={{ height: '100%' }}>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={businesses}
        pagination={false}
        scroll={{ x: 1000, y: '100%' }}
        size="middle"
        style={{ height: '100%' }}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无业务单元" /> }}
      />
      <style>{`
        [data-business-table='true'] .ant-table-wrapper,
        [data-business-table='true'] .ant-spin-nested-loading,
        [data-business-table='true'] .ant-spin-container,
        [data-business-table='true'] .ant-table,
        [data-business-table='true'] .ant-table-container {
          height: 100%;
        }
      `}</style>
    </div>
  );
}
