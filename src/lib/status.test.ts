import { describe, expect, it } from 'vitest';
import {
  getBuildStatusMeta,
  getEnvMeta,
  getInstanceStatusMeta,
  getReleaseStatusMeta,
} from './status';

describe('status helpers', () => {
  it('maps success build status to green styles', () => {
    expect(getBuildStatusMeta('success')).toMatchObject({
      label: '成功',
      badgeClass: 'bg-[#E8FFEA] text-[#00B42A]',
      dotClass: 'bg-[#00B42A]',
    });
  });

  it('maps deploying release status to active blue styles', () => {
    expect(getReleaseStatusMeta('deploying')).toMatchObject({
      label: '发布中',
      badgeClass: 'bg-[#E8F3FF] text-[#1664FF]',
      dotClass: 'animate-pulse bg-[#1664FF]',
    });
  });

  it('maps prod env to orange styles', () => {
    expect(getEnvMeta('prod')).toMatchObject({
      badgeClass: 'bg-[#FFF2E8] text-[#FA8C16]',
    });
  });

  it('maps degraded instances to danger styles', () => {
    expect(getInstanceStatusMeta('degraded')).toMatchObject({
      label: '异常',
      badgeClass: 'bg-[#FFECE8] text-[#F53F3F]',
    });
  });
});
