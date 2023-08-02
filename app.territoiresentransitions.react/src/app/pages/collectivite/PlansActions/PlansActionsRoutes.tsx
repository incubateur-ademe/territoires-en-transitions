import {Route} from 'react-router-dom';

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
  collectivitePlansActionsCreerPath,
  collectivitePlansActionsImporterPath,
  collectivitePlansActionsNouveauPath,
  collectivitePlansActionsSynthesePath,
  collectivitePlansActionsSyntheseVuePath,
} from 'app/paths';
import {SynthesePage} from './Synthese/SynthesePage';
import {SelectionPage} from './ParcoursCreationPlan/SelectionPage';
import {ImporterPlanPage} from './ParcoursCreationPlan/ImporterPlanPage';
import {CreerPlanPage} from './ParcoursCreationPlan/CreerPlanPage';
import {SyntheseVuePage} from './Synthese/SyntheseVue/SyntheseVuePage';

type Props = {
  collectivite_id: number;
};

/**
 * Routes starting with collectivite/:collectiviteId/plans see CollectiviteRoutes.tsx
 */
export const PlansActionsRoutes = ({collectivite_id}: Props) => {
  return (
    <>
      {/* Création */}
      <Route exact path={collectivitePlansActionsNouveauPath}>
        <SelectionPage />
      </Route>
      <Route exact path={collectivitePlansActionsImporterPath}>
        <ImporterPlanPage />
      </Route>
      <Route exact path={collectivitePlansActionsCreerPath}>
        <CreerPlanPage />
      </Route>
      {/* Synthèse */}
      <Route exact path={[collectivitePlansActionsSynthesePath]}>
        <SynthesePage collectiviteId={collectivite_id} />
      </Route>
      <Route exact path={[collectivitePlansActionsSyntheseVuePath]}>
        <SyntheseVuePage />
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
