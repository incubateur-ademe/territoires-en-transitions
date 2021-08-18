import {Route, useParams, useRouteMatch} from 'react-router-dom';
import {
  ActionReferentielAvancementPage,
  IndicateursPage,
  ReferentielsPage,
} from 'app/pages/index';
import {useActions} from 'core-logic/overmind';

/**
 * Routes starting with collectivite/:epciId/ see App.ts Router.
 *
 * Is responsible for setting the current epci id.
 */
export const CollectiviteRoutes = () => {
  const {path, url} = useRouteMatch();
  const {epciId} = useParams<{epciId: string}>();
  useActions().epcis.setCurrentEpci(epciId);

  // if (false) {
  //   // todo redirect when user is not authenticated: https://reactrouter.com/web/example/auth-workflow
  //   return <Redirect to="" />;
  // }
  return (
    <>
      <Route path={`${path}/actions_referentiels/`}>
        <ReferentielsPage />
      </Route>
      <Route path={`${path}/action/:referentiel/:actionId`}>
        <ActionReferentielAvancementPage />
      </Route>
      <Route path={`${path}/indicateurs/`}>
        <IndicateursPage />
      </Route>
    </>
  );
};
