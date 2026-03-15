import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BasePage } from './BasePage';

describe('base page', () => {
  it('renders the custom page header together with the content container', async () => {
    render(
      <BasePage
        breadcrumbs={[{ label: 'Q DevOps' }, { label: '示例页面' }]}
        title="示例页面"
        description="示例描述"
        contentStyle={{ padding: 0 }}
      >
        <div>页面内容</div>
      </BasePage>,
    );

    expect(await screen.findByRole('heading', { name: '示例页面' })).toBeInTheDocument();
    expect(screen.getByText('示例描述')).toBeInTheDocument();
    expect(screen.getByText('页面内容')).toBeInTheDocument();
  });

  it('keeps the page header horizontal padding aligned with page content', async () => {
    const { container } = render(
      <BasePage
        breadcrumbs={[{ label: 'Q DevOps' }, { label: '示例页面' }]}
        title="示例页面"
      >
        <div>页面内容</div>
      </BasePage>,
    );

    const header = container.querySelector('div[style*="border-bottom: 1px solid rgb(229, 230, 235)"]');
    const contentContainer = container.querySelector('[data-page-content-container="true"]');

    expect(header).not.toBeNull();
    expect(contentContainer).not.toBeNull();
    expect(header).toHaveStyle({ padding: '16px 16px 4px' });
    expect(contentContainer?.getAttribute('style') ?? '').not.toContain('padding-inline');
  });

  it('removes the extension divider and top spacing when disabled', () => {
    const { container } = render(
      <BasePage
        breadcrumbs={[{ label: 'Q DevOps' }, { label: '示例页面' }]}
        title="示例页面"
        extensionDivider={false}
        extension={<div>扩展内容</div>}
      >
        <div>页面内容</div>
      </BasePage>,
    );

    const extensionContainer = container.querySelector('div[style*="padding-top"]');

    expect(extensionContainer).not.toBeNull();
    expect(extensionContainer).toHaveStyle({
      marginTop: '0px',
      paddingTop: '0px',
    });
    expect(extensionContainer?.getAttribute('style') ?? '').not.toContain('border-top');
  });
});
