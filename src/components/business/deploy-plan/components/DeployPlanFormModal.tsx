import { Button, Form, Input, Modal, Select, Space } from 'antd';
import { useEffect } from 'react';
import type { DeployPlanFormValue } from '@/utils/api/metahub/deploy-plan';
import { EnvTag } from '@/components/common/env';

type DeployPlanOption = {
  value: number;
  label: string;
};

type DeployPlanInstanceOption = DeployPlanOption & {
  env: string;
  searchLabel: string;
};

type DeployPlanFormModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialValue: DeployPlanFormValue;
  submitting: boolean;
  optionLoading: boolean;
  ciOptions: ReadonlyArray<DeployPlanOption>;
  cdOptions: ReadonlyArray<DeployPlanOption>;
  instanceOptions: ReadonlyArray<DeployPlanInstanceOption>;
  onSubmit: (value: DeployPlanFormValue) => void;
  onClose: () => void;
};

type FormShape = DeployPlanFormValue;

function renderInstanceOptionLabel(name: string, env: string) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{name}</span>
      <EnvTag env={env} />
    </div>
  );
}

export function DeployPlanFormModal({
  open,
  mode,
  initialValue,
  submitting,
  optionLoading,
  ciOptions,
  cdOptions,
  instanceOptions,
  onSubmit,
  onClose,
}: DeployPlanFormModalProps) {
  const [form] = Form.useForm<FormShape>();

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue(initialValue);
  }, [form, initialValue, open]);

  return (
    <Modal
      open={open}
      title={mode === 'create' ? '新建部署计划' : '编辑部署计划'}
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
          onSubmit({
            name: value.name.trim(),
            description: value.description.trim(),
            ciConfigID: value.ciConfigID,
            cdConfigID: value.cdConfigID,
            instanceOAMID: value.instanceOAMID,
          });
        }}
      >
        <Form.Item<FormShape>
          label="名称"
          name="name"
          rules={[{ required: true, message: '请输入部署计划名称' }]}
        >
          <Input aria-label="名称" placeholder="例：api-server-prod" />
        </Form.Item>

        <Form.Item<FormShape> label="描述" name="description">
          <Input.TextArea aria-label="描述" placeholder="可选，补充部署计划说明" rows={3} />
        </Form.Item>

        <Form.Item<FormShape>
          label="CI 配置"
          name="ciConfigID"
          rules={[{ required: true, message: '请选择 CI 配置' }]}
        >
          <Select
            showSearch
            placeholder="选择 CI 配置"
            options={[...ciOptions]}
            loading={optionLoading}
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item<FormShape>
          label="CD 配置"
          name="cdConfigID"
          rules={[{ required: true, message: '请选择 CD 配置' }]}
        >
          <Select
            showSearch
            placeholder="选择 CD 配置"
            options={[...cdOptions]}
            loading={optionLoading}
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item<FormShape>
          label="实例配置"
          name="instanceOAMID"
          rules={[{ required: true, message: '请选择实例配置' }]}
          style={{ marginBottom: 0 }}
        >
          <Select
            showSearch
            placeholder="选择实例配置"
            options={[...instanceOptions]}
            loading={optionLoading}
            filterOption={(input, option) =>
              String(option?.searchLabel ?? option?.label ?? '')
                .toLowerCase()
                .includes(input.trim().toLowerCase())
            }
            labelRender={(option) => {
              const selectedOption = instanceOptions.find((item) => item.value === Number(option.value));
              if (!selectedOption) {
                return option.label ?? option.value;
              }

              return renderInstanceOptionLabel(selectedOption.label, selectedOption.env);
            }}
            optionRender={(option) => {
              const data = option.data as DeployPlanInstanceOption;
              return renderInstanceOptionLabel(data.label, data.env);
            }}
          />
        </Form.Item>
      </Form>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            aria-label={mode === 'create' ? '创建' : '保存'}
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
