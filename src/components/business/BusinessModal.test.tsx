import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BusinessModal } from './BusinessModal';

const apiServerLabel = 'api-server (https://github.com/org/api-server)';
const webAppLabel = 'web-app (https://github.com/org/web-app)';

function hasExactText(text: string) {
  return (_content: string, element: Element | null) => element?.textContent === text;
}

function isVisibleDropdownOption(element: Element) {
  return Boolean(element.closest('.ant-select-item-option'));
}

function isSelectedValue(element: Element) {
  return Boolean(element.closest('.ant-select-selection-item'));
}

describe('business modal', () => {
  it('shows repo name and clickable repo url in project dropdown', async () => {
    render(
      <BusinessModal
        title="新建业务单元"
        mode="create"
        initialValue={{
          name: '',
          desc: '',
          projectId: 101,
        }}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    fireEvent.mouseDown(screen.getByRole('combobox'));

    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getByRole('option', { name: webAppLabel })).toBeInTheDocument();

    const repoLink = await screen.findByRole('link', { name: 'https://github.com/org/web-app' });
    expect(repoLink).toHaveAttribute('href', 'https://github.com/org/web-app');
    const selectedText = screen.findAllByText(hasExactText(apiServerLabel));
    expect((await selectedText).find(isSelectedValue)).toBeDefined();
  });

  it('submits the selected project in create mode', async () => {
    const onConfirm = vi.fn();

    render(
      <BusinessModal
        title="新建业务单元"
        mode="create"
        initialValue={{
          name: '',
          desc: '',
          projectId: 101,
        }}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('例：api-server'), {
      target: { value: 'member-center' },
    });
    fireEvent.change(screen.getByPlaceholderText('简要描述该业务单元的用途'), {
      target: { value: '负责会员账户与权益' },
    });

    fireEvent.mouseDown(screen.getByRole('combobox'));
    const optionContent = (await screen.findAllByText(hasExactText(webAppLabel))).find(isVisibleDropdownOption);
    expect(optionContent).toBeDefined();
    fireEvent.click(optionContent!.closest('.ant-select-item-option') ?? optionContent!);
    fireEvent.click(screen.getByRole('button', { name: '确认' }));

    expect(onConfirm).toHaveBeenCalledWith({
      name: 'member-center',
      desc: '负责会员账户与权益',
      projectId: 102,
    });
  });

  it('disables project selection in edit mode', () => {
    render(
      <BusinessModal
        title="编辑业务单元"
        mode="edit"
        initialValue={{
          name: 'api-server',
          desc: '核心 REST API 服务',
          projectId: 101,
        }}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const selectedText = screen.getAllByText(hasExactText(apiServerLabel)).find(isSelectedValue);
    expect(selectedText).toBeDefined();
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('renders a clickable repo url in the selected value area', () => {
    render(
      <BusinessModal
        title="编辑业务单元"
        mode="edit"
        initialValue={{
          name: 'api-server',
          desc: '核心 REST API 服务',
          projectId: 101,
        }}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const repoLink = screen.getByRole('link', { name: 'https://github.com/org/api-server' });
    expect(repoLink).toHaveAttribute('href', 'https://github.com/org/api-server');
  });
});
