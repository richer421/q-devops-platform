import type { PageHeaderProps } from './types';

export function PageHeader({
  breadcrumbs,
  title,
  description,
  action,
  footer,
}: PageHeaderProps) {
  return (
    <div className="border-b border-[#E5E6EB] bg-white px-6 py-4">
      {breadcrumbs.length > 0 && (
        <div className="mb-2 flex items-center gap-1">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const textClass = isLast ? 'text-[#86909C]' : 'text-[#C9CDD4]';

            return (
              <div key={`${item.label}-${index}`} className="flex items-center gap-1">
                {item.onClick ? (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className={`${textClass} transition-colors hover:text-[#1664FF]`}
                    style={{ fontSize: 12 }}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className={textClass} style={{ fontSize: 12 }}>
                    {item.label}
                  </span>
                )}
                {!isLast && (
                  <span className="text-[#C9CDD4]" style={{ fontSize: 12 }}>
                    /
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-[#1D2129]" style={{ fontSize: 18, fontWeight: 600 }}>
            {title}
          </h2>
          {description && (
            <p className="m-0 mt-0.5 text-[#86909C]" style={{ fontSize: 13 }}>
              {description}
            </p>
          )}
        </div>
        {action}
      </div>

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}
