import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Select, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';
import {
  AppPage,
  FilterToolbar,
  SectionCard,
  StatusBadge,
} from '@/components/platform';

type BusinessUnitRecord = {
  key: string;
  name: string;
  project: string;
  description: string;
  ciConfigs: number;
  cdConfigs: number;
  deployPlans: number;
  lastBuild: string;
  lastRelease: string;
};

const businessUnits: BusinessUnitRecord[] = [
  {
    key: 'bu-001',
    name: 'web-frontend',
    project: 'frontend-platform',
    description: '主站前端业务单元，承接 PC & H5 全部页面',
    ciConfigs: 2,
    cdConfigs: 2,
    deployPlans: 3,
    lastBuild: '2 分钟前',
    lastRelease: '1 小时前',
  },
  {
    key: 'bu-002',
    name: 'admin-portal',
    project: 'frontend-platform',
    description: '管理后台前端，基于 React + Ant Design',
    ciConfigs: 1,
    cdConfigs: 1,
    deployPlans: 2,
    lastBuild: '1 小时前',
    lastRelease: '3 小时前',
  },
  {
    key: 'bu-003',
    name: 'payment-core',
    project: 'payment-service',
    description: '核心支付逻辑模块，处理交易创建和结算',
    ciConfigs: 1,
    cdConfigs: 2,
    deployPlans: 2,
    lastBuild: '5 分钟前',
    lastRelease: '3 小时前',
  },
  {
    key: 'bu-004',
    name: 'user-auth',
    project: 'user-center',
    description: '用户认证与授权模块，支持 OAuth2 / SSO',
    ciConfigs: 1,
    cdConfigs: 2,
    deployPlans: 3,
    lastBuild: '35 分钟前',
    lastRelease: '2 小时前',
  },
];

const projectToneMap: Record<string, 'primary' | 'success' | 'purple' | 'warning'> = {
  'frontend-platform': 'primary',
  'payment-service': 'success',
  'user-center': 'purple',
  'data-pipeline': 'warning',
};

const BusinessUnitsPage: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [project, setProject] = useState<string>('all');

  const dataSource = useMemo(() => {
    return businessUnits.filter((item) => {
      const keywordMatch =
        item.name.toLowerCase().includes(keyword.toLowerCase()) ||
        item.description.toLowerCase().includes(keyword.toLowerCase());
      const projectMatch = project === 'all' || item.project === project;
      return keywordMatch && projectMatch;
    });
  }, [keyword, project]);

  const columns: ColumnsType<BusinessUnitRecord> = [
    {
      title: '业务单元名称',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#1664FF' }}>{record.name}</div>
        </div>
      ),
    },
    {
      title: '所属项目',
      dataIndex: 'project',
      key: 'project',
      render: (value: string) => (
        <StatusBadge label={value} tone={projectToneMap[value] || 'neutral'} />
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value: string) => (
        <span style={{ fontSize: 12, color: '#4E5969' }}>{value}</span>
      ),
    },
    {
      title: 'CI 配置',
      dataIndex: 'ciConfigs',
      key: 'ciConfigs',
      align: 'center',
    },
    {
      title: 'CD 配置',
      dataIndex: 'cdConfigs',
      key: 'cdConfigs',
      align: 'center',
    },
    {
      title: '部署计划',
      dataIndex: 'deployPlans',
      key: 'deployPlans',
      align: 'center',
    },
    {
      title: '最近构建',
      dataIndex: 'lastBuild',
      key: 'lastBuild',
      render: (value: string) => (
        <span style={{ fontSize: 12, color: '#86909C' }}>{value}</span>
      ),
    },
    {
      title: '最近发布',
      dataIndex: 'lastRelease',
      key: 'lastRelease',
      render: (value: string) => (
        <span style={{ fontSize: 12, color: '#86909C' }}>{value}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size={12}>
          <a style={{ fontSize: 12, color: '#1664FF' }}>详情</a>
          <a style={{ fontSize: 12, color: '#4E5969' }}>编辑</a>
        </Space>
      ),
    },
  ];

  return (
    <AppPage
      title="业务单元"
      subtitle={`共 ${businessUnits.length} 个业务单元，作为应用交付的基本执行单元`}
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          新建业务单元
        </Button>
      }
    >
      <FilterToolbar
        left={
          <>
            <Input
              allowClear
              value={keyword}
              prefix={<SearchOutlined style={{ color: '#86909C' }} />}
              placeholder="搜索业务单元"
              onChange={(event) => setKeyword(event.target.value)}
              style={{ width: 240 }}
            />
            <Select
              value={project}
              onChange={setProject}
              style={{ width: 200 }}
              options={[
                { value: 'all', label: '全部项目' },
                { value: 'frontend-platform', label: 'frontend-platform' },
                { value: 'payment-service', label: 'payment-service' },
                { value: 'user-center', label: 'user-center' },
              ]}
            />
          </>
        }
      />
      <SectionCard bodyPadding={0}>
        <Table
          rowKey="key"
          columns={columns}
          dataSource={dataSource}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </SectionCard>
    </AppPage>
  );
};

export default BusinessUnitsPage;
