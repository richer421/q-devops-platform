import {
  AlertOutlined,
  ApartmentOutlined,
  BuildOutlined,
  CloudServerOutlined,
  DeploymentUnitOutlined,
  RocketOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Area } from '@ant-design/plots';
import { Button, Col, List, Progress, Row, Space } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import {
  AppPage,
  MetricCard,
  SectionCard,
  StatusBadge,
} from '@/components/platform';

const trendData = [
  { day: '03/08', value: 45, type: '构建' },
  { day: '03/09', value: 42, type: '构建' },
  { day: '03/10', value: 51, type: '构建' },
  { day: '03/11', value: 47, type: '构建' },
  { day: '03/12', value: 55, type: '构建' },
  { day: '03/13', value: 53, type: '构建' },
  { day: '03/08', value: 14, type: '发布' },
  { day: '03/09', value: 12, type: '发布' },
  { day: '03/10', value: 18, type: '发布' },
  { day: '03/11', value: 16, type: '发布' },
  { day: '03/12', value: 20, type: '发布' },
  { day: '03/13', value: 18, type: '发布' },
];

const activities = [
  { id: 'BUILD-0053', desc: 'payment-service / main 构建成功', tone: 'success' as const, time: '2 分钟前' },
  { id: 'RELEASE-0023', desc: 'user-auth / prod 发布进行中', tone: 'primary' as const, time: '5 分钟前' },
  { id: 'BUILD-0052', desc: 'data-pipeline / feature-v2 构建失败', tone: 'danger' as const, time: '12 分钟前' },
  { id: 'RELEASE-0022', desc: 'payment-core / prod 发布成功', tone: 'success' as const, time: '23 分钟前' },
];

const pendingItems = [
  { title: 'payment-service v2.3.0 发布审批', tone: 'danger' as const },
  { title: 'ml-inference 生产环境扩容申请', tone: 'warning' as const },
  { title: 'MinIO 存储扩容紧急处理', tone: 'danger' as const },
];

const infraItems = [
  { name: 'Jenkins', health: 100, tone: 'success' as const },
  { name: 'Harbor', health: 100, tone: 'success' as const },
  { name: 'ArgoCD', health: 82, tone: 'warning' as const },
  { name: 'MinIO', health: 48, tone: 'danger' as const },
];

const chartConfig = {
  data: trendData,
  xField: 'day',
  yField: 'value',
  seriesField: 'type',
  smooth: true,
  legend: {
    position: 'top-right' as const,
  },
  color: ['#1664FF', '#00B42A'],
  areaStyle: {
    fillOpacity: 0.12,
  },
  xAxis: {
    label: {
      style: {
        fill: '#86909C',
        fontSize: 11,
      },
    },
  },
  yAxis: {
    label: {
      style: {
        fill: '#86909C',
        fontSize: 11,
      },
    },
    grid: {
      line: {
        style: {
          stroke: '#F2F3F5',
        },
      },
    },
  },
};

const isTest = process.env.NODE_ENV === 'test';

const DashboardPage: React.FC = () => {
  return (
    <AppPage
      title="平台总览"
      subtitle={`今日 ${dayjs().format('YYYY年M月D日')} · 所有数据实时更新`}
      extra={
        <Button icon={<SyncOutlined />} size="middle">
          刷新
        </Button>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <MetricCard
            label="项目总数"
            value="12"
            icon={<ApartmentOutlined />}
            accent="#1664FF"
            accentSoft="#E8F3FF"
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <MetricCard
            label="业务单元"
            value="48"
            icon={<DeploymentUnitOutlined />}
            accent="#7B61FF"
            accentSoft="#F0ECFF"
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <MetricCard
            label="部署计划"
            value="36"
            icon={<RocketOutlined />}
            accent="#FF7D00"
            accentSoft="#FFF7E8"
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <MetricCard
            label="今日构建"
            value="53"
            icon={<BuildOutlined />}
            accent="#00B42A"
            accentSoft="#E8FFEA"
            subtext="成功率 88.7%"
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <MetricCard
            label="今日发布"
            value="18"
            icon={<RocketOutlined />}
            accent="#1664FF"
            accentSoft="#E8F3FF"
            subtext="成功率 88.9%"
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <MetricCard
            label="待处理事项"
            value="3"
            icon={<AlertOutlined />}
            accent="#F53F3F"
            accentSoft="#FFECE8"
            subtext="2 项紧急"
          />
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={16}>
          <SectionCard title="构建 & 发布趋势">
            {isTest ? (
              <div
                style={{
                  height: 260,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#86909C',
                  fontSize: 12,
                  background: 'linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%)',
                }}
              >
                趋势图表预览
              </div>
            ) : (
              <Area {...chartConfig} height={260} />
            )}
          </SectionCard>
        </Col>
        <Col xs={24} xl={8}>
          <SectionCard title="基础设施状态摘要">
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {infraItems.map((item) => (
                <div key={item.name}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <Space size={8}>
                      <CloudServerOutlined style={{ color: '#86909C' }} />
                      <span style={{ fontSize: 13, color: '#1D2129' }}>{item.name}</span>
                    </Space>
                    <StatusBadge
                      label={item.tone === 'success' ? '正常' : item.tone === 'warning' ? '告警' : '异常'}
                      tone={item.tone}
                    />
                  </div>
                  <Progress
                    percent={item.health}
                    showInfo={false}
                    strokeColor={
                      item.tone === 'success'
                        ? '#1664FF'
                        : item.tone === 'warning'
                          ? '#FF7D00'
                          : '#F53F3F'
                    }
                    trailColor="#F2F3F5"
                    size={{ height: 6 }}
                  />
                </div>
              ))}
            </Space>
          </SectionCard>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={16}>
          <SectionCard title="最近活动" extra={<a style={{ color: '#1664FF', fontSize: 12 }}>查看全部</a>}>
            <List
              dataSource={activities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space size={12}>
                        <StatusBadge label={item.id} tone={item.tone} />
                        <span style={{ fontSize: 13, color: '#1D2129' }}>{item.desc}</span>
                      </Space>
                    }
                    description={<span style={{ fontSize: 11, color: '#86909C' }}>{item.time}</span>}
                  />
                </List.Item>
              )}
            />
          </SectionCard>
        </Col>
        <Col xs={24} xl={8}>
          <SectionCard title="待处理事项">
            <List
              dataSource={pendingItems}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    <StatusBadge label={item.tone === 'danger' ? '紧急' : '待确认'} tone={item.tone} />
                    <span style={{ fontSize: 13, color: '#1D2129' }}>{item.title}</span>
                  </Space>
                </List.Item>
              )}
            />
          </SectionCard>
        </Col>
      </Row>
    </AppPage>
  );
};

export default DashboardPage;
