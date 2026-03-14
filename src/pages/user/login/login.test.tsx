import { TestBrowser } from '@@/testBrowser';
import { fireEvent, render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { currentUser, login } from '@/services/ant-design-pro/api';

jest.mock('@/services/ant-design-pro/api', () => ({
  currentUser: jest.fn(),
  login: jest.fn(),
  outLogin: jest.fn(),
}));

const mockedCurrentUser = jest.mocked(currentUser);
const mockedLogin = jest.mocked(login);

const mockLocation = {
  href: 'http://localhost/user/login',
  pathname: '/user/login',
  search: '',
};

describe('Login Page', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: mockLocation,
    });
  });

  beforeEach(() => {
    mockedCurrentUser.mockReset();
    mockedLogin.mockReset();
    mockLocation.href = 'http://localhost/user/login';
    mockLocation.pathname = '/user/login';
    mockLocation.search = '';

    mockedCurrentUser.mockResolvedValue({
      data: {
        name: 'Platform Admin',
        avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
        userid: 'platform-admin',
        email: 'platform@example.com',
        access: 'admin',
      },
    } as any);
  });

  it('should show login form', async () => {
    const rootContainer = render(
      <TestBrowser
        location={{
          pathname: '/user/login',
        }}
      />,
    );

    await rootContainer.findAllByText('Q Workplatform');

    expect(
      rootContainer.baseElement?.querySelector('.ant-pro-form-login-desc')
        ?.textContent,
    ).toBe('PaaS application delivery console');
    expect(
      rootContainer.baseElement?.querySelector('.ant-pro-global-footer')
        ?.textContent,
    ).toContain('Q Workplatform');

    rootContainer.unmount();
  });

  it('should login success', async () => {
    mockedLogin.mockResolvedValue({
      status: 'ok',
      type: 'account',
      currentAuthority: 'admin',
    } as API.LoginResult);

    const rootContainer = render(
      <TestBrowser
        location={{
          pathname: '/user/login',
        }}
      />,
    );

    const userNameInput = await rootContainer.findByPlaceholderText(
      'Username: admin or user',
    );
    fireEvent.change(userNameInput, { target: { value: 'admin' } });

    const passwordInput = await rootContainer.findByPlaceholderText(
      'Password: ant.design',
    );
    fireEvent.change(passwordInput, { target: { value: 'ant.design' } });

    fireEvent.click(await rootContainer.findByText('Login'));

    await waitFor(() => {
      expect(mockedLogin).toHaveBeenCalledWith(expect.objectContaining({
        password: 'ant.design',
        type: 'account',
        username: 'admin',
      }));
    });

    await waitFor(() => {
      expect(mockLocation.href).toBe('/');
    });

    rootContainer.unmount();
  });
});
