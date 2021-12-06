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
import {EpciRoutes} from 'app/pages/collectivite/EpciRoutes';
import StatisticsPage from 'app/pages/statistics/StatisticsPage';

import Home from 'app/pages/Home';
import {useConnected} from 'core-logic/hooks';

import {ConnectedRedirector} from 'app/Redirector';
import 'app/app.css';
import 'app/DesignSystem/core.css';
import 'app/DesignSystem/variables.css';

import '@gouvfr/dsfr/dist/dsfr/dsfr.css';

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
          <ConnectedRedirector />

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
              <Lala />
              <Header />
              <AllActiveEpcisPage />
            </Route>
            <Route path={'/epci/:epciSiren'}>
              <Header />
              <EpciRoutes />
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

const Lala = () => (
  <nav className="fr-sidemenu" role="navigation" aria-label="Menu latéral">
    <div className="fr-sidemenu__inner">
      <button
        className="fr-sidemenu__btn"
        aria-controls="fr-sidemenu-wrapper"
        aria-expanded={true}
      >
        Dans cette rubrique
      </button>
      <div className="fr-collapse" id="fr-sidemenu-wrapper">
        <div className="fr-sidemenu__title">Titre de rubrique</div>
        <ul className="fr-sidemenu__list">
          <li className="fr-sidemenu__item">
            <button
              className="fr-sidemenu__btn"
              aria-expanded={true}
              aria-controls="fr-sidemenu-item-0"
            >
              Niveau 1
            </button>
            <div
              className="fr-collapse fr-collapse__expanded"
              id="fr-sidemenu-item-0"
            >
              <ul className="fr-sidemenu__list">
                <li className="fr-sidemenu__item">
                  <a className="fr-sidemenu__link" href="#" target="_self">
                    Accès direct niveau 2
                  </a>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </nav>
);
