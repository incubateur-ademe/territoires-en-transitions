import { ScoreListenerProvider } from '@/app/core-logic/hooks/useScoreListener';
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
import { Toasters } from 'app/Toasters';
import { VisitTracker } from 'app/VisitTracker';
import {
  Redirect,
  Route,
  BrowserRouter as Router,
  Switch,
} from 'react-router-dom';
import { E2E } from './E2E';
import LegacyRouterSync from './legacy-router-sync';
import AccepterCGUModal from './pages/Auth/AccepterCGUModal';
import { ProfilPage } from './pages/Profil/ProfilPage';

export default function LegacyRouter() {
  return (
    <Router>
      <LegacyRouterSync />
      <ScoreListenerProvider>
        <E2E />
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
