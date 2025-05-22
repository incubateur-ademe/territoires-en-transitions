import { PlansActionsPage } from '@/app/app/pages/collectivite/PlansActions/PlansActionsPage';
import { collectivitePlansActionsBasePath } from '@/app/app/paths';
import LegacyRouterSync from '@/app/legacy-router-sync';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

export default function LegacyRouter() {
  return (
    <BrowserRouter>
      <LegacyRouterSync />
      <Switch>
        <Route path={collectivitePlansActionsBasePath}>
          <PlansActionsPage />
        </Route>
      </Switch>
    </BrowserRouter>
  );
}
