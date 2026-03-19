import { Button, Checkbox, Form, Input, Modal, Select, Space } from 'antd';
import { Check } from 'lucide-react';
import { useEffect } from 'react';
import type { CIConfigFormValue } from '../../../lib/metahub-ci-config';

type CIConfigFormModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialValue: CIConfigFormValue;
  submitting: boolean;
  onSubmit: (value: CIConfigFormValue) => void;
  onClose: () => void;
};

type FormShape = CIConfigFormValue;

export function CIConfigFormModal({
  open,
  mode,
  initialValue,
  submitting,
  onSubmit,
  onClose,
}: CIConfigFormModalProps) {
  const [form] = Form.useForm<FormShape>();
  const tagRuleType = Form.useWatch('imageTagRuleType', form) ?? initialValue.imageTagRuleType;

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue(initialValue);
  }, [form, initialValue, open]);

  return (
    <Modal
      open={open}
      title={mode === 'create' ? '新建 CI 配置' : '编辑 CI 配置'}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnHidden
    >
      <Form<FormShape>
        form={form}
        layout="vertical"
        initialValues={initialValue}
        onFinish={(value) => {
          const makeCommand = value.makeCommand.trim();
          onSubmit({
            name: value.name.trim(),
            imageTagRuleType: value.imageTagRuleType,
            imageTagTemplate: value.imageTagTemplate?.trim() ?? '',
            withTimestamp: value.withTimestamp ?? false,
            withCommit: value.withCommit ?? false,
            makefilePath: value.makefilePath.trim(),
            makeCommand: makeCommand || 'make build',
            dockerfilePath: value.dockerfilePath.trim(),
          });
        }}
      >
        <Form.Item<FormShape>
          label="名称"
          name="name"
          rules={[{ required: true, message: '请输入 CI 配置名称' }]}
        >
          <Input placeholder="例：api-server" />
        </Form.Item>

        <Form.Item<FormShape>
          label="Tag 规则"
          name="imageTagRuleType"
          rules={[{ required: true, message: '请选择 Tag 规则' }]}
        >
          <Select
            options={[
              { label: '分支名', value: 'branch' },
              { label: 'Git Tag', value: 'tag' },
              { label: 'Commit', value: 'commit' },
              { label: '时间戳', value: 'timestamp' },
              { label: '自定义模板', value: 'custom' },
            ]}
          />
        </Form.Item>

        {tagRuleType === 'branch' ? (
          <Space size={24} style={{ marginBottom: 20 }}>
            <Form.Item<FormShape> name="withTimestamp" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox>追加时间戳</Checkbox>
            </Form.Item>
            <Form.Item<FormShape> name="withCommit" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox>追加 Commit</Checkbox>
            </Form.Item>
          </Space>
        ) : null}

        {tagRuleType === 'custom' ? (
          <Form.Item<FormShape>
            label="自定义模板"
            name="imageTagTemplate"
            rules={[{ required: true, message: '请输入自定义模板' }]}
            extra="支持 ${branch} / ${tag} / ${commit} / ${timestamp}"
          >
            <Input placeholder="例：release-${timestamp}" />
          </Form.Item>
        ) : null}

        <Form.Item<FormShape> label="Makefile 路径" name="makefilePath">
          <Input placeholder="./Makefile" />
        </Form.Item>

        <Form.Item<FormShape> label="构建命令" name="makeCommand">
          <Input placeholder="make build" />
        </Form.Item>

        <Form.Item<FormShape> label="Dockerfile 路径" name="dockerfilePath" style={{ marginBottom: 0 }}>
          <Input placeholder="./Dockerfile" />
        </Form.Item>
      </Form>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            icon={<Check size={14} />}
            loading={submitting}
            onClick={() => void form.submit()}
          >
            {mode === 'create' ? '创建' : '保存'}
          </Button>
        </Space>
      </div>
    </Modal>
  );
}
