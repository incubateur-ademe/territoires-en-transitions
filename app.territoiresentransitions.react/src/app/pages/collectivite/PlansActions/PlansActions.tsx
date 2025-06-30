import { Route, Switch } from 'react-router-dom';

import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { ToutesLesFichesActionPage } from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/ToutesLesFichesActionPage';
import {
  collectiviteFicheNonClasseePath,
  collectivitePlanActionAxeFichePath,
  collectivitePlanActionFichePath,
  collectiviteToutesLesFichesPath,
} from '@/app/app/paths';
import PageContainer from '@/ui/components/layout/page-container';
import FicheActionPage from './FicheAction/FicheActionPage';
import { PlansActionsRoutes } from './PlansActionsRoutes';

type PlansActionsProps = {
  collectivite: CurrentCollectivite;
};

export const PlansActions = ({ collectivite }: PlansActionsProps) => {
  return (
    <Switch>
      {/* Page de visualisation de toutes les fiches */}
      <Route exact path={collectiviteToutesLesFichesPath}>
        <PageContainer dataTest="ToutesLesFichesAction">
          <ToutesLesFichesActionPage />
        </PageContainer>
      </Route>

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
      <PlansActionsRoutes
        collectivite_id={collectivite.collectiviteId}
        readonly={collectivite.isReadOnly}
      />
    </Switch>
  );
};
