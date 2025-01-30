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
import {
  Redirect,
  Route,
  BrowserRouter as Router,
  Switch,
} from 'react-router-dom';
import { ProfilPage } from '../../src/app/pages/Profil/ProfilPage';
import LegacyRouterSync from './legacy-router-sync';

export default function LegacyRouter() {
  return (
    <Router>
      <LegacyRouterSync />
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
    </Router>
  );
}
