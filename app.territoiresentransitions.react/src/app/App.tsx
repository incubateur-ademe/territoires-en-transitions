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

import {Redirector} from 'app/Redirector';
import 'app/app.css';
import 'app/DesignSystem/core.css';
import 'app/DesignSystem/variables.css';
import 'app/DesignSystem/buttons.css';
import {Toasters} from 'app/Toasters';
import {ScrollToTop} from 'app/ScrollToTop';
import {createTheme, MuiThemeProvider} from '@material-ui/core';
import {MatomoProvider} from '@datapunt/matomo-tracker-react';
import {matomoInstance} from 'app/matomo_instance';
import {AllActiveEpcisPage} from 'app/pages';
import {CurrentUserEpcisPage} from 'app/pages/CurrentUserEpcis/CurrentUserEpcisPage';
import {allEpcisPath, authBasePath, myEpcisPath} from 'app/paths';

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

            <Route path={authBasePath}>
              <Header />
              <AuthRoutes />
            </Route>

            <Route path={myEpcisPath}>
              <Header />
              <CurrentUserEpcisPage />
            </Route>
            <Route path={allEpcisPath}>
              <Header />
              <AllActiveEpcisPage />
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
