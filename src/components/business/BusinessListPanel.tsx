import { Flex, Input } from 'antd';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { BusinessUnit } from '../../data';
import { TablePagination } from '../layout/pagination/TablePagination';
import { BusinessTable } from './BusinessTable';

type BusinessListPanelProps = {
  businesses: BusinessUnit[];
  onOpenDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

const DEFAULT_PAGE_SIZE = 10;

export function BusinessListPanel({
  businesses,
  onOpenDetail,
  onEdit,
  onDelete,
}: BusinessListPanelProps) {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const filteredBusinesses = useMemo(
    () =>
      businesses.filter(
        (business) =>
          business.name.toLowerCase().includes(keyword.toLowerCase()) ||
          business.desc.toLowerCase().includes(keyword.toLowerCase()),
      ),
    [businesses, keyword],
  );

  const totalPages = Math.max(1, Math.ceil(filteredBusinesses.length / pageSize));

  const paginatedBusinesses = useMemo(() => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredBusinesses.slice(start, start + pageSize);
  }, [filteredBusinesses, page, pageSize, totalPages]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize]);

  return (
    <div style={{ flex: 1, minHeight: 0, padding: 16 }}>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          border: '1px solid #e5e6eb',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <Flex
          align="center"
          style={{
            padding: 16,
            borderBottom: '1px solid #e5e6eb',
            flexShrink: 0,
          }}
        >
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索名称或描述"
            prefix={<Search size={14} />}
            style={{ width: 280 }}
            allowClear
          />
        </Flex>

        <div style={{ flex: 1, minHeight: 0 }}>
          <BusinessTable
            businesses={paginatedBusinesses}
            onOpenDetail={onOpenDetail}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>

        <TablePagination
          totalItems={filteredBusinesses.length}
          currentPage={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
