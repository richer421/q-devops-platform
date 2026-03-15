import { Button, Modal, Space, Typography } from 'antd';

type BusinessDeleteModalProps = {
  name: string;
  onConfirm: () => void;
  onClose: () => void;
};

export function BusinessDeleteModal({
  name,
  onConfirm,
  onClose,
}: BusinessDeleteModalProps) {
  return (
    <Modal open onCancel={onClose} footer={null} width={420} title="确认删除" destroyOnHidden>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
        确定要删除业务单元 <Typography.Text strong>{name}</Typography.Text> 吗？该操作不可撤销，关联的配置数据也将一并移除。
      </Typography.Paragraph>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button danger onClick={onConfirm}>确认删除</Button>
        </Space>
      </div>
    </Modal>
  );
}
