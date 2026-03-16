import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { businessInstanceConfigs } from '../../mock';
import { BusinessInstancesPanel } from './BusinessInstancesPanel';

describe('business instances panel', () => {
  it('renders pod runtime view as the default detail content', async () => {
    render(<BusinessInstancesPanel instances={businessInstanceConfigs.filter((item) => item.buId === 'bu-001')} />);

    expect(screen.getByText('业务实例')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Pod' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('columnheader', { name: 'Pod 名称' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '状态' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '重启' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Pod IP' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '节点' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '操作' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '' })).toBeNull();
    expect(screen.getByText('api-server-dev-6f9d4d4b7f-km2p8')).toBeInTheDocument();
    expect(screen.getByText('api-server-dev-6f9d4d4b7f-p7m4n')).toBeInTheDocument();
    expect(screen.getByText('172.16.10.12')).toBeInTheDocument();
    expect(screen.getAllByText('Running').length).toBeGreaterThan(0);
    expect(screen.queryAllByRole('button', { name: '日志' })).toHaveLength(0);
    expect(screen.getAllByRole('button', { name: '事件' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'yaml' }).length).toBeGreaterThan(0);
  });

  it('expands pod containers and opens the logs dialog', async () => {
    render(<BusinessInstancesPanel instances={businessInstanceConfigs.filter((item) => item.buId === 'bu-001')} />);

    fireEvent.click(screen.getAllByRole('button', { name: '展开容器' })[0]);

    const containerPanel = await screen.findByTestId('pod-container-panel');
    const containerTable = await screen.findByTestId('pod-container-table');
    const firstContainerRow = containerTable.querySelector('.ant-table-row');
    expect(firstContainerRow).not.toBeNull();
    expect(within(containerTable).getByRole('columnheader', { name: '容器名称' })).toBeInTheDocument();
    expect(within(containerTable).getByRole('columnheader', { name: '镜像' })).toBeInTheDocument();
    expect(within(containerTable).getByRole('columnheader', { name: '分支@commit' })).toBeInTheDocument();
    expect(within(containerTable).getByRole('columnheader', { name: 'CPU' })).toBeInTheDocument();
    expect(within(containerTable).getByRole('columnheader', { name: '内存' })).toBeInTheDocument();
    expect(within(containerTable).getByRole('columnheader', { name: '重启次数' })).toBeInTheDocument();
    expect(within(containerTable).getByRole('columnheader', { name: '操作' })).toBeInTheDocument();
    expect(screen.getByText('develop@9f3a2c1')).toBeInTheDocument();
    expect(screen.getByText('0.5核')).toBeInTheDocument();
    expect(screen.getByText('0.5G')).toBeInTheDocument();
    const expandedCell = containerPanel.closest('td');
    expect(expandedCell).not.toBeNull();
    expect(expandedCell).toHaveStyle({
      paddingTop: '8px',
      paddingRight: '12px',
      paddingBottom: '8px',
      paddingLeft: '12px',
    });
    const expandedWrap = containerPanel.closest('tr.ant-table-expanded-row');
    expect(expandedWrap).not.toBeNull();
    expect(screen.getByText('api-server')).toBeInTheDocument();
    expect(screen.getByText('istio-proxy')).toBeInTheDocument();
    expect(within(containerTable).getAllByRole('button', { name: '日志' }).length).toBeGreaterThan(0);
    expect(within(containerTable).getAllByRole('button', { name: 'Terminal' }).length).toBeGreaterThan(0);

    fireEvent.click(within(containerTable).getAllByRole('button', { name: '日志' })[0]);

    expect(await screen.findByText('api-server-dev-6f9d4d4b7f-km2p8/api-server 日志')).toBeInTheDocument();
    expect(screen.queryByTestId('pod-log-terminal')).toBeNull();
    expect(screen.getByText(/Started HTTP server on :8080/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByLabelText('Close')[0]);
    fireEvent.click(within(containerTable).getAllByRole('button', { name: 'Terminal' })[0]);

    expect(await screen.findByText('api-server-dev-6f9d4d4b7f-km2p8/api-server Terminal')).toBeInTheDocument();
    expect(screen.getByTestId('pod-log-terminal')).toHaveTextContent('kubectl exec -it api-server-dev-6f9d4d4b7f-km2p8 -c api-server -- sh');
  });

  it('switches to config tab and saves the visual draft back to preview mode', async () => {
    render(<BusinessInstancesPanel instances={businessInstanceConfigs.filter((item) => item.buId === 'bu-001')} />);

    fireEvent.click(screen.getByRole('tab', { name: '配置' }));
    fireEvent.click(screen.getByRole('button', { name: /编\s*辑/ }));

    const replicasInput = screen.getByPlaceholderText('副本数');
    const imageInput = screen.getByPlaceholderText('容器镜像');

    fireEvent.change(replicasInput, { target: { value: '4' } });
    fireEvent.change(imageInput, { target: { value: 'harbor.example.io/org/api-server:2.0.0' } });
    fireEvent.click(screen.getByRole('button', { name: /保\s*存/ }));

    expect(screen.queryByPlaceholderText('副本数')).toBeNull();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('harbor.example.io/org/api-server:2.0.0')).toBeInTheDocument();
  }, 10000);

  it('switches the active instance and opens pod yaml dialog', async () => {
    render(<BusinessInstancesPanel instances={businessInstanceConfigs.filter((item) => item.buId === 'bu-001')} />);

    fireEvent.click(screen.getByRole('button', { name: /选择实例 inst-api-prod/i }));
    expect(screen.getAllByText('inst-api-prod')).toHaveLength(2);
    expect(screen.getByText('api-server-prod-7c68d4d6df-9x2pl')).toBeInTheDocument();
    expect(screen.getByText('api-server-prod-7c68d4d6df-q8n5r')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'yaml' })[0]);

    expect(await screen.findByText('api-server-prod-7c68d4d6df-9x2pl YAML')).toBeInTheDocument();
    expect(screen.getByTestId('pod-yaml-viewer')).toHaveTextContent('kind: Pod');
  });
});
