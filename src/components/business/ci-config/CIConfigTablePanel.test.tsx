import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CIConfigItem } from '../../../lib/metahub-ci-config';
import { CIConfigTablePanel } from './CIConfigTablePanel';

function createItem(): CIConfigItem {
  return {
    id: 12,
    businessUnitID: 34,
    name: 'api-server',
    imageRegistry: 'harbor.example.com/project-a',
    imageRepo: 'api-server',
    fullImageRepo: 'harbor.example.com/project-a/api-server',
    imageTagRule: {
      type: 'branch',
      template: '',
      withTimestamp: true,
      withCommit: true,
    },
    tagRuleLabel: '分支名 + 时间戳 + Commit',
    buildSpec: {
      makefilePath: './Makefile',
      makeCommand: 'build',
      dockerfilePath: './Dockerfile',
      dockerContext: '.',
    },
    createdAt: '2026-03-18T10:00:00Z',
    updatedAt: '2026-03-18T12:00:00Z',
  };
}

describe('ci config table panel', () => {
  it('renders toolbar and dispatches create/detail/edit/delete actions', async () => {
    const item = createItem();
    const onCreate = vi.fn();
    const onView = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <CIConfigTablePanel
        items={[item]}
        total={1}
        page={1}
        pageSize={10}
        keyword=""
        loading={false}
        onKeywordChange={() => undefined}
        onPageChange={() => undefined}
        onCreate={onCreate}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(await screen.findByPlaceholderText('搜索 CI 配置名称')).toBeInTheDocument();
    expect(screen.getByText('harbor.example.com/project-a/api-server')).toBeInTheDocument();
    expect(screen.getByText('分支名 + 时间戳 + Commit')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '新建 CI 配置' }));
    fireEvent.click(screen.getByRole('button', { name: '详情' }));
    fireEvent.click(screen.getByRole('button', { name: '编辑 api-server' }));
    fireEvent.click(screen.getByRole('button', { name: '删除 api-server' }));

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onView).toHaveBeenCalledWith(item);
    expect(onEdit).toHaveBeenCalledWith(item);
    expect(onDelete).toHaveBeenCalledWith(item);
  });
});
