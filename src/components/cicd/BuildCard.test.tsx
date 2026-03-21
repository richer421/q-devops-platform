import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { BuildRecord } from '../../lib/q-ci-build';
import { BuildCard } from './BuildCard';

const sampleBuild: BuildRecord = {
  id: 42,
  ciConfigID: 31,
  businessUnitID: 21,
  deployPlanID: 61,
  name: 'api-server',
  imageRef: 'harbor.local/demo/api-server:main',
  imageTag: 'main',
  imageDigest: 'sha256:abc123',
  status: 'success',
  buildSource: {
    repoURL: 'https://github.com/org/api-server.git',
    refType: 'branch',
    refValue: 'main',
    commitID: '',
    commitMessage: '',
    author: '',
  },
  buildStartedAt: '2026-03-21T10:00:00Z',
  buildFinishedAt: '2026-03-21T10:02:05Z',
  errorMessage: '',
  jenkinsBuildURL: 'http://127.0.0.1:30090/job/q-ci-build/42',
  jenkinsBuildNumber: 42,
  createdAt: '2026-03-21T10:00:00Z',
};

describe('build card', () => {
  it('renders the task-level build summary and artifact info', async () => {
    render(<BuildCard build={sampleBuild} />);

    expect(screen.getByText('api-server')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Jenkins #42/i })).toHaveAttribute(
      'href',
      'http://127.0.0.1:30090/job/q-ci-build/42',
    );
  });

});
