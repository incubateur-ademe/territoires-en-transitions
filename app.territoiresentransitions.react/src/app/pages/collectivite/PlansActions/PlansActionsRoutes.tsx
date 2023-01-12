import {Route} from 'react-router-dom';

import {FicheActionPage} from 'app/pages/collectivite/PlansActions/FicheAction/FicheActionPage';
import {PlanActionPage} from './PlanAction/PlanActionPage';
import FichesNonClassees from 'app/pages/collectivite/PlansActions/FichesNonClassees';
import {
  collectiviteFicheNonClasseePath,
  CollectiviteFichesNonClasseesPath,
  collectivitePlanActionFichePath,
  collectivitePlanActionPath,
  CollectivitePlansActionsBasePath,
} from 'app/paths';

/**
 * Routes starting with collectivite/:collectiviteId/plans see CollectiviteRoutes.tsx
 */
export const PlansActionsRoutes = () => {
  return (
    <>
      <Route
        exact
        path={[
          CollectivitePlansActionsBasePath,
          CollectiviteFichesNonClasseesPath,
        ]}
      >
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
