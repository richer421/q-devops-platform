import { Card, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DeployPlan } from '../../data';
import { getReleaseStatusMeta } from '../../lib/status';
import { EnvTag } from '../common/EnvTag';

type DeployPlansTableProps = {
  plans: DeployPlan[];
};

export function DeployPlansTable({ plans }: DeployPlansTableProps) {
  const columns: ColumnsType<DeployPlan> = [
    {
      title: '计划名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '环境',
      dataIndex: 'env',
      key: 'env',
      render: (envValue: DeployPlan['env']) => <EnvTag env={envValue} />,
    },
    {
      title: 'CI 配置',
      dataIndex: 'ciConfig',
      key: 'ciConfig',
    },
    {
      title: 'CD 配置',
      dataIndex: 'cdConfig',
      key: 'cdConfig',
    },
    {
      title: '实例配置',
      dataIndex: 'instance',
      key: 'instance',
    },
    {
      title: '最近发布',
      dataIndex: 'lastTime',
      key: 'lastTime',
    },
    {
      title: '状态',
      dataIndex: 'lastStatus',
      key: 'lastStatus',
      render: (value: DeployPlan['lastStatus']) => {
        const status =
          value === 'running'
            ? { label: '进行中' }
            : getReleaseStatusMeta(value as 'success' | 'failed' | 'deploying');
        return <Tag>{status.label}</Tag>;
      },
    },
  ];

  return (
    <Card title="部署计划">
      <Table rowKey="id" dataSource={plans} columns={columns} pagination={false} />
    </Card>
  );
}
