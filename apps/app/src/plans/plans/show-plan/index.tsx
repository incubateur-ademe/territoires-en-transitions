import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { Plan as DetailedPlanType } from '@/domain/plans/plans';
import { PlanFiltersProvider } from './filters/plan-filters.context';
import { PlanView } from './plan.view';

type PlanActionProps = {
  currentCollectivite: CurrentCollectivite;
  plan: DetailedPlanType;
};

export const Plan = (props: PlanActionProps) => {
  const { collectiviteId } = props.currentCollectivite;
  const url = makeCollectivitePlanActionUrl({
    collectiviteId,
    planActionUid: props.plan.id.toString(),
  });
  return (
    <PlanFiltersProvider
      url={url}
      collectivite={props.currentCollectivite}
      plan={props.plan}
    >
      <PlanView {...props} />
    </PlanFiltersProvider>
  );
};
