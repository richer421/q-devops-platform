import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ciConfigFromMetahub,
  ciConfigToCreatePayload,
  listBusinessUnitCIConfigs,
  type CIConfigFormValue,
} from './metahub-ci-config';

describe('metahub ci config client', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('maps metahub ci config dto into ui fields with defaults', () => {
    const item = ciConfigFromMetahub({
      id: 12,
      business_unit_id: 34,
      name: 'api-server',
      image_registry: 'harbor.example.com/project-a',
      image_repo: 'api-server',
      full_image_repo: 'harbor.example.com/project-a/api-server',
      image_tag_rule: {
        type: 'branch',
        with_timestamp: true,
        with_commit: true,
      },
      build_spec: {},
      created_at: '2026-03-18T10:00:00Z',
      updated_at: '2026-03-18T12:00:00Z',
    });

    expect(item.id).toBe(12);
    expect(item.fullImageRepo).toBe('harbor.example.com/project-a/api-server');
    expect(item.tagRuleLabel).toBe('分支名 + 时间戳 + Commit');
    expect(item.buildSpec.makefilePath).toBe('./Makefile');
    expect(item.buildSpec.makeCommand).toBe('build');
    expect(item.buildSpec.dockerfilePath).toBe('./Dockerfile');
    expect(item.buildSpec.dockerContext).toBe('.');
  });

  it('builds list query by name keyword only and maps response rows', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 0,
          message: 'ok',
          data: {
            items: [
              {
                id: 12,
                business_unit_id: 34,
                name: 'api-server',
                image_registry: 'harbor.example.com/project-a',
                image_repo: 'api-server',
                full_image_repo: 'harbor.example.com/project-a/api-server',
                image_tag_rule: {
                  type: 'custom',
                  template: 'release-${timestamp}',
                },
                build_spec: {
                  makefile_path: './ops/Makefile',
                  dockerfile_path: './deploy/Dockerfile',
                },
                created_at: '2026-03-18T10:00:00Z',
                updated_at: '2026-03-18T12:00:00Z',
              },
            ],
            total: 1,
            page: 2,
            page_size: 20,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const page = await listBusinessUnitCIConfigs(34, {
      page: 2,
      pageSize: 20,
      keyword: '  api-server  ',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/business-units/34/ci-configs?page=2&page_size=20&keyword=api-server',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(page.total).toBe(1);
    expect(page.page).toBe(2);
    expect(page.pageSize).toBe(20);
    expect(page.items[0]?.tagRuleLabel).toBe('自定义: release-${timestamp}');
    expect(page.items[0]?.buildSpec.makefilePath).toBe('./ops/Makefile');
  });

  it('omits image repo from create payload and keeps only static build inputs', () => {
    const formValue: CIConfigFormValue = {
      name: 'api-server',
      imageRegistry: ' harbor.example.com/project-a/ ',
      imageTagRuleType: 'branch',
      imageTagTemplate: '',
      withTimestamp: true,
      withCommit: false,
      makefilePath: './Makefile',
      makeCommand: 'build-image',
      dockerfilePath: './Dockerfile',
    };

    expect(ciConfigToCreatePayload(formValue)).toEqual({
      name: 'api-server',
      image_registry: 'harbor.example.com/project-a',
      image_tag_rule: {
        type: 'branch',
        with_timestamp: true,
        with_commit: false,
      },
      build_spec: {
        makefile_path: './Makefile',
        make_command: 'build-image',
        dockerfile_path: './Dockerfile',
      },
    });
  });
});
