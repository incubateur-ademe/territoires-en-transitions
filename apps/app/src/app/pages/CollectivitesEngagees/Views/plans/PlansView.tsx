'use client';
import { useFilteredPlans } from '@/app/app/pages/CollectivitesEngagees/data/useFilteredPlans';
import { PlanCarte } from '@/app/app/pages/CollectivitesEngagees/Views/plans/PlanCarte';
import { View } from '@/app/app/pages/CollectivitesEngagees/Views/View';
import { filtersParsers, filtersUrlKeys } from '../../data/filters';
import { CollectiviteEngagee } from '@tet/api';
import { useQueryStates } from 'nuqs';

export const PlansView = ({ collectiviteId }: { collectiviteId?: number }) => {
  const [filters, setFilters] = useQueryStates(filtersParsers, {
    urlKeys: filtersUrlKeys,
  });
  const { isLoading, plans, plansCount } = useFilteredPlans(filters);
  return (
    <View<CollectiviteEngagee.RecherchesPlan>
      data={plans}
      dataCount={plansCount}
      isLoading={isLoading}
      filters={filters}
      setFilters={setFilters}
      view="plans"
      collectiviteId={collectiviteId}
      renderCard={({ data, isClickable }) => {
        return (
          <PlanCarte key={data.planId} plan={data} isClickable={isClickable} />
        );
      }}
    />
  );
};
