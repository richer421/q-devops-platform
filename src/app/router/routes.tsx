import {
  BrowserRouter,
  MemoryRouter,
  Navigate,
  Route,
  Routes,
  type MemoryRouterProps,
} from 'react-router-dom';
import { BaseLayout } from '../layout/BaseLayout';
import { BusinessListPage } from '../../pages/business/BusinessListPage';
import { BusinessDetailPage } from '../../pages/business-detail/BusinessDetailPage';
import { CicdPage } from '../../pages/cicd/CicdPage';
import { NotFoundPage } from '../../pages/not-found/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BaseLayout />}>
        <Route index element={<Navigate replace to="/business" />} />
        <Route path="business" element={<BusinessListPage />} />
        <Route path="business/:id" element={<BusinessDetailPage />} />
        <Route path="cicd" element={<CicdPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

type AppRouterProps =
  | {
      kind: 'browser';
    }
  | {
      kind: 'memory';
      initialEntries: MemoryRouterProps['initialEntries'];
    };

export function AppRouter(props: AppRouterProps) {
  if (props.kind === 'memory') {
    return (
      <MemoryRouter initialEntries={props.initialEntries}>
        <AppRoutes />
      </MemoryRouter>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
