import type { PageHeaderTabsProps } from './types';

export function PageHeaderTabs<T extends string>({
  items,
  value,
  onChange,
  right,
}: PageHeaderTabsProps<T>) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`border-b-2 px-4 py-2.5 transition-colors ${
              value === item.id
                ? 'border-[#1664FF] text-[#1664FF]'
                : 'border-transparent text-[#4E5969] hover:text-[#1D2129]'
            }`}
            style={{ fontSize: 13, fontWeight: value === item.id ? 500 : 400 }}
          >
            {item.icon && <span className="mr-1.5 inline-flex">{item.icon}</span>}
            {item.label}
            {typeof item.count === 'number' && (
              <span
                className="ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5"
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  height: 16,
                  background: value === item.id ? '#E8F3FF' : '#F2F3F5',
                  color: value === item.id ? '#1664FF' : '#86909C',
                }}
              >
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {right}
    </div>
  );
}
