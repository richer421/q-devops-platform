import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRouter } from '../../app/router/routes';
import { __resetBusinessUnitListCacheForTest } from '../../lib/metahub-business-unit';

const originalFetch = globalThis.fetch;
const originalIntersectionObserver = globalThis.IntersectionObserver;

type MockIntersectionObserverEntry = {
  callback: IntersectionObserverCallback;
  elements: Set<Element>;
};

const intersectionObserverEntries: MockIntersectionObserverEntry[] = [];

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px 0px 240px 0px';
  readonly thresholds = [0];

  constructor(private readonly callback: IntersectionObserverCallback) {
    intersectionObserverEntries.push({
      callback,
      elements: new Set<Element>(),
    });
  }

  disconnect() {
    const entry = intersectionObserverEntries.find(
      (item) => item.callback === this.callback,
    );
    entry?.elements.clear();
  }

  observe(target: Element) {
    const entry = intersectionObserverEntries.find(
      (item) => item.callback === this.callback,
    );
    entry?.elements.add(target);
  }

  takeRecords() {
    return [];
  }

  unobserve(target: Element) {
    const entry = intersectionObserverEntries.find(
      (item) => item.callback === this.callback,
    );
    entry?.elements.delete(target);
  }
}

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

function hasExactText(text: string) {
  return (_content: string, element: Element | null) =>
    element?.textContent === text;
}

function isVisibleDropdownOption(element: Element) {
  return Boolean(element.closest('.ant-select-item-option'));
}

function buildArtifact(id: number) {
  return {
    id,
    ci_config_id: 31,
    business_unit_id: 21,
    deploy_plan_id: 61,
    name: `api-server-${id}`,
    pipeline: {
      name: 'standard',
      stages: [
        { name: 'checkout', title: '代码检出' },
        { name: 'compile', title: '代码编译' },
        { name: 'image_build', title: '镜像构建' },
        { name: 'image_push', title: '镜像推送' },
      ],
    },
    image_ref: `harbor.local/demo/api-server:${id}`,
    image_tag: `build-${id}`,
    image_digest: `sha256:${id}`,
    status: 'success',
    build_source: {
      repo_url: 'https://github.com/org/api-server.git',
      ref_type: 'branch',
      ref_value: 'main',
    },
    stages: [
      {
        name: 'checkout',
        title: '代码检出',
        status: 'success',
        started_at: '2026-03-21T10:00:00Z',
        finished_at: '2026-03-21T10:00:02Z',
      },
    ],
    jenkins_build_url: `http://127.0.0.1:30090/job/q-ci-build/${id}`,
    jenkins_build_number: id,
    created_at: '2026-03-21T10:00:00Z',
  };
}

describe('cicd page', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
    globalThis.IntersectionObserver = originalIntersectionObserver;
    intersectionObserverEntries.length = 0;
    __resetBusinessUnitListCacheForTest();
  });

  it('keeps filters empty by default and still loads build records before and after selecting a business unit', async () => {
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
          page_size: 10,
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
          page_size: 10,
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
              pipeline: {
                name: 'standard',
                stages: [
                  { name: 'checkout', title: '代码检出' },
                  { name: 'compile', title: '代码编译' },
                  { name: 'image_build', title: '镜像构建' },
                  { name: 'image_push', title: '镜像推送' },
                ],
              },
              image_ref: 'harbor.local/demo/api-server:main',
              image_tag: 'main',
              image_digest: 'sha256:abc123',
              status: 'success',
              build_source: {
                repo_url: 'https://github.com/org/api-server.git',
                ref_type: 'branch',
                ref_value: 'main',
              },
              stages: [
                {
                  name: 'checkout',
                  title: '代码检出',
                  status: 'success',
                  started_at: '2026-03-21T10:00:00Z',
                  finished_at: '2026-03-21T10:00:02Z',
                },
                {
                  name: 'compile',
                  title: '代码编译',
                  status: 'success',
                  started_at: '2026-03-21T10:00:02Z',
                  finished_at: '2026-03-21T10:01:05Z',
                },
                {
                  name: 'image_build',
                  title: '镜像构建',
                  status: 'success',
                  started_at: '2026-03-21T10:01:05Z',
                  finished_at: '2026-03-21T10:01:45Z',
                },
                {
                  name: 'image_push',
                  title: '镜像推送',
                  status: 'success',
                  started_at: '2026-03-21T10:01:45Z',
                  finished_at: '2026-03-21T10:02:05Z',
                },
              ],
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

    expect(await screen.findByText('请选择业务单元')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/v1/business-units?page=1&page_size=10',
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/q-ci-api/api/v1/artifacts?page=1&page_size=20',
      expect.any(Object),
    );
    expect(
      screen
        .getByTestId('build-filter-business-unit')
        .querySelector('.ant-select-selection-placeholder'),
    ).toHaveTextContent('请选择业务单元');
    expect(
      screen
        .getByTestId('build-filter-deploy-plan')
        .querySelector('.ant-select-selection-placeholder'),
    ).toHaveTextContent('按部署计划筛选');

    const businessUnitSelector = screen
      .getByTestId('build-filter-business-unit')
      .closest('.ant-select');
    expect(businessUnitSelector).not.toBeNull();
    fireEvent.mouseDown(
      businessUnitSelector!.querySelector('.ant-select-selector')!,
    );
    const businessUnitOption = (
      await screen.findAllByText(hasExactText('api-server'))
    ).find(isVisibleDropdownOption);
    expect(businessUnitOption).toBeDefined();
    fireEvent.click(
      businessUnitOption!.closest('.ant-select-item-option') ??
        businessUnitOption!,
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/v1/business-units/21/deploy-plans?page=1&page_size=10',
      expect.any(Object),
    );

    expect(
      await screen.findByRole('link', { name: /Jenkins #42/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '展开条目详情' }));
    expect(screen.getByText('镜像推送')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Jenkins #42/i })).toHaveAttribute(
      'href',
      'http://127.0.0.1:30090/job/q-ci-build/42',
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      '/q-ci-api/api/v1/artifacts?page=1&page_size=20&business_unit_id=21',
      expect.any(Object),
    );
  });

  it('triggers a build with deploy plan and ref semantics', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(
        async (input: RequestInfo | URL, init?: RequestInit) => {
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
                {
                  id: 22,
                  name: 'worker',
                  description: '异步任务服务',
                  project_id: 102,
                  created_at: '2026-03-18T09:10:00Z',
                  updated_at: '2026-03-18T09:40:00Z',
                },
              ],
              total: 1,
              page: 1,
              page_size: 10,
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
              page_size: 10,
            });
          }

          if (url.startsWith('/api/v1/business-units/22/deploy-plans?')) {
            return jsonResponse({
              items: [
                {
                  id: 71,
                  business_unit_id: 22,
                  name: 'worker-dev',
                  env: 'dev',
                  ci_config_name: 'ci-worker',
                  cd_config_name: 'cd-worker',
                  instance_name: 'inst-worker-dev',
                  last_status: 'success',
                  last_time: '2026-03-21T09:10:00Z',
                },
              ],
              total: 1,
              page: 1,
              page_size: 10,
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
                deploy_plan_id: 71,
                ref_type: 'tag',
                ref_value: 'v1.2.3',
              }),
            });
            return jsonResponse({
              artifact_id: 108,
              deploy_plan_id: 71,
              status: 'running',
              image_ref: 'harbor.local/demo/worker:v1.2.3',
              image_tag: 'v1.2.3',
            });
          }

          throw new Error(`unexpected request: ${url}`);
        },
      );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<AppRouter kind="memory" initialEntries={['/cicd']} />);

    fireEvent.click(await screen.findByRole('button', { name: /触发构建/i }));

    const businessUnitSelector = screen
      .getByTestId('trigger-build-business-unit')
      .querySelector('.ant-select-selector');
    expect(businessUnitSelector).not.toBeNull();
    fireEvent.mouseDown(businessUnitSelector!);
    const workerOption = (
      await screen.findAllByText(hasExactText('worker'))
    ).find(isVisibleDropdownOption);
    expect(workerOption).toBeDefined();
    fireEvent.click(
      workerOption!.closest('.ant-select-item-option') ?? workerOption!,
    );

    expect(
      fetchMock.mock.calls.some(
        ([input]) =>
          String(input) ===
          '/q-ci-api/api/v1/artifacts?page=1&page_size=20&business_unit_id=22',
      ),
    ).toBe(false);

    const deployPlanSelector = screen
      .getByTestId('trigger-build-deploy-plan')
      .querySelector('.ant-select-selector');
    expect(deployPlanSelector).not.toBeNull();
    fireEvent.mouseDown(deployPlanSelector!);
    const workerDeployPlanOption = (
      await screen.findAllByText(hasExactText('worker-dev'))
    ).find(isVisibleDropdownOption);
    expect(workerDeployPlanOption).toBeDefined();
    fireEvent.click(
      workerDeployPlanOption!.closest('.ant-select-item-option') ??
        workerDeployPlanOption!,
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Tag' }));
    fireEvent.change(
      screen.getByPlaceholderText('例如：main / v1.2.3 / a1b2c3d4'),
      {
        target: { value: 'v1.2.3' },
      },
    );
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

  it('loads the next build page when the load-more sentinel enters the viewport', async () => {
    globalThis.IntersectionObserver =
      MockIntersectionObserver as typeof IntersectionObserver;

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
          page_size: 10,
        });
      }

      if (url === '/q-ci-api/api/v1/artifacts?page=1&page_size=20') {
        return jsonResponse({
          list: Array.from({ length: 20 }, (_, index) =>
            buildArtifact(index + 1),
          ),
          total: 23,
        });
      }

      if (url === '/q-ci-api/api/v1/artifacts?page=2&page_size=20') {
        return jsonResponse({
          list: Array.from({ length: 3 }, (_, index) =>
            buildArtifact(index + 21),
          ),
          total: 23,
        });
      }

      throw new Error(`unexpected request: ${url}`);
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<AppRouter kind="memory" initialEntries={['/cicd']} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/q-ci-api/api/v1/artifacts?page=1&page_size=20',
        expect.any(Object),
      );
    });
    expect(await screen.findByText('api-server-20')).toBeInTheDocument();
    expect(screen.queryByText('api-server-23')).not.toBeInTheDocument();

    const loadMoreSentinel = await screen.findByTestId(
      'build-list-load-more-sentinel',
    );
    const activeObserver = intersectionObserverEntries.find((entry) =>
      entry.elements.has(loadMoreSentinel),
    );
    expect(activeObserver).toBeDefined();

    await act(async () => {
      activeObserver!.callback(
        [
          {
            boundingClientRect: loadMoreSentinel.getBoundingClientRect(),
            intersectionRatio: 1,
            intersectionRect: loadMoreSentinel.getBoundingClientRect(),
            isIntersecting: true,
            rootBounds: null,
            target: loadMoreSentinel,
            time: Date.now(),
          } satisfies IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/q-ci-api/api/v1/artifacts?page=2&page_size=20',
        expect.any(Object),
      );
    });
    expect(await screen.findByText('api-server-23')).toBeInTheDocument();
  });
});
