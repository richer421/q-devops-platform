import { PlayCircleOutlined } from '@ant-design/icons';
import { Form, Input, Modal, Select, Typography } from 'antd';
import { businesses } from '../../data';

const { Text } = Typography;

type TriggerBuildModalProps = {
  open: boolean;
  onClose: () => void;
};

export function TriggerBuildModal({ open, onClose }: TriggerBuildModalProps) {
  const [form] = Form.useForm();

  return (
    <Modal
      title={
        <>
          <PlayCircleOutlined style={{ color: '#1664FF', marginRight: 8 }} />
          触发构建
        </>
      }
      open={open}
      onOk={() => onClose()}
      onCancel={onClose}
      okText="确认触发"
      cancelText="取消"
      width={440}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="buId" label="业务单元" rules={[{ required: true, message: '请选择业务单元' }]}>
          <Select
            placeholder="请选择业务单元"
            options={businesses.map((item) => ({ value: item.id, label: item.name }))}
          />
        </Form.Item>
        <Form.Item name="branch" label="分支 / Tag" initialValue="main">
          <Input />
        </Form.Item>
      </Form>

      <div style={{ background: '#F7F8FA', borderRadius: 8, padding: 12 }}>
        <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>
          触发后将使用该业务单元绑定的 CI 配置执行构建，镜像推送至对应仓库后可用于发布。
        </Text>
      </div>
    </Modal>
  );
}
