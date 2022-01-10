import {
  BrowserRouter as Router,
  Redirect,
  Route,
  RouteProps,
  Switch,
} from 'react-router-dom';
import {Footer, Header} from 'ui';
import {FooterDescription, FooterNavigation} from 'ui/Footer';
import {AuthRoutes} from 'app/pages/Auth/AuthRoutes';
import {CollectiviteRoutes} from 'app/pages/collectivite/CollectiviteRoutes';
import StatisticsPage from 'app/pages/statistics/StatisticsPage';
import Home from 'app/pages/Home';
import {ConnectedRedirector} from 'app/Redirector';

import 'app/app.css';

import {Toasters} from 'app/Toasters';
import {ScrollToTop} from 'app/ScrollToTop';
import {createTheme, MuiThemeProvider} from '@material-ui/core';
import {MatomoProvider} from '@datapunt/matomo-tracker-react';
import {matomoInstance} from 'app/matomo_instance';
import {ElsesCollectivitesPage, CurrentUserCollectivitesPage} from 'app/pages';
import {
  allCollectivitesPath,
  authBasePath,
  myCollectivitesPath,
} from 'app/paths';
import {authBloc} from 'core-logic/observables';

const theme = createTheme({
  palette: {
    primary: {
      main: '#000091',
    },
  },
});

export const App = () => {
  return (
    <MatomoProvider value={matomoInstance}>
      <MuiThemeProvider theme={theme}>
        <Router>
          <ScrollToTop />
          <Toasters />
          <ConnectedRedirector />

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
          </Switch>
          <Footer
            description={<FooterDescription />}
            navigation={<FooterNavigation />}
          />
        </Router>
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
