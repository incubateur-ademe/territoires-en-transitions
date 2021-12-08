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
  makeCollectiviteIndicateursPath,
  makeCollectiviteReferentielsPath,
  makeCollectiviteTabPath,
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
      <Route
        path={`${makeCollectiviteTabPath({
          id: collectiviteId,
          tab: 'referentiels',
        })}`}
      >
        <Redirect
          to={makeCollectiviteReferentielsPath({
            id: collectiviteId,
            referentiel: 'eci',
          })}
        />
      </Route>
      <Route
        path={`${makeCollectiviteTabPath({
          id: collectiviteId,
          tab: 'referentiels',
        })}/:referentiel`}
      >
        <ReferentielsPage />
      </Route>
      <Route
        path={`/collectivite/${collectiviteId}/action/:referentiel/:actionId`}
      >
        <ActionReferentielAvancementPage />
      </Route>
      <Route
        path={`${makeCollectiviteTabPath({
          id: collectiviteId,
          tab: 'indicateurs',
        })}/:view`}
      >
        <IndicateursPage />
      </Route>
      <Route
        path={`${makeCollectiviteTabPath({
          id: collectiviteId,
          tab: 'indicateurs',
        })}`}
      >
        <Redirect
          to={makeCollectiviteIndicateursPath({
            id: collectiviteId,
            view: 'eci',
          })}
        />
      </Route>
      <Route
        path={makeCollectiviteTabPath({
          id: collectiviteId,
          tab: 'plans_actions',
        })}
      >
        {' '}
        <Redirect
          to={`/collectivite/${collectiviteId}/plan_action/${planActionDefault.uid}`}
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
