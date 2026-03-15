import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppRouter } from '../../app/router/routes';

describe('business list page', () => {
  it('renders the seeded business list on the default route', async () => {
    render(<AppRouter kind="memory" initialEntries={['/business']} />);

    expect(await screen.findByText('api-server')).toBeInTheDocument();
    expect(screen.getByText('web-app')).toBeInTheDocument();
  });

  it('navigates to business detail when clicking the business name', async () => {
    render(<AppRouter kind="memory" initialEntries={['/business']} />);

    fireEvent.click(await screen.findByRole('button', { name: 'api-server' }));

    expect(await screen.findByRole('heading', { name: 'api-server' })).toBeInTheDocument();
    expect(screen.getByText('api-server-dev')).toBeInTheDocument();
  });

  it('renders the primary create action from the reference layout', async () => {
    render(<AppRouter kind="memory" initialEntries={['/business']} />);

    expect(
      await screen.findByRole('button', { name: /新建业务单元/i }),
    ).toBeInTheDocument();
  });

  it('filters business rows from the integrated search input', async () => {
    render(<AppRouter kind="memory" initialEntries={['/business']} />);

    const searchInput = await screen.findByPlaceholderText('搜索名称或描述');
    fireEvent.change(searchInput, { target: { value: 'web-app' } });

    expect(screen.getByText('web-app')).toBeInTheDocument();
    expect(screen.queryByText('api-server')).toBeNull();
  });
});
