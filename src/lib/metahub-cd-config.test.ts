import { afterEach, describe, expect, it, vi } from 'vitest';
import { cdConfigFromMetahub, cdConfigToMetahubPayload, deleteCDConfig } from './metahub-cd-config';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('metahub cd config', () => {
  it('maps metahub cd config dto into frontend view', () => {
    expect(
      cdConfigFromMetahub({
        id: 12,
        created_at: '2026-03-18T10:00:00Z',
        updated_at: '2026-03-18T12:00:00Z',
        name: 'api-server-prod',
        business_unit_id: 7,
        release_region: '华北',
        release_env: '生产',
        deployment_mode: '金丝雀发布',
        strategy_summary: '3 批次 / 10%,30%,60%',
        traffic_batch_count: 3,
        traffic_ratio_list: [10, 30, 60],
        manual_adjust: true,
        adjust_timeout_seconds: 300,
      }),
    ).toEqual({
      id: '12',
      buId: '7',
      name: 'api-server-prod',
      releaseRegion: '华北',
      releaseEnv: '生产',
      deploymentMode: '金丝雀发布',
      strategySummary: '3 批次 / 10%,30%,60%',
      trafficBatchCount: 3,
      trafficRatioList: [10, 30, 60],
      manualAdjust: true,
      adjustTimeoutSeconds: 300,
      createdAt: '2026-03-18T10:00:00Z',
      updatedAt: '2026-03-18T12:00:00Z',
    });
  });

  it('builds canary update payload from form values', () => {
    expect(
      cdConfigToMetahubPayload({
        name: 'api-server-prod',
        releaseRegion: '新加坡',
        releaseEnv: '灰度',
        deploymentMode: '金丝雀发布',
        trafficBatchCount: 3,
        trafficRatioList: [10, 30, 60],
        manualAdjust: true,
        adjustTimeoutSeconds: 600,
      }),
    ).toEqual({
      name: 'api-server-prod',
      release_region: '新加坡',
      release_env: '灰度',
      deployment_mode: '金丝雀发布',
      traffic_batch_count: 3,
      traffic_ratio_list: [10, 30, 60],
      manual_adjust: true,
      adjust_timeout_seconds: 600,
    });
  });

  it('surfaces backend error message when deleting cd config fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        code: 40901,
        message: '该 CD 配置已被发布计划引用，禁止删除',
        data: {},
      }),
    } as Response);

    await expect(deleteCDConfig(12)).rejects.toThrow('该 CD 配置已被发布计划引用，禁止删除');
  });
});
