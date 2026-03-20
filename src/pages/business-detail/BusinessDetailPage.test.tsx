import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRouter } from '../../app/router/routes';

function createApiResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify({
    code: 0,
    message: 'ok',
    data,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

function getRequestURL(input: string | URL | Request) {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof Request) {
    return input.url;
  }
  return input.toString();
}

async function selectOption(label: string, optionText: string) {
  fireEvent.mouseDown(screen.getByLabelText(label));
  const options = await screen.findAllByText(optionText);
  fireEvent.click(options[options.length - 1]);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('business detail page', () => {
  it('renders the seeded business detail metadata', async () => {
    const { container } = render(<AppRouter kind="memory" initialEntries={['/business/bu-001']} />);

    expect(await screen.findByRole('heading', { name: 'api-server' })).toBeInTheDocument();
    expect(screen.getByText('核心 REST API 服务')).toBeInTheDocument();
    expect(screen.getAllByText('inst-api-dev').length).toBeGreaterThan(0);
    expect(screen.queryByRole('heading', { name: '业务详情' })).toBeNull();
    expect(screen.queryByText('查看业务单元的部署计划、CI/CD 配置与实例状态')).toBeNull();
    expect(screen.queryByRole('button', { name: /返回我的业务/i })).toBeNull();
    expect(container.querySelector('div[style*="border-top: 1px solid rgb(229, 230, 235)"]')).toBeNull();
  }, 10000);

  it('switches detail tabs while keeping the seeded reference data visible', async () => {
    render(<AppRouter kind="memory" initialEntries={['/business/bu-001']} />);

    const instanceTab = await screen.findByRole('tab', { name: /^业务实例/ });

    expect(instanceTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getAllByText('inst-api-dev').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /选择实例 inst-api-dev/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Pod' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '配置' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /^YAML$/ })).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: /^CI 配置/ }));
    expect(screen.getByText('ci-api-server')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索 CI 配置')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /^CD 配置/ }));
    expect(screen.getByText('cd-api-server-dev')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索 CD 配置')).toBeInTheDocument();
  });

  it('opens the tab from query string on initial render', async () => {
    render(<AppRouter kind="memory" initialEntries={['/business/bu-001?tab=cd']} />);

    const cdTab = await screen.findByRole('tab', { name: /^CD 配置/ });
    expect(cdTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('cd-api-server-dev')).toBeInTheDocument();
  });

  it('switches the instance config panel between visual and yaml modes', async () => {
    render(<AppRouter kind="memory" initialEntries={['/business/bu-001']} />);

    await screen.findByRole('tab', { name: /^业务实例/ });

    expect(screen.getByRole('tab', { name: 'Pod' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('api-server-dev-6f9d4d4b7f-km2p8')).toBeInTheDocument();
    expect(screen.getByText('api-server-dev-6f9d4d4b7f-p7m4n')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: '配置' }));
    expect(screen.getByText('基础配置层')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /编\s*辑/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'YAML 视图' }));
    const yamlViewer = await screen.findByTestId('pod-yaml-viewer');
    expect(yamlViewer).toHaveTextContent('instance_type: deployment');
    expect(yamlViewer).toHaveTextContent('image: IMAGE');
    expect(yamlViewer).toHaveTextContent('attach_resources:');
  });

  it('switches the active business instance from the config entry', async () => {
    render(<AppRouter kind="memory" initialEntries={['/business/bu-001']} />);

    fireEvent.click(await screen.findByRole('button', { name: /选择实例 inst-api-prod/i }));

    expect(screen.getAllByText('inst-api-prod').length).toBeGreaterThan(0);
    expect(screen.getByText('api-server-prod-7c68d4d6df-9x2pl')).toBeInTheDocument();
    expect(screen.getByText('api-server-prod-7c68d4d6df-q8n5r')).toBeInTheDocument();
  });

  it('filters deploy plans from the integrated table panel search input', async () => {
    render(<AppRouter kind="memory" initialEntries={['/business/bu-001']} />);

    fireEvent.click(await screen.findByRole('tab', { name: /^部署计划/ }));

    const searchInput = await screen.findByPlaceholderText('搜索部署计划');
    fireEvent.change(searchInput, { target: { value: 'prod' } });

    expect(screen.getByText('api-server-prod')).toBeInTheDocument();
    expect(screen.queryByText('api-server-dev')).toBeNull();
  });

  it('renders the empty state when the business id does not exist', async () => {
    render(<AppRouter kind="memory" initialEntries={['/business/unknown']} />);

    expect(await screen.findByText('未找到该业务单元')).toBeInTheDocument();
  });

  it('integrates metahub cd config list with create, edit and detail actions', async () => {
    const cdRows = [
      {
        id: 12,
        business_unit_id: 1,
        name: 'cd-api-server-prod',
        release_region: '华北',
        release_env: '生产',
        deployment_mode: '滚动发布',
        strategy_summary: '按默认批次滚动发布',
        created_at: '2026-03-18T10:00:00Z',
        updated_at: '2026-03-18T12:00:00Z',
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = getRequestURL(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/v1/instance-oam-templates' && method === 'GET') {
        return createApiResponse([]);
      }
      if (url.startsWith('/api/v1/business-units/1/instance-oams?') && method === 'GET') {
        return createApiResponse({
          items: [],
          total: 0,
          page: 1,
          page_size: 10,
        });
      }
      if (url.startsWith('/api/v1/business-units/1/cd-configs?') && method === 'GET') {
        return createApiResponse({
          items: cdRows,
          total: cdRows.length,
          page: 1,
          page_size: 10,
        });
      }
      if (url === '/api/v1/business-units/1/cd-configs' && method === 'POST') {
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        const created = {
          id: 18,
          business_unit_id: 1,
          name: String(body.name),
          release_region: String(body.release_region),
          release_env: String(body.release_env),
          deployment_mode: String(body.deployment_mode),
          strategy_summary: '按默认批次滚动发布',
          created_at: '2026-03-18T13:00:00Z',
          updated_at: '2026-03-18T13:00:00Z',
        };
        cdRows.unshift(created);
        return createApiResponse(created);
      }
      if (url === '/api/v1/cd-configs/12' && method === 'GET') {
        return createApiResponse(cdRows.find((item) => item.id === 12));
      }
      if (url === '/api/v1/cd-configs/12' && method === 'PUT') {
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        const index = cdRows.findIndex((item) => item.id === 12);
        cdRows[index] = {
          ...cdRows[index],
          name: String(body.name),
          release_region: String(body.release_region),
          release_env: String(body.release_env),
          deployment_mode: String(body.deployment_mode),
          strategy_summary:
            String(body.deployment_mode) === '金丝雀发布' || String(body.deployment_mode) === 'canary'
              ? '3 批次 / 10%,30%,60%'
              : '按默认批次滚动发布',
          updated_at: '2026-03-18T14:00:00Z',
        };
        return createApiResponse(cdRows[index]);
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });

    render(<AppRouter kind="memory" initialEntries={['/business/1']} />);

    fireEvent.click(await screen.findByRole('tab', { name: /^CD 配置/ }));
    expect(await screen.findByText('cd-api-server-prod')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '新建 CD 配置' }));
    expect(document.querySelector('.ant-modal')).not.toBeNull();
    fireEvent.change(await screen.findByLabelText('名称'), { target: { value: 'cd-api-server-gray' } });
    fireEvent.click(screen.getByRole('button', { name: '创建 CD 配置' }));

    expect(await screen.findByText('cd-api-server-gray')).toBeInTheDocument();

    const existingRow = screen.getByText('cd-api-server-prod').closest('tr');
    expect(existingRow).not.toBeNull();
    fireEvent.click(within(existingRow as HTMLElement).getByRole('button', { name: /^编辑 / }));

    expect(await screen.findByDisplayValue('cd-api-server-prod')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('名称'), { target: { value: 'cd-api-server-prod-canary' } });
    fireEvent.click(screen.getByRole('radio', { name: '金丝雀发布' }));
    fireEvent.change(await screen.findByLabelText('流量批次数'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('每批流量比例'), { target: { value: '10,30,60' } });
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }));

    expect(await screen.findByText('cd-api-server-prod-canary')).toBeInTheDocument();

    const updatedRow = screen.getByText('cd-api-server-prod-canary').closest('tr');
    expect(updatedRow).not.toBeNull();
    fireEvent.click(within(updatedRow as HTMLElement).getByRole('button', { name: '详情' }));

    const detailDrawer = await screen.findByRole('dialog');
    expect(within(detailDrawer).getByText('3 批次 / 10%,30%,60%')).toBeInTheDocument();
    expect(within(detailDrawer).getByText('2026/03/18 14:00')).toBeInTheDocument();
  }, 10000);

  it('shows backend delete error in confirm modal for referenced metahub cd config', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = getRequestURL(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/v1/instance-oam-templates' && method === 'GET') {
        return createApiResponse([]);
      }
      if (url.startsWith('/api/v1/business-units/1/instance-oams?') && method === 'GET') {
        return createApiResponse({
          items: [],
          total: 0,
          page: 1,
          page_size: 10,
        });
      }
      if (url.startsWith('/api/v1/business-units/1/cd-configs?') && method === 'GET') {
        return createApiResponse({
          items: [
            {
              id: 12,
              business_unit_id: 1,
              name: 'cd-api-server-prod',
              release_region: '华北',
              release_env: '生产',
              deployment_mode: '滚动发布',
              strategy_summary: '按默认批次滚动发布',
              created_at: '2026-03-18T10:00:00Z',
              updated_at: '2026-03-18T12:00:00Z',
            },
          ],
          total: 1,
          page: 1,
          page_size: 10,
        });
      }
      if (url === '/api/v1/cd-configs/12' && method === 'DELETE') {
        return new Response(JSON.stringify({
          code: 40901,
          message: '该 CD 配置已被发布计划引用，禁止删除',
          data: {},
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });

    render(<AppRouter kind="memory" initialEntries={['/business/1']} />);

    fireEvent.click(await screen.findByRole('tab', { name: /^CD 配置/ }));
    expect(await screen.findByText('cd-api-server-prod')).toBeInTheDocument();

    const row = screen.getByText('cd-api-server-prod').closest('tr');
    expect(row).not.toBeNull();
    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: /^删除 / }));
    fireEvent.click(screen.getByRole('button', { name: '确认删除' }));

    await waitFor(() => {
      expect(screen.getByText('该 CD 配置已被发布计划引用，禁止删除')).toBeInTheDocument();
    });
  });

  it('loads metahub deploy plans when plans tab is active', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = getRequestURL(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/v1/instance-oam-templates' && method === 'GET') {
        return createApiResponse([]);
      }
      if (url.startsWith('/api/v1/business-units/1/instance-oams?') && method === 'GET') {
        return createApiResponse({
          items: [],
          total: 0,
          page: 1,
          page_size: 10,
        });
      }
      if (url.startsWith('/api/v1/business-units/1/deploy-plans?') && method === 'GET') {
        return createApiResponse({
          items: [
            {
              id: 21,
              business_unit_id: 1,
              name: 'api-server-prod',
              env: 'prod',
              ci_config_name: 'ci-api-server',
              cd_config_name: 'cd-api-server-prod',
              instance_name: 'inst-api-prod',
              last_status: 'pending',
              last_time: '2026-03-20T08:30:00Z',
            },
          ],
          total: 1,
          page: 1,
          page_size: 200,
        });
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });

    render(<AppRouter kind="memory" initialEntries={['/business/1']} />);

    fireEvent.click(await screen.findByRole('tab', { name: /^部署计划/ }));

    expect(await screen.findByText('api-server-prod')).toBeInTheDocument();
    expect(screen.getByText('ci-api-server')).toBeInTheDocument();
    expect(screen.getByText('cd-api-server-prod')).toBeInTheDocument();
    expect(screen.getByText('inst-api-prod')).toBeInTheDocument();
  });

  it('integrates metahub deploy plan list with create, edit, detail and delete actions', async () => {
    const planRows = [
      {
        id: 21,
        business_unit_id: 1,
        name: 'api-server-prod',
        description: 'prod 发布计划',
        ci_config_id: 11,
        cd_config_id: 12,
        instance_oam_id: 13,
        env: 'prod',
        ci_config_name: 'ci-api-server',
        cd_config_name: 'cd-api-server-prod',
        instance_name: 'inst-api-prod',
        last_status: 'pending',
        last_time: '2026-03-20T08:30:00Z',
        created_at: '2026-03-20T08:00:00Z',
        updated_at: '2026-03-20T08:30:00Z',
      },
    ];

    const ciConfigRows = [
      {
        id: 11,
        business_unit_id: 1,
        name: 'ci-api-server',
        image_tag_rule: { type: 'branch', with_timestamp: true },
        build_spec: {
          makefile_path: './Makefile',
          make_command: 'make build',
          dockerfile_path: './Dockerfile',
        },
        created_at: '2026-03-20T07:00:00Z',
        updated_at: '2026-03-20T07:30:00Z',
      },
      {
        id: 14,
        business_unit_id: 1,
        name: 'ci-api-server-gray',
        image_tag_rule: { type: 'branch', with_timestamp: true },
        build_spec: {
          makefile_path: './Makefile',
          make_command: 'make build',
          dockerfile_path: './Dockerfile',
        },
        created_at: '2026-03-20T07:10:00Z',
        updated_at: '2026-03-20T07:40:00Z',
      },
    ];

    const cdConfigRows = [
      {
        id: 12,
        business_unit_id: 1,
        name: 'cd-api-server-prod',
        release_region: 'cn-north',
        release_env: 'prod',
        deployment_mode: 'rolling',
        strategy_summary: '按默认批次滚动发布',
        created_at: '2026-03-20T07:20:00Z',
        updated_at: '2026-03-20T07:50:00Z',
      },
      {
        id: 15,
        business_unit_id: 1,
        name: 'cd-api-server-gray',
        release_region: 'cn-east',
        release_env: 'gray',
        deployment_mode: 'rolling',
        strategy_summary: '按默认批次滚动发布',
        created_at: '2026-03-20T07:25:00Z',
        updated_at: '2026-03-20T07:55:00Z',
      },
    ];

    const instanceRows = [
      {
        id: 13,
        business_unit_id: 1,
        name: 'inst-api-prod',
        env: 'prod',
        schema_version: 'v1alpha1',
        oam_application: {},
        frontend_payload: {
          basic: {
            instance: {
              id: '13',
              buId: '1',
              name: 'inst-api-prod',
              env: 'prod',
              type: 'Deployment',
              instanceType: 'deployment',
              replicas: 2,
              readyReplicas: 2,
              cpu: '500m',
              memory: '512Mi',
              status: 'running',
              pods: [],
            },
          },
        },
      },
      {
        id: 16,
        business_unit_id: 1,
        name: 'inst-api-gray',
        env: 'gray',
        schema_version: 'v1alpha1',
        oam_application: {},
        frontend_payload: {
          basic: {
            instance: {
              id: '16',
              buId: '1',
              name: 'inst-api-gray',
              env: 'gray',
              type: 'Deployment',
              instanceType: 'deployment',
              replicas: 1,
              readyReplicas: 1,
              cpu: '250m',
              memory: '256Mi',
              status: 'running',
              pods: [],
            },
          },
        },
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = getRequestURL(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/v1/instance-oam-templates' && method === 'GET') {
        return createApiResponse([]);
      }
      if (url.startsWith('/api/v1/business-units/1/instance-oams?') && method === 'GET') {
        return createApiResponse({
          items: instanceRows,
          total: instanceRows.length,
          page: 1,
          page_size: 10,
        });
      }
      if (url.startsWith('/api/v1/business-units/1/ci-configs?') && method === 'GET') {
        return createApiResponse({
          items: ciConfigRows,
          total: ciConfigRows.length,
          page: 1,
          page_size: 200,
        });
      }
      if (url.startsWith('/api/v1/business-units/1/cd-configs?') && method === 'GET') {
        return createApiResponse({
          items: cdConfigRows,
          total: cdConfigRows.length,
          page: 1,
          page_size: 200,
        });
      }
      if (url.startsWith('/api/v1/business-units/1/deploy-plans?') && method === 'GET') {
        return createApiResponse({
          items: planRows.map((item) => ({
            id: item.id,
            business_unit_id: item.business_unit_id,
            name: item.name,
            env: item.env,
            ci_config_name: item.ci_config_name,
            cd_config_name: item.cd_config_name,
            instance_name: item.instance_name,
            last_status: item.last_status,
            last_time: item.last_time,
          })),
          total: planRows.length,
          page: 1,
          page_size: 200,
        });
      }
      if (url.startsWith('/api/v1/deploy-plans/') && method === 'GET') {
        const deployPlanID = Number(url.split('/').pop());
        return createApiResponse(planRows.find((item) => item.id === deployPlanID));
      }
      if (url === '/api/v1/business-units/1/deploy-plans' && method === 'POST') {
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        const created = {
          id: 22,
          business_unit_id: 1,
          name: String(body.name),
          description: String(body.description),
          ci_config_id: Number(body.ci_config_id),
          cd_config_id: Number(body.cd_config_id),
          instance_oam_id: Number(body.instance_oam_id),
          env: 'gray',
          ci_config_name: 'ci-api-server-gray',
          cd_config_name: 'cd-api-server-gray',
          instance_name: 'inst-api-gray',
          last_status: 'pending',
          last_time: '2026-03-20T09:00:00Z',
          created_at: '2026-03-20T09:00:00Z',
          updated_at: '2026-03-20T09:00:00Z',
        };
        planRows.unshift(created);
        return createApiResponse(created);
      }
      if (url === '/api/v1/deploy-plans/21' && method === 'PUT') {
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        const targetIndex = planRows.findIndex((item) => item.id === 21);
        const next = {
          ...planRows[targetIndex],
          name: String(body.name),
          description: String(body.description),
          ci_config_id: Number(body.ci_config_id),
          cd_config_id: Number(body.cd_config_id),
          instance_oam_id: Number(body.instance_oam_id),
          env: 'gray',
          ci_config_name: 'ci-api-server-gray',
          cd_config_name: 'cd-api-server-gray',
          instance_name: 'inst-api-gray',
          updated_at: '2026-03-20T09:30:00Z',
          last_time: '2026-03-20T09:30:00Z',
        };
        planRows[targetIndex] = next;
        return createApiResponse(next);
      }
      if (url === '/api/v1/deploy-plans/21' && method === 'DELETE') {
        const targetIndex = planRows.findIndex((item) => item.id === 21);
        planRows.splice(targetIndex, 1);
        return createApiResponse({});
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });

    render(<AppRouter kind="memory" initialEntries={['/business/1']} />);

    fireEvent.click(await screen.findByRole('tab', { name: /^部署计划/ }));
    expect(await screen.findByText('api-server-prod')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '新建部署计划' }));
    fireEvent.change(await screen.findByLabelText('名称'), { target: { value: 'api-server-gray' } });
    fireEvent.change(screen.getByLabelText('描述'), { target: { value: 'gray 发布计划' } });
    await selectOption('CI 配置', 'ci-api-server-gray');
    await selectOption('CD 配置', 'cd-api-server-gray');
    await selectOption('实例配置', 'inst-api-gray');
    fireEvent.click(screen.getByRole('button', { name: '创建' }));

    expect(await screen.findByText('api-server-gray')).toBeInTheDocument();

    const existingRow = screen.getByText('api-server-prod').closest('tr');
    expect(existingRow).not.toBeNull();
    fireEvent.click(within(existingRow as HTMLElement).getByRole('button', { name: /^编辑 / }));

    expect(await screen.findByDisplayValue('api-server-prod')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('名称'), { target: { value: 'api-server-prod-gray' } });
    fireEvent.change(screen.getByLabelText('描述'), { target: { value: 'gray 接管 prod' } });
    await selectOption('CI 配置', 'ci-api-server-gray');
    await selectOption('CD 配置', 'cd-api-server-gray');
    await selectOption('实例配置', 'inst-api-gray');
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(await screen.findByText('api-server-prod-gray')).toBeInTheDocument();

    const updatedRow = screen.getByText('api-server-prod-gray').closest('tr');
    expect(updatedRow).not.toBeNull();
    fireEvent.click(within(updatedRow as HTMLElement).getByRole('button', { name: '详情' }));

    const detailDrawer = await screen.findByRole('dialog');
    expect(within(detailDrawer).getByText('gray 接管 prod')).toBeInTheDocument();
    expect(within(detailDrawer).getByText('inst-api-gray')).toBeInTheDocument();
    expect(within(detailDrawer).getAllByText('2026/03/20 09:30').length).toBeGreaterThan(0);

    fireEvent.click(within(updatedRow as HTMLElement).getByRole('button', { name: /^删除 / }));
    fireEvent.click(screen.getByRole('button', { name: '确认删除' }));

    await waitFor(() => {
      expect(screen.queryByText('api-server-prod-gray')).toBeNull();
    });
  }, 10000);
});
