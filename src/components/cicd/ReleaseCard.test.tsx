import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { releaseStages, releases } from '../../mock';
import { ReleaseCard } from './ReleaseCard';

describe('release card', () => {
  it('renders release stages inside expandable step containers', async () => {
    const release = releases.find((item) => item.id === 'REL-004');

    expect(release).toBeDefined();

    render(<ReleaseCard release={release!} stages={releaseStages[release!.id] ?? []} />);

    const stepContainers = document.querySelectorAll('[data-cicd-step-container="true"]');

    expect(stepContainers).toHaveLength((releaseStages[release!.id] ?? []).length);
    expect(await screen.findByText('滚动部署')).toBeInTheDocument();
  });

  it('renders rollout detail and terminal detail with different step panels', async () => {
    const release = releases.find((item) => item.id === 'REL-004');

    expect(release).toBeDefined();

    render(<ReleaseCard release={release!} stages={releaseStages[release!.id] ?? []} />);

    expect(document.querySelector('[data-cicd-step-detail="rollout"]')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /预检 3s/i }));
    expect(document.querySelector('[data-cicd-step-detail="terminal"]')).not.toBeNull();
    expect(await screen.findByText(/Pre-flight checks passed/i)).toBeInTheDocument();
  });
});
