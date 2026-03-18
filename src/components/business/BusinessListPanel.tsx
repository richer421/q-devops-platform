import { BusinessTable, type BusinessTableRow } from './BusinessTable';

type BusinessListPanelProps = {
  businesses: BusinessTableRow[];
  keyword: string;
  page: number;
  pageSize: number;
  total: number;
  loading?: boolean;
  onOpenDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onKeywordChange: (keyword: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
};

export function BusinessListPanel({
  businesses,
  keyword,
  page,
  pageSize,
  total,
  loading = false,
  onOpenDetail,
  onEdit,
  onDelete,
  onKeywordChange,
  onPageChange,
}: BusinessListPanelProps) {
  return (
    <div
      style={{
        height: '100%',
        minHeight: 0,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
        }}
      >
        <BusinessTable
          businesses={businesses}
          keyword={keyword}
          page={page}
          pageSize={pageSize}
          total={total}
          loading={loading}
          onOpenDetail={onOpenDetail}
          onEdit={onEdit}
          onDelete={onDelete}
          onKeywordChange={onKeywordChange}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
