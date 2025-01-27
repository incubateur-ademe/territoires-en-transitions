import { Route, Switch } from 'react-router-dom';

import { ToutesLesFichesActionPage } from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/ToutesLesFichesActionPage';
import {
  collectiviteFicheNonClasseePath,
  collectivitePlanActionAxeFichePath,
  collectivitePlanActionFichePath,
  collectivitePlansActionsSynthesePath,
  collectivitePlansActionsSyntheseVuePath,
  collectiviteTDBBasePath,
  collectiviteToutesLesFichesPath,
} from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { RouteEnAccesRestreint } from '../CollectiviteRoutes';
import { TableauDeBordPage } from '../TableauDeBord/TableauDeBordPage';
import FicheActionPage from './FicheAction/FicheActionPage';
import { PlansActionsRoutes } from './PlansActionsRoutes';
import { SynthesePage } from './Synthese/SynthesePage';
import { SyntheseVuePage } from './Synthese/SyntheseVue/SyntheseVuePage';
import PageContainer from '@/ui/components/layout/page-container';

const PlansActions = () => {
  const collectivite = useCurrentCollectivite();

  if (!collectivite) return null;

  return (
    <Switch>
      {/* Tableau de bord */}
      <RouteEnAccesRestreint path={collectiviteTDBBasePath}>
        <TableauDeBordPage />
      </RouteEnAccesRestreint>

      {/* Page de synthèse */}
      <Route exact path={[collectivitePlansActionsSynthesePath]}>
        <SynthesePage collectiviteId={collectivite.collectiviteId} />
      </Route>

      {/* Page de synthèse d'une métrique */}
      <Route exact path={[collectivitePlansActionsSyntheseVuePath]}>
        <SyntheseVuePage />
      </Route>

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
        <FicheActionPage isReadonly={collectivite.isReadOnly} />
      </Route>

      {/* Autres routes */}
      <PlansActionsRoutes
        collectivite_id={collectivite.collectiviteId}
        readonly={collectivite.isReadOnly}
      />
    </Switch>
  );
};

export default PlansActions;
