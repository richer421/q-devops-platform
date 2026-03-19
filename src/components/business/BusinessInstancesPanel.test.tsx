import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { businessInstanceConfigs, type Instance } from '../../mock';
import { BusinessInstancesPanel } from './BusinessInstancesPanel';

const seedInstances = businessInstanceConfigs.filter((item) => item.buId === 'bu-001');

function renderControlledPanel() {
  function Harness() {
    const [items, setItems] = useState<Instance[]>(seedInstances);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [keyword, setKeyword] = useState('');
    const [envFilter, setEnvFilter] = useState('all');

    const filteredItems = items.filter((item) => {
      const matchedEnv = envFilter === 'all' || item.env === envFilter;
      const matchedKeyword = keyword.trim() === '' || item.name.toLowerCase().includes(keyword.trim().toLowerCase());
      return matchedEnv && matchedKeyword;
    });
    const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

    return (
      <BusinessInstancesPanel
        instances={pagedItems}
        total={filteredItems.length}
        page={page}
        pageSize={pageSize}
        keyword={keyword}
        envFilter={envFilter}
        templates={[
          {
            key: 'low_load',
            name: '低负载业务',
            description: 'test template',
            replicas: 1,
            cpuRequest: '250m',
            cpuLimit: '500m',
            memoryRequest: '256Mi',
            memoryLimit: '512Mi',
          },
        ]}
        onPageChange={(nextPage, nextPageSize) => {
          setPage(nextPage);
          setPageSize(nextPageSize);
        }}
        onKeywordChange={(value) => {
          setKeyword(value);
          setPage(1);
        }}
        onEnvFilterChange={(value) => {
          setEnvFilter(value);
          setPage(1);
        }}
        onCreateInstance={async (payload) => {
          const created: Instance = {
            ...seedInstances[0],
            id: `inst-${payload.name}`,
            name: payload.name,
            env: payload.env,
            pods: [],
            readyReplicas: 0,
            status: 'stopped',
          };
          setItems((current) => [created, ...current]);
          setEnvFilter(payload.env);
          setKeyword('');
          setPage(1);
          return created;
        }}
      />
    );
  }

  render(<Harness />);
}

describe('business instances panel', () => {
  it('renders pod runtime view as the default detail content', async () => {
    render(<BusinessInstancesPanel instances={seedInstances} />);

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
    render(<BusinessInstancesPanel instances={seedInstances} />);

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
  }, 10000);

  it('switches to config tab and saves the visual draft back to preview mode', async () => {
    render(<BusinessInstancesPanel instances={seedInstances} />);

    fireEvent.click(screen.getByRole('tab', { name: '配置' }));
    fireEvent.click(screen.getByRole('button', { name: /编\s*辑/ }));

    const replicasInput = screen.getByPlaceholderText('副本数');

    fireEvent.change(replicasInput, { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: /保\s*存/ }));

    const readonlyReplicasInput = screen.getByPlaceholderText('副本数');

    expect(readonlyReplicasInput).toBeDisabled();
    expect((readonlyReplicasInput as HTMLInputElement).value).toBe('4');
    expect(screen.queryByPlaceholderText('容器镜像')).toBeNull();
  }, 10000);

  it('filters instances by environment and fuzzy name', async () => {
    renderControlledPanel();

    fireEvent.mouseDown(screen.getByText('全部环境'));
    const prodCandidates = await screen.findAllByText('生产');
    const prodOption = prodCandidates.find((element) => element.classList.contains('ant-select-item-option-content'));
    expect(prodOption).toBeDefined();
    fireEvent.click(prodOption!);

    expect(screen.getAllByText('inst-api-prod').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('inst-api-dev')).toHaveLength(0);

    fireEvent.change(screen.getByPlaceholderText('名称模糊匹配'), { target: { value: 'prod' } });
    expect(screen.getAllByText('inst-api-prod').length).toBeGreaterThan(0);
  });

  it('creates a new instance from modal and enters config edit mode', async () => {
    renderControlledPanel();

    fireEvent.click(screen.getByRole('button', { name: /创建实例/ }));
    fireEvent.change(screen.getByPlaceholderText('例如：inst-api-dev'), { target: { value: 'inst-api-gray' } });
    fireEvent.click(screen.getByRole('button', { name: '创建并编辑' }));

    expect((await screen.findAllByText('inst-api-gray')).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /保\s*存/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '配置' })).toHaveAttribute('aria-selected', 'true');
  });

  it('derives instance runtime status from pod states', () => {
    const stoppedInstance: Instance = {
      ...seedInstances[0],
      id: 'inst-stopped',
      name: 'inst-stopped',
      pods: [],
      status: 'running',
    };
    const degradedInstance: Instance = {
      ...seedInstances[0],
      id: 'inst-degraded',
      name: 'inst-degraded',
      pods: [
        {
          ...seedInstances[0].pods![0],
          name: 'inst-degraded-pod-1',
          status: 'CrashLoopBackOff',
        },
      ],
      status: 'running',
    };

    render(<BusinessInstancesPanel instances={[stoppedInstance, degradedInstance]} />);

    expect(screen.getAllByText('inst-stopped').length).toBeGreaterThan(0);
    expect(screen.getByText('未运行')).toBeInTheDocument();
    expect(screen.getAllByText('inst-degraded').length).toBeGreaterThan(0);
    expect(screen.getByText('异常')).toBeInTheDocument();
  });

  it('shows delete action on the selected list item instead of the config header', async () => {
    const onDeleteInstance = vi.fn(async () => {});
    render(<BusinessInstancesPanel instances={seedInstances} onDeleteInstance={onDeleteInstance} />);

    fireEvent.click(screen.getByRole('button', { name: /删除实例 inst-api-dev/i }));
    expect(await screen.findByText('删除业务实例')).toBeInTheDocument();
    expect(screen.getByText(/确定删除实例/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '确认删除' }));
    expect(onDeleteInstance).toHaveBeenCalledTimes(1);
    expect(onDeleteInstance).toHaveBeenCalledWith(expect.objectContaining({ id: seedInstances[0].id }));
  });

  it('switches the active instance and opens pod yaml dialog', async () => {
    render(<BusinessInstancesPanel instances={seedInstances} />);

    fireEvent.click(screen.getByRole('button', { name: /选择实例 inst-api-prod/i }));
    expect(screen.getAllByText('inst-api-prod')).toHaveLength(2);
    expect(screen.getByText('api-server-prod-7c68d4d6df-9x2pl')).toBeInTheDocument();
    expect(screen.getByText('api-server-prod-7c68d4d6df-q8n5r')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'yaml' })[0]);

    expect(await screen.findByText('api-server-prod-7c68d4d6df-9x2pl YAML')).toBeInTheDocument();
    expect(screen.getByTestId('pod-yaml-viewer')).toHaveTextContent('kind: Pod');
  });
});
