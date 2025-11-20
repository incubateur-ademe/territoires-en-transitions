import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { PlanCard } from '@/app/plans/plans/components/card/plan.card';
import { Plan } from '@tet/domain/plans';

const getPlanURL = ({
  collectiviteId,
  planId,
}: {
  collectiviteId: number;
  planId: number;
}) =>
  makeCollectivitePlanActionUrl({
    collectiviteId,
    planActionUid: planId.toString(),
  });

export const PlanCardList = ({
  plans,
  collectiviteId,
}: {
  plans: Plan[];
  collectiviteId: number;
}) => {
  return (
    <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          link={getPlanURL({ collectiviteId, planId: plan.id })}
        />
      ))}
    </div>
  );
};
