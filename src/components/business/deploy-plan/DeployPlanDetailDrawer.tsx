import { Alert, Button, Descriptions, Drawer, Empty, Spin } from 'antd';
import type { DeployPlan } from '../../../mock';
import { formatDateTimeYMDHM } from '../../../lib/date-time';
import { EnvTag } from '../../common/EnvTag';

type DeployPlanDetailDrawerProps = {
  open: boolean;
  loading: boolean;
  error: string;
  item: DeployPlan | null;
  onClose: () => void;
  onEdit: (item: DeployPlan) => void;
};

export function DeployPlanDetailDrawer({
  open,
  loading,
  error,
  item,
  onClose,
  onEdit,
}: DeployPlanDetailDrawerProps) {
  return (
    <Drawer
      open={open}
      width={560}
      title="部署计划详情"
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
        <Descriptions
          column={1}
          size="small"
          styles={{
            label: { width: 132, fontWeight: 600 },
          }}
        >
          <Descriptions.Item label="名称">{item.name}</Descriptions.Item>
          <Descriptions.Item label="描述">{item.description?.trim() || '-'}</Descriptions.Item>
          <Descriptions.Item label="环境">
            <EnvTag env={item.env} />
          </Descriptions.Item>
          <Descriptions.Item label="CI 配置">{item.ciConfig}</Descriptions.Item>
          <Descriptions.Item label="CD 配置">{item.cdConfig}</Descriptions.Item>
          <Descriptions.Item label="实例配置">{item.instance}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDateTimeYMDHM(item.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDateTimeYMDHM(item.updatedAt)}</Descriptions.Item>
        </Descriptions>
      )}
    </Drawer>
  );
}
