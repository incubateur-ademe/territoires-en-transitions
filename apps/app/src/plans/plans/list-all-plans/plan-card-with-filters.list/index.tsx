'use client';

import { Plan } from '@/domain/plans/plans';
import { Spacer } from '@/ui';
import { useListPlans } from '../data/use-list-plans';
import { Filters } from './filters';
import { PlanCardList } from './plan-card.list';
import { SortDirection, SortField } from './sorting-parameters';

export const PlanCardWithFiltersList = ({
  collectiviteId,
  sort,
  setSortParams,
}: {
  plans: Plan[];
  collectiviteId: number;
  sort: {
    field: SortField;
    direction: SortDirection;
  };
  setSortParams: (sort: { field: SortField; direction: SortDirection }) => void;
}) => {
  const { plans, totalCount } = useListPlans(collectiviteId, {
    sort,
  });

  return (
    <>
      <Filters
        plansCount={totalCount}
        sortedBy={sort.field}
        onChangeSort={(field, direction) => setSortParams({ field, direction })}
      />
      <Spacer height={2} />
      <PlanCardList plans={plans} collectiviteId={collectiviteId} />
    </>
  );
};
