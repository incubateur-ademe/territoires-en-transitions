'use client';
import { CollectiviteEngagee } from '@/api';
import { View } from '@/app/app/pages/CollectivitesEngagees/Views/View';
import {
  initialFilters,
  nameToShortNames,
} from '@/app/app/pages/CollectivitesEngagees/data/filters';
import { useFilteredReferentiels } from '@/app/app/pages/CollectivitesEngagees/data/useFilteredReferentiels';
import { recherchesCollectivitesUrl } from '@/app/app/paths';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { ReferentielCarte } from './ReferentielCarte';

export const ReferentielsView = ({
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
    useFilteredReferentiels(filters);

  return (
    <View
      initialFilters={initialFilters}
      filters={filters}
      setFilters={setFilters}
      setView={setView}
      view="referentiels"
      data={collectivites}
      dataCount={collectivitesCount}
      isLoading={isLoading}
      collectiviteId={collectiviteId}
      renderCard={({ data, isClickable }) => {
        return (
          <ReferentielCarte
            key={data.collectiviteId}
            collectivite={data}
            isClickable={isClickable}
          />
        );
      }}
    />
  );
};
