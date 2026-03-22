import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { BuildRecord } from '../../lib/q-ci-build';
import { BuildCard } from './BuildCard';

const sampleBuild: BuildRecord = {
  id: 42,
  ciConfigID: 31,
  businessUnitID: 21,
  deployPlanID: 61,
  name: 'api-server',
  pipeline: {
    name: 'standard',
    stages: [
      { name: 'checkout', title: '代码检出' },
      { name: 'compile', title: '代码编译' },
      { name: 'image_build', title: '镜像构建' },
      { name: 'image_push', title: '镜像推送' },
    ],
  },
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
  stages: [
    {
      name: 'checkout',
      title: '代码检出',
      status: 'success',
      startedAt: '2026-03-21T10:00:00Z',
      finishedAt: '2026-03-21T10:00:02Z',
      errorMessage: '',
    },
    {
      name: 'compile',
      title: '代码编译',
      status: 'success',
      startedAt: '2026-03-21T10:00:02Z',
      finishedAt: '2026-03-21T10:01:05Z',
      errorMessage: '',
    },
    {
      name: 'image_build',
      title: '镜像构建',
      status: 'success',
      startedAt: '2026-03-21T10:01:05Z',
      finishedAt: '2026-03-21T10:01:45Z',
      errorMessage: '',
    },
    {
      name: 'image_push',
      title: '镜像推送',
      status: 'success',
      startedAt: '2026-03-21T10:01:45Z',
      finishedAt: '2026-03-21T10:02:05Z',
      errorMessage: '',
    },
  ],
};

describe('build card', () => {
  it('renders the four official build stages and artifact info', async () => {
    render(<BuildCard build={sampleBuild} />);
    fireEvent.click(screen.getByRole('button', { name: '展开条目详情' }));

    expect(screen.getByText('api-server')).toBeInTheDocument();
    expect(screen.getByText('代码检出')).toBeInTheDocument();
    expect(screen.getByText('代码编译')).toBeInTheDocument();
    expect(screen.getByText('镜像构建')).toBeInTheDocument();
    expect(screen.getByText('镜像推送')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Jenkins #42/i })).toHaveAttribute(
      'href',
      'http://127.0.0.1:30090/job/q-ci-build/42',
    );
  });

});
