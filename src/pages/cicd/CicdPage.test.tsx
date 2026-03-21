import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRouter } from '../../app/router/routes';

const originalFetch = globalThis.fetch;

function jsonResponse(data: unknown) {
  return {
    ok: true,
    json: async () => ({
      code: 0,
      message: 'ok',
      data,
    }),
  };
}

describe('cicd page', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it('loads build records from the real q-ci query flow', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.startsWith('/api/v1/business-units?')) {
        return jsonResponse({
          items: [
            {
              id: 21,
              name: 'api-server',
              description: '核心 REST API 服务',
              project_id: 101,
              created_at: '2026-03-18T09:00:00Z',
              updated_at: '2026-03-18T09:30:00Z',
            },
          ],
          total: 1,
          page: 1,
          page_size: 200,
        });
      }

      if (url.startsWith('/api/v1/business-units/21/deploy-plans?')) {
        return jsonResponse({
          items: [
            {
              id: 61,
              business_unit_id: 21,
              name: 'api-server-dev',
              env: 'dev',
              ci_config_name: 'ci-api-server',
              cd_config_name: 'cd-api-server',
              instance_name: 'inst-api-server-dev',
              last_status: 'success',
              last_time: '2026-03-21T09:00:00Z',
            },
          ],
          total: 1,
          page: 1,
          page_size: 200,
        });
      }

      if (url.startsWith('/q-ci-api/api/v1/artifacts?')) {
        return jsonResponse({
          list: [
            {
              id: 42,
              ci_config_id: 31,
              business_unit_id: 21,
              deploy_plan_id: 61,
              name: 'api-server',
              image_ref: 'harbor.local/demo/api-server:main',
              image_tag: 'main',
              image_digest: 'sha256:abc123',
              status: 'success',
              build_source: {
                repo_url: 'https://github.com/org/api-server.git',
                ref_type: 'branch',
                ref_value: 'main',
              },
              jenkins_build_url: 'http://127.0.0.1:30090/job/q-ci-build/42',
              jenkins_build_number: 42,
              created_at: '2026-03-21T10:00:00Z',
            },
          ],
          total: 1,
        });
      }

      throw new Error(`unexpected request: ${url}`);
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<AppRouter kind="memory" initialEntries={['/cicd']} />);

    expect(await screen.findByRole('link', { name: /Jenkins #42/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Jenkins #42/i })).toHaveAttribute(
      'href',
      'http://127.0.0.1:30090/job/q-ci-build/42',
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/q-ci-api/api/v1/artifacts?page=1&page_size=20&business_unit_id=21',
      expect.any(Object),
    );
  });

  it('triggers a build with deploy plan and ref semantics', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.startsWith('/api/v1/business-units?')) {
          return jsonResponse({
            items: [
              {
                id: 21,
                name: 'api-server',
                description: '核心 REST API 服务',
                project_id: 101,
                created_at: '2026-03-18T09:00:00Z',
                updated_at: '2026-03-18T09:30:00Z',
              },
            ],
            total: 1,
            page: 1,
            page_size: 200,
          });
        }

        if (url.startsWith('/api/v1/business-units/21/deploy-plans?')) {
          return jsonResponse({
            items: [
              {
                id: 61,
                business_unit_id: 21,
                name: 'api-server-dev',
                env: 'dev',
                ci_config_name: 'ci-api-server',
                cd_config_name: 'cd-api-server',
                instance_name: 'inst-api-server-dev',
                last_status: 'success',
                last_time: '2026-03-21T09:00:00Z',
              },
            ],
            total: 1,
            page: 1,
            page_size: 200,
          });
        }

        if (url.startsWith('/q-ci-api/api/v1/artifacts?')) {
          return jsonResponse({
            list: [],
            total: 0,
          });
        }

        if (url === '/q-ci-api/api/v1/builds/trigger') {
          expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({
              deploy_plan_id: 61,
              ref_type: 'tag',
              ref_value: 'v1.2.3',
            }),
          });
          return jsonResponse({
            artifact_id: 108,
            deploy_plan_id: 61,
            status: 'running',
            image_ref: 'harbor.local/demo/api-server:v1.2.3',
            image_tag: 'v1.2.3',
          });
        }

        throw new Error(`unexpected request: ${url}`);
      });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<AppRouter kind="memory" initialEntries={['/cicd']} />);

    fireEvent.click(await screen.findByRole('button', { name: /触发构建/i }));

    fireEvent.click(screen.getByRole('radio', { name: 'Tag' }));
    fireEvent.change(screen.getByPlaceholderText('例如：main / v1.2.3 / a1b2c3d4'), {
      target: { value: 'v1.2.3' },
    });
    fireEvent.click(screen.getByRole('button', { name: '确认触发' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/q-ci-api/api/v1/builds/trigger',
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });
  });
});
