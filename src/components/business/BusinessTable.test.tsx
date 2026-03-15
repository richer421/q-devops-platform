import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BusinessTable } from './BusinessTable';

describe('business table', () => {
  it('renders the expected headers and row actions', async () => {
    render(
      <BusinessTable
        businesses={[
          {
            id: 'bu-001',
            name: 'api-server',
            desc: '核心 REST API 服务',
            repoUrl: 'https://github.com/org/api-server',
            status: 'active',
          },
        ]}
        onOpenDetail={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(await screen.findByRole('columnheader', { name: '名称' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '代码库' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '状态' })).toHaveStyle({ textAlign: 'center' });
    expect(screen.getByRole('button', { name: '详情' })).toBeInTheDocument();
  });

  it('filters rows from the integrated search input', async () => {
    render(
      <BusinessTable
        businesses={[
          {
            id: 'bu-001',
            name: 'api-server',
            desc: '核心 REST API 服务',
            repoUrl: 'https://github.com/org/api-server',
            status: 'active',
          },
          {
            id: 'bu-002',
            name: 'web-app',
            desc: '前端 Web 单页应用',
            repoUrl: 'https://github.com/org/web-app',
            status: 'active',
          },
        ]}
        onOpenDetail={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.change(await screen.findByPlaceholderText('搜索名称或描述'), {
      target: { value: 'web-app' },
    });

    expect(await screen.findByText('web-app')).toBeInTheDocument();
    expect(screen.queryByText('api-server')).toBeNull();
  });

  it('uses antd table pagination managed inside the component', async () => {
    const businesses = Array.from({ length: 12 }, (_, index) => ({
      id: `bu-${index + 1}`,
      name: `service-${index + 1}`,
      desc: `description-${index + 1}`,
      repoUrl: `https://github.com/org/service-${index + 1}`,
      status: 'active' as const,
    }));

    render(
      <BusinessTable
        businesses={businesses}
        onOpenDetail={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('service-10')).toBeInTheDocument();
    expect(screen.queryByText('service-11')).toBeNull();

    fireEvent.click(screen.getByTitle('2'));

    expect(await screen.findByText('service-11')).toBeInTheDocument();
    expect(screen.queryByText('service-1')).toBeNull();
  });

  it('pins the pagination to the bottom of the table area', () => {
    const { container } = render(
      <BusinessTable
        businesses={[
          {
            id: 'bu-001',
            name: 'api-server',
            desc: '核心 REST API 服务',
            repoUrl: 'https://github.com/org/api-server',
            status: 'active',
          },
        ]}
        onOpenDetail={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(container.querySelector('style')?.textContent ?? '').toContain('margin-block-start: auto');
  });

  it('fills the available width and centers the pagination', async () => {
    const { container } = render(
      <BusinessTable
        businesses={Array.from({ length: 12 }, (_, index) => ({
          id: `bu-${index + 1}`,
          name: `service-${index + 1}`,
          desc: `description-${index + 1}`,
          repoUrl: `https://github.com/org/service-${index + 1}`,
          status: 'active' as const,
        }))}
        onOpenDetail={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const root = container.querySelector('[data-business-table="true"]');

    expect(root).toHaveStyle({ width: '100%', flex: '1 1 0%' });
    expect(await screen.findByText('service-10')).toBeInTheDocument();
    expect(container.querySelector('.ant-table-pagination')).toHaveClass('ant-pagination-center');
  });
});
