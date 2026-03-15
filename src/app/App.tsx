import { App as AntApp, ConfigProvider } from 'antd';
import { AppRouter } from './router/routes';

export function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1664ff',
          borderRadius: 8,
          fontSize: 13,
        },
      }}
    >
      <AntApp>
        <AppRouter kind="browser" />
      </AntApp>
    </ConfigProvider>
  );
}
