import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BusinessSummary } from './BusinessSummary';

describe('business summary', () => {
  it('adds 4px vertical padding around the summary block', () => {
    const { container } = render(
      <BusinessSummary
        business={{
          id: 'bu-001',
          name: 'api-server',
          desc: '核心 REST API 服务',
          repoUrl: 'https://github.com/org/api-server',
          status: 'active',
        }}
      />,
    );

    expect(container.firstElementChild).toHaveStyle({ paddingBlock: '4px' });
  });

  it('pushes the avatar icon down by 4px', () => {
    const { container } = render(
      <BusinessSummary
        business={{
          id: 'bu-001',
          name: 'api-server',
          desc: '核心 REST API 服务',
          repoUrl: 'https://github.com/org/api-server',
          status: 'active',
        }}
      />,
    );

    expect(container.querySelector('span.ant-avatar')?.parentElement).toHaveStyle({ marginTop: '4px' });
  });
});
