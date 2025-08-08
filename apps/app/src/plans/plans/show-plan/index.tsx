import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { Plan as DetailedPlanType } from '@/domain/plans/plans';
import { PlanFiltersProvider } from './filters/plan-filters.context';
import { PlanView } from './plan.view';

type PlanActionProps = {
  currentCollectivite: CurrentCollectivite;
  plan: DetailedPlanType;
};

export const Plan = (props: PlanActionProps) => {
  return (
    <PlanFiltersProvider
      collectivite={props.currentCollectivite}
      plan={props.plan}
    >
      <PlanView {...props} />
    </PlanFiltersProvider>
  );
};
