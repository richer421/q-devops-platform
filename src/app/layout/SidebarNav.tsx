import { Link, useLocation } from 'react-router-dom';
import { navigationItems } from './navigation';

type SidebarNavProps = {
  collapsed: boolean;
};

export function SidebarNav({ collapsed }: SidebarNavProps) {
  const location = useLocation();

  return (
    <nav className="flex-1 space-y-1 px-2 py-3">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const active = location.pathname.startsWith(item.path);

        return (
          <Link
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : undefined}
            data-active={active ? 'true' : 'false'}
            className={`flex h-9 items-center gap-2.5 rounded-lg px-2 transition-all duration-150 ${
              active
                ? 'bg-[#E8F3FF] text-[#1664FF]'
                : 'text-[#4E5969] hover:bg-[#F2F3F5] hover:text-[#1D2129]'
            }`}
          >
            <div className="flex-shrink-0">
              <Icon size={15} />
            </div>
            {!collapsed && (
              <span style={{ fontSize: 13, fontWeight: active ? 500 : 400 }}>{item.label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
