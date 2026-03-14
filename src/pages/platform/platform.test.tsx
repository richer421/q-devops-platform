import { TestBrowser } from '@@/testBrowser';
import { render, screen } from '@testing-library/react';
import React from 'react';

describe('Platform pages', () => {
  it('renders dashboard page', async () => {
    render(
      <TestBrowser
        location={{
          pathname: '/dashboard',
        }}
      />,
    );

    expect(await screen.findByText('平台总览')).not.toBeNull();
    expect(screen.getByText('最近活动')).not.toBeNull();
  });

  it('renders business units page', async () => {
    render(
      <TestBrowser
        location={{
          pathname: '/business-units',
        }}
      />,
    );

    expect(await screen.findByText('业务单元')).not.toBeNull();
    expect(screen.getByText('新建业务单元')).not.toBeNull();
  });

  it('renders ci builds page', async () => {
    render(
      <TestBrowser
        location={{
          pathname: '/ci-builds',
        }}
      />,
    );

    expect(await screen.findByText('CI 构建中心')).not.toBeNull();
    expect(screen.getByText('构建记录')).not.toBeNull();
  });
});
