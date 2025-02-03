import { CollectivitesEngageesPage } from '@/app/app/pages/CollectivitesEngagees/CollectivitesEngageesPage';
import {
  finaliserMonInscriptionUrl,
  recherchesLandingPath,
} from '@/app/app/paths';
import LegacyRouterSync from '@/app/legacy-router-sync';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

export default function LegacyRouter() {
  return (
    <BrowserRouter>
      <LegacyRouterSync />
      <Switch>
        <Route path={[recherchesLandingPath, finaliserMonInscriptionUrl]}>
          <CollectivitesEngageesPage />
        </Route>
      </Switch>
    </BrowserRouter>
  );
}
