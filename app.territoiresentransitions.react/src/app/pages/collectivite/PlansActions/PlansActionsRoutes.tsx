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
  makeCollectiviteFichesNonClasseesUrl,
  makeCollectivitePlanActionUrl,
} from 'app/paths';
import {usePlansActionsListe} from './PlanAction/data/usePlansActionsListe';

type Props = {
  collectivite_id: number;
};

/**
 * Routes starting with collectivite/:collectiviteId/plans see CollectiviteRoutes.tsx
 */
export const PlansActionsRoutes = ({collectivite_id}: Props) => {
  const data = usePlansActionsListe(collectivite_id);

  return (
    <>
      <Route exact path={[CollectivitePlansActionsBasePath]}>
        {/** S'il existe au moins 1 plan, on redirige vers le 1er plan de la liste,
         * sinon vers les fiches non classées */}
        <Redirect
          to={
            data && data.plans.length > 0
              ? makeCollectivitePlanActionUrl({
                  collectiviteId: collectivite_id,
                  planActionUid: data.plans[0].id.toString(),
                })
              : makeCollectiviteFichesNonClasseesUrl({
                  collectiviteId: collectivite_id,
                })
          }
        />
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
