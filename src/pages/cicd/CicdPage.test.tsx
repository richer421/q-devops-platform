import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppRouter } from '../../app/router/routes';

describe('cicd page', () => {
  it('uses compact vertical spacing between workspace cards', async () => {
    const { container } = render(<AppRouter kind="memory" initialEntries={['/cicd']} />);

    await screen.findByText('feat: add JWT authentication middleware');

    const space = container.querySelector('.ant-space');

    expect(space).not.toBeNull();
    expect(space).toHaveStyle({ rowGap: '2px' });
  });

  it('uses compact content padding around the workspace cards', async () => {
    const { container } = render(<AppRouter kind="memory" initialEntries={['/cicd']} />);

    await screen.findByText('feat: add JWT authentication middleware');

    const content = container.querySelector(
      '[data-page-content-container="true"] .ant-pro-page-container-children-container',
    );

    expect(content).not.toBeNull();
    expect(content).toHaveStyle({ padding: '2px' });
  });

  it('renders seeded build records', async () => {
    render(<AppRouter kind="memory" initialEntries={['/cicd']} />);

    expect(
      await screen.findByText('feat: add JWT authentication middleware'),
    ).toBeInTheDocument();
    expect(screen.getByText('chore: upgrade vite to 5.2.0')).toBeInTheDocument();
  });

  it('expands build details when a build card is clicked', async () => {
    render(<AppRouter kind="memory" initialEntries={['/cicd']} />);

    fireEvent.click(await screen.findByText('chore: upgrade vite to 5.2.0'));
    fireEvent.click(screen.getByRole('button', { name: /镜像推送 22s/i }));

    expect(
      await screen.findByText(/sha256:a1b2c3d4e5f6/i),
    ).toBeInTheDocument();
  });

  it('switches to the release workspace tab', async () => {
    render(<AppRouter kind="memory" initialEntries={['/cicd']} />);

    fireEvent.click(await screen.findByRole('tab', { name: /发布工作台/i }));

    expect(await screen.findByText('web-app')).toBeInTheDocument();
    expect(screen.getByText('#REL-004')).toBeInTheDocument();
  });
});
