'use client';
import { CollectiviteEngagee } from '@/api';
import { RecherchesPlan } from '@/api/collectiviteEngagees';
import { useFilteredPlans } from '@/app/app/pages/CollectivitesEngagees/data/useFilteredPlans';
import { PlanCarte } from '@/app/app/pages/CollectivitesEngagees/Views/plans/PlanCarte';
import { View } from '@/app/app/pages/CollectivitesEngagees/Views/View';
import { recherchesPlansUrl } from '@/app/app/paths';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { initialFilters, nameToShortNames } from '../../data/filters';

export const PlansView = ({ collectiviteId }: { collectiviteId?: number }) => {
  const [filters, setFilters] = useSearchParams<CollectiviteEngagee.Filters>(
    recherchesPlansUrl,
    initialFilters,
    nameToShortNames
  );
  const { isLoading, plans, plansCount } = useFilteredPlans(filters);
  return (
    <View<RecherchesPlan>
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
