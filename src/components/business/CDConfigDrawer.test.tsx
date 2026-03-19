import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CDConfigDrawer } from './CDConfigDrawer';

describe('cd config drawer', () => {
  it('shows canary-only fields when deployment mode is 金丝雀发布', async () => {
    render(
      <CDConfigDrawer
        open
        mode="create"
        onClose={() => {}}
        onSubmit={() => {}}
      />,
    );

    expect(document.querySelector('.ant-modal')).toBeInTheDocument();
    expect(document.querySelector('.ant-drawer')).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: '金丝雀发布' }));

    expect(await screen.findByLabelText('流量批次数')).toBeInTheDocument();
    expect(screen.getByLabelText('每批流量比例')).toBeInTheDocument();
    expect(screen.getByText('允许手动调整')).toBeInTheDocument();
  });

  it('hides canary-only fields when deployment mode is 滚动发布', () => {
    render(
      <CDConfigDrawer
        open
        mode="create"
        onClose={() => {}}
        onSubmit={() => {}}
      />,
    );

    expect(screen.queryByLabelText('流量批次数')).toBeNull();
    expect(screen.queryByLabelText('每批流量比例')).toBeNull();
  });

  it('renders edit mode as modal instead of drawer', async () => {
    render(
      <CDConfigDrawer
        open
        mode="edit"
        config={{
          id: 'cd-001',
          buId: 'bu-001',
          name: 'cd-api-server-prod',
          releaseRegion: '华北',
          releaseEnv: '生产',
          deploymentMode: '滚动发布',
          strategySummary: '按默认批次滚动发布',
        }}
        onClose={() => {}}
        onSubmit={() => {}}
      />,
    );

    expect(document.querySelector('.ant-modal')).toBeInTheDocument();
    expect(document.querySelector('.ant-drawer')).toBeNull();
    expect(await screen.findByRole('button', { name: '保存修改' })).toBeInTheDocument();
  });

  it('renders readonly detail mode with timestamps', async () => {
    render(
      <CDConfigDrawer
        open
        mode="detail"
        config={{
          id: 'cd-001',
          buId: 'bu-001',
          name: 'cd-api-server-prod',
          releaseRegion: '华北',
          releaseEnv: '生产',
          deploymentMode: '金丝雀发布',
          strategySummary: '3 批次 / 10%,30%,60%',
          trafficBatchCount: 3,
          trafficRatioList: [10, 30, 60],
          manualAdjust: true,
          adjustTimeoutSeconds: 300,
          createdAt: '2026-03-18T10:00:00Z',
          updatedAt: '2026-03-18T12:00:00Z',
        }}
        onClose={() => {}}
      />,
    );

    expect(await screen.findByText('cd-api-server-prod')).toBeInTheDocument();
    expect(screen.getByText('2026/03/18 10:00')).toBeInTheDocument();
    expect(screen.getByText('2026/03/18 12:00')).toBeInTheDocument();
    expect(screen.getByText('生产')).toHaveClass('ant-tag');
  });

  it('submits parsed canary values from the form', async () => {
    const onSubmit = vi.fn();

    render(
      <CDConfigDrawer
        open
        mode="create"
        onClose={() => {}}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('名称'), { target: { value: 'cd-api-server-gray' } });
    fireEvent.click(screen.getByRole('radio', { name: '金丝雀发布' }));
    fireEvent.change(await screen.findByLabelText('流量批次数'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('每批流量比例'), { target: { value: '10,30,60' } });
    fireEvent.click(screen.getByRole('button', { name: '创建 CD 配置' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'cd-api-server-gray',
      deploymentMode: '金丝雀发布',
      trafficBatchCount: 3,
      trafficRatioList: [10, 30, 60],
    }));
  });
});
