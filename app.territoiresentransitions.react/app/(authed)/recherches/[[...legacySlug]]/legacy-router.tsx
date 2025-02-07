import DecouvrirLesCollectivites from '@/app/app/pages/CollectivitesEngagees/DecouvrirLesCollectivites';
import { recherchesLandingPath } from '@/app/app/paths';
import LegacyRouterSync from '@/app/legacy-router-sync';
import { BrowserRouter, Route } from 'react-router-dom';

export default function LegacyRouter() {
  return (
    <BrowserRouter>
      <LegacyRouterSync />

      <Route path={recherchesLandingPath}>
        <DecouvrirLesCollectivites />
      </Route>
    </BrowserRouter>
  );
}
