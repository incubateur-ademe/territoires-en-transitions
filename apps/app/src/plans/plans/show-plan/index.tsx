import { Plan as DetailedPlanType } from '@tet/domain/plans';
import { PlanFiltersProvider } from './filters/plan-filters.context';
import { PlanOptionsProvider } from './plan-arborescence.view/plan-options.context';
import { PlanTab } from './plan.tabs';
import { PlanView } from './plan.view';

type PlanActionProps = {
  plan: DetailedPlanType;
  tab: PlanTab;
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
