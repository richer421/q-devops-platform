import {
  CaretRightOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Input, Select, Space, Table, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';
import {
  AppPage,
  CodeTag,
  FilterToolbar,
  SectionCard,
  StatusBadge,
} from '@/components/platform';

type BuildRecord = {
  key: string;
  planId: string;
  bu: string;
  branch: string;
  commit: string;
  status: 'success' | 'failed' | 'primary';
  imageRef: string;
  duration: string;
  startTime: string;
  finishTime: string;
  error?: string;
};

type ConfigRecord = {
  key: string;
  name: string;
  bu: string;
  registry: string;
  repo: string;
  tagRule: string;
  buildType: string;
  lastBuild: string;
};

type ArtifactRecord = {
  key: string;
  bu: string;
  imageRef: string;
  tag: string;
  digest: string;
  size: string;
  status: 'primary' | 'success';
  buildTime: string;
};

const buildRecords: BuildRecord[] = [
  {
    key: 'BUILD-0053',
    planId: 'dp-003',
    bu: 'payment-core',
    branch: 'main',
    commit: 'a3f82bc',
    status: 'success',
    imageRef: 'harbor.platform.io/payment/core:main-a3f82bc',
    duration: '3分20秒',
    startTime: '14:35:22',
    finishTime: '14:38:42',
  },
  {
    key: 'BUILD-0052',
    planId: 'dp-007',
    bu: 'data-ingestion',
    branch: 'feature-v2',
    commit: 'c91de3a',
    status: 'failed',
    imageRef: '',
    duration: '1分05秒',
    startTime: '14:23:10',
    finishTime: '14:24:15',
    error: 'Makefile target not found: build-v2',
  },
  {
    key: 'BUILD-0051',
    planId: 'dp-008',
    bu: 'gateway-core',
    branch: 'main',
    commit: 'b57ef1d',
    status: 'success',
    imageRef: 'harbor.platform.io/gateway/core:main-b57ef1d',
    duration: '2分45秒',
    startTime: '14:10:05',
    finishTime: '14:12:50',
  },
];

const ciConfigs: ConfigRecord[] = [
  {
    key: 'ci-web-prod',
    name: 'ci-web-prod',
    bu: 'web-frontend',
    registry: 'harbor.platform.io',
    repo: 'frontend/web',
    tagRule: String.raw`\${branch}-\${commit:7}`,
    buildType: 'Dockerfile',
    lastBuild: '2 分钟前',
  },
  {
    key: 'ci-pay-prod',
    name: 'ci-pay-prod',
    bu: 'payment-core',
    registry: 'harbor.platform.io',
    repo: 'payment/core',
    tagRule: String.raw`\${tag}`,
    buildType: 'Makefile',
    lastBuild: '5 分钟前',
  },
];

const artifacts: ArtifactRecord[] = [
  {
    key: 'ART-0053',
    bu: 'payment-core',
    imageRef: 'harbor.platform.io/payment/core:main-a3f82bc',
    tag: 'main-a3f82bc',
    digest: 'sha256:8f3a9c...',
    size: '148 MB',
    status: 'primary',
    buildTime: '14:38:42',
  },
  {
    key: 'ART-0049',
    bu: 'web-frontend',
    imageRef: 'harbor.platform.io/frontend/web:2.14.3',
    tag: '2.14.3',
    digest: 'sha256:f1a3b9...',
    size: '231 MB',
    status: 'success',
    buildTime: '12:23:55',
  },
];

const CIBuildsPage: React.FC = () => {
  const [tab, setTab] = useState('builds');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');

  const filteredBuilds = useMemo(() => {
    return buildRecords.filter((record) => {
      const keywordMatch =
        record.key.toLowerCase().includes(keyword.toLowerCase()) ||
        record.bu.toLowerCase().includes(keyword.toLowerCase()) ||
        record.branch.toLowerCase().includes(keyword.toLowerCase());
      const statusMatch = status === 'all' || record.status === status;
      return keywordMatch && statusMatch;
    });
  }, [keyword, status]);

  const buildColumns: ColumnsType<BuildRecord> = [
    {
      title: '构建 ID',
      dataIndex: 'key',
      key: 'key',
      render: (value: string) => <CodeTag>{value}</CodeTag>,
    },
    {
      title: '业务单元',
      dataIndex: 'bu',
      key: 'bu',
    },
    {
      title: '分支 / Commit',
      key: 'ref',
      render: (_, record) => (
        <Space size={8}>
          <span>{record.branch}</span>
          <CodeTag>{record.commit}</CodeTag>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value: BuildRecord['status']) => (
        <StatusBadge
          label={value === 'success' ? '成功' : value === 'failed' ? '失败' : '进行中'}
          tone={value === 'success' ? 'success' : value === 'failed' ? 'danger' : 'primary'}
        />
      ),
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
    },
    {
      title: '镜像地址',
      dataIndex: 'imageRef',
      key: 'imageRef',
      render: (value: string) => (value ? <CodeTag>{value}</CodeTag> : <span style={{ color: '#C9CDD4' }}>—</span>),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size={12}>
          <a style={{ fontSize: 12, color: '#1664FF' }}>Jenkins</a>
          <a style={{ fontSize: 12, color: '#4E5969' }}>重新构建</a>
        </Space>
      ),
    },
  ];

  const configColumns: ColumnsType<ConfigRecord> = [
    { title: '配置名称', dataIndex: 'name', key: 'name' },
    { title: '业务单元', dataIndex: 'bu', key: 'bu', render: (value: string) => <CodeTag>{value}</CodeTag> },
    { title: '镜像仓库', dataIndex: 'registry', key: 'registry' },
    { title: '镜像路径', dataIndex: 'repo', key: 'repo', render: (value: string) => <CodeTag>{value}</CodeTag> },
    { title: 'Tag 规则', dataIndex: 'tagRule', key: 'tagRule', render: (value: string) => <CodeTag tone="purple">{value}</CodeTag> },
    { title: '构建类型', dataIndex: 'buildType', key: 'buildType' },
    { title: '最近构建', dataIndex: 'lastBuild', key: 'lastBuild' },
  ];

  const artifactColumns: ColumnsType<ArtifactRecord> = [
    { title: '产物 ID', dataIndex: 'key', key: 'key', render: (value: string) => <CodeTag>{value}</CodeTag> },
    { title: '业务单元', dataIndex: 'bu', key: 'bu' },
    { title: '镜像地址', dataIndex: 'imageRef', key: 'imageRef', render: (value: string) => <CodeTag>{value}</CodeTag> },
    { title: 'Tag', dataIndex: 'tag', key: 'tag', render: (value: string) => <CodeTag tone="purple">{value}</CodeTag> },
    { title: 'Digest', dataIndex: 'digest', key: 'digest', render: (value: string) => <CodeTag>{value}</CodeTag> },
    { title: '大小', dataIndex: 'size', key: 'size' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value: ArtifactRecord['status']) => (
        <StatusBadge label={value === 'success' ? '已部署' : '可用'} tone={value} />
      ),
    },
    { title: '构建时间', dataIndex: 'buildTime', key: 'buildTime' },
  ];

  return (
    <AppPage
      title="CI 构建中心"
      subtitle="管理构建配置、触发构建并追踪构建产物"
      extra={
        <>
          <Button icon={<PlusOutlined />}>新建 CI 配置</Button>
          <Button type="primary" icon={<CaretRightOutlined />}>
            触发构建
          </Button>
        </>
      }
    >
      <SectionCard bodyPadding={0}>
        <Tabs
          activeKey={tab}
          onChange={setTab}
          style={{ paddingInline: 16 }}
          items={[
            { key: 'builds', label: '构建记录' },
            { key: 'config', label: 'CI 配置' },
            { key: 'artifacts', label: '构建产物' },
          ]}
        />
        {tab === 'builds' ? (
          <div style={{ padding: 16, paddingTop: 0 }}>
            <FilterToolbar
              left={
                <>
                  <Input
                    allowClear
                    value={keyword}
                    prefix={<SearchOutlined style={{ color: '#86909C' }} />}
                    placeholder="搜索构建 ID / 业务单元 / 分支"
                    onChange={(event) => setKeyword(event.target.value)}
                    style={{ width: 280 }}
                  />
                  <Select
                    value={status}
                    onChange={setStatus}
                    style={{ width: 160 }}
                    options={[
                      { value: 'all', label: '全部状态' },
                      { value: 'success', label: '成功' },
                      { value: 'failed', label: '失败' },
                      { value: 'primary', label: '进行中' },
                    ]}
                  />
                </>
              }
            />
            <div style={{ marginTop: 16 }}>
              <Table
                rowKey="key"
                columns={buildColumns}
                dataSource={filteredBuilds}
                expandable={{
                  expandedRowRender: (record) => (
                    <Space direction="vertical" size={8}>
                      <div style={{ fontSize: 12, color: '#4E5969' }}>
                        部署计划：<CodeTag>{record.planId}</CodeTag>
                      </div>
                      <div style={{ fontSize: 12, color: '#4E5969' }}>
                        结束时间：{record.finishTime}
                      </div>
                      {record.error ? (
                        <div style={{ fontSize: 12, color: '#F53F3F' }}>
                          错误信息：{record.error}
                        </div>
                      ) : null}
                    </Space>
                  ),
                }}
                pagination={false}
              />
            </div>
          </div>
        ) : null}
        {tab === 'config' ? (
          <Table rowKey="key" columns={configColumns} dataSource={ciConfigs} pagination={false} />
        ) : null}
        {tab === 'artifacts' ? (
          <Table rowKey="key" columns={artifactColumns} dataSource={artifacts} pagination={false} />
        ) : null}
      </SectionCard>
    </AppPage>
  );
};

export default CIBuildsPage;
