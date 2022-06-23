import {
  BrowserRouter as Router,
  Redirect,
  Route,
  RouteProps,
  Switch,
} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from 'react-query';
import {ReactQueryDevtools} from 'react-query/devtools';
import {E2E} from './E2E';
import {AuthRoutes} from 'app/pages/Auth/AuthRoutes';
import {CollectiviteRoutes} from 'app/pages/collectivite/CollectiviteRoutes';
import StatisticsPage from 'app/pages/StatisticsPage';
import Home from 'app/pages/Home';
import {InvitationRedirector} from 'app/Redirector';
import {Toasters} from 'app/Toasters';
import {ScrollToTop} from 'app/ScrollToTop';
import {createTheme, MuiThemeProvider} from '@material-ui/core';
import {MatomoProvider} from '@datapunt/matomo-tracker-react';
import {matomoInstance} from 'app/matomo_instance';

import {
  allCollectivitesPath,
  authBasePath,
  invitationLandingPath,
  myCollectivitesPath,
} from 'app/paths';
import {authBloc} from 'core-logic/observables';
import {MesCollectivitesPage} from 'app/pages/MesCollectivites/MesCollectivitesPage';
import {InvitationLanding} from 'app/pages/invitation/InvitationLanding';
import {ToutesLesCollectivitesPage} from 'app/pages/ToutesLesCollectivites/ToutesLesCollectivitesPage';
import Layout from './Layout';
import {AuthProvider} from 'core-logic/api/auth/AuthProvider';

const theme = createTheme({
  palette: {
    primary: {
      main: '#000091',
    },
  },
});

const queryClient = new QueryClient();

export const App = () => {
  return (
    <MatomoProvider value={matomoInstance}>
      <MuiThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ReactQueryDevtools initialIsOpen={false} />
            <Router>
              <Layout>
                <E2E />
                <ScrollToTop />
                <Toasters />
                <InvitationRedirector />
                <Switch>
                  <HomeRoute exact path="/">
                    <Home />
                  </HomeRoute>

                  <HomeRoute path={authBasePath}>
                    <AuthRoutes />
                  </HomeRoute>

                  <Route path={myCollectivitesPath}>
                    <MesCollectivitesPage />
                  </Route>
                  <Route path={allCollectivitesPath}>
                    <ToutesLesCollectivitesPage />
                  </Route>
                  <Route path={'/collectivite/:collectiviteId'}>
                    <CollectiviteRoutes />
                  </Route>
                  <Route path={'/statistics'}>
                    <StatisticsPage />
                  </Route>
                  <Route path={invitationLandingPath}>
                    <InvitationLanding />
                  </Route>
                </Switch>
              </Layout>
            </Router>
          </AuthProvider>
        </QueryClientProvider>
      </MuiThemeProvider>
    </MatomoProvider>
  );
};

const HomeRoute = ({children, ...rest}: RouteProps) => {
  const connected = authBloc.connected;
  return (
    <Route
      {...rest}
      render={({location}) =>
        !connected ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: '/mes_collectivites',
              state: {from: location},
            }}
          />
        )
      }
    />
  );
};
