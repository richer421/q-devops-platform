import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeployPlanFormModal } from './DeployPlanFormModal';

describe('DeployPlanFormModal', () => {
  it('renders instance environment as tag-like label', async () => {
    render(
      <DeployPlanFormModal
        open
        mode="create"
        initialValue={{ name: '', description: '' }}
        submitting={false}
        optionLoading={false}
        ciOptions={[]}
        cdOptions={[]}
        instanceOptions={[
          { value: 1, label: 'inst-api-w', env: 'dev', searchLabel: 'inst-api-w dev' },
        ]}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    fireEvent.mouseDown(screen.getByLabelText('实例配置'));

    expect(await screen.findByText('inst-api-w')).toBeInTheDocument();
    expect(screen.getByText('开发')).toBeInTheDocument();
  });
});
