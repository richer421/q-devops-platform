import { LinkOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Space, Table, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';
import { Search } from 'lucide-react';
import { useMemo } from 'react';

type ColumnsType<T extends object = object> = TableProps<T>['columns'];

export type BusinessTableRow = {
  id: string;
  name: string;
  desc: string;
  repoUrl: string;
  projectName: string;
  projectId: number;
  status: 'active' | 'inactive';
};

type BusinessTableProps = {
  businesses: ReadonlyArray<BusinessTableRow>;
  keyword: string;
  page: number;
  pageSize: number;
  total: number;
  loading?: boolean;
  onOpenDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onKeywordChange: (keyword: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
};

export function BusinessTable({
  businesses,
  keyword,
  page,
  pageSize,
  total,
  loading = false,
  onOpenDetail,
  onEdit,
  onDelete,
  onKeywordChange,
  onPageChange,
}: BusinessTableProps) {
  const isEmpty = businesses.length === 0;

  const columns: ColumnsType<BusinessTableRow> = useMemo(
    () => [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        render: (_, business) => (
          <Button
            type="link"
            onClick={() => onOpenDetail(business.id)}
            style={{ paddingInline: 0, fontSize: 13, textAlign: 'left', justifyContent: 'flex-start', maxWidth: '100%' }}
          >
            <Typography.Text
              ellipsis={{ tooltip: business.name }}
              style={{ maxWidth: 88, color: 'inherit' }}
            >
              {business.name}
            </Typography.Text>
          </Button>
        ),
      },
      {
        title: '描述',
        dataIndex: 'desc',
        key: 'desc',
        minWidth: 200,
        ellipsis: { showTitle: false },
        render: (value) => (
          <Typography.Text
            ellipsis={{ tooltip: String(value) }}
            style={{ maxWidth: '100%', color: '#86909c' }}
          >
            {String(value)}
          </Typography.Text>
        ),
      },
      {
        title: '代码库',
        dataIndex: 'repoUrl',
        key: 'repoUrl',
        minWidth: 250,
        ellipsis: { showTitle: false },
        render: (value) => {
          const repoUrl = String(value ?? '');
          const displayValue = repoUrl.replace('https://', '');

          return repoUrl ? (
            <a
              data-repo-link="true"
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                minWidth: 0,
                maxWidth: '100%',
                color: '#1890ff',
                textDecoration: 'none',
              }}
            >
              <LinkOutlined />
              <Typography.Text
                ellipsis={{ tooltip: displayValue }}
                style={{ maxWidth: '100%', color: 'inherit' }}
              >
                {displayValue}
              </Typography.Text>
            </a>
          ) : (
            '—'
          );
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        width: 100,
        render: (value) => (
          <Tag
            color={value === 'active' ? 'success' : 'default'}
            style={{ fontSize: 12, lineHeight: '18px', marginInlineEnd: 0 }}
          >
            {value === 'active' ? '正常' : '停用'}
          </Tag>
        ),
      },
      {
        title: '操作',
        key: 'action',
        align: 'center',
        fixed: 'right',
        width: 180,
        render: (_, business) => (
          <Space size={8} style={{ justifyContent: 'center', width: '100%' }}>
            <Button
              type="link"
              size="small"
              style={{ paddingInline: 0, fontSize: 12 }}
              onClick={() => onOpenDetail(business.id)}
            >
              详情
            </Button>
            <Button
              type="link"
              size="small"
              style={{ paddingInline: 0, fontSize: 12 }}
              onClick={() => onEdit(business.id)}
            >
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              danger
              style={{ paddingInline: 0, fontSize: 12 }}
              onClick={() => onDelete(business.id)}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ],
    [onDelete, onEdit, onOpenDetail],
  );

  const handleTableChange: TableProps<BusinessTableRow>['onChange'] = (pagination) => {
    onPageChange(pagination.current ?? page, pagination.pageSize ?? pageSize);
  };

  return (
    <div
      data-business-table="true"
      data-empty={isEmpty ? 'true' : 'false'}
      style={{
        height: '100%',
        minHeight: 0,
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        border: '1px solid #e5e6eb',
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
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="搜索名称或描述"
          prefix={<Search size={14} />}
          style={{ width: 280 }}
          allowClear
        />
      </div>

      <div style={{ flex: 1, minHeight: 0, boxSizing: 'border-box', overflow: 'hidden' }}>
        <Table<BusinessTableRow>
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={businesses}
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
          tableLayout="auto"
          scroll={isEmpty ? { x: 850, y: '100%' } : { x: 850 }}
          size="middle"
          locale={{ emptyText: <Empty description="暂无业务单元" /> }}
          onChange={handleTableChange}
        />
      </div>

      <style>{`
        [data-business-table='true'] .ant-table-wrapper,
        [data-business-table='true'] .ant-spin-nested-loading,
        [data-business-table='true'] .ant-spin-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        [data-business-table='true'] .ant-table,
        [data-business-table='true'] .ant-table-container,
        [data-business-table='true'] .ant-table-content {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        [data-business-table='true'] .ant-table-body {
          flex: 1;
          min-height: 0;
        }
        [data-business-table='true'][data-empty='true'] .ant-table,
        [data-business-table='true'][data-empty='true'] .ant-table-container,
        [data-business-table='true'][data-empty='true'] .ant-table-content,
        [data-business-table='true'][data-empty='true'] .ant-table-body {
          height: 100%;
        }
        [data-business-table='true'][data-empty='true'] .ant-table-content > table,
        [data-business-table='true'][data-empty='true'] .ant-table-body > table {
          height: 100%;
        }
        [data-business-table='true'][data-empty='true'] .ant-table-content > table > tbody,
        [data-business-table='true'][data-empty='true'] .ant-table-body > table > tbody {
          height: 100%;
        }
        [data-business-table='true'][data-empty='true'] .ant-table-tbody {
          height: 100%;
        }
        [data-business-table='true'][data-empty='true'] .ant-table-tbody > tr.ant-table-placeholder {
          height: 100%;
        }
        [data-business-table='true'][data-empty='true'] .ant-table-tbody > tr.ant-table-placeholder > td {
          height: 100%;
          padding: 0 !important;
        }
        [data-business-table='true'][data-empty='true'] .ant-table-tbody > tr.ant-table-placeholder .ant-empty {
          height: 100%;
          margin: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        [data-business-table='true'] .ant-table-pagination.ant-pagination {
          margin-block-start: auto;
          margin-block-end: 8px;
        }
      `}</style>
    </div>
  );
}
