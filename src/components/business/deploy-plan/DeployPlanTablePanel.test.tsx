import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeployPlanTablePanel } from './DeployPlanTablePanel';

describe('DeployPlanTablePanel', () => {
  it('renders updated-at column instead of release/status columns', async () => {
    render(
      <DeployPlanTablePanel
        items={[
          {
            id: 'dp-001',
            buId: 'bu-001',
            name: 'api-server-dev',
            env: 'dev',
            ciConfig: 'ci-api-server',
            cdConfig: 'cd-api-server-dev',
            instance: 'inst-api-dev',
            lastStatus: 'success',
            lastTime: '2026-03-20T09:00:00Z',
            updatedAt: '2026-03-20T10:30:00Z',
          },
        ]}
        total={1}
        page={1}
        pageSize={10}
        keyword=""
        loading={false}
        onKeywordChange={vi.fn()}
        onPageChange={vi.fn()}
        onCreate={vi.fn()}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(await screen.findByRole('columnheader', { name: '更新时间' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '最近发布' })).toBeNull();
    expect(screen.queryByRole('columnheader', { name: '状态' })).toBeNull();
  });
});
