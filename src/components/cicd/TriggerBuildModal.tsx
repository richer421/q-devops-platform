import { PlayCircleOutlined } from '@ant-design/icons';
import { Form, Input, Modal, Radio, Select, Typography } from 'antd';
import { useEffect, type UIEvent } from 'react';
import type { TriggerBuildPayload } from '@/utils/api/q-ci/build';

const { Text } = Typography;

type SelectOption = {
  value: number;
  label: string;
};

type TriggerBuildModalProps = {
  open: boolean;
  onClose: () => void;
  businessUnitOptions: ReadonlyArray<SelectOption>;
  deployPlanOptions: ReadonlyArray<SelectOption>;
  businessUnitID?: number;
  deployPlanID?: number;
  businessUnitOptionLoading?: boolean;
  deployPlanOptionLoading?: boolean;
  submitting?: boolean;
  onBusinessUnitChange: (value: number | undefined) => void;
  onDeployPlanChange: (value: number | undefined) => void;
  onBusinessUnitSearch: (keyword: string) => void;
  onDeployPlanSearch: (keyword: string) => void;
  onBusinessUnitLoadMore: () => void;
  onDeployPlanLoadMore: () => void;
  onSubmit: (value: TriggerBuildPayload) => Promise<void>;
};

type FormShape = {
  businessUnitID?: number;
  deployPlanID?: number;
  refType: TriggerBuildPayload['refType'];
  refValue: string;
};

export function TriggerBuildModal({
  open,
  onClose,
  businessUnitOptions,
  deployPlanOptions,
  businessUnitID,
  deployPlanID,
  businessUnitOptionLoading = false,
  deployPlanOptionLoading = false,
  submitting = false,
  onBusinessUnitChange,
  onDeployPlanChange,
  onBusinessUnitSearch,
  onDeployPlanSearch,
  onBusinessUnitLoadMore,
  onDeployPlanLoadMore,
  onSubmit,
}: TriggerBuildModalProps) {
  const [form] = Form.useForm();

  const isNearPopupBottom = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    return target.scrollHeight - target.scrollTop - target.clientHeight < 24;
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue({
      businessUnitID,
      deployPlanID,
      refType: 'branch',
      refValue: 'main',
    } satisfies FormShape);
  }, [businessUnitID, deployPlanID, form, open]);

  return (
    <Modal
      title={
        <>
          <PlayCircleOutlined style={{ color: '#1664FF', marginRight: 8 }} />
          触发构建
        </>
      }
      open={open}
      onOk={() => form.submit()}
      onCancel={onClose}
      okText="确认触发"
      cancelText="取消"
      width={440}
      destroyOnHidden
      confirmLoading={submitting}
    >
      <Form<FormShape>
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
        onFinish={async (value) => {
          await onSubmit({
            deployPlanID: value.deployPlanID ?? 0,
            refType: value.refType,
            refValue: value.refValue,
          });
          form.resetFields();
          onClose();
        }}
      >
        <Form.Item
          name="businessUnitID"
          label="业务单元"
          rules={[{ required: true, message: '请选择业务单元' }]}
        >
          <Select
            data-testid="trigger-build-business-unit"
            placeholder="请选择业务单元"
            options={[...businessUnitOptions]}
            loading={businessUnitOptionLoading}
            showSearch
            filterOption={false}
            onSearch={onBusinessUnitSearch}
            onPopupScroll={(event) => {
              if (isNearPopupBottom(event)) {
                onBusinessUnitLoadMore();
              }
            }}
            onChange={(value) => {
              onBusinessUnitChange(value);
              onDeployPlanChange(undefined);
              form.setFieldValue('deployPlanID', undefined);
            }}
          />
        </Form.Item>

        <Form.Item
          name="deployPlanID"
          label="部署计划"
          rules={[{ required: true, message: '请选择部署计划' }]}
        >
          <Select
            data-testid="trigger-build-deploy-plan"
            placeholder="请选择部署计划"
            options={[...deployPlanOptions]}
            loading={deployPlanOptionLoading}
            disabled={!businessUnitID}
            showSearch
            filterOption={false}
            onSearch={onDeployPlanSearch}
            onPopupScroll={(event) => {
              if (isNearPopupBottom(event)) {
                onDeployPlanLoadMore();
              }
            }}
            onChange={onDeployPlanChange}
          />
        </Form.Item>

        <Form.Item
          name="refType"
          label="代码版本类型"
          rules={[{ required: true, message: '请选择代码版本类型' }]}
        >
          <Radio.Group
            aria-label="代码版本类型"
            options={[
              { value: 'branch', label: 'Branch' },
              { value: 'tag', label: 'Tag' },
            ]}
            optionType="button"
            buttonStyle="solid"
          />
        </Form.Item>

        <Form.Item
          name="refValue"
          label="代码版本值"
          rules={[{ required: true, message: '请输入代码版本值' }]}
          initialValue="main"
        >
          <Input placeholder="例如：main / v1.2.3 / a1b2c3d4" />
        </Form.Item>
      </Form>

      <div style={{ background: '#F7F8FA', borderRadius: 8, padding: 12 }}>
        <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>
          触发后将按部署计划读取静态 CI 配置，并以本次选择的 Branch 或 Tag 驱动 Jenkins 构建，成功后推送到 Harbor。
        </Text>
      </div>
    </Modal>
  );
}
