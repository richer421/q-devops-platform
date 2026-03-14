import { ExternalLink } from 'lucide-react';
import type { BusinessUnit } from '../../data';

type BusinessTableProps = {
  businesses: BusinessUnit[];
  onOpenDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function BusinessTable({
  businesses,
  onOpenDetail,
  onEdit,
  onDelete,
}: BusinessTableProps) {
  return (
    <div className="flex-1 overflow-auto bg-white">
      <table className="w-full">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-[#F2F3F5] bg-[#FAFAFA]">
            {['名称', '描述', '代码库', '状态', '操作'].map((header) => (
              <th
                key={header}
                className="px-5 py-3 text-left text-[#86909C]"
                style={{ fontSize: 12, fontWeight: 500 }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F2F3F5]">
          {businesses.map((business) => (
            <tr key={business.id} className="transition-colors hover:bg-[#FAFAFA]">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F3FF]">
                    <span className="text-[#1664FF]" style={{ fontSize: 13, fontWeight: 700 }}>
                      {business.name[0].toUpperCase()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenDetail(business.id)}
                    className="text-left text-[#1664FF] hover:underline"
                    style={{ fontSize: 13, fontWeight: 500 }}
                  >
                    {business.name}
                  </button>
                </div>
              </td>
              <td className="max-w-xs px-5 py-3.5 text-[#4E5969]" style={{ fontSize: 13 }}>
                <span className="line-clamp-1">{business.desc || '—'}</span>
              </td>
              <td className="px-5 py-3.5">
                {business.repoUrl ? (
                  <a
                    href={business.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#1664FF] hover:underline"
                    style={{ fontSize: 12 }}
                  >
                    <ExternalLink size={11} />
                    <span className="max-w-[180px] truncate">
                      {business.repoUrl.replace('https://', '')}
                    </span>
                  </a>
                ) : (
                  <span className="text-[#C9CDD4]" style={{ fontSize: 13 }}>
                    —
                  </span>
                )}
              </td>
              <td className="px-5 py-3.5">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    background: business.status === 'active' ? '#E8FFEA' : '#F2F3F5',
                    color: business.status === 'active' ? '#00B42A' : '#86909C',
                  }}
                >
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      business.status === 'active' ? 'bg-[#00B42A]' : 'bg-[#86909C]'
                    }`}
                  />
                  {business.status === 'active' ? '正常' : '停用'}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(business.id)}
                    className="h-7 rounded-lg border border-[#E5E6EB] px-2.5 text-[#4E5969] transition-colors hover:border-[#1664FF] hover:text-[#1664FF]"
                    style={{ fontSize: 12 }}
                  >
                    详情
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(business.id)}
                    className="h-7 rounded-lg border border-[#E5E6EB] px-2.5 text-[#4E5969] transition-colors hover:border-[#1664FF] hover:text-[#1664FF]"
                    style={{ fontSize: 12 }}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(business.id)}
                    className="h-7 rounded-lg border border-[#E5E6EB] px-2.5 text-[#F53F3F] transition-colors hover:border-[#F53F3F]"
                    style={{ fontSize: 12 }}
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {businesses.length === 0 && (
            <tr>
              <td colSpan={5} className="py-16 text-center text-[#86909C]" style={{ fontSize: 13 }}>
                暂无业务单元
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
