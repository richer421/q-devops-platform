import { Col, Row, Statistic } from 'antd';
import { businesses, cdConfigs, ciConfigs, deployPlans, instances } from '../../data';

const metricItems = [
  { label: '业务单元', value: businesses.length },
  { label: '部署计划', value: deployPlans.length },
  { label: 'CI 配置', value: ciConfigs.length },
  { label: '实例', value: instances.length },
  { label: 'CD 配置', value: cdConfigs.length },
];

export function BusinessMetrics() {
  return (
    <Row gutter={12}>
      {metricItems.map((item) => (
        <Col key={item.label} span={24 / metricItems.length}>
          <Statistic title={item.label} value={item.value} />
        </Col>
      ))}
    </Row>
  );
}
