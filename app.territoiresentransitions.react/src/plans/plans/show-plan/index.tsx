import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { Plan as DetailedPlanType } from '@/domain/plans/plans';
import { PlanFiltersProvider } from './filters/plan-filters.context';
import { PlanView } from './plan.view';

type PlanActionProps = {
  currentCollectivite: CurrentCollectivite;
  plan: DetailedPlanType;
};

export const Plan = (props: PlanActionProps) => {
  const { collectiviteId } = props.currentCollectivite;
  const url = `/collectivite/${collectiviteId}/plans/plan/${props.plan.id}`;
  return (
    <PlanFiltersProvider
      url={url}
      collectivite={props.currentCollectivite}
      planId={props.plan.id}
    >
      <PlanView {...props} />
    </PlanFiltersProvider>
  );
};
