import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DeployPlansTable } from './DeployPlansTable';

describe('deploy plans table', () => {
  it('renders antd table headers and centered env/status columns', async () => {
    render(
      <DeployPlansTable
        plans={[
          {
            id: 'dp-001',
            buId: 'bu-001',
            name: 'api-server-dev',
            env: 'dev',
            ciConfig: 'ci-api-server',
            cdConfig: 'cd-api-server-dev',
            instance: 'inst-api-dev',
            lastStatus: 'success',
            lastTime: '2小时前',
          },
        ]}
      />,
    );

    expect(await screen.findByRole('columnheader', { name: '计划名称' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '环境' })).toHaveStyle({ textAlign: 'center' });
    expect(screen.getByRole('columnheader', { name: '状态' })).toHaveStyle({ textAlign: 'center' });
  });

  it('filters and paginates plans locally', async () => {
    const plans = Array.from({ length: 12 }, (_, index) => ({
      id: `dp-${index + 1}`,
      buId: 'bu-001',
      name: `deploy-${index + 1}`,
      env: index % 2 === 0 ? 'dev' as const : 'prod' as const,
      ciConfig: 'ci-api-server',
      cdConfig: 'cd-api-server-dev',
      instance: `instance-${index + 1}`,
      lastStatus: 'success' as const,
      lastTime: `${index + 1}小时前`,
    }));

    const { container } = render(<DeployPlansTable plans={plans} />);

    expect(screen.getByText('deploy-10')).toBeInTheDocument();
    expect(screen.queryByText('deploy-11')).toBeNull();

    fireEvent.click(within(container).getByTitle('2'));
    expect(await screen.findByText('deploy-11')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('搜索部署计划'), {
      target: { value: 'deploy-2' },
    });

    expect(await screen.findByText('deploy-2')).toBeInTheDocument();
    expect(screen.queryByText('deploy-11')).toBeNull();
  });

  it('pins the pagination to the bottom of the table area', () => {
    const { container } = render(
      <DeployPlansTable
        plans={[
          {
            id: 'dp-001',
            buId: 'bu-001',
            name: 'api-server-dev',
            env: 'dev',
            ciConfig: 'ci-api-server',
            cdConfig: 'cd-api-server-dev',
            instance: 'inst-api-dev',
            lastStatus: 'success',
            lastTime: '2小时前',
          },
        ]}
      />,
    );

    expect(container.querySelector('style')?.textContent ?? '').toContain('margin-block-start: auto');
  });

  it('centers the pagination instead of docking it to the right edge', async () => {
    const plans = Array.from({ length: 12 }, (_, index) => ({
      id: `dp-${index + 1}`,
      buId: 'bu-001',
      name: `deploy-${index + 1}`,
      env: index % 2 === 0 ? 'dev' as const : 'prod' as const,
      ciConfig: 'ci-api-server',
      cdConfig: 'cd-api-server-dev',
      instance: `instance-${index + 1}`,
      lastStatus: 'success' as const,
      lastTime: `${index + 1}小时前`,
    }));

    const { container } = render(<DeployPlansTable plans={plans} />);

    expect(await screen.findByText('deploy-10')).toBeInTheDocument();
    expect(container.querySelector('.ant-table-pagination')).toHaveClass('ant-pagination-center');
  });

});
