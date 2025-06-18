import { CollectiviteNiveauAcces } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { CollectiviteRoutes } from '@/app/app/pages/collectivite/CollectiviteRoutes';
import LegacyRouterSync from '@/app/legacy-router-sync';
import { BrowserRouter, Route } from 'react-router-dom';

export function LegacyRouter({
  collectivite,
}: {
  collectivite: CollectiviteNiveauAcces;
}) {
  return (
    <BrowserRouter>
      <LegacyRouterSync />

      <Route path={'/collectivite/:collectiviteId'}>
        <CollectiviteRoutes collectivite={collectivite} />
      </Route>
    </BrowserRouter>
  );
}
