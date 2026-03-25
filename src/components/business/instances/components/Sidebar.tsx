import {
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Card, Empty, Flex, Input, List, Select, Tag, Typography } from 'antd';
import type { Instance } from '@/mock';
import { EnvTag } from '@/components/common/env';
import { getInstanceRuntimeStatusLabel } from './draft';
import { TableBottomPagination } from './PodViews';

type BusinessInstancesSidebarProps = {
  instances: ReadonlyArray<Instance>;
  activeInstance?: Instance;
  total: number;
  page: number;
  pageSize: number;
  keyword: string;
  envFilter: string;
  loading: boolean;
  canCreate: boolean;
  canDelete: boolean;
  paginationOptions: number[];
  onPageChange?: (page: number, pageSize: number) => void;
  onKeywordChange?: (value: string) => void;
  onEnvFilterChange?: (value: string) => void;
  onSelectInstance: (instanceID: string) => void;
  onOpenCreate: () => void;
  onRequestDelete: (instanceID: string) => void;
};

export function BusinessInstancesSidebar({
  instances,
  activeInstance,
  total,
  page,
  pageSize,
  keyword,
  envFilter,
  loading,
  canCreate,
  canDelete,
  paginationOptions,
  onPageChange,
  onKeywordChange,
  onEnvFilterChange,
  onSelectInstance,
  onOpenCreate,
  onRequestDelete,
}: BusinessInstancesSidebarProps) {
  const envFilterOptions = [
    { label: '全部环境', value: 'all' },
    ...Array.from(
      new Set(['dev', 'test', 'gray', 'prod', ...instances.map((item) => item.env.toLowerCase())]),
    )
      .filter((value, index, values) => {
        if (value === 'all') {
          return false;
        }
        return values.indexOf(value) === index;
      })
      .map((env) => ({
        label:
          {
            dev: '开发',
            test: '测试',
            gray: '灰度',
            prod: '生产',
          }[env] ?? env,
        value: env,
      })),
  ];

  return (
    <Card
      title="业务实例"
      extra={(
        <Button
          size="small"
          type="primary"
          icon={<PlusOutlined />}
          onClick={onOpenCreate}
          disabled={!canCreate}
        >
          创建实例
        </Button>
      )}
      loading={loading}
      styles={{
        header: { paddingInline: 16 },
        body: {
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          height: '100%',
        },
      }}
      style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ marginBottom: 8 }}>
        <Flex gap={8} align="center">
          <Select
            style={{ width: 118 }}
            value={envFilter}
            options={envFilterOptions}
            onChange={(value) => onEnvFilterChange?.(value)}
            disabled={loading}
          />
          <Input
            value={keyword}
            allowClear
            placeholder="名称模糊匹配"
            prefix={<SearchOutlined />}
            onChange={(event) => onKeywordChange?.(event.target.value)}
            disabled={loading}
          />
        </Flex>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {instances.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无匹配实例" />
        ) : (
          <List
            dataSource={[...instances]}
            renderItem={(instance) => {
              const statusLabel = getInstanceRuntimeStatusLabel(instance);
              const selected = activeInstance?.id === instance.id;

              return (
                <List.Item style={{ padding: 0, border: 'none' }}>
                  <div
                    role="button"
                    aria-label={`选择实例 ${instance.name}`}
                    tabIndex={0}
                    onClick={() => onSelectInstance(instance.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectInstance(instance.id);
                      }
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: 'none',
                      background: selected ? '#F7FAFF' : '#fff',
                      padding: 16,
                      cursor: 'pointer',
                      borderBottom: '1px solid #F2F3F5',
                    }}
                  >
                    <Flex align="center" justify="space-between" gap={12}>
                      <div style={{ minWidth: 0 }}>
                        <Typography.Text strong ellipsis style={{ display: 'block' }}>
                          {instance.name}
                        </Typography.Text>
                        <Flex align="center" gap={8} wrap={false} style={{ marginTop: 8 }}>
                          <EnvTag env={instance.env} />
                          <Tag
                            style={{
                              margin: 0,
                              border: 'none',
                              borderRadius: 999,
                              background: '#F2F3F5',
                              color: '#4E5969',
                            }}
                          >
                            {instance.type}
                          </Tag>
                          <Tag style={{ margin: 0, border: 'none', borderRadius: 999 }}>
                            {statusLabel}
                          </Tag>
                        </Flex>
                      </div>
                      {selected && canDelete ? (
                        <Button
                          size="small"
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          aria-label={`删除实例 ${instance.name}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onRequestDelete(instance.id);
                          }}
                        >
                          删除
                        </Button>
                      ) : null}
                    </Flex>
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </div>
      <TableBottomPagination
        current={page}
        pageSize={pageSize}
        total={total}
        pageSizeOptions={paginationOptions}
        onChange={(nextPage, nextPageSize) => onPageChange?.(nextPage, nextPageSize)}
      />
    </Card>
  );
}
