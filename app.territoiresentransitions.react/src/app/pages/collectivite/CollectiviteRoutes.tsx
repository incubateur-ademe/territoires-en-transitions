import {Redirect, Route, useRouteMatch} from 'react-router-dom';
import {
  ActionReferentielAvancementPage,
  IndicateursPage,
  ReferentielsPage,
} from 'app/pages/index';
import {PlanActionPage} from 'app/pages/collectivite/PlanActions/PlanActionsPage';
import {FicheActionPage} from 'app/pages/collectivite/PlanActions/FicheActionPage';
import {FicheActionCreationPage} from 'app/pages/collectivite/PlanActions/FicheActionCreationPage';
import {useEpciId} from 'core-logic/hooks';
import {planActionDefault} from 'generated/models/plan_action_default';

/**
 * Routes starting with collectivite/:epciId/ see App.ts Router.
 *
 * Is responsible for setting the current epci id.
 */
export const CollectiviteRoutes = () => {
  const {path} = useRouteMatch();
  const epciId = useEpciId()!;
  return (
    <>
      <Route path={`${path}/referentiels`}>
        <Redirect to={`/collectivite/${epciId}/referentiel/eci`} />
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
        <Redirect
          to={`/collectivite/${epciId}/plan_action/${planActionDefault.uid}`}
        />
      </Route>
      <Route path={`${path}/plan_action/:planUid`}>
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
