import { Card, Empty, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CDConfig, CIConfig, Instance } from '../../data';
import { getInstanceStatusMeta } from '../../lib/status';
import { EnvTag } from '../common/EnvTag';

type ConfigTablesProps = {
  ciConfigs: CIConfig[];
  cdConfigs: CDConfig[];
  instances: Instance[];
};

export function ConfigTables({ ciConfigs, cdConfigs, instances }: ConfigTablesProps) {
  if (ciConfigs.length === 0 && cdConfigs.length === 0 && instances.length === 0) {
    return <Empty description="暂无配置数据" />;
  }

  const ciColumns: ColumnsType<CIConfig> = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '镜像仓库',
      key: 'repo',
      render: (_, record) => `${record.registry}/${record.repo}`,
    },
    { title: 'Tag 规则', dataIndex: 'tagRule', key: 'tagRule' },
    {
      title: '构建类型',
      dataIndex: 'buildType',
      key: 'buildType',
      render: (value: CIConfig['buildType']) => (value === 'dockerfile' ? 'Dockerfile' : 'Makefile'),
    },
  ];

  const cdColumns: ColumnsType<CDConfig> = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '渲染引擎', dataIndex: 'renderEngine', key: 'renderEngine' },
    { title: '发布策略', dataIndex: 'releaseMode', key: 'releaseMode' },
    { title: 'GitOps 仓库', dataIndex: 'gitOpsRepo', key: 'gitOpsRepo' },
  ];

  const instanceColumns: ColumnsType<Instance> = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '环境',
      dataIndex: 'env',
      key: 'env',
      render: (value: Instance['env']) => <EnvTag env={value} />,
    },
    { title: '类型', dataIndex: 'type', key: 'type' },
    {
      title: '就绪',
      key: 'ready',
      render: (_, record) => `${record.readyReplicas}/${record.replicas}`,
    },
    { title: 'CPU', dataIndex: 'cpu', key: 'cpu' },
    { title: '内存', dataIndex: 'memory', key: 'memory' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value: Instance['status']) => {
        const status = getInstanceStatusMeta(value);
        return <Tag color={value === 'running' ? 'success' : value === 'degraded' ? 'warning' : 'error'}>{status.label}</Tag>;
      },
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      {ciConfigs.length > 0 && (
        <Card title="CI 配置">
          <Table rowKey="id" dataSource={ciConfigs} columns={ciColumns} pagination={false} />
        </Card>
      )}

      {cdConfigs.length > 0 && (
        <Card title="CD 配置">
          <Table rowKey="id" dataSource={cdConfigs} columns={cdColumns} pagination={false} />
        </Card>
      )}

      {instances.length > 0 && (
        <Card title="实例">
          <Table
            rowKey="id"
            dataSource={instances}
            columns={instanceColumns}
            pagination={false}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无实例" /> }}
          />
        </Card>
      )}
    </Space>
  );
}
