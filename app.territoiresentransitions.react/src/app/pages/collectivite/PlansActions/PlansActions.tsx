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
import CollectivitePageLayout from '../CollectivitePageLayout/CollectivitePageLayout';
import { RouteEnAccesRestreint } from '../CollectiviteRoutes';
import { TableauDeBordPage } from '../TableauDeBord/TableauDeBordPage';
import FicheActionPage from './FicheAction/FicheActionPage';
import { PlansActionsRoutes } from './PlansActionsRoutes';
import { SynthesePage } from './Synthese/SynthesePage';
import { SyntheseVuePage } from './Synthese/SyntheseVue/SyntheseVuePage';

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
        <CollectivitePageLayout dataTest="PlansAction">
          <SynthesePage collectiviteId={collectivite.collectivite_id} />
        </CollectivitePageLayout>
      </Route>

      {/* Page de synthèse d'une métrique */}
      <Route exact path={[collectivitePlansActionsSyntheseVuePath]}>
        <CollectivitePageLayout dataTest="PlansAction">
          <SyntheseVuePage />
        </CollectivitePageLayout>
      </Route>

      {/* Page de visualisation de toutes les fiches */}
      <Route exact path={collectiviteToutesLesFichesPath}>
        <div className="grow bg-grey-2 -mb-8 py-12 px-4 lg:px-6 2xl:px-0">
          <CollectivitePageLayout dataTest="ToutesLesFichesAction">
            <ToutesLesFichesActionPage />
          </CollectivitePageLayout>
        </div>
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
        <FicheActionPage isReadonly={collectivite.readonly} />
      </Route>

      {/* Autres routes */}
      <PlansActionsRoutes
        collectivite_id={collectivite.collectivite_id}
        readonly={collectivite.readonly}
      />
    </Switch>
  );
};

export default PlansActions;
