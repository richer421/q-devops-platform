import { Menu, Zap } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarNav } from './SidebarNav';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F2F3F5]">
      <aside
        className="flex flex-shrink-0 flex-col border-r border-[#E5E6EB] bg-white transition-all duration-300"
        style={{ width: collapsed ? 64 : 220 }}
      >
        <div className="flex h-14 items-center gap-3 border-b border-[#E5E6EB] px-4">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, #1664FF 0%, #0094FF 100%)' }}
          >
            <Zap size={16} color="white" fill="white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div
                className="whitespace-nowrap text-[#1D2129]"
                style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px' }}
              >
                Q DevOps Platform
              </div>
              <div
                className="whitespace-nowrap text-[#86909C]"
                style={{ fontSize: 11, lineHeight: '16px' }}
              >
                应用交付平台
              </div>
            </div>
          )}
        </div>

        <SidebarNav collapsed={collapsed} />

        <div className="border-t border-[#E5E6EB]">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="flex h-11 w-full items-center justify-center text-[#86909C] transition-colors hover:bg-[#F2F3F5] hover:text-[#1D2129]"
          >
            <Menu size={16} />
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
