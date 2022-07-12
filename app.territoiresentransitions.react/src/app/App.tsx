import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from 'react-query';
import {ReactQueryDevtools} from 'react-query/devtools';
import {E2E} from './E2E';
import {AuthRoutes} from 'app/pages/Auth/AuthRoutes';
import {CollectiviteRoutes} from 'app/pages/collectivite/CollectiviteRoutes';
import StatisticsPage from 'app/pages/StatisticsPage';
import Home from 'app/pages/Home';
import {Redirector} from 'app/Redirector';
import {Toasters} from 'app/Toasters';
import {ScrollToTop} from 'app/ScrollToTop';
import {createTheme, MuiThemeProvider} from '@material-ui/core';
import {MatomoProviderWithAuth} from 'app/MatomoProviderWithAuth';

import {allCollectivitesPath, authBasePath} from 'app/paths';
import {ToutesLesCollectivitesPage} from 'app/pages/ToutesLesCollectivites/ToutesLesCollectivitesPage';
import Layout from 'app/Layout';
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MatomoProviderWithAuth>
          <MuiThemeProvider theme={theme}>
            <ReactQueryDevtools initialIsOpen={false} />
            <Router>
              <Layout>
                <E2E />
                <ScrollToTop />
                <Toasters />
                <Redirector />
                <Switch>
                  <Route exact path="/">
                    <Home />
                  </Route>
                  <Route path={authBasePath}>
                    <AuthRoutes />
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
                </Switch>
              </Layout>
            </Router>
          </MuiThemeProvider>
        </MatomoProviderWithAuth>
      </AuthProvider>
    </QueryClientProvider>
  );
};
