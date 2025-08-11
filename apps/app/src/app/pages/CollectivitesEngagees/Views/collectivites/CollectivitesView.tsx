'use client';

import { CollectiviteEngagee } from '@/api';
import { RecherchesCollectivite } from '@/api/collectiviteEngagees';
import { nameToShortNames } from '@/app/app/pages/CollectivitesEngagees/data/filters';
import { useFilteredCollectivites } from '@/app/app/pages/CollectivitesEngagees/data/useFilteredCollectivites';
import { View } from '@/app/app/pages/CollectivitesEngagees/Views/View';
import { recherchesCollectivitesUrl } from '@/app/app/paths';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { initialFilters } from '../../data/filters';
import { CollectiviteCarte } from './CollectiviteCarte';

export const CollectivitesView = ({
  collectiviteId,
}: {
  collectiviteId?: number;
}) => {
  const [filters, setFilters] = useSearchParams<CollectiviteEngagee.Filters>(
    recherchesCollectivitesUrl,
    initialFilters,
    nameToShortNames
  );

  const { isLoading, collectivites, collectivitesCount } =
    useFilteredCollectivites(filters);
  return (
    <View<RecherchesCollectivite>
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
