import { ProLayout } from '@ant-design/pro-components';
import { Zap } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { navigationItems } from './navigation';

export function BaseLayout() {
  const location = useLocation();

  const menuData = navigationItems.map((item) => ({
    path: item.path,
    name: item.label,
    icon: <item.icon size={15} />,
  }));

  return (
    <ProLayout
      layout="side"
      location={{ pathname: location.pathname }}
      headerRender={false}
      menuDataRender={() => menuData}
      menuItemRender={(item, dom) => (
        <Link to={item.path || '/'} style={{ display: 'block' }}>{dom}</Link>
      )}
      logo={(
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #1664ff 0%, #0094ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Zap size={16} color="white" fill="white" />
        </div>
      )}
      title="Q DevOps"
      siderWidth={220}
      style={{ minHeight: '100vh' }}
      contentStyle={{
        background: '#f2f3f5',
        padding: 2,
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
      token={{
        sider: {
          colorMenuBackground: '#ffffff',
          colorTextMenu: '#4e5969',
          colorTextMenuSelected: '#1664ff',
          colorBgMenuItemSelected: '#e8f3ff',
          colorTextMenuActive: '#1664ff',
          colorTextMenuItemHover: '#1664ff',
        },
      }}
    >
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </ProLayout>
  );
}
