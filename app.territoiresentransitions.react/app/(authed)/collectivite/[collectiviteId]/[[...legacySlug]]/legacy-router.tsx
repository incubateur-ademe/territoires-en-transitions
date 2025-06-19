import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { CollectiviteRoutes } from '@/app/app/pages/collectivite/CollectiviteRoutes';
import LegacyRouterSync from '@/app/legacy-router-sync';
import { BrowserRouter, Route } from 'react-router-dom';

export function LegacyRouter({
  collectivite,
}: {
  collectivite: CurrentCollectivite;
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
