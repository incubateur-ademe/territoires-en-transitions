import {Route, useRouteMatch} from 'react-router-dom';
import {
  ActionReferentielAvancementPage,
  IndicateursPage,
  ReferentielsPage,
} from 'app/pages/index';
import {PlanActionPage} from 'app/pages/collectivite/PlanActions/PlanActionsPage';
import {FicheActionPage} from 'app/pages/collectivite/PlanActions/FicheActionPage';
import {FicheActionCreationPage} from 'app/pages/collectivite/PlanActions/FicheActionCreationPage';

/**
 * Routes starting with collectivite/:epciId/ see App.ts Router.
 *
 * Is responsible for setting the current epci id.
 */
export const CollectiviteRoutes = () => {
  const {path} = useRouteMatch();

  return (
    <>
      <Route path={`${path}/referentiels/:view?`}>
        <ReferentielsPage />
      </Route>
      <Route path={`${path}/referentiel/:referentiel/`}>
        <ReferentielsPage />
      </Route>
      <Route path={`${path}/action/:referentiel/:actionId`}>
        <ActionReferentielAvancementPage />
      </Route>
      <Route path={`${path}/indicateurs/`}>
        <IndicateursPage />
      </Route>
      <Route path={`${path}/plan_actions/`}>
        <PlanActionPage />
      </Route>
      <Route path={`${path}/fiche/:ficheUid`}>
        <FicheActionPage />
      </Route>
      <Route path={`${path}/nouvelle_fiche/`}>
        <FicheActionCreationPage />
      </Route>
    </>
  );
};
