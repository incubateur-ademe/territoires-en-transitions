import { Route, Switch } from 'react-router-dom';

import { CurrentCollectivite } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { ToutesLesFichesActionPage } from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/ToutesLesFichesActionPage';
import {
  collectiviteFicheNonClasseePath,
  collectivitePlanActionAxeFichePath,
  collectivitePlanActionFichePath,
  collectiviteTDBBasePath,
  collectiviteToutesLesFichesPath,
} from '@/app/app/paths';
import PageContainer from '@/ui/components/layout/page-container';
import { RouteEnAccesRestreint } from '../CollectiviteRoutes';
import { TableauDeBordPage } from '../TableauDeBord/TableauDeBordPage';
import FicheActionPage from './FicheAction/FicheActionPage';
import { PlansActionsRoutes } from './PlansActionsRoutes';

type PlansActionsProps = {
  collectivite: CurrentCollectivite;
};

export const PlansActions = ({ collectivite }: PlansActionsProps) => {
  return (
    <Switch>
      {/* Tableau de bord */}
      <RouteEnAccesRestreint
        path={collectiviteTDBBasePath}
        collectivite={collectivite}
      >
        <TableauDeBordPage />
      </RouteEnAccesRestreint>

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
