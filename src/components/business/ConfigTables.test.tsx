import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CDConfigsTable, CIConfigsTable, InstancesTable } from './ConfigTables';

describe('config tables', () => {
  it('renders ci config table with integrated search and pagination', async () => {
    const configs = Array.from({ length: 12 }, (_, index) => ({
      id: `ci-${index + 1}`,
      buId: 'bu-001',
      name: `ci-${index + 1}`,
      registry: 'harbor.example.io',
      repo: `org/service-${index + 1}`,
      tagRule: '${branch}-${commit:7}',
      buildType: 'dockerfile' as const,
    }));

    render(<CIConfigsTable configs={configs} />);

    expect(await screen.findByPlaceholderText('搜索 CI 配置')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '构建类型' })).toHaveStyle({ textAlign: 'center' });
    expect(screen.getByTitle('2')).toBeInTheDocument();
  });

  it('renders cd config table with expected headers', async () => {
    render(
      <CDConfigsTable
        configs={[
          {
            id: 'cd-001',
            buId: 'bu-001',
            name: 'cd-api-server-dev',
            renderEngine: 'Helm',
            releaseMode: 'rolling',
            gitOpsRepo: 'gitops.example.io/api-server/dev',
          },
        ]}
      />,
    );

    expect(await screen.findByRole('columnheader', { name: 'GitOps 仓库' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索 CD 配置')).toBeInTheDocument();
  });

  it('renders instance table with right-aligned numeric columns', async () => {
    render(
      <InstancesTable
        instances={[
          {
            id: 'inst-001',
            buId: 'bu-001',
            name: 'inst-api-dev',
            env: 'dev',
            type: 'Deployment',
            replicas: 2,
            readyReplicas: 2,
            cpu: '500m',
            memory: '512Mi',
            status: 'running',
          },
        ]}
      />,
    );

    expect(await screen.findByRole('columnheader', { name: '就绪' })).toHaveStyle({ textAlign: 'right' });
    expect(screen.getByRole('columnheader', { name: 'CPU' })).toHaveStyle({ textAlign: 'right' });
    expect(screen.getByRole('columnheader', { name: '状态' })).toHaveStyle({ textAlign: 'center' });
  });

  it('pins each table pagination to the bottom of the table area', () => {
    const { container: ciContainer } = render(
      <CIConfigsTable
        configs={[
          {
            id: 'ci-001',
            buId: 'bu-001',
            name: 'ci-api-server',
            registry: 'harbor.example.io',
            repo: 'org/api-server',
            tagRule: '${branch}-${commit:7}',
            buildType: 'dockerfile',
          },
        ]}
      />,
    );
    const { container: cdContainer } = render(
      <CDConfigsTable
        configs={[
          {
            id: 'cd-001',
            buId: 'bu-001',
            name: 'cd-api-server-dev',
            renderEngine: 'Helm',
            releaseMode: 'rolling',
            gitOpsRepo: 'gitops.example.io/api-server/dev',
          },
        ]}
      />,
    );
    const { container: instanceContainer } = render(
      <InstancesTable
        instances={[
          {
            id: 'inst-001',
            buId: 'bu-001',
            name: 'inst-api-dev',
            env: 'dev',
            type: 'Deployment',
            replicas: 2,
            readyReplicas: 2,
            cpu: '500m',
            memory: '512Mi',
            status: 'running',
          },
        ]}
      />,
    );

    expect(ciContainer.querySelector('style')?.textContent ?? '').toContain('margin-block-start: auto');
    expect(cdContainer.querySelector('style')?.textContent ?? '').toContain('margin-block-start: auto');
    expect(instanceContainer.querySelector('style')?.textContent ?? '').toContain('margin-block-start: auto');
  });

  it('centers pagination for each table', async () => {
    const manyCiConfigs = Array.from({ length: 12 }, (_, index) => ({
      id: `ci-${index + 1}`,
      buId: 'bu-001',
      name: `ci-${index + 1}`,
      registry: 'harbor.example.io',
      repo: `org/service-${index + 1}`,
      tagRule: '${branch}-${commit:7}',
      buildType: 'dockerfile' as const,
    }));
    const manyCdConfigs = Array.from({ length: 12 }, (_, index) => ({
      id: `cd-${index + 1}`,
      buId: 'bu-001',
      name: `cd-${index + 1}`,
      renderEngine: 'Helm',
      releaseMode: 'rolling',
      gitOpsRepo: `gitops.example.io/service-${index + 1}`,
    }));
    const manyInstances = Array.from({ length: 12 }, (_, index) => ({
      id: `inst-${index + 1}`,
      buId: 'bu-001',
      name: `inst-${index + 1}`,
      env: index % 2 === 0 ? 'dev' as const : 'prod' as const,
      type: 'Deployment',
      replicas: 2,
      readyReplicas: 2,
      cpu: '500m',
      memory: '512Mi',
      status: 'running' as const,
    }));

    const { container: ciContainer } = render(<CIConfigsTable configs={manyCiConfigs} />);
    const { container: cdContainer } = render(<CDConfigsTable configs={manyCdConfigs} />);
    const { container: instanceContainer } = render(<InstancesTable instances={manyInstances} />);

    expect(await screen.findByText('ci-10')).toBeInTheDocument();
    expect(ciContainer.querySelector('.ant-table-pagination')).toHaveClass('ant-pagination-center');
    expect(cdContainer.querySelector('.ant-table-pagination')).toHaveClass('ant-pagination-center');
    expect(instanceContainer.querySelector('.ant-table-pagination')).toHaveClass('ant-pagination-center');
  });

});
