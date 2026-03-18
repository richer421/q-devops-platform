import { Button, Form, Input, Modal, Select, Space, Typography } from 'antd';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { projectCatalog } from '../../lib/project-catalog';

export type BusinessFormValue = {
  name: string;
  desc: string;
  projectId: number;
};

type BusinessModalProps = {
  title: string;
  mode: 'create' | 'edit';
  initialValue: BusinessFormValue;
  confirmText?: string;
  onConfirm: (value: BusinessFormValue) => void;
  onClose: () => void;
};

function formatProjectLabel(name: string, repoUrl: string) {
  return `${name} (${repoUrl})`;
}

function renderProjectLabel(name: string, repoUrl: string) {
  return (
    <span>
      {name}
      {' ('}
      <Typography.Link
        href={repoUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {repoUrl}
      </Typography.Link>
      {')'}
    </span>
  );
}

const projectOptions = projectCatalog.map((item) => ({
  label: formatProjectLabel(item.name, item.repoUrl),
  value: item.id,
  repoName: item.name,
  repoUrl: item.repoUrl,
}));

export function BusinessModal({
  title,
  mode,
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

        <Form.Item label="代码库" style={{ marginBottom: 0 }}>
          <Select
            value={value.projectId}
            onChange={(projectId) => setValue((prev) => ({ ...prev, projectId }))}
            options={projectOptions}
            labelRender={(option) => {
              const selectedOption = projectOptions.find((item) => item.value === Number(option.value));
              if (!selectedOption) {
                return option.label ?? option.value;
              }

              return renderProjectLabel(selectedOption.repoName, selectedOption.repoUrl);
            }}
            optionRender={(option) => {
              const data = option.data as (typeof projectOptions)[number];

              return renderProjectLabel(data.repoName, data.repoUrl);
            }}
            disabled={mode === 'edit'}
          />
        </Form.Item>
      </Form>

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            icon={<Check size={14} />}
            disabled={!value.name.trim() || !value.projectId}
            onClick={() =>
              onConfirm({
                name: value.name.trim(),
                desc: value.desc.trim(),
                projectId: value.projectId,
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
