import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  QueryClient as TanstackQueryClient,
  QueryClientProvider as TanstackQueryClientProvider,
} from '@tanstack/react-query';
import { createTrackingClient, TrackingProvider } from '@tet/ui';
import { CollectiviteRoutes } from 'app/pages/collectivite/CollectiviteRoutes';
import Home from 'app/pages/Home';
import { Redirector } from 'app/Redirector';
import { ScrollToTopOnPageChange } from 'app/ScrollToTopOnPageChange';
import { Toasters } from 'app/Toasters';
import { ENV } from 'environmentVariables';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import {
  Redirect,
  Route,
  BrowserRouter as Router,
  Switch,
} from 'react-router-dom';
import { E2E } from './E2E';

import Layout from 'app/Layout';
import { CollectivitesEngageesPage } from 'app/pages/CollectivitesEngagees/CollectivitesEngageesPage';
import {
  ancienRecherchesPath,
  finaliserMonInscriptionUrl,
  profilPath,
  recherchesCollectivitesUrl,
  recherchesLandingPath,
} from 'app/paths';
import { VisitTracker } from 'app/VisitTracker';
import { AuthProvider } from 'core-logic/api/auth/AuthProvider';
import { ScoreListenerProvider } from 'core-logic/hooks/useScoreListener';
import { trpc, trpcClient } from 'utils/trpc';
import AccepterCGUModal from './pages/Auth/AccepterCGUModal';
import { ProfilPage } from './pages/Profil/ProfilPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#000091',
    },
  },
});

const trackingClient = createTrackingClient(ENV.posthog);
const queryClient = new QueryClient();
const tanstackQueryClient = new TanstackQueryClient();

export const App = () => {
  return (
    <TrackingProvider client={trackingClient}>
      <trpc.Provider client={trpcClient} queryClient={tanstackQueryClient}>
        <TanstackQueryClientProvider client={tanstackQueryClient}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ThemeProvider theme={theme}>
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
                        <Route path={profilPath}>
                          <ProfilPage />
                        </Route>
                        <Redirect
                          exact
                          from={ancienRecherchesPath}
                          to={recherchesCollectivitesUrl}
                        />
                        <Route
                          path={[
                            recherchesLandingPath,
                            finaliserMonInscriptionUrl,
                          ]}
                        >
                          <CollectivitesEngageesPage />
                        </Route>
                        <Route path={'/collectivite/:collectiviteId'}>
                          <CollectiviteRoutes />
                        </Route>
                      </Switch>
                    </Layout>
                  </ScoreListenerProvider>
                </Router>
              </ThemeProvider>
            </AuthProvider>
          </QueryClientProvider>
        </TanstackQueryClientProvider>
      </trpc.Provider>
    </TrackingProvider>
  );
};
