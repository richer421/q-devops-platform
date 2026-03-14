import { Search } from 'lucide-react';

type BusinessToolbarProps = {
  value: string;
  onChange: (value: string) => void;
  count: number;
};

export function BusinessToolbar({ value, onChange, count }: BusinessToolbarProps) {
  return (
    <div className="flex items-center gap-3">
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
  );
}
