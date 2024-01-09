import {useMemo} from 'react';

import Filters from './Filters/Filters';
import CollectivitesView from './Views/CollectivitesView';
import AssocierCollectiviteBandeau from 'ui/collectivites/AssocierCollectiviteBandeau';

import {useSearchParams} from 'core-logic/hooks/query';
import {useOwnedCollectivites} from 'core-logic/hooks/useOwnedCollectivites';
import {TCollectiviteCarte} from './types';
import {useFilteredCollectivites} from './data/useFilteredCollectivites';
import {TCollectivitesFilters} from './data/filtreLibelles';
import {TSetFilters, initialFilters, nameToShortNames} from './data/filters';

export type TRenderCollectivitesEngageesPage = {
  collectivites: TCollectiviteCarte[];
  collectivitesCount: number;
  filters: TCollectivitesFilters;
  setFilters: TSetFilters;
  isLoading: boolean;
};

export const RenderCollectivitesEngageesPage = (
  props: TRenderCollectivitesEngageesPage
) => {
  const ownedCollectivites = useOwnedCollectivites();

  const hasCollectivites = useMemo(
    () => ownedCollectivites?.length !== 0,
    [ownedCollectivites]
  );

  return (
    <>
      {!hasCollectivites && <AssocierCollectiviteBandeau />}
      <div
        data-test="ToutesLesCollectivites"
        className="app fr-container my-16"
      >
        <div className="md:flex">
          {/* Filters column */}
          <Filters filters={props.filters} setFilters={props.setFilters} />
          {/* Collectivites column */}
          <CollectivitesView
            initialFilters={initialFilters}
            filters={props.filters}
            setFilters={props.setFilters}
            data={props.collectivites}
            dataCount={props.collectivitesCount}
            isLoading={props.isLoading}
            canUserClickCard={hasCollectivites}
          />
        </div>
      </div>
    </>
  );
};

const CollectivitesEngageesPage = () => {
  // filtre initial
  const [filters, setFilters] = useSearchParams<TCollectivitesFilters>(
    'collectivites',
    initialFilters,
    nameToShortNames
  );
  const {collectivites, collectivitesCount, isLoading} =
    useFilteredCollectivites(filters);

  return (
    <RenderCollectivitesEngageesPage
      collectivites={collectivites}
      collectivitesCount={collectivitesCount}
      filters={filters}
      setFilters={setFilters}
      isLoading={isLoading}
    />
  );
};

export default CollectivitesEngageesPage;
