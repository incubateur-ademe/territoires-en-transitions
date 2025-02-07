import { CollectiviteRoutes } from '@/app/app/pages/collectivite/CollectiviteRoutes';
import LegacyRouterSync from '@/app/legacy-router-sync';
import { BrowserRouter, Route } from 'react-router-dom';

export default function LegacyRouter() {
  return (
    <BrowserRouter>
      <LegacyRouterSync />

      <Route path={'/collectivite/:collectiviteId'}>
        <CollectiviteRoutes />
      </Route>
    </BrowserRouter>
  );
}
