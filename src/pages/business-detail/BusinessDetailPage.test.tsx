import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppRouter } from '../../app/router/routes';

describe('business detail page', () => {
  it('renders the seeded business detail metadata', async () => {
    const { container } = render(<AppRouter kind="memory" initialEntries={['/business/bu-001']} />);

    expect(await screen.findByRole('heading', { name: 'api-server' })).toBeInTheDocument();
    expect(screen.getByText('核心 REST API 服务')).toBeInTheDocument();
    expect(screen.getByText('api-server-dev')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /返回我的业务/i })).toBeNull();
    expect(container.querySelector('div[style*="border-top: 1px solid rgb(229, 230, 235)"]')).toBeNull();
  });

  it('switches detail tabs while keeping the seeded reference data visible', async () => {
    render(<AppRouter kind="memory" initialEntries={['/business/bu-001']} />);

    fireEvent.click(await screen.findByRole('tab', { name: /^CI 配置/ }));
    expect(screen.getByText('ci-api-server')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索 CI 配置')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /^CD 配置/ }));
    expect(screen.getByText('cd-api-server-dev')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索 CD 配置')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /^实例/ }));
    expect(screen.getByText('inst-api-dev')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索实例')).toBeInTheDocument();
  });

  it('filters deploy plans from the integrated table panel search input', async () => {
    render(<AppRouter kind="memory" initialEntries={['/business/bu-001']} />);

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
