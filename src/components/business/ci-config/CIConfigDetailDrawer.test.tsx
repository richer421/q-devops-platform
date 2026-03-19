import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CIConfigItem } from '../../../lib/metahub-ci-config';
import { CIConfigDetailDrawer } from './CIConfigDetailDrawer';

function createItem(): CIConfigItem {
  return {
    id: 12,
    businessUnitID: 34,
    name: 'q-demo-ci',
    imageTagRule: {
      type: 'commit',
      template: '',
      withTimestamp: false,
      withCommit: false,
    },
    tagRuleLabel: '${commit}',
    buildSpec: {
      makefilePath: './Makefile',
      makeCommand: 'make build',
      dockerfilePath: './Dockerfile',
      dockerContext: '.',
    },
    createdAt: '2026-03-19T15:18:00+08:00',
    updatedAt: '2026-03-19T15:19:14.317+08:00',
  };
}

describe('ci config detail drawer', () => {
  it('formats updated time as YYYY/MM/DD HH:mm', async () => {
    render(
      <CIConfigDetailDrawer
        open
        loading={false}
        error=""
        item={createItem()}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(await screen.findByText('2026/03/19 15:19')).toBeInTheDocument();
    expect(screen.queryByText('2026-03-19T15:19:14.317+08:00')).toBeNull();
  });
});
