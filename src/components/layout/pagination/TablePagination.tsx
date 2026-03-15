import { ConfigProvider, Pagination } from 'antd';

type TablePaginationProps = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: ReadonlyArray<number>;
};

export function TablePagination({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  return (
    <div style={{ borderTop: '1px solid #e5e7eb', background: '#fff', padding: 16 }}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1664ff',
            borderRadius: 8,
          },
        }}
      >
        <Pagination
          current={safeCurrentPage}
          pageSize={pageSize}
          total={totalItems}
          showSizeChanger={{
            options: pageSizeOptions.map((value) => ({
              label: `${value} 条/页`,
              value,
            })),
          }}
          style={{ display: 'flex', justifyContent: 'flex-end' }}
          onChange={(page, size) => {
            if (size !== pageSize) {
              onPageSizeChange(size);
            }
            onPageChange(page);
          }}
        />
      </ConfigProvider>
    </div>
  );
}
