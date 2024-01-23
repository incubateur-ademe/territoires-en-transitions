import {useMemo} from 'react';

import Filters from './Filters/Filters';
import AssocierCollectiviteBandeau from 'ui/collectivites/AssocierCollectiviteBandeau';
import CollectivitesView from './Views/CollectivitesView';
import PlansView from 'app/pages/CollectivitesEngagees/Views/PlansView';

import {useSearchParams} from 'core-logic/hooks/query';
import {useOwnedCollectivites} from 'core-logic/hooks/useOwnedCollectivites';
import {useAuth} from 'core-logic/api/auth/AuthProvider';

import {Tfilters, initialFilters, nameToShortNames} from './data/filters';

const CollectivitesEngagees = () => {
  const ownedCollectivites = useOwnedCollectivites();

  const hasCollectivites = useMemo(
    () => ownedCollectivites?.length !== 0,
    [ownedCollectivites]
  );

  const auth = useAuth();

  const {isConnected} = auth;

  /** Filters */
  const [filters, setFilters] = useSearchParams<Tfilters>(
    'collectivites',
    initialFilters,
    nameToShortNames
  );

  const vue = filters.vue[0];

  return (
    <div className="bg-primary-1 -mb-8">
      {!hasCollectivites && <AssocierCollectiviteBandeau />}
      <div
        data-test="ToutesLesCollectivites"
        className="app fr-container py-16"
      >
        <div className="md:flex md:gap-6 xl:gap-12">
          {/* Filters column */}
          <Filters filters={filters} setFilters={setFilters} />
          {/* Results column */}
          {vue === 'collectivite' && (
            <CollectivitesView
              initialFilters={initialFilters}
              filters={filters}
              setFilters={setFilters}
              isConnected={isConnected}
              canUserClickCard={hasCollectivites && isConnected}
            />
          )}
          {vue === 'plan' && (
            <PlansView
              initialFilters={initialFilters}
              filters={{...filters, trierPar: ['nom']}}
              setFilters={setFilters}
              isConnected={isConnected}
              canUserClickCard={hasCollectivites && isConnected}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectivitesEngagees;
