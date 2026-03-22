import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  __resetBusinessUnitListCacheForTest,
  createBusinessUnit,
  deleteBusinessUnit,
  listBusinessUnits,
  updateBusinessUnit,
} from './metahub-business-unit';

const originalFetch = globalThis.fetch;

describe('metahub business-unit client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
    __resetBusinessUnitListCacheForTest();
  });

  it('lists business units with pagination and keyword params', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 0,
        message: 'ok',
        data: {
          items: [
            {
              id: 7,
              name: 'api-server',
              description: '核心 REST API 服务',
              project_id: 101,
              project: {
                id: 101,
                git_id: 1001,
                name: 'api-server',
                repo_url: 'https://github.com/org/api-server.git',
                created_at: '2026-03-18T08:00:00Z',
                updated_at: '2026-03-18T08:30:00Z',
              },
              created_at: '2026-03-18T09:00:00Z',
              updated_at: '2026-03-18T09:30:00Z',
            },
          ],
          total: 1,
          page: 2,
          page_size: 25,
        },
      }),
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await listBusinessUnits({ page: 2, pageSize: 25, keyword: 'api' });

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/business-units?page=2&page_size=25&keyword=api', expect.any(Object));
    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      id: 7,
      name: 'api-server',
      description: '核心 REST API 服务',
      projectId: 101,
      project: {
        id: 101,
        name: 'api-server',
        repoUrl: 'https://github.com/org/api-server.git',
      },
    });
  });

  it('creates a business unit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 0,
        message: 'ok',
        data: {
          id: 9,
          name: 'member-center',
          description: '负责会员账户与权益',
          project_id: 101,
          created_at: '2026-03-18T09:00:00Z',
          updated_at: '2026-03-18T09:30:00Z',
        },
      }),
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await createBusinessUnit({
      name: 'member-center',
      description: '负责会员账户与权益',
      projectId: 101,
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/business-units', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        name: 'member-center',
        description: '负责会员账户与权益',
        project_id: 101,
      }),
    }));
    expect(result.id).toBe(9);
  });

  it('updates only editable business-unit fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 0,
        message: 'ok',
        data: {
          id: 9,
          name: 'member-center-v2',
          description: '新版说明',
          project_id: 101,
          created_at: '2026-03-18T09:00:00Z',
          updated_at: '2026-03-18T10:00:00Z',
        },
      }),
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await updateBusinessUnit(9, {
      name: 'member-center-v2',
      description: '新版说明',
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/business-units/9', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({
        name: 'member-center-v2',
        description: '新版说明',
      }),
    }));
    expect(result.projectId).toBe(101);
  });

  it('deletes a business unit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 0,
        message: 'ok',
        data: {},
      }),
    });
    globalThis.fetch = fetchMock as typeof fetch;

    await deleteBusinessUnit(9);

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/business-units/9', expect.objectContaining({
      method: 'DELETE',
    }));
  });

  it('deduplicates in-flight list requests with the same query', async () => {
    let resolveResponse: ((value: unknown) => void) | undefined;
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveResponse = resolve;
        }),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const first = listBusinessUnits({ page: 1, pageSize: 200 });
    const second = listBusinessUnits({ page: 1, pageSize: 200 });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveResponse?.({
      ok: true,
      json: async () => ({
        code: 0,
        message: 'ok',
        data: {
          items: [],
          total: 0,
          page: 1,
          page_size: 200,
        },
      }),
    });

    await expect(first).resolves.toMatchObject({ total: 0, page: 1, pageSize: 200 });
    await expect(second).resolves.toMatchObject({ total: 0, page: 1, pageSize: 200 });
  });

  it('invalidates cached list results after create', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          message: 'ok',
          data: {
            items: [],
            total: 0,
            page: 1,
            page_size: 200,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          message: 'ok',
          data: {
            id: 10,
            name: 'q-demo',
            description: 'demo',
            project_id: 1,
            created_at: '2026-03-22T16:00:00Z',
            updated_at: '2026-03-22T16:00:00Z',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          message: 'ok',
          data: {
            items: [],
            total: 0,
            page: 1,
            page_size: 200,
          },
        }),
      });
    globalThis.fetch = fetchMock as typeof fetch;

    await listBusinessUnits({ page: 1, pageSize: 200 });
    await createBusinessUnit({ name: 'q-demo', description: 'demo', projectId: 1 });
    await listBusinessUnits({ page: 1, pageSize: 200 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
