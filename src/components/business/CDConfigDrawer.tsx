import { Button, Drawer, Form, Input, Radio, Select, Space, Switch, Typography } from 'antd';
import { useEffect, useState } from 'react';
import type { CDConfig } from '../../mock';
import type { CDConfigFormValue } from '../../lib/metahub-cd-config';

export type CDConfigDrawerMode = 'detail' | 'create' | 'edit';

type CDConfigDrawerProps = {
  open: boolean;
  mode: CDConfigDrawerMode;
  config?: CDConfig | null;
  loading?: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit?: (value: CDConfigFormValue) => void;
};

const emptyFormValue: CDConfigFormValue = {
  name: '',
  releaseRegion: '华东',
  releaseEnv: '开发',
  deploymentMode: '滚动发布',
};

function toFormValue(config?: CDConfig | null): CDConfigFormValue {
  if (!config) {
    return emptyFormValue;
  }

  return {
    name: config.name,
    releaseRegion: config.releaseRegion,
    releaseEnv: config.releaseEnv,
    deploymentMode: config.deploymentMode,
    trafficBatchCount: config.trafficBatchCount,
    trafficRatioList: config.trafficRatioList,
    manualAdjust: config.manualAdjust,
    adjustTimeoutSeconds: config.adjustTimeoutSeconds,
  };
}

function toRatioInput(value?: number[]) {
  if (!value?.length) {
    return '';
  }
  return value.join(',');
}

export function CDConfigDrawer({
  open,
  mode,
  config,
  loading = false,
  submitting = false,
  onClose,
  onSubmit,
}: CDConfigDrawerProps) {
  const [value, setValue] = useState<CDConfigFormValue>(toFormValue(config));
  const [trafficRatioInput, setTrafficRatioInput] = useState(toRatioInput(config?.trafficRatioList));

  useEffect(() => {
    setValue(toFormValue(config));
    setTrafficRatioInput(toRatioInput(config?.trafficRatioList));
  }, [config, mode, open]);

  const isDetail = mode === 'detail';
  const isCanary = value.deploymentMode === '金丝雀发布';
  const title = mode === 'detail' ? 'CD 配置详情' : mode === 'create' ? '新建 CD 配置' : '编辑 CD 配置';

  const handleSubmit = () => {
    if (!onSubmit) {
      return;
    }

    const nextValue: CDConfigFormValue = {
      ...value,
      name: value.name.trim(),
      trafficRatioList: isCanary
        ? trafficRatioInput
            .split(',')
            .map((item) => Number(item.trim()))
            .filter((item) => Number.isFinite(item) && item > 0)
        : undefined,
    };

    if (!isCanary) {
      nextValue.trafficBatchCount = undefined;
      nextValue.manualAdjust = undefined;
      nextValue.adjustTimeoutSeconds = undefined;
    }

    onSubmit(nextValue);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      width={480}
      destroyOnHidden
      extra={(
        <Space>
          <Button onClick={onClose}>关闭</Button>
          {!isDetail ? (
            <Button
              type="primary"
              loading={submitting}
              disabled={!value.name.trim()}
              onClick={handleSubmit}
            >
              {mode === 'create' ? '创建 CD 配置' : '保存修改'}
            </Button>
          ) : null}
        </Space>
      )}
    >
      {isDetail ? (
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
          <Typography.Text strong>名称</Typography.Text>
          <Typography.Text>{config?.name ?? '-'}</Typography.Text>
          <Typography.Text strong>发布区域</Typography.Text>
          <Typography.Text>{config?.releaseRegion ?? '-'}</Typography.Text>
          <Typography.Text strong>发布环境</Typography.Text>
          <Typography.Text>{config?.releaseEnv ?? '-'}</Typography.Text>
          <Typography.Text strong>发布策略</Typography.Text>
          <Typography.Text>{config?.deploymentMode ?? '-'}</Typography.Text>
          <Typography.Text strong>策略摘要</Typography.Text>
          <Typography.Text>{config?.strategySummary ?? '-'}</Typography.Text>
          <Typography.Text strong>金丝雀参数</Typography.Text>
          <Typography.Text>
            {config?.deploymentMode === '金丝雀发布'
              ? `批次数 ${config.trafficBatchCount ?? '-'} / 流量 ${config.trafficRatioList?.join(',') ?? '-'} / 手动调整 ${config.manualAdjust ? '开启' : '关闭'} / 超时 ${config.adjustTimeoutSeconds ?? 0} 秒`
              : '无额外参数'}
          </Typography.Text>
          <Typography.Text strong>创建时间</Typography.Text>
          <Typography.Text>{config?.createdAt ?? '-'}</Typography.Text>
          <Typography.Text strong>更新时间</Typography.Text>
          <Typography.Text>{config?.updatedAt ?? '-'}</Typography.Text>
        </Space>
      ) : (
        <Form layout="vertical" disabled={loading}>
          <Form.Item label="名称" required>
            <Input
              aria-label="名称"
              value={value.name}
              onChange={(event) => setValue((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="例：cd-api-server-prod"
            />
          </Form.Item>
          <Form.Item label="发布区域" required>
            <Select
              aria-label="发布区域"
              value={value.releaseRegion}
              onChange={(nextValue) => setValue((prev) => ({ ...prev, releaseRegion: nextValue }))}
              options={[
                { value: '华东', label: '华东' },
                { value: '华北', label: '华北' },
                { value: '新加坡', label: '新加坡' },
              ]}
            />
          </Form.Item>
          <Form.Item label="发布环境" required>
            <Select
              aria-label="发布环境"
              value={value.releaseEnv}
              onChange={(nextValue) => setValue((prev) => ({ ...prev, releaseEnv: nextValue }))}
              options={[
                { value: '开发', label: '开发' },
                { value: '测试', label: '测试' },
                { value: '灰度', label: '灰度' },
                { value: '生产', label: '生产' },
              ]}
            />
          </Form.Item>
          <Form.Item label="发布策略" required>
            <Radio.Group
              aria-label="发布策略"
              value={value.deploymentMode}
              onChange={(event) =>
                setValue((prev) => ({
                  ...prev,
                  deploymentMode: event.target.value,
                }))
              }
              options={[
                { value: '滚动发布', label: '滚动发布' },
                { value: '金丝雀发布', label: '金丝雀发布' },
              ]}
              optionType="button"
              buttonStyle="solid"
            />
          </Form.Item>
          {isCanary ? (
            <>
              <Form.Item label="流量批次数" required>
                <Input
                  aria-label="流量批次数"
                  type="number"
                  value={value.trafficBatchCount}
                  onChange={(event) =>
                    setValue((prev) => ({
                      ...prev,
                      trafficBatchCount: Number(event.target.value || 0),
                    }))
                  }
                />
              </Form.Item>
              <Form.Item label="每批流量比例" required extra="使用逗号分隔，例如 10,30,60">
                <Input
                  aria-label="每批流量比例"
                  value={trafficRatioInput}
                  onChange={(event) => setTrafficRatioInput(event.target.value)}
                  placeholder="10,30,60"
                />
              </Form.Item>
              <Form.Item label="允许手动调整">
                <Switch
                  aria-label="允许手动调整"
                  checked={Boolean(value.manualAdjust)}
                  onChange={(checked) => setValue((prev) => ({ ...prev, manualAdjust: checked }))}
                />
              </Form.Item>
              <Form.Item label="手动调整超时时间（秒）">
                <Input
                  aria-label="手动调整超时时间（秒）"
                  type="number"
                  value={value.adjustTimeoutSeconds}
                  onChange={(event) =>
                    setValue((prev) => ({
                      ...prev,
                      adjustTimeoutSeconds: Number(event.target.value || 0),
                    }))
                  }
                />
              </Form.Item>
            </>
          ) : null}
        </Form>
      )}
    </Drawer>
  );
}
