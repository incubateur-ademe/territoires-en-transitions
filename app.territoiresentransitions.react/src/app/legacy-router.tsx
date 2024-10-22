import { CollectiviteRoutes } from 'app/pages/collectivite/CollectiviteRoutes';
import { CollectivitesEngageesPage } from 'app/pages/CollectivitesEngagees/CollectivitesEngageesPage';
import Home from 'app/pages/Home';
import {
  ancienRecherchesPath,
  finaliserMonInscriptionUrl,
  profilPath,
  recherchesCollectivitesUrl,
  recherchesLandingPath,
} from 'app/paths';
import { Redirector } from 'app/Redirector';
import { ScrollToTopOnPageChange } from 'app/ScrollToTopOnPageChange';
import { Toasters } from 'app/Toasters';
import { VisitTracker } from 'app/VisitTracker';
import { ScoreListenerProvider } from 'core-logic/hooks/useScoreListener';
import {
  Redirect,
  Route,
  BrowserRouter as Router,
  Switch,
} from 'react-router-dom';
import { E2E } from './E2E';
import AccepterCGUModal from './pages/Auth/AccepterCGUModal';
import { ProfilPage } from './pages/Profil/ProfilPage';
import LegacyRouterSync from './legacy-router-sync';

export default function LegacyRouter() {
  return (
    <Router>
      <LegacyRouterSync />
      <ScoreListenerProvider>
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
          <Route path={[recherchesLandingPath, finaliserMonInscriptionUrl]}>
            <CollectivitesEngageesPage />
          </Route>
          <Route path={'/collectivite/:collectiviteId'}>
            <CollectiviteRoutes />
          </Route>
        </Switch>
      </ScoreListenerProvider>
    </Router>
  );
}
