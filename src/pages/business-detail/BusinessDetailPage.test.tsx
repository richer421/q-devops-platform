import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { message } from 'antd';
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
  });

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
          strategy_summary: String(body.deployment_mode) === '金丝雀发布' ? '3 批次 / 10%,30%,60%' : '按默认批次滚动发布',
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
    fireEvent.change(await screen.findByLabelText('名称'), { target: { value: 'cd-api-server-gray' } });
    fireEvent.click(screen.getByRole('button', { name: '创建 CD 配置' }));

    expect(await screen.findByText('cd-api-server-gray')).toBeInTheDocument();

    const existingRow = screen.getByText('cd-api-server-prod').closest('tr');
    expect(existingRow).not.toBeNull();
    fireEvent.click(within(existingRow as HTMLElement).getByRole('button', { name: '编辑' }));

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
    expect(within(detailDrawer).getByText('2026-03-18T14:00:00Z')).toBeInTheDocument();
  });

  it('shows backend delete error message for referenced metahub cd config', async () => {
    const messageError = vi.spyOn(message, 'error').mockImplementation(
      () => Promise.resolve(true) as unknown as ReturnType<typeof message.error>,
    );

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
    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: '删除' }));

    await waitFor(() => {
      expect(messageError).toHaveBeenCalledWith('该 CD 配置已被发布计划引用，禁止删除');
    });
  });
});
