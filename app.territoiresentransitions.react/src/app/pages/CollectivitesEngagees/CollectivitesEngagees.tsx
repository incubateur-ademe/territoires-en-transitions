import {useMemo} from 'react';

import Filters from './Filters/Filters';
import CollectivitesView from './Views/CollectivitesView';
import AssocierCollectiviteBandeau from 'ui/collectivites/AssocierCollectiviteBandeau';

import {useSearchParams} from 'core-logic/hooks/query';
import {useOwnedCollectivites} from 'core-logic/hooks/useOwnedCollectivites';
import {useFilteredCollectivites} from './data/useFilteredCollectivites';
import {Tfilters, initialFilters, nameToShortNames} from './data/filters';

const CollectivitesEngagees = () => {
  const ownedCollectivites = useOwnedCollectivites();

  const hasCollectivites = useMemo(
    () => ownedCollectivites?.length !== 0,
    [ownedCollectivites]
  );

  /** Filters */
  const [filters, setFilters] = useSearchParams<Tfilters>(
    'collectivites',
    initialFilters,
    nameToShortNames
  );

  /** Data */
  const {collectivites, collectivitesCount, isLoading} =
    useFilteredCollectivites(filters);

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
          {/* Collectivites column */}
          <CollectivitesView
            initialFilters={initialFilters}
            filters={filters}
            setFilters={setFilters}
            data={collectivites}
            dataCount={collectivitesCount}
            isLoading={isLoading}
            canUserClickCard={hasCollectivites}
          />
        </div>
      </div>
    </>
  );
};

export default CollectivitesEngagees;
