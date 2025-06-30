import PlanActionCard from '@/app/app/pages/collectivite/PlansActions/PlanAction/list/card/PlanActionCard';
import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { Axe } from '@/backend/plans/fiches/index-domain';

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

export const PlansCardList = ({
  plans,
  collectiviteId,
  cardDisplay,
}: {
  plans: Axe[];
  collectiviteId: number;
  cardDisplay: 'row' | 'circular';
}) => {
  return (
    <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4 h-full">
      {plans.map((plan) => (
        <PlanActionCard
          key={plan.id}
          plan={plan}
          display={cardDisplay}
          link={getPlanURL({ collectiviteId, planId: plan.id })}
          openInNewTab
        />
      ))}
    </div>
  );
};
