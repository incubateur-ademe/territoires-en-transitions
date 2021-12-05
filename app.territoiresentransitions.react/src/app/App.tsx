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

const Lala = () => (
  <nav
    className="fr-nav"
    id="navigation-773"
    role="navigation"
    aria-label="Menu principal"
  >
    <ul className="fr-nav__list">
      <li className="fr-nav__item">
        <button
          className="fr-nav__btn"
          aria-expanded="true"
          aria-controls="menu-776"
          aria-current="true"
        >
          Entrée menu active et ouverte ... :(
        </button>
        <div
          className="fr-collapse fr-menu fr-collapse__expanded"
          id="menu-776"
        >
          <ul className="fr-menu__list">
            <li>
              <a className="fr-nav__link" href="#" target="_self">
                Lien de navigation
              </a>
            </li>
            <li>
              <a
                className="fr-nav__link"
                href="#"
                target="_self"
                aria-current="page"
              >
                Lien de navigation
              </a>
            </li>
            <li>
              <a className="fr-nav__link" href="#" target="_self">
                Lien de navigation
              </a>
            </li>
          </ul>
        </div>
      </li>
      <li className="fr-nav__item">
        <button
          className="fr-nav__btn"
          aria-expanded="false"
          aria-controls="menu-774"
        >
          Entrée menu fermée
        </button>

        <div
          className="fr-collapse fr-menu fr-collapse--expanded"
          aria-expanded="true"
          id="menu-774"
        >
          <ul className="fr-menu__list overflow-visible">
            <li>
              <a className="fr-nav__link" href="#" target="_self">
                Lien de navigation
              </a>
            </li>
            <li>
              <a className="fr-nav__link" href="#" target="_self">
                Lien de navigation
              </a>
            </li>

            <li>
              <a className="fr-nav__link" href="#" target="_self">
                Lien de navigation
              </a>
            </li>
          </ul>
        </div>
      </li>
      <li className="fr-nav__item">
        <a className="fr-nav__link" href="#" target="_self">
          accès direct
        </a>
      </li>
      <li className="fr-nav__item">
        <a className="fr-nav__link" href="#" target="_self">
          accès direct
        </a>
      </li>
    </ul>
  </nav>
);

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
              <Header />
              <Lala />
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
