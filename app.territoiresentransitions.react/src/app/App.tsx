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
import {useConnected} from 'core-logic/hooks';

import 'app/app.css';
import 'app/DesignSystem/core.css';
import 'app/DesignSystem/variables.css';
import 'app/DesignSystem/buttons.css';
import {Toasters} from 'app/Toasters';
import {ScrollToTop} from 'app/ScrollToTop';
import {createTheme, MuiThemeProvider} from '@material-ui/core';
import {MatomoProvider} from '@datapunt/matomo-tracker-react';
import {matomoInstance} from 'app/matomo_instance';
import {ToutesCollectivitesPage} from 'app/pages';
import {MesCollectivitesPage} from 'app/pages/MesCollectivites/MesCollectivitesPage';

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
          <Switch>
            <HomeRoute exact path="/">
              <Header />
              <Home />
            </HomeRoute>

            <Route path={'/auth'}>
              <Header />
              <AuthRoutes />
            </Route>

            <Route path={'/mes_collectivites'}>
              <Header />
              <MesCollectivitesPage />
            </Route>
            <Route path={'/toutes_collectivites'}>
              <Header />
              <ToutesCollectivitesPage />
            </Route>
            <Route path={'/collectivite/:epciId'}>
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
  const connected = useConnected();

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
