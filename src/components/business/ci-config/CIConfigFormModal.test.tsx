import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CIConfigFormValue } from '../../../lib/metahub-ci-config';
import { CIConfigFormModal } from './CIConfigFormModal';

const defaultInitialValue: CIConfigFormValue = {
  name: '',
  imageTagRuleType: 'branch',
  imageTagTemplate: '',
  withTimestamp: true,
  withCommit: false,
  makefilePath: './Makefile',
  makeCommand: '',
  dockerfilePath: './Dockerfile',
};

describe('ci config form modal', () => {
  it('does not expose image registry input and submits make build by default', async () => {
    const onSubmit = vi.fn();

    render(
      <CIConfigFormModal
        open
        mode="create"
        initialValue={defaultInitialValue}
        submitting={false}
        onSubmit={onSubmit}
        onClose={() => {}}
      />,
    );

    expect(screen.queryByLabelText('镜像仓库地址')).toBeNull();

    fireEvent.change(screen.getByLabelText('名称'), { target: { value: 'api-server' } });
    fireEvent.change(screen.getByLabelText('构建命令'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: '创建' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'api-server',
        makeCommand: 'make build',
      }));
    });
  });
});
