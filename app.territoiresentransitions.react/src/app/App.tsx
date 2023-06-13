import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from 'react-query';
import {ReactQueryDevtools} from 'react-query/devtools';
import {E2E} from './E2E';
import {AuthRoutes} from 'app/pages/Auth/AuthRoutes';
import {CollectiviteRoutes} from 'app/pages/collectivite/CollectiviteRoutes';
import Home from 'app/pages/Home';
import {Redirector} from 'app/Redirector';
import {Toasters} from 'app/Toasters';
import {ScrollToTopOnPageChange} from 'app/ScrollToTopOnPageChange';
import {createTheme, MuiThemeProvider} from '@material-ui/core';

import {allCollectivitesPath, authBasePath, profilPath} from 'app/paths';
import {ToutesLesCollectivitesPage} from 'app/pages/ToutesLesCollectivites/ToutesLesCollectivitesPage';
import {ProfilPage} from './pages/Profil/ProfilPage';
import Layout from 'app/Layout';
import {AuthProvider} from 'core-logic/api/auth/AuthProvider';
import {ScoreListenerProvider} from 'core-logic/hooks/useScoreListener';
import {VisitTracker} from 'app/VisitTracker';
import AccepterCGUModal from './pages/Auth/AccepterCGUModal';

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MuiThemeProvider theme={theme}>
          <ReactQueryDevtools initialIsOpen={false} />
          <Router>
            <ScoreListenerProvider>
              <Layout>
                <E2E />
                <ScrollToTopOnPageChange />
                <Toasters />
                <Redirector />
                <VisitTracker />
                <AccepterCGUModal />
                <Switch>
                  <Route exact path="/">
                    <Home />
                  </Route>
                  <Route path={authBasePath}>
                    <AuthRoutes />
                  </Route>
                  <Route path={profilPath}>
                    <ProfilPage />
                  </Route>

                  <Route path={allCollectivitesPath}>
                    <ToutesLesCollectivitesPage />
                  </Route>
                  <Route path={'/collectivite/:collectiviteId'}>
                    <CollectiviteRoutes />
                  </Route>
                </Switch>
              </Layout>
            </ScoreListenerProvider>
          </Router>
        </MuiThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
