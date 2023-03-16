import {Redirect, Route} from 'react-router-dom';

import {FicheActionPage} from 'app/pages/collectivite/PlansActions/FicheAction/FicheActionPage';
import {PlanActionPage} from './PlanAction/PlanActionPage';
import FichesNonClassees from 'app/pages/collectivite/PlansActions/FichesNonClassees';
import {
  collectiviteFicheNonClasseePath,
  CollectiviteFichesNonClasseesPath,
  collectivitePlanActionFichePath,
  collectivitePlanActionPath,
  CollectivitePlansActionsBasePath,
  collectivitePlansActionsSynthesePath,
  makeCollectivitePlansActionsSyntheseUrl,
} from 'app/paths';
import {SynthesePage} from './Synthese/SynthesePage';

type Props = {
  collectivite_id: number;
};

/**
 * Routes starting with collectivite/:collectiviteId/plans see CollectiviteRoutes.tsx
 */
export const PlansActionsRoutes = ({collectivite_id}: Props) => {
  return (
    <>
      <Route exact path={[CollectivitePlansActionsBasePath]}>
        {/* Redirection vers la page de synthèse */}
        <Redirect
          to={makeCollectivitePlansActionsSyntheseUrl({
            collectiviteId: collectivite_id,
          })}
        />
      </Route>
      {/* Synthèse */}
      <Route exact path={[collectivitePlansActionsSynthesePath]}>
        <SynthesePage collectiviteId={collectivite_id} />
      </Route>
      {/* <FichesNonClassees /> */}
      <Route exact path={[CollectiviteFichesNonClasseesPath]}>
        <FichesNonClassees />
      </Route>
      <Route
        path={[
          collectiviteFicheNonClasseePath,
          collectivitePlanActionFichePath,
        ]}
      >
        <FicheActionPage />
      </Route>
      <Route exact path={collectivitePlanActionPath}>
        <PlanActionPage />
      </Route>
    </>
  );
};
