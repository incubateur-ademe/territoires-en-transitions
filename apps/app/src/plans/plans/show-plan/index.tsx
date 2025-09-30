import { Plan as DetailedPlanType } from '@/domain/plans/plans';
import { PlanFiltersProvider } from './filters/plan-filters.context';
import { PlanView } from './plan.view';

type PlanActionProps = {
  plan: DetailedPlanType;
};

export const Plan = (props: PlanActionProps) => {
  return (
    <PlanFiltersProvider plan={props.plan}>
      <PlanView {...props} />
    </PlanFiltersProvider>
  );
};
