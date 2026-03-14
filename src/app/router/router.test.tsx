import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppRouter } from './routes';

describe('app router', () => {
  it('redirects the root route to /business', async () => {
    render(<AppRouter kind="memory" initialEntries={['/']} />);

    expect(await screen.findByRole('heading', { name: '我的业务' })).toBeInTheDocument();
  });

  it('keeps the cicd navigation item active on /cicd', async () => {
    render(<AppRouter kind="memory" initialEntries={['/cicd']} />);

    const navItem = await screen.findByRole('link', { name: 'CI&CD 工作台' });

    expect(navItem).toHaveAttribute('data-active', 'true');
    expect(screen.getByRole('heading', { name: 'CI&CD 工作台' })).toBeInTheDocument();
  });

  it('renders the not-found page for an unknown route', async () => {
    render(<AppRouter kind="memory" initialEntries={['/missing']} />);

    expect(await screen.findByRole('heading', { name: '页面不存在' })).toBeInTheDocument();
  });
});
