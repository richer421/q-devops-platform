import { describe, expect, it } from 'vitest';
import { builds, businesses, releases } from './index';

describe('platform mock data', () => {
  it('contains at least three seeded business units', () => {
    expect(businesses).toHaveLength(3);
  });

  it('contains both running and failed builds', () => {
    expect(builds.some((build) => build.status === 'running')).toBe(true);
    expect(builds.some((build) => build.status === 'failed')).toBe(true);
  });

  it('contains a deploying release example', () => {
    expect(releases.some((release) => release.status === 'deploying')).toBe(true);
  });
});
