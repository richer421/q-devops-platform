import { Button, Layout, Space, Typography } from 'antd';
import { Menu as MenuIcon, Zap } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarNav } from './SidebarNav';

const { Sider, Header, Content } = Layout;

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        collapsedWidth={64}
        width={220}
        style={{ background: '#fff', borderRight: '1px solid #e5e6eb' }}
      >
        <Header
          style={{
            height: 56,
            background: '#fff',
            borderBottom: '1px solid #e5e6eb',
            paddingInline: 0,
          }}
        >
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              paddingInline: 16,
            }}
          >
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
            {!collapsed && (
              <Space direction="vertical" size={0} style={{ lineHeight: 1.2 }}>
                <Typography.Text style={{ fontSize: 14, fontWeight: 600, color: '#1d2129' }}>
                  Q DevOps Platform
                </Typography.Text>
                <Typography.Text style={{ fontSize: 11, color: '#86909c' }}>
                  应用交付平台
                </Typography.Text>
              </Space>
            )}
          </div>
        </Header>

        <SidebarNav collapsed={collapsed} />

        <div style={{ borderTop: '1px solid #e5e6eb' }}>
          <Button
            type="text"
            onClick={() => setCollapsed((value) => !value)}
            icon={<MenuIcon size={16} />}
            style={{ width: '100%', height: 44, borderRadius: 0, color: '#86909c' }}
          />
        </div>
      </Sider>

      <Layout>
        <Content style={{ background: '#f2f3f5', minWidth: 0 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
