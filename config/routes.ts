export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        path: '/user/login',
        layout: false,
        name: 'login',
        component: './user/login',
      },
      {
        path: '/user',
        redirect: '/user/login',
      },
      {
        component: '404',
        path: '/user/*',
      },
    ],
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    icon: 'dashboard',
    component: './platform/dashboard',
  },
  {
    path: '/business-units',
    name: 'business-units',
    icon: 'appstore',
    component: './platform/business-units',
  },
  {
    path: '/ci-builds',
    name: 'ci-builds',
    icon: 'build',
    component: './platform/ci-builds',
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    component: '404',
    path: '/*',
  },
];
