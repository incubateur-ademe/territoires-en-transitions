import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import PlanCard from '@/app/plans/plans/card/plan.card';
import { Plan } from '@/domain/plans/plans';

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
  cardDisplay,
}: {
  plans: Plan[];
  collectiviteId: number;
  cardDisplay: 'row' | 'circular';
}) => {
  return (
    <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4 h-full">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          display={cardDisplay}
          link={getPlanURL({ collectiviteId, planId: plan.id })}
        />
      ))}
    </div>
  );
};
