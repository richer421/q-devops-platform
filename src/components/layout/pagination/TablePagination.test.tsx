import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TablePagination } from './TablePagination';

describe('table pagination', () => {
  it('renders with antd pagination while preserving container layout', () => {
    const { container } = render(
      <TablePagination
        totalItems={100}
        currentPage={3}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    const wrapper = container.firstElementChild as HTMLElement | null;
    expect(wrapper).not.toBeNull();
    expect(wrapper?.style.borderTop).toContain('1px');
    expect(container.querySelector('.ant-pagination')).not.toBeNull();
    expect(container.querySelector('.ant-pagination-options')).not.toBeNull();
    expect(container.querySelector('.ant-pagination-prev')).not.toBeNull();
    expect(container.querySelector('.ant-pagination-next')).not.toBeNull();
  });

  it('emits onPageChange when clicking page controls', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    const { container } = render(
      <TablePagination
        totalItems={100}
        currentPage={3}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    const prev = container.querySelector('.ant-pagination-prev');
    const next = container.querySelector('.ant-pagination-next');
    const page5 = container.querySelector('.ant-pagination-item-5');

    expect(prev).not.toBeNull();
    expect(next).not.toBeNull();
    expect(page5).not.toBeNull();

    fireEvent.click(prev!);
    fireEvent.click(page5!);
    fireEvent.click(next!);

    expect(onPageChange).toHaveBeenNthCalledWith(1, 2);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 5);
    expect(onPageChange).toHaveBeenNthCalledWith(3, 4);
    expect(onPageSizeChange).not.toHaveBeenCalled();
  });
});
