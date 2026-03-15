import { Button, Form, Input, Modal, Space } from 'antd';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';

export type BusinessFormValue = {
  name: string;
  desc: string;
  repoUrl: string;
};

type BusinessModalProps = {
  title: string;
  initialValue: BusinessFormValue;
  confirmText?: string;
  onConfirm: (value: BusinessFormValue) => void;
  onClose: () => void;
};

export function BusinessModal({
  title,
  initialValue,
  confirmText = '确认',
  onConfirm,
  onClose,
}: BusinessModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <Modal open title={title} onCancel={onClose} footer={null} width={520} destroyOnHidden>
      <Form layout="vertical">
        <Form.Item label="名称" required>
          <Input
            value={value.name}
            onChange={(event) => setValue((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="例：api-server"
          />
        </Form.Item>

        <Form.Item label="描述">
          <Input.TextArea
            value={value.desc}
            onChange={(event) => setValue((prev) => ({ ...prev, desc: event.target.value }))}
            rows={3}
            placeholder="简要描述该业务单元的用途"
          />
        </Form.Item>

        <Form.Item label="代码库地址" style={{ marginBottom: 0 }}>
          <Input
            value={value.repoUrl}
            onChange={(event) => setValue((prev) => ({ ...prev, repoUrl: event.target.value }))}
            placeholder="https://github.com/org/repo"
          />
        </Form.Item>
      </Form>

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            icon={<Check size={14} />}
            disabled={!value.name.trim()}
            onClick={() =>
              onConfirm({
                name: value.name.trim(),
                desc: value.desc.trim(),
                repoUrl: value.repoUrl.trim(),
              })
            }
          >
            {confirmText}
          </Button>
        </Space>
      </div>
    </Modal>
  );
}
