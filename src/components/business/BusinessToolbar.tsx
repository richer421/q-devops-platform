import { Plus, Search } from 'lucide-react';

type BusinessToolbarProps = {
  value: string;
  onChange: (value: string) => void;
  count: number;
  onCreate: () => void;
};

export function BusinessToolbar({ value, onChange, count, onCreate }: BusinessToolbarProps) {
  return (
    <div className="border-b border-[#E5E6EB] bg-white px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-[#1D2129]" style={{ fontSize: 18, fontWeight: 600 }}>
            业务中心
          </h2>
          <p className="m-0 mt-0.5 text-[#86909C]" style={{ fontSize: 13 }}>
            管理业务单元及其关联的 CI/CD 配置
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1664FF] px-4 text-white transition-colors hover:bg-[#0E50D3]"
          style={{ fontSize: 13, fontWeight: 500 }}
        >
          <Plus size={15} />
          新建业务单元
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-8 w-64 items-center gap-2 rounded-lg bg-[#F2F3F5] px-3">
          <Search size={13} className="text-[#86909C]" />
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="搜索名称或描述"
            className="flex-1 border-none bg-transparent text-[#1D2129] outline-none placeholder:text-[#C9CDD4]"
            style={{ fontSize: 13 }}
          />
        </div>
        <span className="text-[#86909C]" style={{ fontSize: 12 }}>
          {count} 个业务单元
        </span>
      </div>
    </div>
  );
}
