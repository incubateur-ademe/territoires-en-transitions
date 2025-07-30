'use client';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import { useCurrentCollectivite } from '@/api/collectivites';
import {
  collectiviteFicheNonClasseePath,
  collectivitePlanActionAxeFichePath,
  collectivitePlanActionFichePath,
} from '@/app/app/paths';
import LegacyRouterSync from '@/app/legacy-router-sync';
import { FicheActionPage } from './FicheAction/FicheActionPage';
import { PlansActionsRoutes } from './PlansActionsRoutes';

export const PlansActions = () => {
  const collectivite = useCurrentCollectivite();
  return (
    <BrowserRouter>
      <LegacyRouterSync />
      <Switch>
        {/* Pages fiche action - nouvelle version */}
        <Route
          exact
          path={[
            collectiviteFicheNonClasseePath,
            collectivitePlanActionFichePath,
            collectivitePlanActionAxeFichePath,
          ]}
        >
          <FicheActionPage collectivite={collectivite} />
        </Route>

        {/* Autres routes */}
        <PlansActionsRoutes collectivite_id={collectivite.collectiviteId} />
      </Switch>
    </BrowserRouter>
  );
};
