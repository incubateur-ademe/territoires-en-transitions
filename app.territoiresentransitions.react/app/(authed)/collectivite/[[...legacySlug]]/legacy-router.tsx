import { CollectiviteRoutes } from '@/app/app/pages/collectivite/CollectiviteRoutes';
import LegacyRouterSync from '@/app/legacy-router-sync';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

export default function LegacyRouter() {
  return (
    <BrowserRouter>
      <LegacyRouterSync />
      <Switch>
        <Route path={'/collectivite/:collectiviteId'}>
          <CollectiviteRoutes />
        </Route>
      </Switch>
    </BrowserRouter>
  );
}
