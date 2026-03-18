import { Alert, Button, Descriptions, Drawer, Empty, Space, Spin, Tag, Typography } from 'antd';
import type { CIConfigItem } from '../../../lib/metahub-ci-config';

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
            <Descriptions.Item label="镜像仓库地址">{item.imageRegistry}</Descriptions.Item>
            <Descriptions.Item label="镜像仓库路径">
              <Space direction="vertical" size={4} style={{ display: 'flex' }}>
                <Typography.Text>{item.imageRepo}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  按业务单元名称自动生成，不在表单中配置
                </Typography.Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="完整镜像仓库">{item.fullImageRepo}</Descriptions.Item>
            <Descriptions.Item label="Tag 规则">
              <Tag>{item.tagRuleLabel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Makefile">{item.buildSpec.makefilePath}</Descriptions.Item>
            <Descriptions.Item label="构建命令">{item.buildSpec.makeCommand}</Descriptions.Item>
            <Descriptions.Item label="Dockerfile">{item.buildSpec.dockerfilePath}</Descriptions.Item>
            <Descriptions.Item label="Docker Context">{item.buildSpec.dockerContext}</Descriptions.Item>
            <Descriptions.Item label="最近更新">{item.updatedAt}</Descriptions.Item>
          </Descriptions>
        </Space>
      )}
    </Drawer>
  );
}
