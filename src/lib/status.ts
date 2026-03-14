import type { Build, Instance, Release } from '../data';

export function getBuildStatusMeta(status: Build['status']) {
  return {
    success: { bg: '#E8FFEA', text: '#00B42A', label: '成功' },
    failed: { bg: '#FFECE8', text: '#F53F3F', label: '失败' },
    running: { bg: '#E8F3FF', text: '#1664FF', label: '构建中' },
  }[status];
}

export function getReleaseStatusMeta(status: Release['status']) {
  return {
    success: { bg: '#E8FFEA', text: '#00B42A', label: '成功' },
    failed: { bg: '#FFECE8', text: '#F53F3F', label: '失败' },
    deploying: { bg: '#E8F3FF', text: '#1664FF', label: '发布中' },
    rolled_back: { bg: '#FFF7E8', text: '#FF7D00', label: '已回滚' },
  }[status];
}

export function getEnvMeta(env: string) {
  return {
    prod: { bg: '#FFF2E8', text: '#FA8C16' },
    dev: { bg: '#E6F7FF', text: '#1890FF' },
    test: { bg: '#F6FFED', text: '#52C41A' },
    gray: { bg: '#F9F0FF', text: '#722ED1' },
  }[env] ?? { bg: '#F2F3F5', text: '#86909C' };
}

export function getInstanceStatusMeta(status: Instance['status']) {
  return {
    running: { bg: '#E8FFEA', text: '#00B42A', label: '运行中' },
    degraded: { bg: '#FFECE8', text: '#F53F3F', label: '异常' },
    stopped: { bg: '#F2F3F5', text: '#86909C', label: '已停止' },
  }[status];
}
