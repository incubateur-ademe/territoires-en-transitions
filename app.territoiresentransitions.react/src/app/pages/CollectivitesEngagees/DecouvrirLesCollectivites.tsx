import PlansView from 'app/pages/CollectivitesEngagees/Views/PlansView';
import { Route } from 'react-router-dom';
import AssocierCollectiviteBandeau from 'ui/collectivites/AssocierCollectiviteBandeau';
import Filters from './Filters/FiltersColonne';
import CollectivitesView from './Views/CollectivitesView';

import { useAuth } from 'core-logic/api/auth/AuthProvider';
import { useSearchParams } from 'core-logic/hooks/query';

import { CollectiviteEngagee } from '@tet/api';
import { recherchesCollectivitesUrl, recherchesPlansUrl } from 'app/paths';
import { initialFilters, nameToShortNames } from './data/filters';
import { useSansCollectivite } from 'core-logic/hooks/useOwnedCollectivites';

const DecouvrirLesCollectivites = () => {
  const auth = useAuth();
  const { isConnected } = auth;

  const sansCollectivite = useSansCollectivite();

  /** Filters */
  const [filters, setFilters] = useSearchParams<CollectiviteEngagee.Filters>(
    '',
    initialFilters,
    nameToShortNames
  );

  return (
    <div className="bg-primary-1 -mb-8">
      {!!sansCollectivite && <AssocierCollectiviteBandeau />}
      <div
        data-test="ToutesLesCollectivites"
        className="app fr-container py-16"
      >
        <div className="md:flex md:gap-6 xl:gap-12">
          <Route path={recherchesCollectivitesUrl}>
            <Filters
              vue="collectivites"
              filters={filters}
              setFilters={setFilters}
            />
            <CollectivitesView
              initialFilters={initialFilters}
              filters={filters}
              setFilters={setFilters}
              isConnected={isConnected}
              canUserClickCard={!sansCollectivite && isConnected}
            />
          </Route>
          <Route path={recherchesPlansUrl}>
            <Filters vue="plans" filters={filters} setFilters={setFilters} />
            <PlansView
              initialFilters={initialFilters}
              filters={{ ...filters, trierPar: ['nom'] }}
              setFilters={setFilters}
              isConnected={isConnected}
              canUserClickCard={!sansCollectivite && isConnected}
            />
          </Route>
        </div>
      </div>
    </div>
  );
};

export default DecouvrirLesCollectivites;
