'use client';

import { SortPlansActionValue } from '@/api/plan-actions/plan-actions.list/domain/fetch-options.schema';
import { useGetAllPlans } from '@/app/plans/plans/show-detailed-plan/data/use-get-all-plans';
import { DetailedPlan } from '@/backend/plans/plans/plans.schema';
import { Spacer } from '@/ui/design-system/Spacer';
import { useState } from 'react';
import { Filters } from './filters';
import { PlanCardList } from './plan-card.list';

export const PlanCardWithFiltersList = ({
  plans: initialPlans,
  collectiviteId,
}: {
  plans: DetailedPlan[];
  collectiviteId: number;
}) => {
  const { plans, totalCount } = useGetAllPlans(collectiviteId, {
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

  return (
    <>
      <Filters
        plansCount={totalCount}
        cardDisplay={cardDisplay}
        onDisplayChange={(display) => setCardDisplay(display)}
        sortedBy={sort.key}
        onChangeSort={(key, direction) => setSort({ key, direction })}
      />
      <Spacer height={2} />
      <PlanCardList
        plans={plans}
        collectiviteId={collectiviteId}
        cardDisplay={cardDisplay}
      />
    </>
  );
};
