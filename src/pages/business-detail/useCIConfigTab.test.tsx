import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CIConfigFormValue, CIConfigItem } from '../../lib/metahub-ci-config';
import { useCIConfigTab } from './useCIConfigTab';

const metahubMocks = vi.hoisted(() => ({
  listBusinessUnitCIConfigs: vi.fn(),
  getCIConfig: vi.fn(),
  createBusinessUnitCIConfig: vi.fn(),
  updateCIConfig: vi.fn(),
  deleteCIConfig: vi.fn(),
}));

vi.mock('../../lib/metahub-ci-config', () => ({
  listBusinessUnitCIConfigs: metahubMocks.listBusinessUnitCIConfigs,
  getCIConfig: metahubMocks.getCIConfig,
  createBusinessUnitCIConfig: metahubMocks.createBusinessUnitCIConfig,
  updateCIConfig: metahubMocks.updateCIConfig,
  deleteCIConfig: metahubMocks.deleteCIConfig,
  ciConfigToFormValue: (item: CIConfigItem) => ({
    name: item.name,
    imageTagRuleType: item.imageTagRule.type,
    imageTagTemplate: item.imageTagRule.template,
    withTimestamp: item.imageTagRule.withTimestamp,
    withCommit: item.imageTagRule.withCommit,
    makefilePath: item.buildSpec.makefilePath,
    makeCommand: item.buildSpec.makeCommand,
    dockerfilePath: item.buildSpec.dockerfilePath,
  }),
}));

function createItem(id: number, name: string): CIConfigItem {
  return {
    id,
    businessUnitID: 34,
    name,
    imageTagRule: {
      type: 'branch',
      template: '',
      withTimestamp: true,
      withCommit: false,
    },
    tagRuleLabel: '${branch}-${timestamp}',
    buildSpec: {
      makefilePath: './Makefile',
      makeCommand: 'make build',
      dockerfilePath: './Dockerfile',
      dockerContext: '.',
    },
    createdAt: '2026-03-18T10:00:00Z',
    updatedAt: '2026-03-18T12:00:00Z',
  };
}

function HookHarness() {
  const tab = useCIConfigTab({
    businessUnitID: 34,
    enabled: true,
  });

  const submitValue: CIConfigFormValue = {
    name: 'api-server-updated',
    imageTagRuleType: 'branch',
    imageTagTemplate: '',
    withTimestamp: true,
    withCommit: false,
    makefilePath: './Makefile',
    makeCommand: 'make build',
    dockerfilePath: './Dockerfile',
  };

  return (
    <div>
      <div data-testid="page">{tab.page}</div>
      <div data-testid="keyword">{tab.keyword}</div>
      <div data-testid="detail-name">{tab.detailItem?.name ?? ''}</div>
      <div data-testid="delete-name">{tab.deleteTarget?.name ?? ''}</div>
      <div data-testid="delete-error">{tab.deleteError}</div>
      <button onClick={() => tab.onPageChange(2, 10)}>page-2</button>
      <button onClick={() => tab.onKeywordChange('api-server')}>search-api</button>
      <button onClick={() => tab.requestDelete(createItem(12, 'api-server'))}>open-delete</button>
      <button onClick={() => void tab.confirmDelete()}>confirm-delete</button>
      <button onClick={() => tab.openDetail(createItem(12, 'api-server'))}>open-detail</button>
      <button onClick={() => tab.openEditForm(createItem(12, 'api-server'))}>open-edit</button>
      <button onClick={() => void tab.submitForm(submitValue)}>submit-edit</button>
    </div>
  );
}

describe('useCIConfigTab', () => {
  beforeEach(() => {
    metahubMocks.listBusinessUnitCIConfigs.mockReset();
    metahubMocks.getCIConfig.mockReset();
    metahubMocks.createBusinessUnitCIConfig.mockReset();
    metahubMocks.updateCIConfig.mockReset();
    metahubMocks.deleteCIConfig.mockReset();
  });

  it('resets page to first page when searching by name', async () => {
    metahubMocks.listBusinessUnitCIConfigs
      .mockResolvedValueOnce({
        items: [createItem(1, 'ci-1')],
        total: 11,
        page: 1,
        pageSize: 10,
      })
      .mockResolvedValueOnce({
        items: [createItem(11, 'ci-11')],
        total: 11,
        page: 2,
        pageSize: 10,
      })
      .mockResolvedValueOnce({
        items: [createItem(12, 'api-server')],
        total: 1,
        page: 1,
        pageSize: 10,
      });

    render(<HookHarness />);

    await waitFor(() => {
      expect(metahubMocks.listBusinessUnitCIConfigs).toHaveBeenCalledWith(34, {
        page: 1,
        pageSize: 10,
        keyword: '',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'page-2' }));

    await waitFor(() => {
      expect(screen.getByTestId('page')).toHaveTextContent('2');
    });

    fireEvent.click(screen.getByRole('button', { name: 'search-api' }));

    await waitFor(() => {
      expect(screen.getByTestId('page')).toHaveTextContent('1');
      expect(metahubMocks.listBusinessUnitCIConfigs).toHaveBeenLastCalledWith(34, {
        page: 1,
        pageSize: 10,
        keyword: 'api-server',
      });
    });
  });

  it('falls back to the previous page after deleting the last row on current page', async () => {
    metahubMocks.listBusinessUnitCIConfigs
      .mockResolvedValueOnce({
        items: [createItem(1, 'ci-1')],
        total: 11,
        page: 1,
        pageSize: 10,
      })
      .mockResolvedValueOnce({
        items: [createItem(12, 'api-server')],
        total: 11,
        page: 2,
        pageSize: 10,
      })
      .mockResolvedValueOnce({
        items: [createItem(1, 'ci-1')],
        total: 10,
        page: 1,
        pageSize: 10,
      });
    metahubMocks.deleteCIConfig.mockResolvedValue(undefined);

    render(<HookHarness />);

    await waitFor(() => {
      expect(metahubMocks.listBusinessUnitCIConfigs).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'page-2' }));

    await waitFor(() => {
      expect(screen.getByTestId('page')).toHaveTextContent('2');
    });

    fireEvent.click(screen.getByRole('button', { name: 'open-delete' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'confirm-delete' }));
    });

    await waitFor(() => {
      expect(metahubMocks.deleteCIConfig).toHaveBeenCalledWith(12);
      expect(screen.getByTestId('page')).toHaveTextContent('1');
      expect(metahubMocks.listBusinessUnitCIConfigs).toHaveBeenLastCalledWith(34, {
        page: 1,
        pageSize: 10,
        keyword: '',
      });
    });
  });

  it('refreshes detail data after editing the active ci config', async () => {
    metahubMocks.listBusinessUnitCIConfigs.mockResolvedValue({
      items: [createItem(12, 'api-server')],
      total: 1,
      page: 1,
      pageSize: 10,
    });
    metahubMocks.getCIConfig.mockResolvedValue(createItem(12, 'api-server'));
    metahubMocks.updateCIConfig.mockResolvedValue(createItem(12, 'api-server-updated'));

    render(<HookHarness />);

    await waitFor(() => {
      expect(metahubMocks.listBusinessUnitCIConfigs).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'open-detail' }));

    await waitFor(() => {
      expect(metahubMocks.getCIConfig).toHaveBeenCalledWith(12);
      expect(screen.getByTestId('detail-name')).toHaveTextContent('api-server');
    });

    fireEvent.click(screen.getByRole('button', { name: 'open-edit' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'submit-edit' }));
    });

    await waitFor(() => {
      expect(metahubMocks.updateCIConfig).toHaveBeenCalledWith(
        12,
        expect.objectContaining({
          name: 'api-server-updated',
        }),
      );
      expect(screen.getByTestId('detail-name')).toHaveTextContent('api-server-updated');
    });
  });

  it('maps english delete guard message into chinese copy', async () => {
    metahubMocks.listBusinessUnitCIConfigs.mockResolvedValue({
      items: [createItem(12, 'api-server')],
      total: 1,
      page: 1,
      pageSize: 10,
    });
    metahubMocks.deleteCIConfig.mockRejectedValue(new Error('ci config is referenced by 1 deploy plans and cannot be deleted'));

    render(<HookHarness />);

    await waitFor(() => {
      expect(metahubMocks.listBusinessUnitCIConfigs).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'open-delete' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'confirm-delete' }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('delete-error')).toHaveTextContent('该 CI 配置已被 1 个部署计划引用，禁止删除');
    });
  });
});
