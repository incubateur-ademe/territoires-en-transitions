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
import {Footer, FooterDescription, FooterNavigation} from 'ui/Footer';
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
import {CurrentUserCollectivitesPage} from 'app/pages/CurrentUserCollectivite/CurrentUserCollectivitesPage';
import {ElsesCollectivitesPage} from 'app/pages/ElsesCollectivites/ElsesCollectivitePage';
import {Header} from 'ui/Header';
import {InvitationLanding} from 'app/pages/invitation/InvitationLanding';

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
          <ReactQueryDevtools initialIsOpen={false} />
          <Router>
            <E2E />
            <ScrollToTop />
            <Toasters />
            <InvitationRedirector />

            <Switch>
              <HomeRoute exact path="/">
                <Header />
                <Home />
              </HomeRoute>

              <HomeRoute path={authBasePath}>
                <Header />
                <AuthRoutes />
              </HomeRoute>

              <Route path={myCollectivitesPath}>
                <Header />
                <CurrentUserCollectivitesPage />
              </Route>
              <Route path={allCollectivitesPath}>
                <Header />
                <ElsesCollectivitesPage />
              </Route>
              <Route path={'/collectivite/:collectiviteId'}>
                <Header />
                <CollectiviteRoutes />
              </Route>
              <Route path={'/statistics'}>
                <Header />
                <StatisticsPage />
              </Route>
              <Route path={invitationLandingPath}>
                <Header />
                <InvitationLanding />
              </Route>
            </Switch>
            <Footer
              description={<FooterDescription />}
              navigation={<FooterNavigation />}
            />
          </Router>
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
