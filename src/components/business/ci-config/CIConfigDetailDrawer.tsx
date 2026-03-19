import { Alert, Button, Descriptions, Drawer, Empty, Space, Spin, Tag } from 'antd';
import type { CIConfigItem } from '../../../lib/metahub-ci-config';
import { formatDateTimeYMDHM } from '../../../lib/date-time';

type CIConfigDetailDrawerProps = {
  open: boolean;
  loading: boolean;
  error: string;
  item: CIConfigItem | null;
  onClose: () => void;
  onEdit: (item: CIConfigItem) => void;
};

export function CIConfigDetailDrawer({
  open,
  loading,
  error,
  item,
  onClose,
  onEdit,
}: CIConfigDetailDrawerProps) {
  return (
    <Drawer
      open={open}
      width={560}
      title="CI 配置详情"
      onClose={onClose}
      destroyOnHidden
      extra={
        item ? (
          <Button type="primary" onClick={() => onEdit(item)}>
            编辑
          </Button>
        ) : undefined
      }
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Spin />
        </div>
      ) : error ? (
        <Alert type="error" message={error} showIcon />
      ) : !item ? (
        <Empty description="暂无详情数据" />
      ) : (
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
          <Descriptions
            column={1}
            size="small"
            styles={{
              label: { width: 132, fontWeight: 600 },
            }}
          >
            <Descriptions.Item label="名称">{item.name}</Descriptions.Item>
            <Descriptions.Item label="Tag 模板">
              <Tag>{item.tagRuleLabel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Makefile">{item.buildSpec.makefilePath}</Descriptions.Item>
            <Descriptions.Item label="构建命令">{item.buildSpec.makeCommand}</Descriptions.Item>
            <Descriptions.Item label="Dockerfile">{item.buildSpec.dockerfilePath}</Descriptions.Item>
            <Descriptions.Item label="Docker Context">{item.buildSpec.dockerContext}</Descriptions.Item>
            <Descriptions.Item label="最近更新">{formatDateTimeYMDHM(item.updatedAt)}</Descriptions.Item>
          </Descriptions>
        </Space>
      )}
    </Drawer>
  );
}
