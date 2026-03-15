import type { Build, Instance, Release } from '../data';

export function getBuildStatusMeta(status: Build['status']) {
  return {
    success: { label: '成功', badgeClass: 'bg-[#E8FFEA] text-[#00B42A]', dotClass: 'bg-[#00B42A]' },
    failed: { label: '失败', badgeClass: 'bg-[#FFECE8] text-[#F53F3F]', dotClass: 'bg-[#F53F3F]' },
    running: {
      label: '构建中',
      badgeClass: 'bg-[#E8F3FF] text-[#1664FF]',
      dotClass: 'animate-pulse bg-[#1664FF]',
    },
  }[status];
}

export function getReleaseStatusMeta(status: Release['status']) {
  return {
    success: { label: '成功', badgeClass: 'bg-[#E8FFEA] text-[#00B42A]', dotClass: 'bg-[#00B42A]' },
    failed: { label: '失败', badgeClass: 'bg-[#FFECE8] text-[#F53F3F]', dotClass: 'bg-[#F53F3F]' },
    deploying: {
      label: '发布中',
      badgeClass: 'bg-[#E8F3FF] text-[#1664FF]',
      dotClass: 'animate-pulse bg-[#1664FF]',
    },
    rolled_back: {
      label: '已回滚',
      badgeClass: 'bg-[#FFF7E8] text-[#FF7D00]',
      dotClass: 'bg-[#FF7D00]',
    },
  }[status];
}

export function getEnvMeta(env: string) {
  return {
    prod: { badgeClass: 'bg-[#FFF2E8] text-[#FA8C16]' },
    dev: { badgeClass: 'bg-[#E6F7FF] text-[#1890FF]' },
    test: { badgeClass: 'bg-[#F6FFED] text-[#52C41A]' },
    gray: { badgeClass: 'bg-[#F9F0FF] text-[#722ED1]' },
  }[env] ?? { badgeClass: 'bg-[#F2F3F5] text-[#86909C]' };
}

export function getInstanceStatusMeta(status: Instance['status']) {
  return {
    running: { label: '运行中', badgeClass: 'bg-[#E8FFEA] text-[#00B42A]' },
    degraded: { label: '异常', badgeClass: 'bg-[#FFECE8] text-[#F53F3F]' },
    stopped: { label: '已停止', badgeClass: 'bg-[#F2F3F5] text-[#86909C]' },
  }[status];
}
