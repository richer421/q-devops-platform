import { RocketOutlined } from '@ant-design/icons';
import { Form, Modal, Select } from 'antd';
import { builds, businesses } from '../../data';

type ExecuteReleaseModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ExecuteReleaseModal({ open, onClose }: ExecuteReleaseModalProps) {
  const [form] = Form.useForm();
  const buId = Form.useWatch('buId', form);
  const buBuilds = builds.filter((build) => build.buId === buId && build.status === 'success');

  return (
    <Modal
      title={
        <>
          <RocketOutlined style={{ color: '#1664FF', marginRight: 8 }} />
          执行发布
        </>
      }
      open={open}
      onOk={() => onClose()}
      onCancel={onClose}
      okText="确认发布"
      cancelText="取消"
      width={440}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="buId" label="业务单元" rules={[{ required: true, message: '请选择业务单元' }]}>
          <Select
            placeholder="请选择业务单元"
            options={businesses.map((item) => ({ value: item.id, label: item.name }))}
            onChange={() => form.setFieldValue('artifactId', undefined)}
          />
        </Form.Item>

        <Form.Item name="artifactId" label="构建产物" rules={[{ required: true, message: '请选择构建产物' }]}>
          <Select
            placeholder="请选择构建产物"
            disabled={!buId}
            options={buBuilds.map((build) => ({
              value: build.id,
              label: `${build.id} · ${build.branch}@${build.commit}`,
            }))}
          />
        </Form.Item>

        <Form.Item name="env" label="发布环境" initialValue="dev">
          <Select
            options={[
              { value: 'dev', label: 'DEV' },
              { value: 'test', label: 'TEST' },
              { value: 'gray', label: 'GRAY' },
              { value: 'prod', label: 'PROD' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
