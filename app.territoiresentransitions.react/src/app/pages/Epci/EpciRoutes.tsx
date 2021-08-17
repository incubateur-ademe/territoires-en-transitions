import {Route, useParams, useRouteMatch} from 'react-router-dom';
import {
  ActionReferentielAvancementPage,
  IndicateursPage,
  ReferentielsPage,
} from 'app/pages/index';

export const EpciRoutes = () => {
  const {path, url} = useRouteMatch();
  const {epciId} = useParams<{epciId: string}>();

  console.log(
    'path in connected is ',
    path,
    'url is',
    url,
    ' and EPCI ID is',
    epciId
  );

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
