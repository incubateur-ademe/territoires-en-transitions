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
import '@gouvfr/dsfr/dist/dsfr/dsfr.css';
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

            <Route path={myCollectivitesPath}>
              <Header />
              <CurrentUserCollectivitesPage />
            </Route>
            <Route path={allCollectivitesPath}>
              {/* <Lala /> */}
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

// const Lala = () => (
//   <SideMenu title="SideMenu Title" buttonLabel="SideMenu Button">
//     <SideMenuItem title="SideMenu Item #1">
//       <SideMenuLink href="/">SideMenu Link #1</SideMenuLink>
//       <SideMenuLink onClick={() => {}}>SideMenu Link #2</SideMenuLink>
//     </SideMenuItem>
//     <SideMenuItem title="SideMenu Item #2">
//       <SideMenuItem title="SideMenu Level 2 Item #1">
//         <SideMenuLink href="/">SideMenu Level 2 Link #1</SideMenuLink>
//         <SideMenuLink href="/">SideMenu Level 2 Link #2</SideMenuLink>
//       </SideMenuItem>
//     </SideMenuItem>
//   </SideMenu>
// );
