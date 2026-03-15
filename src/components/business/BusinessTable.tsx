import { LinkOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Space, Table, Tag, Typography } from 'antd';
import type { GetProp, TableProps } from 'antd';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { BusinessUnit } from '../../mock';

type ColumnsType<T extends object = object> = TableProps<T>['columns'];
type TablePaginationConfig = Exclude<GetProp<TableProps, 'pagination'>, boolean>;

type BusinessTableProps = {
  businesses: ReadonlyArray<BusinessUnit>;
  onOpenDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

type BusinessTableParams = {
  pagination?: TablePaginationConfig;
};

const DEFAULT_PAGE_SIZE = 10;

function getFilteredBusinesses(items: ReadonlyArray<BusinessUnit>, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return [...items];
  }

  return items.filter(
    (business) =>
      business.name.toLowerCase().includes(normalizedKeyword) ||
      business.desc.toLowerCase().includes(normalizedKeyword),
  );
}

function getPagedBusinesses(items: ReadonlyArray<BusinessUnit>, params: BusinessTableParams) {
  const current = params.pagination?.current ?? 1;
  const pageSize = params.pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const start = (current - 1) * pageSize;

  return items.slice(start, start + pageSize);
}

export function BusinessTable({
  businesses,
  onOpenDetail,
  onEdit,
  onDelete,
}: BusinessTableProps) {
  const [keyword, setKeyword] = useState('');
  const [tableParams, setTableParams] = useState<BusinessTableParams>({
    pagination: {
      current: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      showSizeChanger: true,
      pageSizeOptions: [10, 25, 50, 100],
      position: ['bottomCenter'],
    },
  });

  const filteredBusinesses = useMemo(
    () => getFilteredBusinesses(businesses, keyword),
    [businesses, keyword],
  );
  const dataSource = useMemo(
    () => getPagedBusinesses(filteredBusinesses, tableParams),
    [filteredBusinesses, tableParams],
  );

  useEffect(() => {
    setTableParams((current) => ({
      ...current,
      pagination: {
        ...current.pagination,
        current: 1,
        total: filteredBusinesses.length,
      },
    }));
  }, [keyword, filteredBusinesses.length]);

  const columns: ColumnsType<BusinessUnit> = useMemo(
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

  const handleTableChange: TableProps<BusinessUnit>['onChange'] = (pagination) => {
    setTableParams({
      pagination: {
        ...pagination,
        total: filteredBusinesses.length,
        showSizeChanger: true,
        pageSizeOptions: [10, 25, 50, 100],
        position: ['bottomCenter'],
      },
    });
  };

  return (
    <div
      data-business-table="true"
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
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索名称或描述"
          prefix={<Search size={14} />}
          style={{ width: 280 }}
          allowClear
        />
      </div>

      <div style={{ flex: 1, minHeight: 0, boxSizing: 'border-box', overflow: 'auto' }}>
        <Table<BusinessUnit>
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={dataSource}
          pagination={tableParams.pagination}
          tableLayout="auto"
          scroll={{ x: 850 }}
          size="middle"
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无业务单元" /> }}
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
        [data-business-table='true'] .ant-table-pagination.ant-pagination {
          margin-block-start: auto;
        }
      `}</style>
    </div>
  );
}
