import { CollectiviteRoutes } from '@/app/app/pages/collectivite/CollectiviteRoutes';
import { CollectivitesEngageesPage } from '@/app/app/pages/CollectivitesEngagees/CollectivitesEngageesPage';
import Home from '@/app/app/pages/Home';
import {
  ancienRecherchesPath,
  finaliserMonInscriptionUrl,
  profilPath,
  recherchesCollectivitesUrl,
  recherchesLandingPath,
} from '@/app/app/paths';
import { Redirector } from '@/app/app/Redirector';
import { Toasters } from '@/app/app/Toasters';
import { VisitTracker } from '@/app/app/VisitTracker';
import { ScoreListenerProvider } from '@/app/core-logic/hooks/useScoreListener';
import {
  Redirect,
  Route,
  BrowserRouter as Router,
  Switch,
} from 'react-router-dom';
import { E2E } from './app/E2E';
import AccepterCGUModal from './app/pages/Auth/AccepterCGUModal';
import { ProfilPage } from './app/pages/Profil/ProfilPage';
import LegacyRouterSync from './legacy-router-sync';

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
