import {Redirect, Route, useRouteMatch} from 'react-router-dom';
import {
  ActionReferentielAvancementPage,
  IndicateursPage,
  ReferentielsPage,
} from 'app/pages/index';
import {PlanActionPage} from 'app/pages/collectivite/PlanActions/PlanActionsPage';
import {FicheActionPage} from 'app/pages/collectivite/PlanActions/FicheActionPage';
import {FicheActionCreationPage} from 'app/pages/collectivite/PlanActions/FicheActionCreationPage';
import {useCollectiviteId} from 'core-logic/hooks';
import {planActionDefault} from 'generated/models/plan_action_default';
import {
  collectiviteActionPath,
  collectiviteIndicateurPath as collectiviteIndicateursPath,
  collectiviteNouvelleFichePath,
  collectivitePlanActionPath,
  collectiviteReferentielPath,
} from 'app/paths';

/**
 * Routes starting with collectivite/:collectiviteId/ see App.ts Router.
 *
 * Is responsible for setting the current collectivite id.
 */
export const CollectiviteRoutes = () => {
  const {path} = useRouteMatch();
  const collectiviteId = useCollectiviteId()!;
  return (
    <>
      {/* <Route
        path={`${makeCollectiviteTabUrl({
          id: collectiviteId,
          tab: 'referentiels',
        })}`}
      >
        <Redirect
          to={makeCollectiviteReferentielsUrl({
            id: collectiviteId,
            referentiel: 'eci',
          })}
        />
      </Route> */}
      <Route path={collectiviteReferentielPath}>
        <ReferentielsPage />
      </Route>
      <Route path={collectiviteActionPath}>
        <ActionReferentielAvancementPage />
      </Route>
      <Route path={collectiviteIndicateursPath}>
        <IndicateursPage />
      </Route>
      {/* <Route
        path={`${makeCollectiviteTabUrl({
          id: collectiviteId,
          tab: 'indicateurs',
        })}`}
      >
        <Redirect
          to={makeCollectiviteIndicateursUrl({
            collectiviteId,
            indicateurGroup: 'eci',
          })}
        />
      </Route> */}
      {/* <Route path={collectivitePlanActionPath}>
        {' '}
        <Redirect
          to={`/collectivite/${collectiviteId}/plan_action/${planActionDefault.uid}`}
        />
      </Route> */}
      <Route path={collectivitePlanActionPath}>
        <PlanActionPage />
      </Route>
      <Route path={`${path}/fiche/:ficheUid`}>
        <FicheActionPage />
      </Route>
      <Route path={collectiviteNouvelleFichePath}>
        <FicheActionCreationPage />
      </Route>
    </>
  );
};
