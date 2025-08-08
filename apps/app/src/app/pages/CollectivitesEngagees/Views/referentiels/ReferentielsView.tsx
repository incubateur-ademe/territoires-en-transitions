'use client';
import { CollectiviteEngagee } from '@/api';
import { RecherchesReferentiel } from '@/api/collectiviteEngagees';
import { View } from '@/app/app/pages/CollectivitesEngagees/Views/View';
import {
  initialFilters,
  nameToShortNames,
} from '@/app/app/pages/CollectivitesEngagees/data/filters';
import { useFilteredReferentiels } from '@/app/app/pages/CollectivitesEngagees/data/useFilteredReferentiels';
import { recherchesReferentielsUrl } from '@/app/app/paths';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { ReferentielCarte } from './ReferentielCarte';

export const ReferentielsView = ({
  collectiviteId,
}: {
  collectiviteId?: number;
}) => {
  const [filters, setFilters] = useSearchParams<CollectiviteEngagee.Filters>(
    recherchesReferentielsUrl,
    initialFilters,
    nameToShortNames
  );

  const { isLoading, collectivites, collectivitesCount } =
    useFilteredReferentiels(filters);
  return (
    <View<RecherchesReferentiel>
      data={collectivites}
      dataCount={collectivitesCount}
      isLoading={isLoading}
      filters={filters}
      setFilters={setFilters}
      view="referentiels"
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
