import PlanActionCard from '@/app/app/pages/collectivite/PlansActions/PlanAction/list/card/PlanActionCard';
import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { Axe } from '@/backend/plans/fiches/index-domain';
import { Header } from '../components/Header';
import { Actions } from './actions';

type Props = {
  plans: Axe[];
  collectiviteId: number;
  panierId: string | undefined;
};

export const AllPlansView = ({ plans, collectiviteId, panierId }: Props) => {
  return (
    <>
      <Header
        title="Tous les plans"
        actionButtons={
          <Actions collectiviteId={collectiviteId} panierId={panierId} />
        }
      />
      <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <PlanActionCard
            key={plan.id}
            plan={plan}
            display="row"
            link={makeCollectivitePlanActionUrl({
              collectiviteId: plan.collectiviteId,
              planActionUid: plan.id.toString(),
            })}
            openInNewTab
          />
        ))}
      </div>
    </>
  );
};
