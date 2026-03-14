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
      text: '#00B42A',
      bg: '#E8FFEA',
    });
  });

  it('maps deploying release status to active blue styles', () => {
    expect(getReleaseStatusMeta('deploying')).toMatchObject({
      label: '发布中',
      text: '#1664FF',
      bg: '#E8F3FF',
    });
  });

  it('maps prod env to orange styles', () => {
    expect(getEnvMeta('prod')).toMatchObject({
      text: '#FA8C16',
      bg: '#FFF2E8',
    });
  });

  it('maps degraded instances to danger styles', () => {
    expect(getInstanceStatusMeta('degraded')).toMatchObject({
      label: '异常',
      text: '#F53F3F',
      bg: '#FFECE8',
    });
  });
});
