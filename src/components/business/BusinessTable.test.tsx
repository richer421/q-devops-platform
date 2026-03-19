import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BusinessTable } from './BusinessTable';

function buildBusiness(index: number) {
  return {
    id: `bu-${index}`,
    name: `service-${index}`,
    desc: `description-${index}`,
    repoUrl: `https://github.com/org/service-${index}`,
    projectName: `service-${index}`,
    projectId: 100 + index,
    status: 'active' as const,
  };
}

describe('business table', () => {
  it('renders the expected headers and row actions', async () => {
    render(
      <BusinessTable
        businesses={[buildBusiness(1)]}
        keyword=""
        page={1}
        pageSize={10}
        total={1}
        onOpenDetail={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onKeywordChange={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );

    expect(await screen.findByRole('columnheader', { name: '名称' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '代码库' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '状态' })).toHaveStyle({ textAlign: 'center' });
    expect(screen.getByRole('button', { name: '详情' })).toBeInTheDocument();
  });

  it('emits the search keyword through the controlled callback', async () => {
    const onKeywordChange = vi.fn();

    render(
      <BusinessTable
        businesses={[buildBusiness(1), buildBusiness(2)]}
        keyword=""
        page={1}
        pageSize={10}
        total={2}
        onOpenDetail={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onKeywordChange={onKeywordChange}
        onPageChange={vi.fn()}
      />,
    );

    fireEvent.change(await screen.findByPlaceholderText('搜索名称或描述'), {
      target: { value: 'web-app' },
    });

    expect(onKeywordChange).toHaveBeenCalledWith('web-app');
  });

  it('emits pagination changes through the controlled callback', async () => {
    const onPageChange = vi.fn();

    render(
      <BusinessTable
        businesses={Array.from({ length: 10 }, (_, index) => buildBusiness(index + 1))}
        keyword=""
        page={1}
        pageSize={10}
        total={12}
        onOpenDetail={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onKeywordChange={vi.fn()}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(screen.getByTitle('2'));

    expect(onPageChange).toHaveBeenCalledWith(2, 10);
  });

  it('pins the pagination to the bottom of the table area', () => {
    const { container } = render(
      <BusinessTable
        businesses={[buildBusiness(1)]}
        keyword=""
        page={1}
        pageSize={10}
        total={1}
        onOpenDetail={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onKeywordChange={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );

    expect(container.querySelector('style')?.textContent ?? '').toContain('margin-block-start: auto');
  });

  it('fills the available width and centers the pagination', async () => {
    const { container } = render(
      <BusinessTable
        businesses={Array.from({ length: 10 }, (_, index) => buildBusiness(index + 1))}
        keyword=""
        page={1}
        pageSize={10}
        total={12}
        onOpenDetail={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onKeywordChange={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );

    const root = container.querySelector('[data-business-table="true"]');

    expect(root).toHaveStyle({ width: '100%', flex: '1 1 0%' });
    expect(await screen.findByText('service-10')).toBeInTheDocument();
    expect(container.querySelector('.ant-table-pagination')).toHaveClass('ant-pagination-center');
  });
});
