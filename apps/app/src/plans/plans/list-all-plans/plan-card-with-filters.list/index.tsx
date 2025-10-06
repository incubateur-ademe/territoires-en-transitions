'use client';

import { Plan } from '@/domain/plans/plans';
import { Spacer } from '@/ui';
import { useState } from 'react';
import { useListPlans } from '../data/use-list-plans';
import { Filters, SortByOption } from './filters';
import { PlanCardList } from './plan-card.list';

export const PlanCardWithFiltersList = ({
  plans: initialPlans,
  collectiviteId,
}: {
  plans: Plan[];
  collectiviteId: number;
}) => {
  const [sort, setSort] = useState<{
    field: SortByOption['value'];
    direction: SortByOption['direction'];
  }>({
    field: 'nom',
    direction: 'asc',
  });
  const { plans, totalCount } = useListPlans(collectiviteId, {
    initialData: {
      plans: initialPlans,
      totalCount: initialPlans.length,
    },
    sort,
  });

  return (
    <>
      <Filters
        plansCount={totalCount}
        sortedBy={sort.field}
        onChangeSort={(field, direction) => setSort({ field, direction })}
      />
      <Spacer height={2} />
      <PlanCardList plans={plans} collectiviteId={collectiviteId} />
    </>
  );
};
