'use client';

import { CollectiviteEngagee } from '@/api';
import { nameToShortNames } from '@/app/app/pages/CollectivitesEngagees/data/filters';
import { View } from '@/app/app/pages/CollectivitesEngagees/Views/View';
import { recherchesCollectivitesUrl } from '@/app/app/paths';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { initialFilters } from '../data/filters';
import { useFilteredCollectivites } from '../data/useFilteredCollectivites';
import { CollectiviteCarte } from './CollectiviteCarte';

export const CollectivitesView = ({
  collectiviteId,
}: {
  collectiviteId?: number;
}) => {
  const [filters, setFilters, _, setView] =
    useSearchParams<CollectiviteEngagee.Filters>(
      recherchesCollectivitesUrl,
      initialFilters,
      nameToShortNames
    );
  const { collectivites, collectivitesCount, isLoading } =
    useFilteredCollectivites(filters);

  return (
    <View
      initialFilters={initialFilters}
      filters={filters}
      setFilters={setFilters}
      setView={setView}
      view="collectivites"
      data={collectivites}
      dataCount={collectivitesCount}
      isLoading={isLoading}
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
