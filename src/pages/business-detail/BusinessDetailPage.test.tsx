import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppRouter } from '../../app/router/routes';

describe('business detail page', () => {
  it('renders the seeded business detail metadata', async () => {
    render(<AppRouter kind="memory" initialEntries={['/business/bu-001']} />);

    expect(await screen.findByRole('heading', { name: 'api-server' })).toBeInTheDocument();
    expect(screen.getByText('核心 REST API 服务')).toBeInTheDocument();
    expect(screen.getByText('api-server-dev')).toBeInTheDocument();
  });

  it('switches detail tabs while keeping the seeded reference data visible', async () => {
    render(<AppRouter kind="memory" initialEntries={['/business/bu-001']} />);

    fireEvent.click(await screen.findByRole('button', { name: /^CI 配置/ }));
    expect(screen.getByText('ci-api-server')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^CD 配置/ }));
    expect(screen.getByText('cd-api-server-dev')).toBeInTheDocument();
  });

  it('renders the empty state when the business id does not exist', async () => {
    render(<AppRouter kind="memory" initialEntries={['/business/unknown']} />);

    expect(await screen.findByText('未找到该业务单元')).toBeInTheDocument();
  });
});
