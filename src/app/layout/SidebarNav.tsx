import { ConfigProvider, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { navigationItems } from './navigation';

type SidebarNavProps = {
  collapsed: boolean;
};

export function SidebarNav({ collapsed }: SidebarNavProps) {
  const location = useLocation();
  const activeKey = navigationItems
    .slice()
    .reverse()
    .find((item) => location.pathname.startsWith(item.path))?.path;

  return (
    <div style={{ padding: 8, height: 'calc(100% - 100px)' }}>
      <ConfigProvider
        theme={{
          components: {
            Menu: {
              itemHeight: 36,
              itemColor: '#4e5969',
              itemBorderRadius: 8,
              itemSelectedColor: '#1664ff',
              itemSelectedBg: '#e8f3ff',
              itemHoverColor: '#1664ff',
            },
          },
        }}
      >
        <Menu
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={activeKey ? [activeKey] : []}
          style={{ border: 0, background: 'transparent' }}
          items={navigationItems.map((item) => {
            const Icon = item.icon;
            return {
              key: item.path,
              icon: <Icon size={15} />,
              label: <Link to={item.path}>{item.label}</Link>,
            };
          })}
        />
      </ConfigProvider>
    </div>
  );
}
