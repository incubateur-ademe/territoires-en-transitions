import {useMemo} from 'react';

import Filters from './Filters/Filters';
import AssocierCollectiviteBandeau from 'ui/collectivites/AssocierCollectiviteBandeau';
import CollectivitesView from './Views/CollectivitesView';

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
    <>
      {!hasCollectivites && <AssocierCollectiviteBandeau />}
      <div
        data-test="ToutesLesCollectivites"
        className="app fr-container my-16"
      >
        <div className="md:flex">
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
        </div>
      </div>
    </>
  );
};

export default CollectivitesEngagees;
