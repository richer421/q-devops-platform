import {
  BuildOutlined,
  AppstoreOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { App as AntdApp } from 'antd';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import React from 'react';
import {
  AvatarDropdown,
  AvatarName,
  Footer,
  Question,
  SelectLang,
} from '@/components';
import { currentUser as queryCurrentUser } from '@/services/ant-design-pro/api';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import '@ant-design/v5-patch-for-react-19';

const isDev = process.env.NODE_ENV === 'development' || process.env.CI;
const isTest = process.env.NODE_ENV === 'test';
const loginPath = '/user/login';

const menuIconMap: Record<string, React.ReactNode> = {
  dashboard: <DashboardOutlined />,
  'business-units': <AppstoreOutlined />,
  'ci-builds': <BuildOutlined />,
};

const platformDemoUser: API.CurrentUser = {
  name: 'Platform Admin',
  avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
  userid: 'platform-admin',
  email: 'platform@example.com',
  access: 'admin',
};

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  const fetchUserInfo = async () => {
    if (isTest) {
      return platformDemoUser;
    }
    try {
      const msg = await queryCurrentUser({
        skipErrorHandler: true,
      });
      return msg.data || platformDemoUser;
    } catch (_error) {
      return platformDemoUser;
    }
  };
  const { location } = history;
  if (
    ![loginPath, '/user/register', '/user/register-result'].includes(
      location.pathname,
    )
  ) {
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser: currentUser || platformDemoUser,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    currentUser: platformDemoUser,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
}) => {
  return {
    title: 'Q Workplatform',
    actionsRender: () => [
      <Question key="doc" />,
      <SelectLang key="SelectLang" />,
    ],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    waterMarkProps: {
      content: undefined,
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    links: isDev
      ? [
          <Link key="repo" to="https://github.com/richer421/q-workplatform" target="_blank">
            <span>Repository</span>
          </Link>,
        ]
      : [],
    menu: {
      locale: false,
    },
    menuItemRender: (_item, dom) => <>{dom}</>,
    menuDataRender: (menuData) =>
      menuData.map((item) => ({
        ...item,
        icon: item.name ? menuIconMap[item.name] : item.icon,
      })),
    headerTitleRender: (_, title, props) => {
      const logoSrc = typeof props.logo === 'string' ? props.logo : '/logo.svg';
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={logoSrc} alt="Q Workplatform" style={{ width: 28, height: 28 }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1D2129' }}>{title}</span>
            <span style={{ fontSize: 11, color: '#86909C' }}>PaaS application delivery console</span>
          </div>
        </div>
      );
    },
    childrenRender: (children) => {
      return (
        <AntdApp>
          {children}
        </AntdApp>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  baseURL: '/',
  ...errorConfig,
};
