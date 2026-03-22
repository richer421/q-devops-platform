import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devServerPort = Number(env.VITE_DEV_SERVER_PORT || 5173);
  const metahubProxyPrefix = (env.VITE_METAHUB_BASE_URL || '/api').trim() || '/api';
  const qciProxyPrefix = (env.VITE_Q_CI_BASE_URL || '/q-ci-api').trim() || '/q-ci-api';
  const metahubProxyTarget =
    (env.VITE_METAHUB_PROXY_TARGET || 'http://127.0.0.1:18080').trim() ||
    'http://127.0.0.1:18080';
  const qciProxyTarget =
    (env.VITE_Q_CI_PROXY_TARGET || 'http://127.0.0.1:18081').trim() ||
    'http://127.0.0.1:18081';

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: devServerPort,
      proxy: {
        [metahubProxyPrefix]: {
          target: metahubProxyTarget,
          changeOrigin: true,
        },
        [qciProxyPrefix]: {
          target: qciProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${escapeRegExp(qciProxyPrefix)}`), ''),
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
    },
  };
});
