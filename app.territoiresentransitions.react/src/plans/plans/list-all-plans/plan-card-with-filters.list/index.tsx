'use client';

import { SortPlansActionValue } from '@/api/plan-actions/plan-actions.list/domain/fetch-options.schema';
import { useGetAllPlans } from '@/app/plans/plans/show-detailed-plan/data/use-get-all-plans';
import { DetailedPlan } from '@/backend/plans/plans/plans.schema';
import { Spacer } from '@/ui/design-system/Spacer';
import { useState } from 'react';
import { Filters } from './filters';
import { PlanCardList } from './plan-card.list';

const DEFAULT_PLAN_TYPE = 'Sans type';

const sortPlans = (
  plans: DetailedPlan[],
  sort: { key: SortPlansActionValue; direction: 'asc' | 'desc' }
): DetailedPlan[] =>
  [...plans].sort((a, b) => {
    const comparison =
      sort.key === 'nom'
        ? a.nom?.localeCompare(b.nom ?? '') ?? 0
        : a.createdAt.localeCompare(b.createdAt ?? '');
    return sort.direction === 'asc' ? comparison : -comparison;
  });

export const filterAndSortPlans = (
  plans: DetailedPlan[],
  planTypesToDisplay: string[],
  sort: { key: SortPlansActionValue; direction: 'asc' | 'desc' }
): DetailedPlan[] => {
  const filteredPlans = plans.filter((plan) =>
    planTypesToDisplay.includes(plan.type?.type ?? DEFAULT_PLAN_TYPE)
  );
  return sortPlans(filteredPlans, sort);
};

const getPlanTypesSetFromData = (plans: DetailedPlan[]): string[] => {
  const planTypes = plans
    .map((plan) => plan.type?.type)
    .filter((type) => type !== undefined);
  return [...new Set(planTypes), DEFAULT_PLAN_TYPE];
};

export const PlanCardWithFiltersList = ({
  plans: initialPlans,
  collectiviteId,
}: {
  plans: DetailedPlan[];
  collectiviteId: number;
}) => {
  const { plans } = useGetAllPlans(collectiviteId, {
    initialData: {
      plans: initialPlans,
      totalCount: initialPlans.length,
    },
  });

  const [cardDisplay, setCardDisplay] = useState<'row' | 'circular'>('row');
  const [sort, setSort] = useState<{
    key: SortPlansActionValue;
    direction: 'asc' | 'desc';
  }>({
    key: 'nom',
    direction: 'asc',
  });
  const planTypesToDisplay = getPlanTypesSetFromData(plans);
  const plansToDisplay = filterAndSortPlans(plans, planTypesToDisplay, sort);

  return (
    <>
      <Filters
        plansCount={plans.length}
        cardDisplay={cardDisplay}
        onDisplayChange={(display) => setCardDisplay(display)}
        sortedBy={sort.key}
        onChangeSort={(key, direction) => setSort({ key, direction })}
      />
      <Spacer height={2} />
      <PlanCardList
        plans={plansToDisplay}
        collectiviteId={collectiviteId}
        cardDisplay={cardDisplay}
      />
    </>
  );
};
