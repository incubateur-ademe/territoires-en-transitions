import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { DetailedPlan as DetailedPlanType } from '@/backend/plans/plans/plans.schema';
import { DetailedPlanView } from './detailed-plan.view';
import { PlanFiltersProvider } from './filters/plan-filters.context';

type PlanActionProps = {
  currentCollectivite: CurrentCollectivite;
  plan: DetailedPlanType;
};

export const DetailedPlan = (props: PlanActionProps) => {
  const { collectiviteId } = props.currentCollectivite;
  const url = `/collectivite/${collectiviteId}/plans/plan/${props.plan.id}`;
  return (
    <PlanFiltersProvider
      url={url}
      collectivite={props.currentCollectivite}
      planId={props.plan.id}
    >
      <DetailedPlanView {...props} />
    </PlanFiltersProvider>
  );
};
