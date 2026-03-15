import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppRouter } from '../../app/router/routes';

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
    expect(screen.getByRole('button', { name: /配置 inst-api-dev/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Pod' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '配置' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^YAML$/ })).toBeInTheDocument();

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
    expect(screen.getByText('Deployment 规格')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /编\s*辑/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'YAML' }));
    expect(await screen.findByText(/instance_type: deployment/)).toBeInTheDocument();
    expect(screen.getByText(/attach_resources:/)).toBeInTheDocument();
  });

  it('switches the active business instance from the config entry', async () => {
    render(<AppRouter kind="memory" initialEntries={['/business/bu-001']} />);

    fireEvent.click(await screen.findByRole('button', { name: /配置 inst-api-prod/i }));

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
});
