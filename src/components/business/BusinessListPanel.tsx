import type { BusinessUnit } from '../../mock';
import { BusinessTable } from './BusinessTable';

type BusinessListPanelProps = {
  businesses: BusinessUnit[];
  onOpenDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function BusinessListPanel({
  businesses,
  onOpenDetail,
  onEdit,
  onDelete,
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
          onOpenDetail={onOpenDetail}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
