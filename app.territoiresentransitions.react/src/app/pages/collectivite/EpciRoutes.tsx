import {Redirect, Route, useRouteMatch} from 'react-router-dom';
import {
  ActionReferentielAvancementPage,
  IndicateursPage,
  ReferentielsPage,
} from 'app/pages/index';
import {PlanActionPage} from 'app/pages/collectivite/PlanActions/PlanActionsPage';
import {FicheActionPage} from 'app/pages/collectivite/PlanActions/FicheActionPage';
import {FicheActionCreationPage} from 'app/pages/collectivite/PlanActions/FicheActionCreationPage';
import {useEpciSiren} from 'core-logic/hooks';
import {planActionDefault} from 'generated/models/plan_action_default';
import {
  makeEpciIndicateursPath,
  makeEpciReferentielsPath,
  makeEpciTabPath,
} from 'app/paths';

/**
 * Routes starting with collectivite/:epciId/ see App.ts Router.
 *
 * Is responsible for setting the current epci id.
 */
export const EpciRoutes = () => {
  const {path} = useRouteMatch();
  const epciSiren = useEpciSiren()!;
  return (
    <>
      <Route
        path={`${makeEpciTabPath({
          siren: epciSiren,
          tab: 'referentiels',
        })}`}
      >
        <Redirect
          to={makeEpciReferentielsPath({
            siren: epciSiren,
            referentiel: 'eci',
          })}
        />
      </Route>
      <Route
        path={`${makeEpciTabPath({
          siren: epciSiren,
          tab: 'referentiels',
        })}/:referentiel`}
      >
        <ReferentielsPage />
      </Route>
      <Route path={`/epci/${epciSiren}/action/:referentiel/:actionId`}>
        <ActionReferentielAvancementPage />
      </Route>
      <Route
        path={`${makeEpciTabPath({
          siren: epciSiren,
          tab: 'indicateurs',
        })}/:view`}
      >
        <IndicateursPage />
      </Route>
      <Route
        path={`${makeEpciTabPath({
          siren: epciSiren,
          tab: 'indicateurs',
        })}`}
      >
        <Redirect
          to={makeEpciIndicateursPath({
            siren: epciSiren,
            view: 'eci',
          })}
        />
      </Route>
      <Route
        path={makeEpciTabPath({
          siren: epciSiren,
          tab: 'plans_actions',
        })}
      >
        {' '}
        <Redirect
          to={`/epci/${epciSiren}/plan_action/${planActionDefault.uid}`}
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
