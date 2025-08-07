'use client';
import { CollectiviteEngagee } from '@/api';
import { RecherchesPlan } from '@/api/collectiviteEngagees';
import { PlanCarte } from '@/app/app/pages/CollectivitesEngagees/Views/PlanCarte';
import { View } from '@/app/app/pages/CollectivitesEngagees/Views/View';
import { useFilteredPlans } from '@/app/app/pages/CollectivitesEngagees/data/useFilteredPlans';
import { recherchesCollectivitesUrl } from '@/app/app/paths';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { initialFilters, nameToShortNames } from '../data/filters';

export const PlansView = ({ collectiviteId }: { collectiviteId?: number }) => {
  const [filters, setFilters, _, setView] =
    useSearchParams<CollectiviteEngagee.Filters>(
      recherchesCollectivitesUrl,
      initialFilters,
      nameToShortNames
    );
  const { plans, plansCount, isLoading } = useFilteredPlans(filters);

  return (
    <View
      initialFilters={initialFilters}
      filters={filters}
      setFilters={setFilters}
      setView={setView}
      view="plans"
      data={plans}
      dataCount={plansCount}
      isLoading={isLoading}
      collectiviteId={collectiviteId}
      renderCard={({ data, isClickable }) => {
        const plan = data as RecherchesPlan;
        return (
          <PlanCarte key={plan.planId} plan={plan} isClickable={isClickable} />
        );
      }}
    />
  );
};
