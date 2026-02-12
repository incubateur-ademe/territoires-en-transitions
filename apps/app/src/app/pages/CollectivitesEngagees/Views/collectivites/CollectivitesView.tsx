'use client';

import { CollectiviteEngagee } from '@tet/api';
import { useQueryStates } from 'nuqs';
import { filtersParsers, filtersUrlKeys } from '../../data/filters';
import { useFilteredCollectivites } from '../../data/useFilteredCollectivites';
import { View } from '../View';
import { CollectiviteCarte } from './CollectiviteCarte';

export const CollectivitesView = ({
  collectiviteId,
}: {
  collectiviteId?: number;
}) => {
  const [filters, setFilters] = useQueryStates(filtersParsers, {
    urlKeys: filtersUrlKeys,
  });

  const { isLoading, collectivites, collectivitesCount } =
    useFilteredCollectivites(filters);
  return (
    <View<CollectiviteEngagee.RecherchesCollectivite>
      data={collectivites}
      dataCount={collectivitesCount}
      isLoading={isLoading}
      filters={filters}
      setFilters={setFilters}
      view="collectivites"
      collectiviteId={collectiviteId}
      renderCard={({ data, isClickable }) => {
        return (
          <CollectiviteCarte
            key={data.collectiviteId}
            collectivite={data}
            isClickable={isClickable}
          />
        );
      }}
    />
  );
};
