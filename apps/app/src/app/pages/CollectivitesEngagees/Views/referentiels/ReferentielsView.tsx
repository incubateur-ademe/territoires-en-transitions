'use client';
import { CollectiviteEngagee } from '@tet/api';
import { useQueryStates } from 'nuqs';
import { filtersParsers, filtersUrlKeys } from '../../data/filters';
import { useFilteredReferentiels } from '../../data/useFilteredReferentiels';
import { View } from '../View';
import { ReferentielCarte } from './ReferentielCarte';

export const ReferentielsView = ({
  collectiviteId,
}: {
  collectiviteId?: number;
}) => {
  const [filters, setFilters] = useQueryStates(filtersParsers, {
    urlKeys: filtersUrlKeys,
  });

  const { isLoading, collectivites, collectivitesCount } =
    useFilteredReferentiels(filters);
  return (
    <View<CollectiviteEngagee.RecherchesReferentiel>
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
