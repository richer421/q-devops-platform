import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildSteps, builds } from '../../mock';
import { BuildCard } from './BuildCard';

describe('build card', () => {
  it('renders build steps inside expandable step containers', async () => {
    const build = builds.find((item) => item.id === 'BUILD-004');

    expect(build).toBeDefined();

    render(<BuildCard build={build!} steps={buildSteps[build!.id] ?? []} />);

    fireEvent.click(screen.getByText('chore: upgrade vite to 5.2.0'));

    const stepContainers = document.querySelectorAll('[data-cicd-step-container="true"]');

    expect(stepContainers).toHaveLength((buildSteps[build!.id] ?? []).length);
    expect(await screen.findByText('镜像推送')).toBeInTheDocument();
  });

  it('renders terminal detail inside a dedicated step detail panel', async () => {
    const build = builds.find((item) => item.id === 'BUILD-004');

    expect(build).toBeDefined();

    render(<BuildCard build={build!} steps={buildSteps[build!.id] ?? []} />);

    fireEvent.click(screen.getByText('chore: upgrade vite to 5.2.0'));
    fireEvent.click(screen.getByRole('button', { name: /镜像推送 22s/i }));

    expect(document.querySelector('[data-cicd-step-detail="terminal"]')).not.toBeNull();
    expect(await screen.findByText(/sha256:a1b2c3d4e5f6/i)).toBeInTheDocument();
  });
});
