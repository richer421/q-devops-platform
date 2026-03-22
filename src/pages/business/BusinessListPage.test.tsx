import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRouter } from '../../app/router/routes';
import { __resetBusinessUnitListCacheForTest } from '../../lib/metahub-business-unit';

const originalFetch = globalThis.fetch;
const webAppLabel = 'web-app (https://github.com/org/web-app)';

function hasExactText(text: string) {
  return (_content: string, element: Element | null) => element?.textContent === text;
}

function isVisibleDropdownOption(element: Element) {
  return Boolean(element.closest('.ant-select-item-option'));
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

describe('business list page', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
    __resetBusinessUnitListCacheForTest();
  });

  it('renders the fetched business list on the default route', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({
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
      page: 1,
      page_size: 10,
    })) as typeof fetch;

    render(<AppRouter kind="memory" initialEntries={['/business']} />);

    expect(await screen.findByText('api-server')).toBeInTheDocument();
    expect(screen.getByText('github.com/org/api-server.git')).toBeInTheDocument();
  });

  it('falls back to local project catalog when backend project is absent', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({
      items: [
        {
          id: 8,
          name: 'q-demo-bu',
          description: '用于验证 CI 的业务',
          project_id: 104,
          created_at: '2026-03-18T09:00:00Z',
          updated_at: '2026-03-18T09:30:00Z',
        },
      ],
      total: 1,
      page: 1,
      page_size: 10,
    })) as typeof fetch;

    render(<AppRouter kind="memory" initialEntries={['/business']} />);

    expect(await screen.findByText('q-demo-bu')).toBeInTheDocument();
    expect(screen.getByText('github.com/richer421/q-demo')).toBeInTheDocument();
  });

  it('navigates to business detail when clicking the business name', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        items: [
          {
            id: 7,
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
      }))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({
        items: [],
        total: 0,
        page: 1,
        page_size: 10,
      })) as typeof fetch;

    render(<AppRouter kind="memory" initialEntries={['/business']} />);

    fireEvent.click(await screen.findByRole('button', { name: 'api-server' }));

    expect(await screen.findByRole('heading', { name: 'api-server' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '业务实例' })).toBeInTheDocument();
  });

  it('renders the primary create action from the reference layout', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
    })) as typeof fetch;

    render(<AppRouter kind="memory" initialEntries={['/business']} />);

    expect(
      await screen.findByRole('button', { name: /新建业务单元/i }),
    ).toBeInTheDocument();
  });

  it('filters business rows from the server-side search input', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        items: [
          {
            id: 7,
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
      }))
      .mockResolvedValueOnce(jsonResponse({
        items: [
          {
            id: 8,
            name: 'web-app',
            description: '前端 Web 单页应用',
            project_id: 102,
            created_at: '2026-03-18T09:00:00Z',
            updated_at: '2026-03-18T09:30:00Z',
          },
        ],
        total: 1,
        page: 1,
        page_size: 10,
      }));
    globalThis.fetch = fetchMock as typeof fetch;

    render(<AppRouter kind="memory" initialEntries={['/business']} />);

    const searchInput = await screen.findByPlaceholderText('搜索名称或描述');
    fireEvent.change(searchInput, { target: { value: 'web-app' } });

    expect(await screen.findByText('web-app')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith('/api/v1/business-units?page=1&page_size=10&keyword=web-app', expect.any(Object));
  });

  it('creates a business unit from the modal with a fixed project selection', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        items: [],
        total: 0,
        page: 1,
        page_size: 10,
      }))
      .mockResolvedValueOnce(jsonResponse({
        id: 9,
        name: 'member-center',
        description: '负责会员账户与权益',
        project_id: 102,
        created_at: '2026-03-18T09:00:00Z',
        updated_at: '2026-03-18T09:30:00Z',
      }))
      .mockResolvedValueOnce(jsonResponse({
        items: [
          {
            id: 9,
            name: 'member-center',
            description: '负责会员账户与权益',
            project_id: 102,
            created_at: '2026-03-18T09:00:00Z',
            updated_at: '2026-03-18T09:30:00Z',
          },
        ],
        total: 1,
        page: 1,
        page_size: 10,
      }));
    globalThis.fetch = fetchMock as typeof fetch;

    render(<AppRouter kind="memory" initialEntries={['/business']} />);

    fireEvent.click(await screen.findByRole('button', { name: /新建业务单元/i }));
    fireEvent.change(screen.getByPlaceholderText('例：api-server'), {
      target: { value: 'member-center' },
    });
    fireEvent.change(screen.getByPlaceholderText('简要描述该业务单元的用途'), {
      target: { value: '负责会员账户与权益' },
    });
    fireEvent.mouseDown(screen.getByRole('combobox'));
    const optionContent = (await screen.findAllByText(hasExactText(webAppLabel))).find(isVisibleDropdownOption);
    expect(optionContent).toBeDefined();
    fireEvent.click(optionContent!.closest('.ant-select-item-option') ?? optionContent!);
    fireEvent.click(screen.getByRole('button', { name: '确认' }));

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/v1/business-units', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        name: 'member-center',
        description: '负责会员账户与权益',
        project_id: 102,
      }),
    }));
    expect(await screen.findByText('member-center')).toBeInTheDocument();
  });
});
