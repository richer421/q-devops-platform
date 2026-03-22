import { afterEach, describe, expect, it, vi } from 'vitest';
import { listBuilds } from './q-ci-build';

const originalFetch = globalThis.fetch;

describe('q-ci build client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it('loads the first build page without filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 0,
        message: 'ok',
        data: {
          list: [],
          total: 0,
        },
      }),
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await listBuilds({ page: 1, pageSize: 20 });

    expect(fetchMock).toHaveBeenCalledWith(
      '/q-ci-api/api/v1/artifacts?page=1&page_size=20',
      expect.any(Object),
    );
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('deduplicates in-flight build list requests with the same query', async () => {
    let resolveResponse: ((value: unknown) => void) | undefined;
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveResponse = resolve;
        }),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const first = listBuilds({ page: 1, pageSize: 20 });
    const second = listBuilds({ page: 1, pageSize: 20 });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveResponse?.({
      ok: true,
      json: async () => ({
        code: 0,
        message: 'ok',
        data: {
          list: [],
          total: 0,
        },
      }),
    });

    await expect(first).resolves.toEqual({ items: [], total: 0 });
    await expect(second).resolves.toEqual({ items: [], total: 0 });
  });
});
