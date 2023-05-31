import {Redirect, Route} from 'react-router-dom';

import {FicheActionPage} from 'app/pages/collectivite/PlansActions/FicheAction/FicheActionPage';
import {PlanActionPage} from './PlanAction/PlanActionPage';
import FichesNonClassees from 'app/pages/collectivite/PlansActions/FichesNonClassees';
import {
  collectiviteFicheNonClasseePath,
  collectiviteFichesNonClasseesPath,
  collectivitePlanActionAxeFichePath,
  collectivitePlanActionAxePath,
  collectivitePlanActionFichePath,
  collectivitePlanActionPath,
  collectivitePlansActionsBasePath,
  collectivitePlansActionsCreationPath,
  collectivitePlansActionsSynthesePath,
  makeCollectivitePlansActionsSyntheseUrl,
} from 'app/paths';
import {SynthesePage} from './Synthese/SynthesePage';
import ParcoursCreationPlan from './ParcoursCreationPlan/ParcoursCreationPlan';

type Props = {
  collectivite_id: number;
};

/**
 * Routes starting with collectivite/:collectiviteId/plans see CollectiviteRoutes.tsx
 */
export const PlansActionsRoutes = ({collectivite_id}: Props) => {
  return (
    <>
      <Route exact path={[collectivitePlansActionsBasePath]}>
        {/* Redirection vers la page de synthèse */}
        <Redirect
          to={makeCollectivitePlansActionsSyntheseUrl({
            collectiviteId: collectivite_id,
          })}
        />
      </Route>
      {/* Création */}
      <Route exact path={collectivitePlansActionsCreationPath}>
        <ParcoursCreationPlan />
      </Route>
      {/* Synthèse */}
      <Route exact path={[collectivitePlansActionsSynthesePath]}>
        <SynthesePage collectiviteId={collectivite_id} />
      </Route>
      {/* <FichesNonClassees /> */}
      <Route exact path={[collectiviteFichesNonClasseesPath]}>
        <FichesNonClassees />
      </Route>
      <Route
        path={[
          collectiviteFicheNonClasseePath,
          collectivitePlanActionFichePath,
          collectivitePlanActionAxeFichePath,
        ]}
      >
        <FicheActionPage />
      </Route>
      {/** Plan action */}
      <Route exact path={collectivitePlanActionPath}>
        <PlanActionPage />
      </Route>
      {/** Axe */}
      <Route exact path={collectivitePlanActionAxePath}>
        <PlanActionPage />
      </Route>
    </>
  );
};
