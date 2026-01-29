import { Plan as DetailedPlanType } from '@tet/domain/plans';
import { PlanFiltersProvider } from './filters/plan-filters.context';
import { PlanOptionsProvider } from './plan-arborescence.view/plan-options.context';
import { PlanView } from './plan.view';

type PlanActionProps = {
  plan: DetailedPlanType;
};

export const Plan = (props: PlanActionProps) => {
  return (
    <PlanFiltersProvider plan={props.plan}>
      <PlanOptionsProvider>
        <PlanView {...props} />
      </PlanOptionsProvider>
    </PlanFiltersProvider>
  );
};
