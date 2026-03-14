import type { ProLayoutProps } from '@ant-design/pro-components';

const Settings: ProLayoutProps & {
  pwa?: boolean;
  logo?: string;
} = {
  navTheme: 'light',
  colorPrimary: '#1664FF',
  layout: 'side',
  contentWidth: 'Fluid',
  fixedHeader: true,
  fixSiderbar: true,
  colorWeak: false,
  title: 'Q Workplatform',
  pwa: false,
  logo: '/logo.svg',
  iconfontUrl: '',
  token: {
    bgLayout: '#F2F3F5',
    sider: {
      colorMenuBackground: '#ffffff',
      colorTextMenu: '#4E5969',
      colorTextMenuSelected: '#1664FF',
      colorBgMenuItemSelected: '#E8F3FF',
      colorBgMenuItemHover: '#F2F3F5',
    },
    header: {
      colorBgHeader: '#ffffff',
      colorHeaderTitle: '#1D2129',
      colorTextMenu: '#4E5969',
      colorTextMenuSecondary: '#86909C',
      colorBgMenuItemHover: '#F2F3F5',
    },
    pageContainer: {
      colorBgPageContainer: 'transparent',
    },
  },
};

export default Settings;
